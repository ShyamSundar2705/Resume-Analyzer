# Product Requirements Document
## Cloud-Based Resume Analyzer & Skill Gap Detection System
### Mini Project — College Submission

**Version:** 3.0.0
**Date:** 2026-03-23
**Author:** [Your Name]
**Institution:** [Your College]

---

## 1. Executive Summary

Resume Insights is a cloud-native web application that allows job seekers to upload their resume, receive an AI-computed job match score, identify skill gaps, and interact with a GenAI assistant for resume coaching and tailored cover letter generation.

The system is built on AWS (API Gateway + Lambda + S3 + DynamoDB) with a React + Tailwind frontend deployed on Vercel. NLP processing runs inline within Lambda using spaCy. The GenAI assistant is powered by the Groq API (free tier) using the Llama-3 model. The production-scale data processing architecture uses AWS Glue with Apache Spark (documented in Section 7).

---

## 2. Problem Statement

Job seekers consistently struggle to understand:
- How competitive their resume is for a specific role
- Which skills are missing and how critical each gap is
- Whether their resume will pass automated ATS screening
- How to improve their resume with concrete, actionable guidance

Existing tools provide generic feedback. This system provides a quantified match score, an ATS compatibility score, a classified skill gap list, and a conversational AI coach — all within 10 seconds.

---

## 3. Goals

| Goal | Metric |
|---|---|
| Upload and analyze a resume end-to-end | < 10 seconds total |
| Extract skills from any domain/industry | Generic, domain-agnostic |
| Produce a 0–100 match score | Decomposed into 3 sub-scores |
| ATS compatibility scoring | 0–100 score with formatting checks |
| GenAI assistant: Q&A + cover letter | Context-aware responses |
| All AWS mandatory services covered | API Gateway, Lambda, S3, IAM, KMS |

---

## 4. Users

**Primary User:** Job seeker (any domain) who uploads their own resume and wants to know how well it matches a target job.

**User Journey:**
```
1. Land on Login page → sign in
2. Home page → upload resume (PDF/DOCX) + enter job title
3. Processing page → watch 4-step progress with live percentage
4. Dashboard → view match score, ATS score, skill gaps, AI chat
5. Chat with AI → ask questions about results
6. Request cover letter → download it
7. Profile page → view resume history, past analyses
8. Settings → update email, password, AI preferences, data controls
```

---

## 5. Feature Requirements

### F1 — Resume Upload (P0)
- Accept PDF and DOCX, max 5 MB
- Drag-and-drop or file browser on Home page
- Upload directly to S3 via presigned URL (Lambda generates it, client uploads directly)
- File encrypted at rest with SSE-KMS
- Unique file key per upload: `resumes/{uuid}/{filename}`
- Client-side validation: file type + size before upload

### F2 — Resume Parsing & Skill Extraction (P0)
- Extract raw text from PDF (`pdfminer.six`) or DOCX (`python-docx`)
- Run NLP using spaCy (`en_core_web_sm`) to extract skill entities
- Match against bundled JSON skills ontology (3,000+ skills, all domains)
- Classify: hard skill / soft skill / certification
- Alias normalization: "JS" → "JavaScript", "Py" → "Python"
- Output: structured skill list with confidence scores

### F3 — Job Match Scoring (P0)
- User inputs a job title (matched against ontology) or pastes a raw job description
- Computes match score using TF-IDF cosine similarity (scikit-learn)
- Score decomposed into 3 sub-scores:
  - **Skills Match** — 60% weight
  - **Experience Level** — 25% weight
  - **ATS Compatibility** — 15% weight
- Output: 0–100 overall score + 3 sub-scores

### F4 — ATS Compatibility Score (P0)
- Replaces certifications metric from earlier versions
- Checks resume text for: section headers present, bullet point usage, keyword density, file format compatibility, no tables/columns (ATS-unfriendly), appropriate length
- Returns 0–100 ATS score
- Displayed as third sub-score on dashboard

### F5 — Skill Gap Analysis (P0)
- Compares resume skills vs JD required / preferred / bonus skills
- Classifies each missing skill: Critical / Important / Nice-to-have
- Shows match status per skill: Missing / Partial Match / Weak Match
- Displays recommendation per gap row

### F6 — GenAI Assistant (P0)
- Mode A — Q&A: user asks questions about their specific analysis results
- Mode B — Cover Letter: generates tailored 300–400 word cover letter
- Powered by Groq API (free tier, `llama-3.3-70b-versatile`)
- Full analysis context injected into system prompt server-side
- Shortcut buttons: Summarize, Cover Letter, Top Tips
- Conversation history passed client-side (last 8 turns)

