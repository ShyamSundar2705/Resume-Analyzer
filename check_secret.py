import boto3
import json

client = boto3.client('secretsmanager', region_name='ap-south-1')

try:
    response = client.get_secret_value(SecretId='resume-analyzer/groq-api-key')
    secret_string = response['SecretString']
    
    print("=== SECRET VALUE ===")
    print(f"Raw secret: {secret_string[:100]}...")
    print(f"\nSecret length: {len(secret_string)}")
    
    # Try to parse as JSON
    try:
        parsed = json.loads(secret_string)
        print(f"\n✓ Valid JSON!")
        print(f"Keys in JSON: {list(parsed.keys())}")
        print(f"Full JSON: {parsed}")
    except json.JSONDecodeError as e:
        print(f"\n✗ Not JSON - plain text secret")
        print(f"First 50 chars: {secret_string[:50]}")
        
except Exception as e:
    print(f"Error retrieving secret: {e}")
