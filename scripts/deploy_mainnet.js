const hre = require("hardhat");

// ================================================================
//  LOOKA WIN — Déploiement BSC Mainnet
// ================================================================

const CONFIG = {
  // Adresse TREASURY — figée pour toujours dans le contrat
  TREASURY: "0x4a5464504194d6c1e8e8394818bbdc1a553f862c",

  // USDT officiel sur BSC Mainnet (Tether)
  USDT: "0x55d398326f99059fF775485246999027B3197955",

  // Chainlink VRF v2 — BSC Mainnet
  VRF_COORDINATOR: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
  KEY_HASH: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",

  // ⚠️ Remplacer par ton subscriptionId après création sur vrf.chain.link
  SUBSCRIPTION_ID: 16440464997450773107671537601411486332424455913753800005562123547924570634388n,
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network    = await hre.ethers.provider.getNetwork();

  console.log("════════════════════════════════════════");
  console.log("  LOOKA WIN — Déploiement BSC MAINNET  ");
  console.log("════════════════════════════════════════");
  console.log("Réseau    :", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer  :", deployer.address);
  console.log("TREASURY  :", CONFIG.TREASURY);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance   :", hre.ethers.formatEther(balance), "BNB");

  if (balance < hre.ethers.parseEther("0.03")) {
    console.log("❌ Balance BNB insuffisante — minimum 0.03 BNB");
    process.exit(1);
  }

  // Confirmation avant déploiement
  console.log("\n⚠️  ATTENTION — Déploiement MAINNET irréversible !");
  console.log("TREASURY :", CONFIG.TREASURY);
  console.log("USDT     :", CONFIG.USDT);
  console.log("Appuie Ctrl+C pour annuler ou attends 10 secondes...\n");
  await new Promise(r => setTimeout(r, 10000));

  // Déploiement LookaWin
  console.log("── Déploiement LookaWin ──");
  const LookaWin = await hre.ethers.getContractFactory("LookaWin");
  const looka    = await LookaWin.deploy(
    hre.ethers.getAddress(CONFIG.USDT),
    hre.ethers.getAddress(CONFIG.TREASURY),
    hre.ethers.getAddress(CONFIG.VRF_COORDINATOR),
    CONFIG.KEY_HASH,
    CONFIG.SUBSCRIPTION_ID
  );
  await looka.waitForDeployment();
  const lookaAddress = await looka.getAddress();
  console.log("✅ LookaWin déployé :", lookaAddress);

  // Vérification
  console.log("\n── Vérification ──");
  const treasury    = await looka.TREASURY();
  const ticketPrice = await looka.TICKET_PRICE();
  const minPart     = await looka.MIN_PARTICIPANTS();

  console.log("TREASURY     :", treasury, treasury === CONFIG.TREASURY ? "✅" : "❌");
  console.log("TICKET_PRICE :", Number(ticketPrice)/1e6, "USDT", ticketPrice === 2_000_000n ? "✅" : "❌");
  console.log("MIN_PART     :", minPart.toString(), "✅");

  console.log("\n════════════════════════════════════════");
  console.log("  DÉPLOIEMENT RÉUSSI ✅");
  console.log("════════════════════════════════════════");
  console.log("LookaWin :", lookaAddress);
  console.log("\n📋 ÉTAPES SUIVANTES :");
  console.log("1. Vérifier sur BscScan : https://bscscan.com/address/" + lookaAddress);
  console.log("2. Ajouter comme consumer VRF : https://vrf.chain.link/bsc");
  console.log("3. Enregistrer Chainlink Automation : https://automation.chain.link/bsc");
  console.log("4. Mettre à jour LOOKA_ADDRESS dans contract.js :", lookaAddress);
}

main().catch(console.error);