### F7 — 6-Page UI (P1)
Built with React + Vite + Tailwind CSS, deployed on Vercel:

| Page | Purpose |
|---|---|
| Login | Email/password + Google SSO. Animated syntax character background. |
| Home | Resume upload (drag-drop), job title input, optional JD paste |
| Processing | 4-step animated progress (Upload → Extract → Match → Feedback), circular gauge |
| Dashboard | Match score gauge, sub-score bars, skill gap table, AI chat panel |
| Profile | User info, resume history table with status badges, key expertise chips |
| Settings | Update email, change password, AI config toggles, privacy controls, delete account |

### F8 — Resume History (P1)
- Stored per user in DynamoDB with 7-day TTL
- Visible on Profile page with file name, date, status (Analyzed / Pending)
- View Insights button navigates back to Dashboard with that analysis

---

## 6. System Architecture

```
┌─────────────────────────────────────────┐
│   React + Vite + Tailwind (Vercel)      │
│   6 pages, React Router v6              │
└──────────────────┬──────────────────────┘
                   │ HTTPS + x-api-key header
┌──────────────────▼──────────────────────┐
│      AWS API Gateway (REST API)         │
│      API Key authentication             │
│      3 routes: /upload-url  /analyze  /chat │
└──┬────────────────┬──────────────┬──────┘
   │                │              │
   ▼                ▼              ▼
Lambda           Lambda         Lambda
presign          analyze        chat
(128 MB,         (1024 MB,      (256 MB,
 10s timeout)     60s timeout)   60s timeout)
   │                │              │
   ▼                │              ▼
  S3 Bucket      spaCy NLP      Groq API
(SSE-KMS,        scikit-learn   llama-3.3-70b
 presigned PUT)  ontology JSON     │
                    │           Secrets Manager
                    ▼           (API key)
                DynamoDB
            (analysis results,
              7-day TTL)
```

### Component Summary

| Component | Service | Cost |
|---|---|---|
| Frontend hosting | Vercel | Free |
| API routing | AWS API Gateway | Free tier (1M req/mo) |
| Business logic | AWS Lambda (Python 3.11) | Free tier (1M inv/mo) |
| Resume storage | AWS S3 (SSE-KMS) | Free tier (5 GB) |
| Results storage | AWS DynamoDB | Free tier (25 GB) |
| NLP | spaCy en_core_web_sm (inline Lambda) | Free |
| ML scoring | scikit-learn TF-IDF cosine similarity | Free |
| GenAI assistant | Groq API (Llama-3) | Free tier |
| Secrets | AWS Secrets Manager | Free tier |
| Encryption | AWS KMS (SSE-KMS on S3) | Free |
| Auth | API Gateway API Key | Free |

---

## 7. Production-Scale Data Architecture (Spark / AWS Glue)

> This section documents the production architecture. The demo uses inline Lambda NLP for speed and simplicity. In production with 1000+ concurrent users, this Glue/Spark pipeline replaces inline processing.

### Why Spark?

A single resume takes ~3 seconds to process inline in Lambda. At scale (1,000 concurrent uploads), this requires 1,000 simultaneous Lambda invocations. AWS Glue with PySpark handles this by distributing processing across a managed Spark cluster — 1,000 resumes processed in the same ~3 seconds, not 3,000 seconds sequentially.

### Production Data Flow

```
S3 (resume uploaded via presigned URL)
    → S3 Event Notification → SQS Queue (buffers jobs)
    → AWS Glue PySpark Job (triggered from queue depth)
        → Read batch of resumes from S3
        → Distributed spaCy NLP across Spark workers
        → Broadcast join: skill aliases table (50K rows)
          broadcast to all workers for local canonicalization
        → Write structured results to DynamoDB
    → Lambda polls job status → notifies client
```

### Glue Job Configuration

| Parameter | Value |
|---|---|
| Glue version | 4.0 (Spark 3.3, Python 3.11) |
| Worker type | G.1X (4 vCPU, 16 GB RAM per worker) |
| Auto-scaling | 2 to 10 workers based on SQS queue depth |
| Libraries | spaCy, scikit-learn, boto3 (bundled as Glue extra Python files) |
| Canonicalization | Spark broadcast join — zero network calls per executor |

### Why Not Use Glue for the Demo?
Glue has a ~2-minute cold start. For a college demo where a professor uploads one resume, this is unusable. The inline Lambda approach returns results in under 10 seconds, which is far more impressive in a live viva.

---

## 8. NLP & ML Pipeline

### 8.1 Text Extraction
- PDF: `pdfminer.six` — handles digital PDFs
- DOCX: `python-docx` — extracts paragraph text
- Fallback: Amazon Textract for scanned/image-based PDFs (production only)

