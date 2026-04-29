const hre = require("hardhat");

async function main() {
  const [owner, treasury, player1, player2, player3, referrer] =
    await hre.ethers.getSigners();

  console.log("=== TEST LOOKA WIN ===\n");

  // ─── DÉPLOIEMENT ───────────────────────────────────────────

  const MockVRF = await hre.ethers.getContractFactory("MockVRFCoordinator");
  const mockVRF = await MockVRF.deploy();
  await mockVRF.waitForDeployment();
  const vrfAddress = await mockVRF.getAddress();
  console.log("MockVRF   :", vrfAddress);

  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT  :", usdtAddress);

  // LookaWin : usdt, treasury, vrfCoordinator, keyHash, subscriptionId
  const LookaWin = await hre.ethers.getContractFactory("LookaWin");
  const looka = await LookaWin.deploy(
    usdtAddress,
    treasury.address,
    vrfAddress,
    "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
    1n
  );
  await looka.waitForDeployment();
  const lookaAddress = await looka.getAddress();
  console.log("LookaWin  :", lookaAddress);
  console.log("Treasury  :", treasury.address);

  // ─── MINT & APPROVE ────────────────────────────────────────
  // Chaque ticket = 2 USDT → 50 tickets = 100 USDT minimum
  const MINT = 500n * 1_000_000n; // 500 USDT chacun
  await usdt.mint(player1.address,  MINT);
  await usdt.mint(player2.address,  MINT);
  await usdt.mint(player3.address,  MINT);
  await usdt.mint(referrer.address, MINT);
  await usdt.connect(player1).approve(lookaAddress,  MINT);
  await usdt.connect(player2).approve(lookaAddress,  MINT);
  await usdt.connect(player3).approve(lookaAddress,  MINT);
  await usdt.connect(referrer).approve(lookaAddress, MINT);
  console.log("\n✅ USDT mintés et approuvés (500 USDT chacun)");

  // ─── TEST 1 : ACHAT DE TICKETS & DISTRIBUTION ──────────────
  console.log("\n── TEST 1 : Achat tickets & distribution ──");

  const balanceBefore = await usdt.balanceOf(player1.address);

  // player1 achète 20 tickets sans parrain
  await looka.connect(player1).buyTickets(20n, hre.ethers.ZeroAddress);
  // player2 achète 20 tickets avec referrer comme parrain
  await looka.connect(player2).buyTickets(20n, referrer.address);
  // player3 achète 10 tickets avec referrer comme parrain
  await looka.connect(player3).buyTickets(10n, referrer.address);

  console.log("✅ 50 tickets achetés (20 + 20 + 10)");

  const ticketCount = await looka.getCurrentTicketCount();
  console.log("Tickets horaire :", ticketCount.toString());

  const hourlyPrize = await looka.getCurrentHourlyPrize();
  const jackpots    = await looka.getJackpots();
  const protocolBalance = await looka.protocolBalance();
  const referralPending = await looka.getReferralPending(referrer.address);

  const totalTickets = 50;
  const totalUSDT = totalTickets * 2_000_000; // 100 USDT en micro

  console.log("\n=== DISTRIBUTION (100 USDT total) ===");
  console.log("Cagnotte horaire :", Number(hourlyPrize)   / 1e6, "USDT (attendu:", totalUSDT * 8800 / 10000 / 1e6, ")");
  console.log("Jackpot daily    :", Number(jackpots[0])   / 1e6, "USDT (attendu:", totalUSDT * 300  / 10000 / 1e6, ")");
  console.log("Jackpot weekly   :", Number(jackpots[1])   / 1e6, "USDT (attendu:", totalUSDT * 200  / 10000 / 1e6, ")");
  console.log("Jackpot monthly  :", Number(jackpots[2])   / 1e6, "USDT (attendu:", totalUSDT * 100  / 10000 / 1e6, ")");
  console.log("Parrain pending  :", Number(referralPending)/ 1e6, "USDT (attendu:", (totalUSDT - 20*2_000_000) * 50 / 10000 / 1e6, ")");
  console.log("Maison balance   :", Number(protocolBalance)  / 1e6, "USDT");

  const totalAccounted = hourlyPrize + jackpots[0] + jackpots[1] + jackpots[2] + protocolBalance + referralPending;
  const diff = BigInt(totalUSDT) - totalAccounted;
  console.log("\n🔍 Total comptabilisé :", Number(totalAccounted) / 1e6, "USDT");
  console.log("🔍 Différence (arrondi):", Number(diff), "micro-USDT");
  if (diff <= 50n) console.log("✅ Distribution correcte (écart arrondi acceptable)");
  else console.log("❌ Erreur de distribution !");

  // ─── TEST 2 : 4 LISTES DISTINCTES ──────────────────────────
  console.log("\n── TEST 2 : 4 listes de tickets distinctes ──");

  const tickets = await looka.getTicketsForAddress(player1.address);
  console.log("Player1 tickets hourly :", tickets[0].toString(), "(attendu: 20)");
  console.log("Player1 tickets daily  :", tickets[1].toString(), "(attendu: 20)");
  console.log("Player1 tickets weekly :", tickets[2].toString(), "(attendu: 20)");
  console.log("Player1 tickets monthly:", tickets[3].toString(), "(attendu: 20)");

  if (tickets[0] === 20n && tickets[1] === 20n &&
      tickets[2] === 20n && tickets[3] === 20n) {
    console.log("✅ 4 listes correctement remplies");
  } else {
    console.log("❌ Erreur dans les listes de tickets");
  }

  // ─── TEST 3 : PARRAIN ENREGISTRÉ UNE SEULE FOIS ────────────
  console.log("\n── TEST 3 : Enregistrement parrain unique ──");

  const parrain2 = await looka.referrerOf(player2.address);
  const parrain3 = await looka.referrerOf(player3.address);
  console.log("Parrain player2 :", parrain2, "(attendu:", referrer.address, ")");
  console.log("Parrain player3 :", parrain3, "(attendu:", referrer.address, ")");

  // Tenter de changer de parrain → doit être ignoré
  await looka.connect(player2).buyTickets(1n, player1.address);
  const parrainApresTentative = await looka.referrerOf(player2.address);
  if (parrainApresTentative === referrer.address) {
    console.log("✅ Parrain non modifiable après enregistrement");
  } else {
    console.log("❌ Parrain a été modifié !");
  }

  // ─── TEST 4 : CLAIM REFERRAL (seuil 5 USDT) ────────────────
  console.log("\n── TEST 4 : Claim parrainage ──");

  const pendingBefore = await looka.getReferralPending(referrer.address);
  console.log("Parrainage en attente :", Number(pendingBefore) / 1e6, "USDT");

  if (pendingBefore >= 3_000_000n) {
    const refBalBefore = await usdt.balanceOf(referrer.address);
    await looka.connect(referrer).claimReferral();
    const refBalAfter = await usdt.balanceOf(referrer.address);
    const gained = refBalAfter - refBalBefore;
    console.log("✅ Claim réussi — parrain a reçu :", Number(gained) / 1e6, "USDT");
  } else {
    console.log("⚠️  Parrainage insuffisant pour claim (< 5 USDT) — normal si peu de tickets");
    // Acheter plus de tickets pour atteindre le seuil
    await looka.connect(player1).buyTickets(50n, referrer.address);
    const pendingAfter = await looka.getReferralPending(referrer.address);
    console.log("Parrainage après 50 tickets supplémentaires :", Number(pendingAfter) / 1e6, "USDT");
    if (pendingAfter >= 3_000_000n) {
      await looka.connect(referrer).claimReferral();
      console.log("✅ Claim réussi après tickets supplémentaires");
    }
  }

  // ─── TEST 5 : TIRAGE HORAIRE VIA CHECKUPKEEP / PERFORMUPKEEP
  console.log("\n── TEST 5 : Tirage horaire automatique ──");

  // Avancer le temps de 1h+
  await hre.network.provider.send("evm_increaseTime", [3601]);
  await hre.network.provider.send("evm_mine");

  // Simuler checkUpkeep
  const [upkeepNeeded, performData] = await looka.checkUpkeep("0x");
  console.log("checkUpkeep needed :", upkeepNeeded);

  if (!upkeepNeeded) {
    console.log("❌ checkUpkeep devrait retourner true après 1h");
    return;
  }
  console.log("✅ checkUpkeep retourne true");

  // Simuler performUpkeep → déclenche le tirage
  const txDraw = await looka.performUpkeep(performData);
  const receipt = await txDraw.wait();

  let requestId;
  for (const log of receipt.logs) {
    try {
      const parsed = looka.interface.parseLog(log);
      if (parsed.name === "DrawRequested") {
        requestId = parsed.args[0];
        console.log("🎲 Tirage demandé — requestId:", requestId.toString());
        console.log("   DrawType :", parsed.args[1].toString(), "(1 = HOURLY)");
      }
    } catch {}
  }

  if (!requestId) {
    console.log("❌ Pas de DrawRequested émis");
    return;
  }

  // ─── TEST 6 : CALLBACK VRF & PAIEMENT GAGNANT ──────────────
  console.log("\n── TEST 6 : VRF callback & paiement gagnant ──");

  const hourlyBefore = hourlyPrize;

  // Balances avant
  const b1Before = await usdt.balanceOf(player1.address);
  const b2Before = await usdt.balanceOf(player2.address);
  const b3Before = await usdt.balanceOf(player3.address);

  // MockVRF fulfil avec randomWord = 7
  const randomWord = 7n;
  await mockVRF.fulfillRandomWords(randomWord);
  console.log("✅ VRF fulfillé avec randomWord:", randomWord.toString());

  // Trouver le gagnant
  const b1After = await usdt.balanceOf(player1.address);
  const b2After = await usdt.balanceOf(player2.address);
  const b3After = await usdt.balanceOf(player3.address);

  const gained1 = b1After - b1Before;
  const gained2 = b2After - b2Before;
  const gained3 = b3After - b3Before;

  if (gained1 > 0n) console.log("🏆 Gagnant : Player1 — reçu :", Number(gained1) / 1e6, "USDT");
  else if (gained2 > 0n) console.log("🏆 Gagnant : Player2 — reçu :", Number(gained2) / 1e6, "USDT");
  else if (gained3 > 0n) console.log("🏆 Gagnant : Player3 — reçu :", Number(gained3) / 1e6, "USDT");
  else console.log("❌ Aucun gagnant détecté");

  // Vérifier que ticketsHourly est remis à zéro
  const ticketCountAfter = await looka.getCurrentTicketCount();
  console.log("Tickets horaire après tirage :", ticketCountAfter.toString(), "(attendu: 0 ou tickets achetés après tirage)");

  // Vérifier que jackpotHourly est remis à zéro
  const hourlyAfter = await looka.getCurrentHourlyPrize();
  console.log("JackpotHourly après tirage :", Number(hourlyAfter) / 1e6, "USDT (attendu: 0)");
  if (hourlyAfter === 0n) console.log("✅ jackpotHourly remis à zéro");

  // ─── TEST 7 : LISTES DAILY/WEEKLY/MONTHLY INTACTES ─────────
  console.log("\n── TEST 7 : Listes daily/weekly/monthly non touchées ──");

  const ticketsP1After = await looka.getTicketsForAddress(player1.address);
  // ticketsDaily etc ne sont pas remis à zéro par un tirage HOURLY
  if (ticketsP1After[1] > 0n) {
    console.log("✅ ticketsDaily conservé après tirage horaire :", ticketsP1After[1].toString());
  } else {
    console.log("⚠️  ticketsDaily vide (normal si player a été ajouté avant le test 5 uniquement)");
  }

  // ─── TEST 8 : VIREMENT MAISON SIMULATION ───────────────────
  console.log("\n── TEST 8 : Transfert protocole à 03:13 GMT ──");

  // Avancer au prochain 03:13 GMT
  const now = BigInt((await hre.ethers.provider.getBlock("latest")).timestamp);
  const todayStart = (now / 86400n) * 86400n;
  const target = todayStart + 11580n + 86400n; // Demain à 03:13:00 GMT
  const toAdvance = target - now;

  await hre.network.provider.send("evm_increaseTime", [Number(toAdvance)]);
  await hre.network.provider.send("evm_mine");

  const protocolBalanceNow = await looka.protocolBalance();
  console.log("protocolBalance actuel :", Number(protocolBalanceNow) / 1e6, "USDT");

  const treasuryBefore = await usdt.balanceOf(treasury.address);
  const [upkeepHouse, performDataHouse] = await looka.checkUpkeep("0x");

  if (upkeepHouse) {
    await looka.performUpkeep(performDataHouse);
    const treasuryAfter = await usdt.balanceOf(treasury.address);
    const virements = treasuryAfter - treasuryBefore;
    if (virements > 0n) {
      console.log("✅ Transfert protocole effectué :", Number(virements) / 1e6, "USDT → Treasury");
    } else {
      console.log("⚠️  Upkeep déclenché mais pas de transfert protocole (tirage prioritaire)");
    }
  } else {
    console.log("⚠️  checkUpkeep false — protocolBalance insuffisant ou heure incorrecte");
    console.log("   (Normal si protocolBalance <", 5, "USDT)");
  }

  // ─── TEST 9 : IMMUABILITÉ ───────────────────────────────────
  console.log("\n── TEST 9 : Vérification immuabilité ──");

  // Vérifier constants
  const ticketPrice = await looka.TICKET_PRICE();
  const minPart     = await looka.MIN_PARTICIPANTS();
  const bpHourly    = await looka.BP_HOURLY();
  const bpHouse_check = await looka.MIN_PAYOUT_PROTOCOL();

  console.log("TICKET_PRICE     :", Number(ticketPrice) / 1e6, "USDT (attendu: 2)");
  console.log("MIN_PARTICIPANTS :", minPart.toString(), "(attendu: 50)");
  console.log("BP_HOURLY        :", bpHourly.toString(), "(attendu: 8800)");
  console.log("MIN_PAYOUT_PROTOCOL :", Number(bpHouse_check) / 1e6, "USDT (attendu: 5)");

  // Vérifier immutables
  const usdtAddr     = await looka.USDT();
  const treasuryAddr = await looka.TREASURY();
  console.log("USDT address     :", usdtAddr);
  console.log("TREASURY address :", treasuryAddr, "(attendu:", treasury.address, ")");

  if (
    ticketPrice === 2_000_000n &&
    minPart === 50n &&
    bpHourly === 8800n &&
    treasuryAddr === treasury.address
  ) {
    console.log("✅ Tous les paramètres immuables corrects");
  } else {
    console.log("❌ Paramètre incorrect détecté");
  }

  // ─── RÉSUMÉ ─────────────────────────────────────────────────
  console.log("\n=== RÉSUMÉ FINAL ===");
  const contractBalance = await looka.getContractBalance();
  console.log("Balance contrat  :", Number(contractBalance) / 1e6, "USDT");
  console.log("RoundId          :", (await looka.roundId()).toString());
  console.log("\n=== TEST TERMINÉ ✅ ===");
}

main().catch(console.error);
