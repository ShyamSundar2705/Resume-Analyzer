# ResumeIQ — Cloud-Based Resume Analyzer

AI-powered resume analysis with skill gap detection and GenAI coaching.
Built on AWS (free tier) + Groq (free) for a college mini project.

## Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React + Vite → Vercel | Free |
| API | AWS API Gateway | Free tier |
| Logic | AWS Lambda (Python 3.12) | Free tier |
| Storage | AWS S3 (SSE-KMS) | Free tier |
| Database | AWS DynamoDB | Free tier |
| NLP | spaCy en_core_web_sm | Free (open source) |
| AI Assistant | Groq API (Llama-3-70b) | Free tier |

---

## Setup: Step by Step

### Prerequisites (install these first)

```bash
# 1. Python 3.12
python --version   # should show 3.12.x

# 2. AWS CLI
pip install awscli
aws --version

# 3. AWS SAM CLI
pip install aws-sam-cli
sam --version

# 4. Node.js (for frontend)
node --version   # should be 18+

# 5. Vercel CLI (for deployment)
npm install -g vercel
```

---

### Step 1 — Create AWS Account (Free Tier)

1. Go to https://aws.amazon.com/free/
2. Click "Create a Free Account"
3. Fill in details — use a personal email
4. Add a credit card (required, but you won't be charged — free tier covers everything)
5. Choose "Basic support" (free)

**After account creation:**
```bash
# Configure AWS CLI with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region: ap-south-1, Output: json
```

To get Access Key: AWS Console → IAM → Users → Your user → Security credentials → Create access key

---

### Step 2 — Get Groq API Key (Free)

1. Go to https://console.groq.com/
2. Sign up with Google or email (free)
3. Go to API Keys → Create API Key
4. Copy the key — you'll need it in Step 4

---

### Step 3 — Deploy the Backend

```bash
cd backend

# Build all Lambda functions
sam build

# Deploy to AWS (follow the prompts — accept defaults)
sam deploy --guided
```

When prompted:
- Stack name: `resume-analyzer`
- AWS Region: `ap-south-1`
- Confirm changes: `Y`
- Allow SAM to create IAM roles: `Y`
- Save arguments to samconfig.toml: `Y`

After deploy completes, note the **ApiUrl** from the outputs.

---

### Step 4 — Add Your Groq API Key to AWS

```bash
# Replace YOUR_GROQ_KEY with your actual key from Step 2
aws secretsmanager put-secret-value \
  --secret-id resume-analyzer/groq-api-key \
  --secret-string '{"api_key": "YOUR_GROQ_KEY"}' \
  --region ap-south-1
```

---

### Step 5 — Get Your API Gateway Key

```bash
# List API keys
aws apigateway get-api-keys --include-values --region ap-south-1

# Copy the "value" field from the output
```

---

### Step 6 — Install Lambda Dependencies

The SAM build handles this automatically. But if you want to test locally:

```bash
cd backend
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

---

### Step 7 — Deploy the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Edit .env — paste your ApiUrl (from Step 3) and API Key (from Step 5)
nano .env

# Test locally first
npm run dev
# Open http://localhost:5173

# Deploy to Vercel
vercel
# Follow prompts — it will give you a live URL
```

---

### Step 8 — Test It End to End

1. Open your Vercel URL
2. Upload a sample PDF resume
3. Type "Software Engineer" as the job title
4. Click "Analyze Resume"
5. Watch the results load
6. Chat with the AI: "What's my biggest skill gap?"
7. Ask: "Write me a cover letter"

---

## Project Structure

```
resume-analyzer/
├── backend/
│   ├── template.yaml              ← AWS SAM template (all infra)
│   ├── requirements.txt
│   └── lambdas/
│       ├── presign/
│       │   └── handler.py         ← Generates S3 presigned URL
│       ├── analyze/
│       │   ├── handler.py         ← NLP + scoring logic
│       │   └── skills_ontology.json ← 3000+ skills + job roles
│       └── chat/
│           └── handler.py         ← Groq AI assistant
├── frontend/
│   ├── src/
│   │   ├── App.jsx                ← Full React app
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## How It Works (for your viva)

### 1. Upload Flow
```
User selects resume → React calls /upload-url Lambda via API Gateway
→ Lambda generates a presigned S3 PUT URL (scoped, encrypted)
→ React uploads file directly to S3 (bypasses Lambda — efficient)
→ File stored with SSE-KMS encryption
```

### 2. Analysis Flow
```
React calls /analyze with file_key + job_title
→ Lambda downloads file from S3
→ Text extracted (pdfminer for PDF, python-docx for DOCX)
→ spaCy NLP extracts skill entities
→ Matched against skills_ontology.json (3000+ skills, all domains)
→ TF-IDF cosine similarity scores resume vs JD
→ Result stored in DynamoDB
→ JSON response to frontend
```

### 3. Chat Flow
```
User types message → React calls /chat with message + analysis context
→ Lambda fetches analysis from DynamoDB
→ Builds system prompt with full analysis context
→ Calls Groq API (Llama-3-70b)
→ Returns AI response
```

### 4. Security
- All API calls require `x-api-key` header (API Gateway key)
- Resumes stored encrypted at rest (SSE-KMS on S3)
- Lambda roles have least-privilege IAM policies (presign can't read, analyze can't chat, etc.)
- S3 has Block Public Access: ALL — no public URLs ever
- Groq API key stored in AWS Secrets Manager, not hardcoded

### 5. Why Spark in Production (for viva)
> "In the demo we run NLP inline in Lambda because for a single resume it takes 3-5 seconds — ideal for a demo. In production with thousands of concurrent users, we'd move to AWS Glue with PySpark. Glue distributes the NLP processing across a cluster — the same 3-5 seconds per resume but for 1000 resumes in parallel. The architecture supports this migration without changing the API layer — you just swap the Lambda analyze function with a Glue job trigger + polling."

---

## AWS Services Used (CPPE Coverage)

| Pillar | Services |
|---|---|
| **Cloud** | API Gateway, Lambda |
| **Data** | S3, (Spark/Glue documented for production) |
| **GenAI** | Groq Llama-3 (AI assistant) |
| **Security** | KMS (S3 encryption), IAM (per-Lambda roles), Secrets Manager, API Key auth |

---

## Troubleshooting

**`sam build` fails:**
```bash
pip install aws-sam-cli --upgrade
```

**Lambda timeout on analyze:**
- Lambda timeout is set to 60s in template.yaml — should be enough
- If it times out, the resume might be very large or complex

**Groq API error:**
- Check your API key is set correctly in Secrets Manager
- Groq free tier allows 30 requests/minute — more than enough for a demo

**CORS error in browser:**
- The SAM template sets CORS headers — check that your API Gateway stage is deployed
- Run `sam deploy` again if needed

**S3 upload fails:**
- Check the presigned URL hasn't expired (5 minute window)
- Make sure file is under 5 MB
"# Resume-Analyzer" 
