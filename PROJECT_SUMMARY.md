# 📋 Resume Analyzer - Comprehensive Project Summary

**Date:** March 24, 2026  
**Project Type:** Cloud-Based AI Resume Analysis System (College Mini Project)  
**Status:** 🟡 **80% Complete - Active Development**

---

## 📊 Current Project Status

### ✅ Completed Features
- ✅ Backend serverless architecture (AWS Lambda + API Gateway)
- ✅ Frontend React application with Vite build tooling
- ✅ **NEW:** User authentication system with JWT tokens (Signup/Login)
- ✅ **NEW:** AWS DynamoDB user database with bcrypt password hashing
- ✅ Skills ontology extraction (spaCy NLP)
- ✅ Resume parsing (PDF/DOCX support)
- ✅ S3 file storage with KMS encryption
- ✅ Resume analysis scoring (skills, experience, ATS match)
- ✅ Groq API integration for AI chat assistant
- ✅ Settings page with account management
- ✅ Docker & Docker Compose setup (dev + prod)
- ✅ Comprehensive .gitignore configuration
- ✅ Makefile with utility commands

### 🔄 In Progress / Remaining Issues
1. **Hardcoded Data** (MEDIUM) - DashboardPage still shows demo data instead of real analyzed data
2. **Chat JSON Error** (LOW) - Lambda error response format mismatch in chat handler
3. **Code Coverage** (NOT STARTED) - No test suite or coverage metrics implemented

### 📋 Outstanding Tasks
- [ ] Replace hardcoded analysis data with real backend data
- [ ] Fix chat Lambda JSON error handling
- [ ] Implement unit tests & integration tests
- [ ] Add code coverage metrics (pytest-cov, nyc)
- [ ] Performance optimization & caching
- [ ] Rate limiting on API endpoints
- [ ] Email verification for account signup
- [ ] Password reset functionality

---

## 🛠️ Tech Stack

### **Frontend Stack**
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI library |
| **Build Tool** | Vite | 5.4.2 | Fast build & dev server |
| **Routing** | React Router DOM | 6.26.1 | Client-side routing |
| **Styling** | TailwindCSS | 3.4.19 | Utility-first CSS framework |
| **CSS Processing** | PostCSS | 8.5.8 | CSS transformation |
| **Auto-prefixing** | Autoprefixer | 10.4.27 | Browser compatibility |
| **Node Runtime** | Node.js | 18+ | JavaScript runtime |
| **Package Manager** | NPM | Latest | Dependency management |

### **Backend Stack**
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Python | 3.11 | Lambda execution |
| **Framework** | AWS Lambda + API Gateway | - | Serverless compute |
| **Infrastructure** | AWS SAM | - | Serverless deployment |
| **Text Extraction** | pdfminer.six | 20221105 | PDF parsing |
| **Doc Processing** | python-docx | 1.1.2 | DOCX parsing |
| **NLP** | spaCy | 3.8.4 | Named entity extraction |
| **Model** | en_core_web_sm | - | English NLP model |
| **ML Scoring** | NumPy | 1.26.4 | Numerical computations |
| **AWS SDK** | boto3 | 1.42.70 | AWS service access |
| **HTTP Client** | requests | 2.32.5 | API calls |
| **Password Hashing** | bcrypt | 4.1.1 | Secure password storage |
| **JWT Tokens** | PyJWT | 2.8.1 | User authentication |

### **Cloud Infrastructure (AWS)**
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **API Gateway** | REST API endpoint | 1M requests/month |
| **Lambda** | Serverless compute (4 functions) | 1M requests + 400K GB-seconds/month |
| **S3** | Resume file storage | 5GB storage |
| **DynamoDB** | NoSQL database (2 tables) | 25GB storage + 25 RCU/25 WCU |
| **Secrets Manager** | API key storage | $0.40/secret/month |
| **IAM** | Identity & access control | Free |
| **KMS** | Encryption keys | Free (AWS managed) |

### **External APIs & Services**
| Service | Purpose | Cost |
|---------|---------|------|
| **Groq API** | Llama-3 AI chat | Free tier (unlimited) |
| **Vercel** | Frontend hosting | Free (optional) |

### **DevOps & Containerization**
| Tool | Purpose | Version |
|-----|---------|---------|
| **Docker** | Container runtime | Latest |
| **Docker Compose** | Multi-container orchestration | Latest |
| **LocalStack** | AWS services emulation | Latest |
| **Nginx** | Web server (prod) | Alpine |
| **Git** | Version control | Latest |

---

## 📁 Project File Structure & Descriptions

