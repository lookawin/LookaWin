#!/bin/bash
while true; do
  sleep 30
  RESULT=$(curl -s http://localhost:3001/api/state)
  if echo "$RESULT" | grep -q "error"; then
    echo "Contrat perdu - redéploiement..."
    cd /root/looka
    OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost 2>&1)
    ADDR=$(echo "$OUTPUT" | grep "LotteryV1 deployed:" | awk '{print $3}')
    if [ ! -z "$ADDR" ]; then
      sed -i "s/LOTTERY_ADDRESS=.*/LOTTERY_ADDRESS=$ADDR/" /root/looka/backend/.env
      pm2 restart looka-backend --update-env
      echo "Redéployé: $ADDR"
    fi
  fi
done
