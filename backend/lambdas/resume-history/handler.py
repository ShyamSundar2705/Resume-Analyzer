import json
import boto3
import os
import base64
from datetime import datetime

# Get environment variables
ANALYSIS_TABLE = os.environ.get("TABLE_NAME", "resume-analyzer-analysis")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(ANALYSIS_TABLE)

def decode_jwt_payload(token):
    """
    Manually decode JWT payload (without verification for now)
    Format: header.payload.signature
    We only need the payload which is base64url encoded JSON
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        
        # Get payload (second part), add padding if needed
        payload_encoded = parts[1]
        # Add padding
        padding = 4 - (len(payload_encoded) % 4)
        if padding != 4:
            payload_encoded += "=" * padding
        
        # Decode from base64url
        payload_json = base64.urlsafe_b64decode(payload_encoded)
        return json.loads(payload_json)
    except Exception as e:
        raise Exception(f"Failed to decode token: {str(e)}")

def extract_token_from_header(event):
    """Extract JWT token from Authorization header"""
    headers = event.get("headers", {})
    # Handle both lowercase and uppercase headers (API Gateway can send either)
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.replace("Bearer ", "").strip()

def lambda_handler(event, context):
    """
    GET /resume-history
    Returns a list of all analyzed resumes for the current user
    
    Requires: Authorization header with Bearer JWT token
    
    Response format:
    [
        {
            "name": "filename.pdf",
            "type": "PDF Document",
            "icon": "picture_as_pdf",
            "iconColor": "bg-red-500/10 text-red-400",
            "date": "2026-03-24",
            "status": "analyzed"
        },
        ...
    ]
    """
    
    try:
        # Extract JWT token from Authorization header
        token = extract_token_from_header(event)
        if not token:
            print("❌ No authorization token found in headers")
            return {
                "statusCode": 401,
                "body": json.dumps({"error": "Missing or invalid Authorization header"}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        try:
            payload = decode_jwt_payload(token)
        except Exception as e:
            print(f"❌ Token decode failed: {str(e)}")
            return {
                "statusCode": 401,
                "body": json.dumps({"error": str(e)}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        user_email = payload.get("email")
        
        if not user_email:
            print("❌ Missing email in JWT payload")
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid token: missing email"}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        # Scan analysis table for THIS USER's analyses
        # Only return records that have user_email field (new uploads)
        # Old records without user_email will be excluded (no backward compat for those)
        response = table.scan(
            FilterExpression="user_email = :email",
            ExpressionAttributeValues={
                ":email": user_email
            }
        )
        
        analyses = response.get("Items", [])
        print(f"✓ Found {len(analyses)} new analyses for user: {user_email} (note: old analyses without user_email are not shown)")
        
        # Transform to resume history format
        resumes = []
        for analysis in analyses:
            print(f"🔍 Processing analysis: {analysis.get('analysis_id')}")
            print(f"🔍 Available fields: {list(analysis.keys())}")
            print(f"🔍 file_key value: {analysis.get('file_key')}")
            
            # Determine file type icon based on filename
            file_name = analysis.get("file_name", "resume.pdf")
            file_key = analysis.get("file_key", "")
            file_ext = file_name.split(".")[-1].lower() if "." in file_name else "pdf"
            
            if file_ext == "pdf":
                icon = "picture_as_pdf"
                icon_color = "bg-red-500/10 text-red-400"
            elif file_ext in ["doc", "docx"]:
                icon = "description"
                icon_color = "bg-blue-500/10 text-blue-400"
            else:
                icon = "description"
                icon_color = "bg-slate-500/10 text-slate-400"
            
            # Format date
            created_at = analysis.get("created_at", datetime.now().isoformat())
            date_str = created_at.split("T")[0] if "T" in created_at else created_at
            
            resume = {
                "name": file_name,
                "type": f"{file_ext.upper()} Document",
                "icon": icon,
                "iconColor": icon_color,
                "date": date_str,
                "status": "analyzed",  # or "pending"
                "file_key": file_key,  # For downloading
            }
            print(f"✓ Resume object created with file_key: {file_key}")
            resumes.append(resume)
        
        # Sort by date descending (newest first)
        resumes.sort(key=lambda x: x["date"], reverse=True)
        
        return {
            "statusCode": 200,
            "body": json.dumps(resumes),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        # Return empty array instead of error to prevent UI breakage
        return {
            "statusCode": 200,
            "body": json.dumps([]),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