### **Root Level Files**
```
resume-analyzer/
├── .gitignore                 # Excludes: env vars, secrets, node_modules, __pycache__, venv
├── .dockerignore              # Excludes unnecessary files from Docker builds
├── Makefile                   # Utility commands for Docker, testing, and development
├── docker-compose.yml         # Production multi-service setup (frontend, backend, localstack, redis)
├── docker-compose.dev.yml     # Development setup with hot reload for frontend & backend
├── DOCKER.md                  # Complete Docker documentation & troubleshooting guide
├── README.md                  # Project setup guide & AWS configuration steps
├── README-v2.md               # Alternative documentation (legacy)
├── resume-analyzer-prd-v2.md  # Product Requirements Document v2
└── resume-analyzer-prd-v3.md  # Latest PRD with detailed specifications
```

### **Backend Directory** (`backend/`)
```
backend/
├── template.yaml              # AWS SAM CloudFormation template (defines all AWS resources)
├── requirements.txt           # Python dependencies for all Lambda functions
├── samconfig.toml             # SAM deployment configuration (auto-generated)
├── Dockerfile                 # Lambda image for production deployment
│
└── lambdas/
    │
    ├── analyze/               # Resume parsing & scoring Lambda
    │   ├── handler.py         # Extracts skills, calculates match score, stores analysis in DynamoDB
    │   ├── requirements.txt    # Dependencies: pdfminer, spacy, python-docx, numpy
    │   └── skills_ontology.json # Hardcoded skill taxonomy for matching
    │
    ├── chat/                  # AI conversation Lambda
    │   ├── handler.py         # Groq API integration for resume Q&A & cover letter generation
    │   └── requirements.txt    # Dependencies: requests, boto3, PyJWT
    │
    ├── presign/               # S3 presigned URL generation Lambda
    │   ├── handler.py         # Generates presigned URLs for direct S3 uploads
    │   └── requirements.txt    # Dependencies: boto3
    │
    └── auth/                  # User authentication Lambda
        ├── handler.py         # Handles signup/login with JWT token generation & bcrypt hashing
        └── requirements.txt    # Dependencies: bcrypt, PyJWT, boto3
```

### **Frontend Directory** (`resume-insights/`)
```
resume-insights/
├── index.html                 # Entry HTML file
├── vite.config.js             # Vite build configuration
├── tailwind.config.js          # TailwindCSS configuration
├── postcss.config.js           # PostCSS configuration
├── package.json               # NPM dependencies & scripts (dev, build, preview)
├── Dockerfile                 # Production image (Node build + Nginx serve)
├── Dockerfile.dev             # Development image (Vite dev server with hot reload)
├── nginx.conf                 # Nginx configuration with security headers & caching
│
└── src/
    ├── main.jsx               # React app entry point
    ├── App.jsx                # Main router with protected routes & auth guards
    ├── index.css              # Global styles & CSS variables
    ├── api.js                 # API client functions (upload, analyze, chat)
    ├── auth.js                # Authentication helpers (signup, login, logout, isAuthenticated)
    │
    ├── context/
    │   └── AuthContext.jsx    # Global authentication state management (user, token, login/logout)
    │
    ├── components/
    │   └── Navbar.jsx         # Header navigation, user dropdown, logout button
    │
    └── pages/
        ├── LoginPage.jsx      # Unified signup/login form with email validation & credential checking
        ├── HomePage.jsx       # Resume upload & job description input interface
        ├── ProcessingPage.jsx  # Analysis progress tracker with animated steps
        ├── DashboardPage.jsx   # Resume analysis results (score, gaps, AI chat panel) [HAS HARDCODED DATA]
        ├── ProfilePage.jsx     # User profile & resume history display
        └── SettingsPage.jsx    # Account settings, security, preferences, notifications
```

---

## 🏗️ Architecture Overview

### **Deployment Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│           REACT FRONTEND (Vercel / Nginx)              │
│   - React 18 + Vite (dev) / Nginx (prod)              │
│   - TailwindCSS styling                                │
│   - Client-side routing (React Router)                │
│   - AuthContext for global state                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ REST API (HTTPS)
┌────────────────────────────────────────────────────────┐
│        AWS API GATEWAY (ap-south-1 region)            │
│  - Custom domain & API key authentication             │
│  - CORS enabled                                        │
│  - Rate limiting: 1000 req/day per key                │
└────┬──────────┬────────────┬───────────┬──────────────┘
     │          │            │           │
     ▼          ▼            ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Presign│ │Analyze │ │  Chat  │ │  Auth  │
