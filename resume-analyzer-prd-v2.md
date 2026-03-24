# Product Requirements Document
## Cloud-Based Resume Analyzer & Skill Gap Detection System
### Mini Project — College Submission

**Version:** 2.0.0 (Simplified for Demo)
**Date:** 2026-03-18
**Author:** [Your Name]
**Institution:** [Your College]

---

## 1. Executive Summary

The Resume Analyzer is a cloud-native web application that allows job seekers to upload their resume, receive an AI-computed job match score, identify skill gaps, and interact with a GenAI assistant for resume coaching and tailored cover letter generation.

The system is built on AWS (API Gateway + Lambda + S3) with a React frontend deployed on Vercel. NLP processing runs inline within Lambda using spaCy. The GenAI assistant is powered by the Groq API (free tier) using the Llama-3 model. The production-scale data processing architecture uses AWS Glue with Apache Spark (documented in Section 7).

---

## 2. Problem Statement

Job seekers struggle to understand:
- How competitive their resume is for a specific role
- Which skills are missing and how critical each gap is
- How to improve their resume in concrete, actionable terms

Existing tools provide generic feedback. This system provides a quantified match score, a classified skill gap list, and a conversational AI coach — all in under 10 seconds.

---

## 3. Goals

| Goal | Metric |
|---|---|
| Upload and analyze a resume end-to-end | < 10 seconds total |
| Extract skills from any domain/industry | Generic, domain-agnostic |
| Produce a 0–100 match score | Decomposed into sub-scores |
| GenAI assistant: Q&A + cover letter | Context-aware, streaming |
| All AWS mandatory services covered | API Gateway, Lambda, S3, IAM, KMS |

---

## 4. Users

**Primary User:** Job seeker (any domain) who uploads their own resume and wants to know how well it matches a target job.

**User Journey:**
```
1. Open web app
2. Upload resume (PDF or DOCX)
3. Enter a job title or paste a job description
4. Receive: match score + extracted skills + skill gaps
5. Open AI chat → ask questions about results
6. Request a tailored cover letter
7. Download cover letter
```

---

## 5. Feature Requirements

### F1 — Resume Upload (P0)
- Accept PDF and DOCX, max 5 MB
- Upload directly to S3 via presigned URL (Lambda generates it)
- File encrypted at rest with SSE-KMS
- Unique file key per upload: `resumes/{uuid}/{filename}`

### F2 — Resume Parsing & Skill Extraction (P0)
- Extract raw text from PDF (`pdfminer.six`) or DOCX (`python-docx`)
- Run NLP using spaCy (`en_core_web_sm`) to extract skill entities
- Match against a bundled JSON skills ontology (3,000+ skills, all domains)
- Classify: hard skill / soft skill / certification
- Output: structured skill list with confidence scores

### F3 — Job Match Scoring (P0)
- User inputs a job title or raw job description
- System extracts required skills from JD using same NLP pipeline
- Computes match score using cosine similarity (scikit-learn TF-IDF)
- Decomposes score: Skills (60%) + Experience (25%) + Certifications (15%)
- Outputs: 0–100 score + sub-scores

### F4 — Skill Gap Analysis (P0)
- Compares resume skills vs JD required/preferred skills
- Classifies each gap: Critical / Important / Nice-to-have
- Sorts critical gaps by marginal score impact

### F5 — GenAI Assistant (P0)
- **Mode A — Q&A:** User asks questions about their analysis results
- **Mode B — Cover Letter:** User requests a tailored cover letter (300–400 words)
- Powered by Groq API (free tier, Llama-3-70b-8192)
- Full analysis context injected into system prompt
- Streaming response via SSE

### F6 — Results Dashboard (P1)
- Visual match score gauge
- Skill chips (present vs missing)
- Gap table with severity badges
- Chat panel on the right

---

## 6. System Architecture (Demo Build)

```
┌─────────────────────────────────────┐
│     React SPA (Vercel — free)       │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│   AWS API Gateway (REST API)        │
│   API Key authentication            │
└──┬───────────┬──────────────┬───────┘
   │           │              │
   ▼           ▼              ▼
Lambda      Lambda         Lambda
(presign)  (analyze)      (chat)
   │           │              │
   ▼           │              ▼
  S3        spaCy NLP      Groq API
(SSE-KMS)  + scikit-learn  (Llama-3)
               │
               ▼
           DynamoDB
        (analysis results)
```

### Component Summary

| Component | Service | Cost |
|---|---|---|
| Frontend hosting | Vercel | Free |
| API routing | AWS API Gateway | Free tier (1M requests/mo) |
| Business logic | AWS Lambda (Python 3.12) | Free tier (1M invocations/mo) |
| Resume storage | AWS S3 | Free tier (5 GB) |
| Results storage | AWS DynamoDB | Free tier (25 GB) |
| NLP processing | spaCy (inline in Lambda) | Free (open source) |
| GenAI assistant | Groq API (Llama-3) | Free tier |
| Encryption | AWS KMS | Free (SSE-S3 with CMK) |
| Auth | API Key via API Gateway | Free |

---

## 7. Production-Scale Data Architecture (Spark / AWS Glue)

> This section describes the production architecture. The demo uses inline Lambda NLP for speed. In production with 1000+ concurrent users, this Glue/Spark pipeline replaces the inline processing.

### Why Spark?

