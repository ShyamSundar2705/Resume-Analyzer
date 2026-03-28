import json
import boto3
import os
import base64
from datetime import datetime

# Get environment variables
USERS_TABLE = os.environ.get("USERS_TABLE_NAME", "resume-analyzer-users")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)

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
    headers = event.get("headers", {})
    
    # Handle both lowercase and uppercase headers
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    
    if not auth_header.startswith("Bearer "):
        return None
    
    return auth_header.replace("Bearer ", "").strip()

def lambda_handler(event, context):
    """
    GET /user-profile
    Returns the current user's profile information (name, title, email, skills)
    
    Requires: Authorization header with Bearer JWT token
    """
    
    try:
        # Extract JWT token from Authorization header
        token = extract_token_from_header(event)
        if not token:
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
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid token: missing email"}),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        # Fetch user from DynamoDB
        response = table.get_item(Key={"email": user_email})
        user = response.get("Item")
        
        if not user:
            # User not found - return default profile
            print(f"User not found in DB for email: {user_email}")
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "name": user_email.split("@")[0].title(),
                    "title": "Professional",
                    "email": user_email,
                    "skills": [],
                }),
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        
        # If user exists but is missing fields, add them (backward compatibility for old users)
        if "title" not in user:
            user["title"] = "Professional"
        if "skills" not in user:
            user["skills"] = []
        if "name" not in user and "full_name" in user:
            user["name"] = user["full_name"]
        
        # Update user in DB if we added missing fields
        update_needed = any(k not in response.get("Item", {}) for k in ["title", "skills", "name"])
        if update_needed:
            try:
                table.update_item(
                    Key={"email": user_email},
                    UpdateExpression="SET #title = :title, #skills = :skills, #name = :name, #updated = :updated",
                    ExpressionAttributeNames={
                        "#title": "title",
                        "#skills": "skills",
                        "#name": "name",
                        "#updated": "updated_at"
                    },
                    ExpressionAttributeValues={
                        ":title": user.get("title", "Professional"),
                        ":skills": user.get("skills", []),
                        ":name": user.get("name") or user.get("full_name") or user_email.split("@")[0],
                        ":updated": datetime.now().isoformat()
                    }
                )
                print(f"✓ Updated user {user_email} with missing fields")
            except Exception as e:
                print(f"Warning: Could not update user record: {e}")
        
        # Return user profile
        # Note: full_name is stored during signup, map it to name
        profile = {
            "name": user.get("full_name") or user.get("name") or user_email.split("@")[0].title(),
            "title": user.get("title", "Professional"),
            "email": user.get("email", user_email),
            "skills": user.get("skills", []),
        }
        print(f"✓ User found in DB: {user.keys()}")
        print(f"✓ Returning profile: {profile}")
        
        return {
            "statusCode": 200,
            "body": json.dumps(profile),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
