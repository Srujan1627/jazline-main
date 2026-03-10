import requests
import sys

TOKEN = "rnd_Kle2VsfH6kdDr7RXPA1xeEJHIhOL"
OWNER_ID = "tea-d6n9orea2pns73f78i60"
REPO = "https://github.com/Srujan1627/jazline-main"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

backend_payload = {
    "type": "web_service",
    "name": "jazline-backend-v84",
    "ownerId": OWNER_ID,
    "repo": REPO,
    "autoDeploy": "yes",
    "branch": "main",
    "serviceDetails": {
        "env": "python",
        "plan": "free",
        "envSpecificDetails": {
            "buildCommand": "pip install -r requirements.txt",
            "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT"
        },
        "envVars": [
            {"key": "DB_NAME", "value": "jazline"},
            {"key": "DATABASE_URL", "generateValue": True},
            {"key": "JWT_SECRET", "generateValue": True},
            {"key": "GOOGLE_CLIENT_ID", "value": "set-me"},
            {"key": "GOOGLE_CLIENT_SECRET", "value": "set-me"}
        ]
    }
}

resp_backend = requests.post("https://api.render.com/v1/services", json=backend_payload, headers=headers)
output = f"Backend Response:\n{resp_backend.status_code}\n{resp_backend.text}\n"

if resp_backend.status_code in [200, 201]:
    backend_data = resp_backend.json()
    backend_url = backend_data.get('service', {}).get('serviceDetails', {}).get('url', '')
    if not backend_url:
        backend_url = f"https://{backend_data['service']['id']}.onrender.com"
    
    frontend_payload = {
        "type": "web_service",
        "name": "jazline-frontend-v84",
        "ownerId": OWNER_ID,
        "repo": REPO,
        "autoDeploy": "yes",
        "branch": "main",
        "rootDir": "frontend",
        "serviceDetails": {
            "env": "node",
            "plan": "free",
            "envSpecificDetails": {
                "buildCommand": "npm install && npm run build",
                "startCommand": "npx serve dist -s -p $PORT"
            },
            "envVars": [
                {"key": "EXPO_PUBLIC_BACKEND_URL", "value": backend_url}
            ]
        }
    }

    resp_frontend = requests.post("https://api.render.com/v1/services", json=frontend_payload, headers=headers)
    output += f"\nFrontend Response:\n{resp_frontend.status_code}\n{resp_frontend.text}\n"

with open('api_logs.txt', 'w', encoding='utf-8') as f:
    f.write(output)