A single resume takes ~2 seconds to process inline. At scale (1,000 concurrent uploads), this becomes 2,000 Lambda seconds per batch. AWS Glue with PySpark distributes this across a cluster, processing 1,000 resumes in parallel in the same 2 seconds.

### Production Data Flow

```
S3 (resume uploaded)
    → SQS Queue (buffers jobs)
    → AWS Glue PySpark Job trigger
        → Read batch of resumes from S3
        → Distributed spaCy NLP across Spark workers
        → Canonicalize skills (broadcast join vs ontology)
        → Write results to DynamoDB
    → Lambda notifies user via WebSocket
```

### Glue Job Highlights
- **Glue version:** 4.0 (Spark 3.3, Python 3.10)
- **Worker type:** G.1X (4 vCPU, 16 GB RAM)
- **Auto-scaling:** 2 to 10 workers based on queue depth
- **Libraries:** spaCy, transformers, boto3 (bundled as Glue Python Shell)
- **Canonicalization:** Spark broadcast join — skill aliases table (50K rows) broadcast to all workers so every executor resolves aliases locally without network calls

### Why Not Use Glue for the Demo?
Glue has a ~2-minute cold start. For a college demo where a professor uploads one resume, this is unusable. The inline Lambda approach gives a 5-second result, which is far more impressive in a live demo.

---

## 8. NLP & ML Pipeline

### Skill Extraction
1. Text extraction: `pdfminer.six` (PDF) or `python-docx` (DOCX)
2. NER: `spacy en_core_web_sm` — extracts noun phrases and skill-like tokens
3. Keyword matching: scan against bundled `skills_ontology.json` (3,000+ entries)
4. Alias normalization: "JS" → "JavaScript", "Py" → "Python"
5. Classification: rule-based — hard_skill / soft_skill / certification

### Match Scoring
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

resume_text = " ".join(resume_skills)
jd_text = " ".join(jd_required_skills)

vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
match_score = round(score * 100)
```

---

## 9. Security Model

| Control | Implementation |
|---|---|
| **Encryption at rest** | S3 SSE-KMS (AWS managed key — free tier) |
| **Encryption in transit** | HTTPS enforced on API Gateway and S3 |
| **Access control (IAM)** | Each Lambda has its own execution role, least-privilege inline policies |
| **API Authentication** | API Gateway API Key (x-api-key header) |
| **S3 isolation** | Block Public Access: ALL enabled. No public URLs. Only presigned URLs. |
| **Input validation** | Lambda validates file type and size before generating presigned URL |
| **Secrets** | Groq API key stored in AWS Secrets Manager (free tier) |

---

## 10. API Contracts

### POST `/upload-url`
Request: `{ "filename": "resume.pdf", "content_type": "application/pdf" }`
Response: `{ "upload_url": "...", "file_key": "resumes/uuid/resume.pdf" }`

### POST `/analyze`
Request: `{ "file_key": "resumes/uuid/resume.pdf", "job_title": "Data Analyst" }`
Response:
```json
{
  "analysis_id": "ana_abc123",
  "match_score": 72,
  "sub_scores": { "skills": 68, "experience": 80, "certifications": 60 },
  "extracted_skills": [{ "skill": "Python", "category": "hard_skill" }],
  "skill_gaps": {
    "critical": ["Tableau", "Power BI"],
    "important": ["dbt"],
    "nice_to_have": ["Airflow"]
  }
}
```

### POST `/chat`
Request:
```json
{
  "analysis_id": "ana_abc123",
  "message": "Write me a cover letter",
  "history": [],
  "context": { ... analysis object ... }
}
```
Response: `text/event-stream` (SSE)

---

## 11. Folder Structure

```
resume-analyzer/
├── backend/
│   ├── lambdas/
│   │   ├── presign/         → handler.py
│   │   ├── analyze/         → handler.py, skills_ontology.json
│   │   └── chat/            → handler.py
│   ├── template.yaml        → AWS SAM template
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── UploadZone.jsx
│   │   │   ├── ScoreGauge.jsx
│   │   │   ├── SkillGapTable.jsx
│   │   │   └── ChatPanel.jsx
│   │   └── api.js
│   └── package.json
└── docs/
    └── architecture.md
```

---

## 12. Deployment Steps

```bash
# 1. Create AWS account (free tier)
# 2. Install AWS CLI + SAM CLI (both free)
pip install aws-sam-cli

# 3. Deploy backend
cd backend
sam build
sam deploy --guided   # creates API Gateway + all Lambdas + S3 + DynamoDB

# 4. Deploy frontend
cd frontend
npm install
# set VITE_API_URL and VITE_API_KEY in .env
vercel deploy         # free Vercel account
```

---

## 13. What to Demo

1. Open the live URL (Vercel)
2. Upload a sample resume PDF
3. Enter "Software Engineer" as the job title
4. Show the match score gauge loading in real time
5. Point at the skill gap table — Critical vs Important
6. Click into the chat panel — ask "Which gap hurts my score the most?"
7. Ask for a cover letter — show it streaming word by word
8. Download the cover letter

**Viva talking points:**
- "We use AWS API Gateway as the secure entry point for all requests"
- "Lambda handles business logic — no servers to manage"
- "Resumes are encrypted at rest in S3 using KMS"
- "In production at scale, the NLP layer would move to AWS Glue with Spark for distributed processing across thousands of resumes simultaneously"
- "The GenAI assistant uses Llama-3 via Groq to provide context-aware coaching"

---

*End of Document*
