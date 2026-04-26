#!/bin/bash
cd ~/looka/frontend && npm run build && python3 << 'EOF'
import os, requests, subprocess
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDIzYTBjYS1iN2UzLTQ3YzMtYWFiNi0xM2UwZTk5MDEyODUiLCJlbWFpbCI6InJha290b3phZnlhbmRyeUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZGJiZmNjZGUxNjYzNzdiZDA2NTUiLCJzY29wZWRLZXlTZWNyZXQiOiI2NzEzYzJlNmJkOTQ2MmU1NjZhNWI0YTIxZmQxYjg1YzdhNjA5N2RjYWYxOTFlY2QzMDRkMjIwZGQ2M2IyZWYyIiwiZXhwIjoxODA2ODM4MjgyfQ.mZptSGXXykTEzimDgmRAp9-1gJ-Zn2I8ixJDsqccEF0"
OUT_DIR = "/root/looka/frontend/out"
headers = {"Authorization": f"Bearer {JWT}"}
files = []
for root, dirs, filenames in os.walk(OUT_DIR):
    for filename in filenames:
        filepath = os.path.join(root, filename)
        relative = os.path.relpath(filepath, OUT_DIR)
        files.append(("file", (f"lookawin/{relative}", open(filepath, "rb"), "application/octet-stream")))
response = requests.post(

    headers=headers, files=files,

)
if response.status_code == 200:
    cid = response.json()["IpfsHash"]
    nginx = open('/etc/nginx/sites-enabled/looka').read()
    old_cid = nginx.split('/ipfs/')[1].split('/')[0]
    nginx = nginx.replace(old_cid, cid)
    open('/etc/nginx/sites-enabled/looka', 'w').write(nginx)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    print(f"✅ CID : {cid} → looka.win mis à jour")
else:
    print(f"❌ Erreur {response.status_code}")
EOF
cp -r /root/looka/frontend/out/* /var/www/looka/ && systemctl reload nginx
