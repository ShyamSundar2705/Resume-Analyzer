"""
Auth Lambda - Signup, Login, Change Password
"""
import boto3
import json
import os
import bcrypt
import jwt
import re
from datetime import datetime, timedelta

ddb = boto3.resource("dynamodb")
TABLE = os.environ.get("USERS_TABLE_NAME", "resume-analyzer-users")
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_EXPIRY_HOURS = 24

EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def generate_jwt_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def verify_jwt_token(token: str) -> dict:
    """Decode and verify JWT, return payload or raise"""
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def _error(status, message, headers):
    return {"statusCode": status, "headers": headers, "body": json.dumps({"error": message})}


def _success(status, data, headers):
    return {"statusCode": status, "headers": headers, "body": json.dumps(data)}


def signup(body: dict, headers: dict):
    email = body.get("email", "").strip().lower()
    password = body.get("password", "").strip()
    full_name = body.get("full_name", "").strip()

    if not email or not re.match(EMAIL_PATTERN, email):
        return _error(400, "Invalid email format", headers)
    if len(password) < 8:
        return _error(400, "Password must be at least 8 characters", headers)
    if not any(c.isupper() for c in password):
        return _error(400, "Password must contain at least 1 uppercase letter", headers)
    if not any(c.isdigit() for c in password):
        return _error(400, "Password must contain at least 1 number", headers)
    if not full_name:
        return _error(400, "Full name is required", headers)

    try:
        table = ddb.Table(TABLE)
        response = table.get_item(Key={"email": email})
        if 'Item' in response:
            return _error(409, "User already exists with this email", headers)

        hashed_pw = hash_password(password)
        user_id = f"user_{int(datetime.utcnow().timestamp() * 1000)}"

        user_item = {
            "email": email,
            "user_id": user_id,
            "full_name": full_name,
            "name": full_name,
            "password_hash": hashed_pw,
            "title": "Professional",
            "skills": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "ttl": int((datetime.utcnow() + timedelta(days=365*5)).timestamp())
        }
        table.put_item(Item=user_item)

        token = generate_jwt_token(user_id, email)
        return _success(201, {
            "message": "Signup successful",
            "user": {"user_id": user_id, "email": email, "full_name": full_name, "title": "Professional", "skills": []},
            "token": token
        }, headers)

    except Exception as e:
        print(f"ERROR in signup: {e}")
        import traceback; traceback.print_exc()
        return _error(500, f"Signup failed: {str(e)}", headers)


def login(body: dict, headers: dict):
    email = body.get("email", "").strip().lower()
    password = body.get("password", "").strip()

    if not email or not password:
        return _error(400, "Email and password are required", headers)

    try:
        table = ddb.Table(TABLE)
        response = table.get_item(Key={"email": email})
        if 'Item' not in response:
            return _error(401, "Invalid email or password", headers)

        user = response['Item']
        if not verify_password(password, user.get("password_hash", "")):
            return _error(401, "Invalid email or password", headers)

        token = generate_jwt_token(user["user_id"], email)
        return _success(200, {
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "full_name": user.get("full_name", ""),
                "title": user.get("title", "Professional"),
                "skills": user.get("skills", [])
            },
            "token": token
        }, headers)

    except Exception as e:
        print(f"ERROR in login: {e}")
        import traceback; traceback.print_exc()
        return _error(500, f"Login failed: {str(e)}", headers)


def change_password(body: dict, headers: dict, auth_header: str = ""):
    # Get token from Authorization header (Bearer <token>)
    token_str = ""
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header[7:]
    # Fallback: token in body (legacy)
    if not token_str:
        token_str = body.get("token", "")

    current = body.get("current_password", "")
    new_pw = body.get("new_password", "")

    if not token_str:
        return _error(401, "Authorization token required", headers)
    if not current or not new_pw:
        return _error(400, "current_password and new_password are required", headers)
    if len(new_pw) < 8:
        return _error(400, "New password must be at least 8 characters", headers)

    try:
        payload = verify_jwt_token(token_str)
        email = payload["email"]

        table = ddb.Table(TABLE)
        user = table.get_item(Key={"email": email}).get("Item")

        if not user or not verify_password(current, user.get("password_hash", "")):
            return _error(401, "Incorrect current password", headers)

        new_hash = hash_password(new_pw)
        table.update_item(
            Key={"email": email},
            UpdateExpression="SET password_hash = :pw, updated_at = :ts",
            ExpressionAttributeValues={
                ":pw": new_hash,
                ":ts": datetime.utcnow().isoformat()
            }
        )
        return _success(200, {"message": "Password updated successfully"}, headers)

    except jwt.ExpiredSignatureError:
        return _error(401, "Token expired, please log in again", headers)
    except jwt.InvalidTokenError:
        return _error(401, "Invalid token", headers)
    except Exception as e:
        print(f"ERROR in change_password: {e}")
        import traceback; traceback.print_exc()
        return _error(500, f"Password change failed: {str(e)}", headers)


def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-api-key,Authorization",
        "Content-Type": "application/json"
    }

    try:
        body = json.loads(event.get("body", "{}"))
        path = event.get("path", "")
        path_params = event.get("pathParameters") or {}
        action = path_params.get("action", "").lower()
        auth_header = event.get("headers", {}).get("Authorization", "") or \
                      event.get("headers", {}).get("authorization", "")

        # Route: /change-password
        if path == "/change-password" or "/change-password" in path:
            return change_password(body, headers, auth_header)

        # Route: /auth/signup or /auth/login
        if action == "signup":
            return signup(body, headers)
        elif action == "login":
            return login(body, headers)
        else:
            # Fallback: check body action field
            body_action = body.get("action", "").lower()
            if body_action == "signup":
                return signup(body, headers)
            elif body_action == "login":
                return login(body, headers)
            else:
                return _error(400, f"Invalid action '{action}'. Use 'signup' or 'login'", headers)

    except json.JSONDecodeError:
        return _error(400, "Invalid JSON in request body", headers)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback; traceback.print_exc()
        return _error(500, f"Internal server error: {str(e)}", headers)
