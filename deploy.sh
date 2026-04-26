#!/bin/bash
set -e

echo "🔨 Build Next.js..."
cd ~/looka/frontend && rm -rf .next && npm run build

echo "📦 Upload IPFS Pinata..."
CID=$(python3 << 'PYEOF'
import os, requests
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDIzYTBjYS1iN2UzLTQ3YzMtYWFiNi0xM2UwZTk5MDEyODUiLCJlbWFpbCI6InJha290b3phZnlhbmRyeUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZGJiZmNjZGUxNjYzNzdiZDA2NTUiLCJzY29wZWRLZXlTZWNyZXQiOiI2NzEzYzJlNmJkOTQ2MmU1NjZhNWI0YTIxZmQxYjg1YzdhNjA5N2RjYWYxOTFlY2QzMDRkMjIwZGQ2M2IyZWYyIiwiZXhwIjoxODA2ODM4MjgyfQ.mZptSGXXykTEzimDgmRAp9-1gJ-Zn2I8ixJDsqccEF0"
OUT_DIR = "/root/looka/frontend/out"
files = []
for root, dirs, filenames in os.walk(OUT_DIR):
    for filename in filenames:
        filepath = os.path.join(root, filename)
        relative = os.path.relpath(filepath, OUT_DIR)
        files.append(("file", (f"lookawin/{relative}", open(filepath, "rb"), "application/octet-stream")))
r = requests.post("https://api.pinata.cloud/pinning/pinFileToIPFS", headers={"Authorization": f"Bearer {JWT}"}, files=files)
if r.status_code == 200:
    print(r.json()["IpfsHash"])
else:
    import sys; print(f"ERREUR {r.status_code}: {r.text}", file=sys.stderr); sys.exit(1)
PYEOF
)

echo "🌐 Mise à jour Nginx → CID: $CID"
OLD_CID=$(grep -o 'Qm[a-zA-Z0-9]*' /etc/nginx/sites-enabled/looka | head -1)
sed -i "s/$OLD_CID/$CID/g" /etc/nginx/sites-enabled/looka
nginx -t && systemctl reload nginx

echo "💾 Sauvegarde Git..."
cd /root/looka
git add -A
git commit -m "deploy $(date '+%Y-%m-%d %H:%M') — CID: $CID"

echo ""
echo "✅ Déploiement terminé !"
echo "   CID : $CID"
echo "   URL : https://looka.win"
