# 📄 Changes Made – 27 March 2026

## 🔧 AWS SAM & Template Fixes
- Fixed YAML indentation error in `ChatFunction` causing `NoneType` build failure
- Added missing `/chat` API event to API Gateway
- Corrected IAM policy to use proper ARN instead of `!Ref`
- Removed `GroqApiKeySecret` from template to avoid duplicate secret creation error

---

## 🔐 Secrets Manager Fixes
- Resolved conflict: secret already existed in AWS
- Switched to using manually created secret (`groq_api_key`)
- Updated IAM policy to allow access via direct ARN

---

## 🤖 Groq API Integration Fixes
- Fixed incorrect API key usage (JSON vs raw key issue)
- Simplified secret parsing using `json.loads`
- Verified API works via curl (external validation)
- Confirmed correct model usage (`llama-3.1-8b-instant`)

---

## 🔐 IAM Permission Fixes
- Added `secretsmanager:GetSecretValue` permission to Chat Lambda role
- Fixed AccessDeniedException during secret retrieval

---

## 🌐 API & Debug Fixes
- Fixed Authorization header handling (case-insensitive)
- Ensured correct Bearer token format
- Verified API Gateway endpoint and request flow

---

## ✅ Current Status
- SAM build and deploy working
- Secrets Manager access working
- Chat Lambda successfully retrieves API key
- Groq API integration functional
- Chat endpoint ready for use