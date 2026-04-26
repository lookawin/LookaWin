#!/bin/bash

# ================================================================
#  LOOKA WIN — Script de démarrage local
#  Lance Hardhat, déploie les contrats, met à jour le frontend
# ================================================================

set -e

LOOKA_DIR="/root/looka"
FRONTEND_CONTRACT="$LOOKA_DIR/frontend/contract.js"
LOG_FILE="$LOOKA_DIR/hardhat.log"

echo ""
echo "════════════════════════════════════════"
echo "  LOOKA WIN — Démarrage local"
echo "════════════════════════════════════════"

# ── ÉTAPE 1 : Tuer les anciens processus ─────────────────────────
echo ""
echo "── Nettoyage des processus existants ──"
fuser -k 8545/tcp 2>/dev/null && echo "Port 8545 libéré" || echo "Port 8545 déjà libre"
sleep 1

# ── ÉTAPE 2 : Lancer le nœud Hardhat en arrière-plan ────────────
echo ""
echo "── Lancement du nœud Hardhat ──"
cd "$LOOKA_DIR"
npx hardhat node --hostname 0.0.0.0 > "$LOG_FILE" 2>&1 &
HARDHAT_PID=$!
echo "Hardhat PID : $HARDHAT_PID"

# Attendre que le nœud soit prêt
echo "Attente démarrage nœud..."
for i in $(seq 1 15); do
  sleep 1
  if curl -s -X POST http://127.0.0.1:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | grep -q "result"; then
    echo "✅ Nœud Hardhat prêt"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "❌ Nœud Hardhat n'a pas démarré"
    exit 1
  fi
done

# ── ÉTAPE 3 : Déployer les contrats ──────────────────────────────
echo ""
echo "── Déploiement des contrats ──"
DEPLOY_OUTPUT=$(npx hardhat run --network localhost scripts/deploy.js 2>&1)
echo "$DEPLOY_OUTPUT"

# Extraire les adresses
LOOKA_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "LookaWin :" | awk '{print $NF}')
USDT_ADDR=$(echo "$DEPLOY_OUTPUT"  | grep "USDT     :" | awk '{print $NF}')

if [ -z "$LOOKA_ADDR" ] || [ -z "$USDT_ADDR" ]; then
  echo "❌ Impossible d'extraire les adresses"
  exit 1
fi

echo ""
echo "── Adresses déployées ──"
echo "LookaWin : $LOOKA_ADDR"
echo "USDT     : $USDT_ADDR"

# ── ÉTAPE 4 : Mettre à jour contract.js ─────────────────────────
echo ""
echo "── Mise à jour de contract.js ──"
python3 << PYEOF
import re

with open('$FRONTEND_CONTRACT', 'r') as f:
    content = f.read()

# Remplacer les adresses
content = re.sub(
    r'export const LOOKA_ADDRESS = "0x[0-9a-fA-F]+";',
    'export const LOOKA_ADDRESS = "$LOOKA_ADDR";',
    content
)
content = re.sub(
    r'export const USDT_ADDRESS\s+=\s+"0x[0-9a-fA-F]+";',
    'export const USDT_ADDRESS  = "$USDT_ADDR";',
    content
)

with open('$FRONTEND_CONTRACT', 'w') as f:
    f.write(content)

print("✅ contract.js mis à jour")
PYEOF

# ── ÉTAPE 5 : Mint USDT pour les comptes de test ─────────────────
echo ""
echo "── Mint USDT pour les comptes de test ──"

cat > /root/looka/scripts/mint_usdt.js << JSEOF
const { ethers } = require("hardhat");
async function main() {
  const usdt = await ethers.getContractAt("MockUSDT", process.env.USDT_ADDR);
  const signers = await ethers.getSigners();
  for (let i = 1; i < 5; i++) {
    await usdt.mint(signers[i].address, 10000n * 1000000n);
    console.log("Minté 10 000 USDT pour", signers[i].address);
  }
}
main().catch(console.error);
JSEOF

USDT_ADDR=$USDT_ADDR npx hardhat run --network localhost scripts/mint_usdt.js

# ── RÉSUMÉ ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  DÉMARRAGE COMPLET ✅"
echo "════════════════════════════════════════"
echo ""
echo "LookaWin : $LOOKA_ADDR"
echo "USDT     : $USDT_ADDR"
echo "Hardhat  : http://127.0.0.1:8545"
echo "Frontend : https://looka.win"
echo ""
echo "📋 Token USDT MetaMask :"
echo "   Adresse  : $USDT_ADDR"
echo "   Symbole  : USDT"
echo "   Décimales: 6"
echo ""
echo "Hardhat tourne en arrière-plan (PID: $HARDHAT_PID)"
echo "Logs : tail -f $LOG_FILE"
echo ""
