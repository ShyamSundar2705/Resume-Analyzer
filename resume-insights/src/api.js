// ── API Configuration ─────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "";
const API_KEY = import.meta.env.VITE_API_KEY || "";

const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
};

async function request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers,
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
}

// ── Resume Upload ─────────────────────────────────────────────
// Step 1: Get a presigned S3 URL
export async function getUploadUrl(filename, contentType) {
    return request("/upload-url", {
        method: "POST",
        body: JSON.stringify({ filename, content_type: contentType }),
    });
}

// Step 2: Upload file directly to S3 (bypasses Lambda)
export async function uploadToS3(uploadUrl, file) {
    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!res.ok) throw new Error("S3 upload failed");
}

// ── Resume Analysis ───────────────────────────────────────────
// Step 3: Trigger analysis after upload
export async function analyzeResume(fileKey, jobTitle, jobDescription = "") {
    return request("/analyze", {
        method: "POST",
        body: JSON.stringify({
            file_key: fileKey,
            job_title: jobTitle,
            job_description: jobDescription,
        }),
    });
}

// ── AI Chat ───────────────────────────────────────────────────
export async function sendChatMessage(message, history, analysisContext) {
    return request("/chat", {
        method: "POST",
        body: JSON.stringify({
            message,
            history: history.slice(-8),  // keep last 8 turns to save tokens
            context: analysisContext,
        }),
    });
}

// ── Cover Letter ──────────────────────────────────────────────
export async function generateCoverLetter(analysisContext, tone = "professional") {
    return request("/chat", {
        method: "POST",
        body: JSON.stringify({
            message: `Write me a tailored cover letter for the ${analysisContext.job_title} role. Use a ${tone} tone. 300-400 words.`,
            history: [],
            context: analysisContext,
        }),
    });
}