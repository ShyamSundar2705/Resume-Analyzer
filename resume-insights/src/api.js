// api.js
// ── Config ────────────────────────────────────────────────────
const API_URL  = import.meta.env.VITE_API_URL || "";
const API_KEY  = import.meta.env.VITE_API_KEY || "";

const baseHeaders = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

async function request(path, options = {}) {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const headers = { ...baseHeaders, ...customHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  return data;
}

// ── Resume Upload ─────────────────────────────────────────────
export async function getUploadUrl(filename, contentType) {
  return request("/upload-url", {
    method: "POST",
    body: JSON.stringify({ filename, content_type: contentType }),
  });
}

export async function uploadToS3(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("S3 upload failed");
}

// ── Resume Analysis ───────────────────────────────────────────
export async function analyzeResume(fileKey, jobTitle, jobDescription = "", userEmail = "", fileName = "") {
  return request("/analyze", {
    method: "POST",
    body: JSON.stringify({
      file_key: fileKey,
      job_title: jobTitle,
      job_description: jobDescription,
      user_email: userEmail,
      file_name: fileName,
    }),
  });
}

// ── Download Resume ───────────────────────────────────────────
export async function getDownloadUrl(fileKey) {
  return request("/download-url", {
    method: "POST",
    body: JSON.stringify({ file_key: fileKey }),
  });
}

// ── AI Chat ───────────────────────────────────────────────────
export async function sendChatMessage(message, history, analysisContext) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      history: history.slice(-8),
      context: analysisContext,
    }),
  });
}

// ── User Profile ──────────────────────────────────────────────
export async function getUserProfile(token) {
  return request("/user-profile", {
    method: "GET",
    token,
  });
}

export async function updateUserProfile(token, { full_name, title }) {
  return request("/user-profile", {
    method: "PUT",
    token,
    body: JSON.stringify({ full_name, title }),
  });
}

// ── Change Password ───────────────────────────────────────────
export async function changePassword(token, data) {
  return request("/change-password", {
    method: "POST",
    token, // already added here
    body: JSON.stringify(data),
  });
}

// ── Resume History ────────────────────────────────────────────
export async function getResumeHistory(token) {
  return request("/resume-history", {
    method: "GET",
    token,
  });
}