### 8.2 Skill Extraction
1. Text fed into `spacy en_core_web_sm` NER pipeline
2. Noun phrases and named entities extracted
3. Window matching (1–3 tokens) against `skills_ontology.json` (3,000+ entries)
4. Alias normalization: "JS" → "JavaScript", "k8s" → "Kubernetes"
5. Classification: hard_skill / soft_skill / certification (rule-based)
6. Deduplication: keep highest-confidence entry per canonical skill

### 8.3 Match Scoring
```python
# Skills score — TF-IDF cosine similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

resume_text = " ".join(resume_skill_names)
jd_text     = " ".join(jd_required_skills + jd_preferred_skills)
vec         = TfidfVectorizer()
matrix      = vec.fit_transform([resume_text, jd_text])
skills_score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]

# Experience score — years vs seniority level inferred from job title
exp_score = min(1.0, resume_years / expected_years_for_role)

# ATS score — formatting and keyword density checks
ats_score = compute_ats_score(resume_text)

# Weighted combination
match_score = round((0.60 * skills_score + 0.25 * exp_score + 0.15 * ats_score) * 100)
```

### 8.4 ATS Compatibility Score
Checks the following signals, each contributing to the 0–100 score:
- Section headers present (Summary, Experience, Education, Skills)
- Bullet point usage detected
- Keyword density vs JD (ratio of matched terms)
- Resume length within 400–800 word range
- No evidence of tables or multi-column layout
- File is a standard PDF or DOCX (not image-based)

---

## 9. Security Model

| Control | Implementation |
|---|---|
| Encryption at rest | S3 SSE-KMS, DynamoDB KMS encryption |
| Encryption in transit | HTTPS enforced on API Gateway + S3 |
| IAM | Each Lambda has a dedicated execution role with least-privilege inline policies |
| API authentication | API Gateway API Key (`x-api-key` header on every request) |
| S3 isolation | Block Public Access: ALL enabled. Only presigned URLs used. |
| Input validation | Lambda validates file type, size, and extension before generating presigned URL |
| Secrets management | Groq API key stored in AWS Secrets Manager, never hardcoded |
| Data TTL | DynamoDB analysis records auto-deleted after 7 days |

### IAM Role Matrix

| Lambda | S3 | DynamoDB | Secrets Manager | Groq |
|---|---|---|---|---|
| presign | PutObject on `resumes/*` | — | — | — |
| analyze | GetObject on `resumes/*` | PutItem, GetItem | — | — |
| chat | — | GetItem | GetSecretValue | Called via HTTPS |

---

## 10. API Contracts

All routes require header: `x-api-key: YOUR_KEY`

### POST `/upload-url`
```json
// Request
{ "filename": "resume.pdf", "content_type": "application/pdf" }

// Response
{ "upload_url": "https://s3.amazonaws.com/...presigned...", "file_key": "resumes/uuid/resume.pdf" }
```

### POST `/analyze`
```json
// Request
{ "file_key": "resumes/uuid/resume.pdf", "job_title": "Data Analyst", "job_description": "optional raw JD..." }

// Response
{
  "analysis_id": "ana_abc123",
  "job_title": "Data Analyst",
  "match_score": 72,
  "sub_scores": { "skills": 68, "experience": 80, "ats_score": 74 },
  "experience_years": 3,
  "extracted_skills": [
    { "skill": "Python", "category": "hard_skill", "confidence": 0.95 }
  ],
  "skill_gaps": {
    "critical": ["Tableau", "Power BI"],
    "important": ["dbt"],
    "nice_to_have": ["Airflow"],
    "present": ["Python", "SQL"]
  },
  "created_at": "2026-03-23T10:30:00Z"
}
```

### POST `/chat`
```json
// Request
{
  "message": "Write me a cover letter for this role",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }],
  "context": { ...full analysis object from /analyze response... }
}

// Response
{ "reply": "Dear Hiring Manager, ...", "role": "assistant" }
```

---

## 11. Project Structure

