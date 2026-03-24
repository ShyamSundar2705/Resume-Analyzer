"""
Auth Lambda - Signup and Login
- Stores user credentials in DynamoDB (with bcrypt hashing)
- Issues JWT tokens on successful login
- Returns user info on signup/login
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

# Email validation regex
EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def generate_jwt_token(user_id: str, email: str) -> str:
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def _error(status, message, headers):
    """Return error response"""
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps({"error": message})
    }


def _success(status, data, headers):
    """Return success response"""
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(data)
    }


def signup(body: dict, headers: dict):
    """Handle user signup"""
    email = body.get("email", "").strip().lower()
    password = body.get("password", "").strip()
    full_name = body.get("full_name", "").strip()

    # Validate email
    if not email or not re.match(EMAIL_PATTERN, email):
        return _error(400, "Invalid email format", headers)

    # Validate password (min 8 chars, at least 1 uppercase, 1 number)
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

        # Check if user already exists
        response = table.get_item(Key={"email": email})
        if 'Item' in response:
            return _error(409, "User already exists with this email", headers)

        # Hash password and create user
        hashed_pw = hash_password(password)
        user_id = f"user_{int(datetime.utcnow().timestamp() * 1000)}"

        user_item = {
            "email": email,
            "user_id": user_id,
            "full_name": full_name,
            "password_hash": hashed_pw,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "ttl": int((datetime.utcnow() + timedelta(days=365*5)).timestamp())  # 5 year TTL
        }

        table.put_item(Item=user_item)

        # Generate JWT token
        token = generate_jwt_token(user_id, email)

        return _success(201, {
            "message": "Signup successful",
            "user": {
                "user_id": user_id,
                "email": email,
                "full_name": full_name
            },
            "token": token
        }, headers)

    except Exception as e:
        print(f"ERROR in signup: {e}")
        import traceback
        traceback.print_exc()
        return _error(500, f"Signup failed: {str(e)}", headers)


def login(body: dict, headers: dict):
    """Handle user login"""
    email = body.get("email", "").strip().lower()
    password = body.get("password", "").strip()

    # Validate inputs
    if not email or not password:
        return _error(400, "Email and password are required", headers)

    try:
        table = ddb.Table(TABLE)

        # Fetch user
        response = table.get_item(Key={"email": email})
        if 'Item' not in response:
            return _error(401, "Invalid email or password", headers)

        user = response['Item']

        # Verify password
        if not verify_password(password, user.get("password_hash", "")):
            return _error(401, "Invalid email or password", headers)

        # Generate JWT token
        token = generate_jwt_token(user["user_id"], email)

        return _success(200, {
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "full_name": user.get("full_name", "")
            },
            "token": token
        }, headers)

    except Exception as e:
        print(f"ERROR in login: {e}")
        import traceback
        traceback.print_exc()
        return _error(500, f"Login failed: {str(e)}", headers)


def lambda_handler(event, context):
    """Main Lambda handler"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-api-key",
        "Content-Type": "application/json"
    }

    try:
        # Parse request
        body = json.loads(event.get("body", "{}"))
        action = event.get("pathParameters", {})
        if action:
            action = action.get("action", "").lower()
        else:
            action = body.get("action", "").lower()

        # Route to appropriate handler
        if action == "signup":
            return signup(body, headers)
        elif action == "login":
            return login(body, headers)
        else:
            return _error(400, "Invalid action. Use 'signup' or 'login'", headers)

    except json.JSONDecodeError:
        return _error(400, "Invalid JSON in request body", headers)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return _error(500, f"Internal server error: {str(e)}", headers)
