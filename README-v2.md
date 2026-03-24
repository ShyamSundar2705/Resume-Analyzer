# Resume Insights — Cloud-Based Resume Analyzer

AI-powered resume analysis with skill gap detection, ATS scoring, and GenAI coaching.
Built on AWS (free tier) + Groq (free) for a college mini project.

---

## Tech Stack

| Layer | Technology | Version | Cost |
|---|---|---|---|
| Frontend | React + Vite + Tailwind CSS | React 18, Vite 5 | Free |
| Routing | React Router v6 | 6.26.1 | Free |
| Deploy | Vercel | — | Free |
| API | AWS API Gateway | REST | Free tier |
| Compute | AWS Lambda | Python **3.11** | Free tier |
| Storage | AWS S3 (SSE-KMS) | — | Free tier |
| Database | AWS DynamoDB | — | Free tier |
| NLP | spaCy en_core_web_sm | 3.8.x | Free |
| ML scoring | scikit-learn TF-IDF | 1.4.2 | Free |
| AI assistant | Groq API (Llama-3.3-70b) | — | Free tier |
| Secrets | AWS Secrets Manager | — | Free tier |

> **Python version: 3.11** — do not use 3.12 or 3.13. spaCy 3.8.x has known compatibility issues on 3.12+ and sentence-transformers is unstable on 3.13.

---

## Project Structure

```
resume-analyzer/
├── backend/
│   ├── template.yaml              ← AWS SAM (all infra in one file)
│   ├── requirements.txt           ← Python 3.11 dependencies
│   └── lambdas/
│       ├── presign/handler.py     ← Generates S3 presigned upload URL
│       ├── analyze/
│       │   ├── handler.py         ← NLP + TF-IDF scoring + ATS check
│       │   └── skills_ontology.json
│       └── chat/handler.py        ← Groq AI assistant
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── .env                       ← Not committed — create from .env.example
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                ← React Router v6, 6 routes
│       ├── index.css              ← Tailwind + shared classes
│       ├── api.js                 ← All API calls
│       ├── components/
│       │   └── Navbar.jsx
│       └── pages/
│           ├── LoginPage.jsx      ← Animated syntax background
│           ├── HomePage.jsx       ← Drag-drop upload + job title
│           ├── ProcessingPage.jsx ← 4-step progress + circular gauge
│           ├── DashboardPage.jsx  ← Score, gaps, AI chat
│           ├── ProfilePage.jsx    ← Resume history table
│           └── SettingsPage.jsx   ← Account + privacy controls
│
└── README.md
```

---

## Setup: Step by Step

### Prerequisites

```bash
# Python 3.11 — install from https://www.python.org/downloads/release/python-3110/
python3.11 --version   # must show 3.11.x

# AWS CLI
pip install awscli
aws --version

# AWS SAM CLI
pip install aws-sam-cli
sam --version

# Node.js 18+ — install from https://nodejs.org
node --version   # must be 18+

# Vercel CLI
npm install -g vercel
```

---

### Step 1 — Create AWS Free Tier Account