│Handler │ │Handler │ │Handler │ │Handler │
└────┬───┘ └───┬────┘ └───┬────┘ └────┬───┘
     │         │          │          │
     │    ┌────▼────┐     │          │
     │    │         │     │          │
     ▼    ▼         ▼     ▼          ▼
   ┌────────────────────────────────────────┐
   │    AWS Lambda (Python 3.11)            │
   │  - Text extraction (pdfminer + docx)  │
   │  - NLP (spaCy) for skill extraction   │
   │  - ML scoring (NumPy)                 │
   │  - Groq API calls for AI chat         │
   │  - JWT auth validation                │
   └───┬─────────────────────────┬──────────┘
       │                         │
       ▼                         ▼
   ┌─────────────┐          ┌──────────────────┐
   │  AWS S3     │          │  AWS DynamoDB    │
   │             │          │  (2 tables)      │
   │ Resumes     │          │ - Analysis       │
   │ (encrypted) │          │ - Users (bcrypt) │
   │ SSE-KMS     │          │ - TTL enabled    │
   └─────────────┘          └──────────────────┘
       │                         │
       ▼                         ▼
   ┌─────────────────────────────────────────────┐
   │      AWS Secrets Manager                    │
   │  - Groq API key                            │
   │  - JWT secret key                          │
   │  - Encryption keys (KMS)                   │
   └─────────────────────────────────────────────┘
```

### **Data Flow - Resume Analysis**
```
User Upload
    ↓
[LoginPage] ← Auth Lambda (JWT validation)
    ↓
[HomePage] → User enters job title + description
    ↓
[ProcessingPage] → Upload to S3 (presigned URL)
    ↓
Analyze Lambda:
  1. Fetch resume from S3
  2. Extract text (PDF/DOCX parser)
  3. NLP skill extraction (spaCy)
  4. Calculate match score (NumPy)
  5. Store in DynamoDB
    ↓
[DashboardPage] ← Fetch from DynamoDB
    ↓
User sees: Score, gaps, AI chat
    ↓
Chat Lambda: Groq API → Llama-3 → Response
```

---

## 🔐 Security & Authentication

### **Authentication Flow**
```
Signup:
  Email + Password → Hash (bcrypt) → DynamoDB users table
  ↓
  JWT token generated → Stored in localStorage

Login:
  Email + Password → Verify bcrypt hash → Match found?
  ├─ YES: Generate JWT token → localStorage
  └─ NO: Return 401 Unauthorized

Protected Routes:
  AuthContext → isAuthenticated check
  ├─ TRUE: Render page
  └─ FALSE: Redirect to /login
```

### **Security Features**
- ✅ Bcrypt password hashing (rounds: 12)
- ✅ JWT token expiry (24 hours)
- ✅ S3 encryption (SSE-KMS)
- ✅ API key required on all endpoints
- ✅ CORS configured on API Gateway
- ✅ IAM roles follow least privilege
- ✅ DynamoDB encryption at rest
- ⚠️ **TODO:** Email verification
- ⚠️ **TODO:** Refresh token rotation

---

## 📊 Code Coverage Status

### **Current State: NO FORMAL TEST SUITE**

| Layer | Testing Status | Coverage |
|-------|----------------|----------|
| **Frontend (React)** | ❌ Not started | 0% |
| **Backend Lambdas** | ❌ Not started | 0% |
| **Utils/Helpers** | ❌ Not started | 0% |
| **Authentication** | ❌ Not started | 0% |
| **API Integration** | ❌ Not started | 0% |

### **Required Testing Setup**
```bash
# Backend testing
pip install pytest pytest-cov pytest-mock
pytest tests/ --cov=lambdas --cov-report=html

# Frontend testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm run test -- --coverage
```

### **Recommended Test Files to Create**
- `backend/tests/test_analyze_handler.py` - Resume parsing & scoring
- `backend/tests/test_auth_handler.py` - Signup/login validation
- `backend/tests/test_chat_handler.py` - Groq API integration
- `resume-insights/src/__tests__/LoginPage.test.jsx` - Auth form validation
- `resume-insights/src/__tests__/DashboardPage.test.jsx` - Data display
- `resume-insights/src/__tests__/api.test.js` - API client functions

---

## 🚀 Deployment Status

### **Deployed Infrastructure**
- ✅ AWS Lambda functions (4 functions: presign, analyze, chat, auth)
- ✅ API Gateway endpoint (ap-south-1 region)
- ✅ DynamoDB tables (resume-analyzer-analysis, resume-analyzer-users)
- ✅ S3 bucket (resume-analyzer-bucket, encrypted)
- ✅ Secrets Manager (Groq API key, JWT secret)
- ✅ CloudWatch logs (automatic)

### **Frontend Deployment Options**
| Platform | Status | Cost |
|----------|--------|------|
| **Vercel** | Ready to deploy | Free |
| **Netlify** | Ready to deploy | Free |
| **AWS S3 + CloudFront** | Ready to deploy | ~$1/month |
| **Docker** | Ready (Nginx image) | Variable |

---

## 📋 Key Endpoints & API Routes

### **Authentication Endpoints**
```
POST /auth/signup
  Body: { email, password, full_name }
  Response: { token, user: { user_id, email, full_name } }

