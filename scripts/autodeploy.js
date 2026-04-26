const { ethers } = require("ethers");
const { execSync } = require("child_process");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const envPath  = "/root/looka/backend/.env";

  try {
    await provider.getBlockNumber();
    console.log("Nœud disponible — déploiement...");
    const output = execSync("cd /root/looka && npx hardhat run scripts/deploy.js --network localhost").toString();
    const match  = output.match(/LotteryV1 deployed: (0x[a-fA-F0-9]{40})/);
    if (match) {
      let env = fs.readFileSync(envPath, "utf8");
      env = env.replace(/LOTTERY_ADDRESS=.*/, `LOTTERY_ADDRESS=${match[1]}`);
      fs.writeFileSync(envPath, env);
      execSync("pm2 restart looka-backend --update-env");
      console.log("Contrat déployé et backend mis à jour :", match[1]);
    }
  } catch (e) {
    console.error("Erreur:", e.message);
  }
}

main();