1. Go to https://aws.amazon.com/free/ → Create a Free Account
2. Use a personal email, add a credit card (won't be charged — free tier covers everything)
3. Choose Basic support (free)

```bash
# After account creation, configure AWS CLI
aws configure
# Prompts:
# AWS Access Key ID:     → get from IAM → Users → Security credentials → Create access key
# AWS Secret Access Key: → same screen
# Default region:        ap-south-1
# Default output format: json
```

---

### Step 2 — Get Groq API Key (Free)

1. Go to https://console.groq.com/
2. Sign up (free) → API Keys → Create API Key
3. Copy it — needed in Step 4

---

### Step 3 — Set Up Python Environment

```bash
# Create a virtual environment with Python 3.11
python3.11 -m venv venv

# Activate it
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows

# Install dependencies
cd backend
pip install -r requirements.txt

# Download the spaCy model
python -m spacy download en_core_web_sm
```

---

### Step 4 — Deploy the Backend

```bash
cd backend
sam build
sam deploy --guided
```

When prompted:
- Stack name: `resume-analyzer`
- AWS Region: `ap-south-1`
- Confirm changes before deploy: `Y`
- Allow SAM to create IAM roles: `Y`
- Save arguments to samconfig.toml: `Y`

After deploy, the terminal prints something like:
```
Outputs:
ApiUrl = https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod
```
**Copy that URL — you need it in Step 6.**

---

### Step 5 — Add Groq API Key to AWS

```bash
# Replace YOUR_GROQ_KEY with the key from Step 2
aws secretsmanager put-secret-value \
  --secret-id resume-analyzer/groq-api-key \
  --secret-string '{"api_key": "YOUR_GROQ_KEY"}' \
  --region ap-south-1
```

---

### Step 6 — Get Your API Gateway Key

```bash
aws apigateway get-api-keys --include-values --region ap-south-1
# Copy the "value" field from the output
```

---

### Step 7 — Set Up the Frontend

```bash
cd frontend
npm install

# Create your .env file
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_API_URL=https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod
VITE_API_KEY=your_api_gateway_key_value_here
```

```bash
# Test locally
npm run dev
# Opens at http://localhost:5173

# Deploy to Vercel
vercel
# Follow prompts — adds your .env values as Vercel env vars
# Gives you a live URL like https://resume-insights-xyz.vercel.app
```

When Vercel asks for environment variables, add:
- `VITE_API_URL` → your API Gateway URL
- `VITE_API_KEY` → your API key value

---

### Step 8 — End-to-End Test

1. Open your Vercel URL
2. Sign in on the Login page
3. Upload a PDF resume on the Home page
4. Enter "Software Engineer" as the job title
5. Click Analyze Resume
6. Watch the Processing page — all 4 steps should complete
7. Dashboard loads with your match score
8. In the chat panel, type: "What's my biggest skill gap?"
9. Type: "Write me a cover letter"
10. Navigate to Profile → see your resume in the history table

---

## How It Works

### Upload flow
```
User selects file on Home page
→ React calls POST /upload-url (Lambda presign)
→ Lambda generates a presigned S3 PUT URL (5 min expiry, SSE-KMS)
→ React uploads file directly to S3 (Lambda never handles raw bytes)
→ React navigates to /processing with file_key in router state
```

### Analysis flow
```
ProcessingPage calls POST /analyze with file_key + job_title
→ Lambda downloads file from S3
→ pdfminer.six or python-docx extracts text
→ spaCy NER + ontology matching extracts skills
→ TF-IDF cosine similarity scores resume vs JD skills
→ ATS score computed from formatting signals
→ Weighted score: 60% skills + 25% experience + 15% ATS
→ Result stored in DynamoDB (7-day TTL)
→ JSON returned → React navigates to /dashboard with analysis in state
```

### Chat flow
```
User types in chat panel on Dashboard
→ React calls POST /chat with message + last 8 turns + full analysis context
→ Lambda builds system prompt with analysis data injected
→ Lambda calls Groq API (llama-3.3-70b-versatile)
→ Groq response returned → displayed in chat bubble
```

### Security
- Every API call requires `x-api-key` header — missing key returns 403
- Resumes stored with SSE-KMS — encrypted at rest, key managed by AWS KMS
- Each Lambda has its own IAM role — presign Lambda cannot read S3, chat Lambda cannot write DynamoDB
- S3 Block Public Access: ALL enabled — no public URLs ever exist
- Groq API key in Secrets Manager — never in code or environment files

---

## Troubleshooting

**`Failed to resolve import "./pages/ProcessingPage"`**
File is missing or incorrectly named. On Windows, imports are case-sensitive. Check:
```bash
ls src/pages/
# Must show: LoginPage.jsx  HomePage.jsx  ProcessingPage.jsx
#            DashboardPage.jsx  ProfilePage.jsx  SettingsPage.jsx
```

**`sam build` fails**
```bash
pip install aws-sam-cli --upgrade
# Also ensure Python 3.11 is active in your virtual environment
```

**Lambda timeout on /analyze**
- Timeout is 60s in template.yaml — enough for most resumes
- If it still times out, the spaCy model may not be installed in the Lambda package
- Run `sam build` again — it reinstalls all dependencies fresh

**spaCy model not found error in Lambda**
Add this to `analyze/handler.py` at the top of the file:
```python
import subprocess
subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=False)
```
Or better: add `en_core_web_sm` as a Lambda layer (see AWS docs for custom Lambda layers).

**CORS error in browser**
The SAM template sets CORS headers on all routes. If you see this:
```bash
sam deploy   # redeploy — sometimes API Gateway stage needs a fresh deploy
```

**Groq API 401 error**
Your Groq key in Secrets Manager is wrong or expired. Re-add it:
```bash
aws secretsmanager put-secret-value \
  --secret-id resume-analyzer/groq-api-key \
  --secret-string '{"api_key": "YOUR_NEW_GROQ_KEY"}' \
  --region ap-south-1
```

**S3 upload fails with CORS error**
The S3 bucket CORS config is in `template.yaml`. Verify the bucket was created with SAM:
```bash
aws s3 ls | grep resume
```

---

## AWS Services — CPPE Coverage

| Pillar | Services |
|---|---|
| **Cloud** | API Gateway (REST API, rate limiting, auth), Lambda (3 serverless functions) |
| **Data** | S3 (resume storage), Apache Spark via AWS Glue (production scale — see PRD Section 7) |
| **GenAI** | Groq API Llama-3.3-70b (resume Q&A + cover letter generation) |
| **Security** | KMS (S3 encryption), IAM (per-Lambda least-privilege roles), Secrets Manager (API key), API Key auth |
