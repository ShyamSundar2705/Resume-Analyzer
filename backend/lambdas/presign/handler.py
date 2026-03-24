import boto3
import json
import uuid
import os

s3 = boto3.client("s3")
BUCKET = os.environ["BUCKET_NAME"]

ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-api-key",
        "Content-Type": "application/json"
    }

    try:
        body = json.loads(event.get("body", "{}"))
        filename = body.get("filename", "").strip()
        content_type = body.get("content_type", "").strip()

        # Validate inputs
        if not filename or not content_type:
            return _error(400, "filename and content_type are required", headers)

        if content_type not in ALLOWED_TYPES:
            return _error(400, "Only PDF and DOCX files are allowed", headers)

        # Validate file extension matches content type
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if content_type == "application/pdf" and ext != "pdf":
            return _error(400, "Filename must end in .pdf for PDF content type", headers)
        if "wordprocessingml" in content_type and ext != "docx":
            return _error(400, "Filename must end in .docx for DOCX content type", headers)

        # Generate unique file key
        file_id = uuid.uuid4().hex
        file_key = f"resumes/{file_id}/{filename}"

        # Generate presigned PUT URL (5 minute expiry)
        # Note: Bucket default encryption (SSE-KMS) applies automatically server-side.
        # Do NOT include ServerSideEncryption in Params — it forces the browser to send
        # x-amz-server-side-encryption as a signed header, which causes CORS/403 issues.
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET,
                "Key": file_key,
                "ContentType": content_type,
            },
            ExpiresIn=300
        )

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "upload_url": upload_url,
                "file_key": file_key
            })
        }

    except Exception as e:
        print(f"ERROR in presign: {e}")
        return _error(500, "Internal server error", headers)


def _error(status, message, headers):
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps({"error": message})
    }
