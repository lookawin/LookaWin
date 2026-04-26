const { AutomateSDK, TriggerType } = require("@gelatonetwork/automate-sdk");
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = 56; // BSC Mainnet

  console.log("Création de la task Gelato...");
  console.log("Signer:", signer.address);

  const automate = new AutomateSDK(chainId, signer);

  const LOOKA_ADDRESS = "0x5042A5F099D1a0F6faE303176e7E1c1260FA918d";

  const { taskId, tx } = await automate.createTask({
    name: "LookaWin — Tirage horaire",
    execAddress: LOOKA_ADDRESS,
    execSelector: "0x4585e33b", // performUpkeep(bytes)
    execData: "0x",
    dedicatedMsgSender: false,
    trigger: {
      type: TriggerType.TIME,
      interval: 60 * 60 * 1000, // 1 heure en ms
    },
  });

  await tx.wait();
  console.log("✅ Task créée !");
  console.log("Task ID:", taskId);
  console.log("TX:", tx.hash);
}

main().catch(console.error);