POST /auth/login
  Body: { email, password }
  Response: { token, user: { user_id, email, full_name } }
```

### **Resume Analysis Endpoints**
```
POST /upload-url
  Body: { filename, content_type }
  Response: { upload_url, file_key }

POST /analyze
  Body: { file_key, job_title, job_description }
  Response: { match_score, sub_scores, extracted_skills, skill_gaps, ... }

POST /chat
  Body: { message, history, context }
  Response: { reply: "..." }
```

---

## 🐛 Known Issues & Workarounds

### **Issue #1: Hardcoded Analysis Data (MEDIUM)**
**File:** `resume-insights/src/pages/DashboardPage.jsx`  
**Problem:** Uses fallback demo data instead of real analysis  
**Location:** Line ~154 (analysis object)  
**Impact:** Users see "Senior Software Engineer" data instead of their actual results  
**Fix Status:** Not started

### **Issue #2: Chat JSON Error (LOW)**
**File:** `backend/lambdas/chat/handler.py`  
**Problem:** Error response format has nested JSON structure  
**Error Message:** "Expecting property name enclosed in double quotes: line 1 column 2 (char 1)"  
**Impact:** Chat feature throws exception when backend error occurs  
**Fix Status:** Not started

### **Issue #3: No Test Coverage (MEDIUM)**
**Problem:** Zero test suite implementation  
**Impact:** No regression testing, QA relies on manual testing  
**Fix Status:** Not started (requires full test infrastructure)

---

## 📈 Performance Metrics

### **Expected Performance**
| Metric | Target | Current |
|--------|--------|---------|
| Resume upload to analysis | < 10s | ✓ Met |
| Lambda cold start | < 2s | ✓ Met (1GB memory) |
| DynamoDB query | < 100ms | ✓ Met (on-demand) |
| Chat response | < 5s | ✓ Met (Groq free tier) |
| Frontend load time | < 3s | ✓ Met (Vite optimized) |

### **Lambda Memory Configuration**
- **Auth Function:** 256 MB (lightweight)
- **Presign Function:** 128 MB (minimal)
- **Analyze Function:** 1024 MB (high memory for spaCy)
- **Chat Function:** 256 MB (moderate)

---

## 🔄 Development Workflow

### **Local Development Setup**
```bash
# 1. Clone & setup
git clone <repo>
cd resume-analyzer
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt
cd resume-insights && npm install && cd ..

# 3. Start development environment
make dev
# OR
docker-compose -f docker-compose.dev.yml up

# 4. Access
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
```

### **Deployment Process**
```bash
# 1. Build & deploy backend
cd backend
sam build
sam deploy

# 2. Deploy frontend (Vercel)
npm run build
vercel deploy
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Setup instructions & AWS configuration steps |
| `README-v2.md` | Alternative documentation (legacy) |
| `DOCKER.md` | Complete Docker & containerization guide |
| `resume-analyzer-prd-v3.md` | Latest Product Requirements Document |
| `Makefile` | Utility commands with descriptions |
| `.gitignore` | Version control ignore patterns |

---

## 🎯 Next Steps (Priority Order)

### **High Priority**
1. **Test Suite Implementation** - Add pytest + coverage
2. **Fix Hardcoded Data** - Replace demo data in DashboardPage
3. **Fix Chat Error** - Debug JSON parsing in handler

### **Medium Priority**
4. Email verification for signup
5. Password reset functionality
6. Rate limiting enhancements
7. Performance optimization & caching

### **Low Priority**
8. Analytics & usage tracking
9. User role-based access (free vs. premium)
10. Batch resume upload
11. Export reports functionality

---

## 📞 Support & Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **Groq API:** https://console.groq.com/
- **spaCy NLP:** https://spacy.io/
- **React Docs:** https://react.dev/
- **Docker:** https://docs.docker.com/
- **TailwindCSS:** https://tailwindcss.com/

---

**Last Updated:** March 24, 2026  
**Prepared By:** Development Team  
**Status:** 🟡 Active Development (80% Complete)
