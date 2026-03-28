"""
Resume Analyzer Lambda
- Downloads resume from S3
- Extracts text (PDF or DOCX)
- Runs NLP skill extraction
- Computes job match score
- Stores results in DynamoDB
"""
import boto3
import json
import os
import uuid
import io
import re
import string
from datetime import datetime, timezone
from decimal import Decimal


def sanitize_for_dynamo(obj):
    """Recursively convert floats to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(round(obj, 6)))
    elif isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_dynamo(i) for i in obj]
    return obj

s3 = boto3.client("s3")
ddb = boto3.resource("dynamodb")

BUCKET = os.environ["BUCKET_NAME"]
TABLE = os.environ["TABLE_NAME"]

# Load skills ontology once at cold start
with open("skills_ontology.json") as f:
    ONTOLOGY = json.load(f)

ALIASES = {k.lower(): v for k, v in ONTOLOGY["aliases"].items()}
CATEGORIES = ONTOLOGY["categories"]
JOB_ROLES = ONTOLOGY["job_roles"]

# Build reverse lookup: canonical skill → category
SKILL_TO_CATEGORY = {}
for cat, skills in CATEGORIES.items():
    for s in skills:
        SKILL_TO_CATEGORY[s.lower()] = cat


# ── Text Extraction ─────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    from pdfminer.high_level import extract_text as pdfminer_extract
    return pdfminer_extract(io.BytesIO(file_bytes))


def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext == "docx":
        return extract_text_from_docx(file_bytes)
    raise ValueError(f"Unsupported file type: {ext}")


# ── Skill Extraction ────────────────────────────────────────────

def normalize_skill(raw: str) -> str | None:
    """Map a raw token to its canonical skill name via ontology aliases."""
    cleaned = raw.lower().strip(string.punctuation + " ")
    if cleaned in ALIASES:
        return ALIASES[cleaned]
    # Try multi-word match (up to 3 words)
    return None


def extract_skills_from_text(text: str) -> list[dict]:
    """
    Two-pass skill extraction:
    1. Tokenize and check every 1-3 word window against the ontology aliases
    2. Return deduplicated list with category and confidence
    """
    text_lower = text.lower()
    # Tokenize by splitting on whitespace and punctuation (keep spaces for multi-word)
    words = re.split(r"[\n\r,;/|•·\t]+", text_lower)
    words = [w.strip() for w in words if w.strip()]

    found: dict[str, dict] = {}  # canonical_skill → entry

    for phrase in words:
        # Check the full phrase
        canonical = normalize_skill(phrase)
        if canonical:
            key = canonical.lower()
            if key not in found:
                found[key] = {
                    "skill": canonical,
                    "category": SKILL_TO_CATEGORY.get(key, "hard_skill"),
                    "confidence": 0.90
                }
            continue

        # Check individual tokens within multi-word phrase
        tokens = phrase.split()
        for i in range(len(tokens)):
            for j in range(i + 1, min(i + 4, len(tokens) + 1)):
                window = " ".join(tokens[i:j])
                canonical = normalize_skill(window)
                if canonical:
                    key = canonical.lower()
                    if key not in found:
                        found[key] = {
                            "skill": canonical,
                            "category": SKILL_TO_CATEGORY.get(key, "hard_skill"),
                            "confidence": 0.85
                        }

    return list(found.values())


# ── Experience Extraction ───────────────────────────────────────

def extract_experience_years(text: str) -> int:
    """Estimate years of experience from resume text."""
    patterns = [
        r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
        r"experience\s+of\s+(\d+)\+?\s*years?",
        r"(\d+)\+?\s*yrs?\s+(?:of\s+)?experience",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))

    # Count date ranges like "2019 - 2023" or "Jan 2020 – Dec 2022"
    year_pattern = r"\b(20\d{2}|19\d{2})\b"
    years = sorted(set(int(y) for y in re.findall(year_pattern, text)))
    if len(years) >= 2:
        return years[-1] - years[0]

    return 0


# ── JD Skill Extraction ─────────────────────────────────────────

def get_jd_skills(job_title: str, jd_text: str = "") -> dict:
    """
    Get required/preferred/bonus skills for a job.
    If jd_text provided, extract from it. Otherwise use ontology lookup.
    """
    if jd_text and len(jd_text.strip()) > 50:
        extracted = extract_skills_from_text(jd_text)
        skill_names = [s["skill"] for s in extracted]
        # Split roughly: first half required, second preferred
        mid = len(skill_names) // 2
        return {
            "required": skill_names[:mid] if mid else skill_names,
            "preferred": skill_names[mid:] if mid else [],
            "bonus": []
        }

    # Ontology lookup by job title
    title_lower = job_title.lower().strip()
    # Try exact match first
    if title_lower in JOB_ROLES:
        return JOB_ROLES[title_lower]
    # Try partial match
    for role_key, role_data in JOB_ROLES.items():
        if role_key in title_lower or any(word in title_lower for word in role_key.split()):
            return role_data

    # Generic fallback
    return {
        "required": ["Communication", "Problem Solving", "Teamwork", "Microsoft Office"],
        "preferred": ["Project Management", "Data Analysis"],
        "bonus": []
    }


# ── Match Scoring ───────────────────────────────────────────────

def _tfidf_cosine(resume_skills: list[str], jd_skills_list: list[str]) -> float:
    """
    Pure numpy TF-IDF cosine similarity.
    Replaces sklearn to avoid scipy/scikit-learn Lambda dependency issues.
    Steps:
      1. Build vocabulary from both skill lists
      2. Compute term-frequency vectors for each
      3. Apply IDF weights
      4. Compute cosine similarity between the two vectors
    """
    import numpy as np
    import math

    # Build vocabulary
    resume_tokens = [s.lower() for s in resume_skills]
    jd_tokens     = [s.lower() for s in jd_skills_list]
    vocab = list(set(resume_tokens + jd_tokens))
    if not vocab:
        return 0.0

    def tf_vector(tokens):
        vec = [tokens.count(w) for w in vocab]
        return vec

    def apply_idf(tf_vecs):
        n = len(tf_vecs)
        idf = []
        for i in range(len(vocab)):
            df = sum(1 for v in tf_vecs if v[i] > 0)
            idf.append(math.log((n + 1) / (df + 1)) + 1.0)
        result = []
        for v in tf_vecs:
            result.append([v[i] * idf[i] for i in range(len(vocab))])
        return result

    tf_vecs = [tf_vector(resume_tokens), tf_vector(jd_tokens)]
    tfidf   = apply_idf(tf_vecs)

    a = np.array(tfidf[0], dtype=float)
    b = np.array(tfidf[1], dtype=float)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def compute_match_score(
    resume_skills: list[str],
    jd_skills: dict,
    experience_years: int,
    jd_title: str
) -> dict:
    """
    Weighted match score:
    - 60% skills match (TF-IDF cosine similarity, pure numpy)
    - 25% experience level match
    - 15% ATS compatibility (approximated via keyword overlap)
    """
    resume_set   = {s.lower() for s in resume_skills}
    required_set = {s.lower() for s in jd_skills.get("required", [])}
    preferred_set = {s.lower() for s in jd_skills.get("preferred", [])}
    jd_all       = jd_skills.get("required", []) + jd_skills.get("preferred", [])

    # Skills score — pure numpy TF-IDF cosine similarity
    if resume_skills and jd_all:
        skills_score = _tfidf_cosine(resume_skills, jd_all)
    else:
        skills_score = 0.0

    # Experience score — seniority inferred from job title
    seniority_map = {
        "junior": 1, "entry": 1, "associate": 2,
        "mid": 3, "senior": 5, "lead": 7, "principal": 8, "staff": 8,
        "manager": 5, "director": 8, "vp": 10, "head": 8
    }
    title_lower   = jd_title.lower()
    expected_years = 3  # default mid-level
    for keyword, years in seniority_map.items():
        if keyword in title_lower:
            expected_years = years
            break

    exp_score = min(1.0, experience_years / expected_years) if expected_years > 0 else 0.5

    # ATS score — keyword overlap ratio (required skills found in resume)
    if required_set:
        ats_score = len(resume_set & required_set) / len(required_set)
    else:
        ats_score = 0.5

    # Weighted combination
    weighted    = (0.60 * skills_score + 0.25 * exp_score + 0.15 * ats_score)
    match_score = min(99, max(5, round(weighted * 100)))

    return {
        "match_score": match_score,
        "sub_scores": {
            "skills":      min(99, round(skills_score * 100)),
            "experience":  min(99, round(exp_score * 100)),
            "ats_score":   min(99, round(ats_score * 100))
        }
    }


# ── Gap Analysis ────────────────────────────────────────────────

def compute_gaps(resume_skills: list[str], jd_skills: dict) -> dict:
    resume_set = {s.lower() for s in resume_skills}

    def gap_list(skill_list):
        return [s for s in skill_list if s.lower() not in resume_set]

    def present_list(skill_list):
        return [s for s in skill_list if s.lower() in resume_set]

    return {
        "critical": gap_list(jd_skills.get("required", [])),
        "important": gap_list(jd_skills.get("preferred", [])),
        "nice_to_have": gap_list(jd_skills.get("bonus", [])),
        "present": present_list(
            jd_skills.get("required", []) + jd_skills.get("preferred", [])
        )
    }


# ── Lambda Handler ──────────────────────────────────────────────

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-api-key",
        "Content-Type": "application/json"
    }

    try:
        body = json.loads(event.get("body", "{}"))
        file_key = body.get("file_key", "").strip()
        job_title = body.get("job_title", "software engineer").strip()
        jd_text = body.get("job_description", "").strip()

        if not file_key:
            return _error(400, "file_key is required", headers)

        # 1. Download resume from S3
        print(f"Downloading resume: {file_key}")
        s3_obj = s3.get_object(Bucket=BUCKET, Key=file_key)
        file_bytes = s3_obj["Body"].read()
        filename = file_key.rsplit("/", 1)[-1]

        # 2. Extract text
        print("Extracting text...")
        resume_text = extract_text(file_bytes, filename)
        if not resume_text or len(resume_text.strip()) < 50:
            return _error(422, "Could not extract readable text from the resume. Please ensure it's not a scanned image.", headers)

        # 3. Extract skills
        print("Extracting skills...")
        extracted_skills = extract_skills_from_text(resume_text)
        experience_years = extract_experience_years(resume_text)
        resume_skill_names = [s["skill"] for s in extracted_skills]

        # 4. Get JD skills
        print(f"Getting JD skills for: {job_title}")
        jd_skills = get_jd_skills(job_title, jd_text)

        # 5. Score
        print("Computing match score...")
        scoring = compute_match_score(resume_skill_names, jd_skills, experience_years, job_title)

        # 6. Gaps
        gaps = compute_gaps(resume_skill_names, jd_skills)

        # 7. Build result
        analysis_id = f"ana_{uuid.uuid4().hex[:10]}"
        
        # Get user email from request body (for resume history tracking)
        user_email = body.get("user_email", "anonymous")
        file_name = body.get("file_name", "resume")
        file_key = body.get("file_key", "")  # S3 file key for downloading
        
        print(f"📝 Building analysis result:")
        print(f"   - file_key from request: '{file_key}'")
        print(f"   - file_name: '{file_name}'")
        print(f"   - user_email: '{user_email}'")
        
        result = {
            "analysis_id": analysis_id,
            "user_email": user_email,
            "file_name": file_name,
            "file_key": file_key,
            "job_title": job_title,
            "match_score": scoring["match_score"],
            "sub_scores": scoring["sub_scores"],
            "experience_years": experience_years,
            "extracted_skills": extracted_skills,
            "skill_gaps": gaps,
            "jd_skills": jd_skills,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✓ Result object keys: {list(result.keys())}")

        # 8. Store in DynamoDB (TTL: 7 days)
        table = ddb.Table(TABLE)
        sanitized_item = sanitize_for_dynamo({
            **result,
            "ttl": int(datetime.now(timezone.utc).timestamp()) + (7 * 24 * 3600)
        })
        print(f"💾 Storing analysis in DynamoDB:")
        print(f"   - Keys in sanitized item: {list(sanitized_item.keys())}")
        print(f"   - file_key in item: {sanitized_item.get('file_key')}")
        
        table.put_item(Item=sanitized_item)

        print(f"Analysis complete: {analysis_id}, score: {scoring['match_score']}")
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(result)
        }

    except Exception as e:
        print(f"ERROR in analyze: {e}")
        import traceback
        traceback.print_exc()
        return _error(500, f"Analysis failed: {str(e)}", headers)


def _error(status, message, headers):
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps({"error": message})
    }