```
resume-analyzer/
├── backend/
│   ├── template.yaml              ← AWS SAM (API Gateway + Lambdas + S3 + DynamoDB)
│   ├── requirements.txt           ← Python 3.11 dependencies
│   └── lambdas/
│       ├── presign/
│       │   └── handler.py         ← Generates scoped S3 presigned URL
│       ├── analyze/
│       │   ├── handler.py         ← Text extraction + NLP + scoring
│       │   └── skills_ontology.json ← 3000+ skills + 12 job role definitions
│       └── chat/
│           └── handler.py         ← Groq AI assistant with analysis context
│
├── frontend/                      ← React + Vite + Tailwind CSS
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env                       ← VITE_API_URL + VITE_API_KEY (not committed)
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                ← React Router v6, all 6 routes
│       ├── index.css              ← Tailwind + shared utility classes
│       ├── api.js                 ← All backend API calls in one place
│       ├── components/
│       │   └── Navbar.jsx         ← Shared navbar across all pages
│       └── pages/
│           ├── LoginPage.jsx
│           ├── HomePage.jsx
│           ├── ProcessingPage.jsx
│           ├── DashboardPage.jsx
│           ├── ProfilePage.jsx
│           └── SettingsPage.jsx
│
└── README.md
```

---

## 12. Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18.3.1 |
| Build tool | Vite | 5.4.2 |
| CSS | Tailwind CSS | 3.4.10 |
| Routing | React Router v6 | 6.26.1 |
| Frontend deploy | Vercel | Free tier |
| Backend runtime | Python | **3.11** |
| Lambda framework | AWS SAM | Latest |
| Text extraction (PDF) | pdfminer.six | 20221105 |
| Text extraction (DOCX) | python-docx | 1.1.2 |
| NLP | spaCy | 3.8.x (en_core_web_sm) |
| ML scoring | scikit-learn | 1.4.2 |
| Numeric computing | NumPy | 1.26.4 |
| AWS SDK | boto3 | 1.34.0 |
| GenAI | Groq API (Llama-3.3-70b) | Free tier |
| API layer | AWS API Gateway | REST API |
| Compute | AWS Lambda | Python 3.11 runtime |
| Storage | AWS S3 (SSE-KMS) | Free tier |
| Database | AWS DynamoDB | Free tier (PAY_PER_REQUEST) |
| Secrets | AWS Secrets Manager | Free tier |
| Production data | AWS Glue + Apache Spark | 4.0 / Spark 3.3 |

---

## 13. Deployment Steps

```bash
# Prerequisites
python3.11 --version   # must be 3.11.x
node --version         # must be 18+
aws --version
sam --version

# ── Backend ──────────────────────────────────────────────────
cd backend
sam build
sam deploy --guided
# Note the ApiUrl from deploy outputs

# Add Groq key to Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id resume-analyzer/groq-api-key \
  --secret-string '{"api_key": "YOUR_GROQ_KEY"}' \
  --region ap-south-1

# Get API Gateway key
aws apigateway get-api-keys --include-values --region ap-south-1

# ── Frontend ──────────────────────────────────────────────────
cd frontend
npm install
cp .env.example .env
# Edit .env: set VITE_API_URL and VITE_API_KEY
npm run dev            # test locally at http://localhost:5173
vercel                 # deploy — gives live URL
```

---

## 14. Demo Script (Viva)

1. Open live Vercel URL — show Login page with animated syntax background
2. Sign in → land on Home page
3. Drag and drop a sample PDF resume
4. Type "Software Engineer" as job title → click Analyze Resume
5. Show Processing page — 4 steps animating, percentage climbing
6. Dashboard loads — point at the 85/100 gauge, sub-score bars
7. Point at Skill Gap table — explain Critical vs Important vs Nice-to-have
8. Open AI chat — ask "Which gap hurts my score the most?"
9. Ask "Write me a cover letter" — show it generating
10. Navigate to Profile — show resume history table
11. Navigate to Settings — show toggles, privacy controls

**Viva talking points:**
- "API Gateway acts as the secure front door — all requests are authenticated via API key"
- "Lambda functions are stateless and serverless — no EC2 to manage, scales automatically"
- "Resumes are encrypted at rest in S3 using KMS — even AWS support cannot read them without the key"
- "Each Lambda has its own IAM role with only the permissions it needs — least privilege principle"
- "The Groq API key is never in code — it lives in AWS Secrets Manager and is fetched at runtime"
- "In production at scale, the NLP processing would move to AWS Glue with Apache Spark — the same pipeline but distributed across a cluster, handling thousands of resumes in parallel"
- "ATS compatibility scoring checks whether the resume will pass automated screening before a human even sees it"

---

## 15. CPPE Coverage (College Requirement)

| Pillar | Services Used |
|---|---|
| **Cloud** | AWS API Gateway, AWS Lambda |
| **Data** | AWS S3, Apache Spark via AWS Glue (production architecture, Section 7) |
| **GenAI** | Groq API (Llama-3.3-70b) — resume Q&A assistant + cover letter generation |
| **Security** | AWS KMS (encryption at rest), AWS IAM (least-privilege roles), AWS Secrets Manager, API Key auth |

---

*End of Document — v3.0.0*
