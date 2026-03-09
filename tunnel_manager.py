import subprocess
import re
import os
import time
import sys

def setup_tunnel():
    print("Starting serveo tunnel...")
    # Run serveo tunnel
    process = subprocess.Popen(
        ['ssh', '-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:8001', 'serveo.net'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    url = None
    url_pattern = re.compile(r'(https://[a-zA-Z0-9-]+\.serveousercontent\.com)')
    
    start_time = time.time()
    for line in iter(process.stdout.readline, ''):
        print(f"Tunnel Log: {line.strip()}")
        match = url_pattern.search(line)
        if match:
            url = match.group(1)
            print(f"✅ Found Tunnel URL: {url}")
            break
        if time.time() - start_time > 15: # Timeout if it takes too long
            print("❌ Timeout waiting for tunnel URL")
            break

    if not url:
        print("Failed to obtain tunnel URL.")
        process.terminate()
        return None, process

    return url, process

def update_frontend(url):
    print("Updating frontend configs...")
    
    # 1. Update frontend/.env
    env_path = os.path.join("frontend", ".env")
    with open(env_path, "w") as f:
        f.write(f"EXPO_PUBLIC_BACKEND_URL={url}\n")
        f.write("EXPO_PUBLIC_GOOGLE_CLIENT_ID=237070794063-3i6vkugt6n0n4s7ejhv7ace2hiumspjb.apps.googleusercontent.com\n")
    print("Updated frontend/.env")

    # 2. Update frontend/utils/api.ts
    api_path = os.path.join("frontend", "utils", "api.ts")
    with open(api_path, "r") as f:
        content = f.read()
    
    # regex replace backend literal
    content = re.sub(
        r"const API_URL = \(process\.env\.EXPO_PUBLIC_BACKEND_URL \|\| '[^']+'\) \+ '/api';",
        f"const API_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '{url}') + '/api';",
        content
    )
    with open(api_path, "w") as f:
        f.write(content)
    print("Updated frontend/utils/api.ts")

def deploy_vercel():
    print("Deploying frontend to Vercel production...")
    # Run in frontend folder
    os.chdir("frontend")
    deploy_cmd = 'npx.cmd vercel --prod --yes'
    subprocess.run(deploy_cmd, shell=True)
    os.chdir("..")

if __name__ == "__main__":
    url, tunnel_proc = setup_tunnel()
    if url:
        update_frontend(url)
        deploy_vercel()
        print("\n\n🎉 ALL DONE! The API is running and Vercel is updated with the new URL!")
        print(f"👉 Backend URL: {url}")
        print("We will keep this tunnel running... Press Ctrl+C to close.")
        
        # Keep the script holding the tunnel open
        try:
            tunnel_proc.wait()
        except KeyboardInterrupt:
            tunnel_proc.terminate()
            print("Tunnel closed.")
