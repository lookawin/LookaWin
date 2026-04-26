const hre = require("hardhat");

// ================================================================
//  LOOKA WIN — Script de déploiement BSC Testnet
//  Chainlink VRF v2 + Automation
// ================================================================

// ── CONFIGURATION BSC TESTNET ────────────────────────────────────
const CONFIG = {
  // Chainlink VRF v2 — BSC Testnet
  VRF_COORDINATOR : null,
  KEY_HASH        : "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",

  // ⚠️  Remplacer par ton subscriptionId Chainlink VRF
  // Créer sur : https://vrf.chain.link/bnb-chain-testnet
  SUBSCRIPTION_ID : 1n,

  // ⚠️  Remplacer par l'adresse USDT testnet ou laisser null pour MockUSDT
  // USDT BSC Testnet n'est pas officiel — on déploie un MockUSDT
  USDT_ADDRESS    : null,

  // ⚠️  Remplacer par ton adresse treasury (Gnosis Safe recommandé)
  // Laisser null pour utiliser l'adresse du deployer en testnet
  TREASURY_ADDRESS: null,
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network    = await hre.ethers.provider.getNetwork();

  console.log("════════════════════════════════════════");
  console.log("  LOOKA WIN — Déploiement BSC Testnet  ");
  console.log("════════════════════════════════════════");
  console.log("Réseau     :", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer   :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance    :", hre.ethers.formatEther(balance), "BNB");
  console.log("");

  if (balance < hre.ethers.parseEther("0.05")) {
    console.log("⚠️  Balance BNB insuffisante — minimum 0.05 BNB recommandé");
    console.log("   Faucet BSC Testnet : https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  // ── ÉTAPE 1 : USDT ─────────────────────────────────────────────
  let usdtAddress = CONFIG.USDT_ADDRESS;

  if (!usdtAddress) {
    console.log("── Étape 1 : Déploiement MockUSDT (testnet) ──");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const usdt     = await MockUSDT.deploy();
    await usdt.waitForDeployment();
    usdtAddress = await usdt.getAddress();
    console.log("✅ MockUSDT déployé :", usdtAddress);

    // Mint 10 000 USDT pour le deployer (tests)
    await usdt.mint(deployer.address, 10_000n * 1_000_000n);
    console.log("   → 10 000 USDT mintés vers deployer");
  } else {
    console.log("── Étape 1 : USDT existant ──");
    console.log("✅ USDT address :", usdtAddress);
  }

  // ── ÉTAPE 2 : TREASURY ─────────────────────────────────────────
  const treasuryAddress = CONFIG.TREASURY_ADDRESS ?? deployer.address;
  console.log("\n── Étape 2 : Treasury ──");
  console.log("✅ Treasury :", treasuryAddress);
  if (treasuryAddress === deployer.address) {
    console.log("   ⚠️  Treasury = deployer (OK pour testnet, utiliser Gnosis Safe en mainnet)");
  }

  // ── ÉTAPE 3 : VRF COORDINATOR ──────────────────────────────────
  let vrfAddress = CONFIG.VRF_COORDINATOR;
  if (!vrfAddress) {
    console.log("── Étape 3a : Déploiement MockVRFCoordinator (local) ──");
    const MockVRF = await hre.ethers.getContractFactory("MockVRFCoordinator");
    const mockVRF = await MockVRF.deploy();
    await mockVRF.waitForDeployment();
    vrfAddress = await mockVRF.getAddress();
    console.log("✅ MockVRF déployé :", vrfAddress);
  }

  // ── ÉTAPE 4 : VÉRIFICATION POST-DÉPLOIEMENT ────────────────────
console.log("\n── Étape 4 : Déploiement LookaWin ──");
  const LookaWin = await hre.ethers.getContractFactory("LookaWin");
  const looka    = await LookaWin.deploy(
    usdtAddress,
    treasuryAddress,
    vrfAddress,
    CONFIG.KEY_HASH,
    CONFIG.SUBSCRIPTION_ID
  );
  console.log("   Déploiement en cours...");
  await looka.waitForDeployment();
  const lookaAddress = await looka.getAddress();
  console.log("✅ LookaWin déployé :", lookaAddress);

  console.log("\n── Étape 5 : Vérification post-déploiement ──");

  const usdtOnChain     = await looka.USDT();
  const treasuryOnChain = await looka.TREASURY();
  const ticketPrice     = await looka.TICKET_PRICE();
  const minPart         = await looka.MIN_PARTICIPANTS();
  const bpHourly        = await looka.BP_HOURLY();

  console.log("USDT on-chain      :", usdtOnChain,
    usdtOnChain.toLowerCase() === usdtAddress.toLowerCase() ? "✅" : "❌");
  console.log("TREASURY on-chain  :", treasuryOnChain,
    treasuryOnChain.toLowerCase() === treasuryAddress.toLowerCase() ? "✅" : "❌");
  console.log("TICKET_PRICE       :", Number(ticketPrice)/1e6, "USDT",
    ticketPrice === 2_000_000n ? "✅" : "❌");
  console.log("MIN_PARTICIPANTS   :", minPart.toString(),
    minPart === 50n ? "✅" : "❌");
  console.log("BP_HOURLY          :", bpHourly.toString(),
    bpHourly === 8800n ? "✅" : "❌");

  // ── ÉTAPE 5 : INSTRUCTIONS POST-DÉPLOIEMENT ────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("  DÉPLOIEMENT RÉUSSI ✅                ");
  console.log("════════════════════════════════════════");
  console.log("");
  console.log("📋 ADRESSES À SAUVEGARDER :");
  console.log("   LookaWin :", lookaAddress);
  console.log("   USDT     :", usdtAddress);
  console.log("   Treasury :", treasuryAddress);
  console.log("");
  console.log("📋 ÉTAPES SUIVANTES OBLIGATOIRES :");
  console.log("");
  console.log("1. CHAINLINK VRF — Ajouter le contrat comme consumer :");
  console.log("   → https://vrf.chain.link/bnb-chain-testnet");
  console.log("   → Subscription ID :", CONFIG.SUBSCRIPTION_ID.toString());
  console.log("   → Add consumer :", lookaAddress);
  console.log("   → Recharger subscription avec LINK");
  console.log("");
  console.log("2. CHAINLINK AUTOMATION — Enregistrer l'upkeep :");
  console.log("   → https://automation.chain.link/bnb-chain-testnet");
  console.log("   → Register new Upkeep → Custom Logic");
  console.log("   → Contract address :", lookaAddress);
  console.log("   → Recharger avec LINK (5 LINK minimum)");
  console.log("");
  console.log("3. BSCSCAN TESTNET — Vérifier le contrat :");
  console.log("   → https://testnet.bscscan.com/address/" + lookaAddress);
  console.log("   → Verify & Publish → Solidity Single File");
  console.log("");
  console.log("4. TESTER un premier achat de ticket :");
  console.log("   → Approuver USDT vers", lookaAddress);
  console.log("   → Appeler buyTickets(1, ZeroAddress)");
  console.log("");
}

main().catch(console.error);
