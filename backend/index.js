require("dotenv").config();
// Système de logs
const cronLogs = [];
const MAX_LOGS = 100;

function addLog(message) {
  const entry = {
    time: new Date().toISOString(),
    message
  };
  cronLogs.unshift(entry);
  if (cronLogs.length > MAX_LOGS) cronLogs.pop();
  console.log(`[LOG] ${entry.time} - ${message}`);
}
const express = require("express");
const cron = require("node-cron");
const { ethers } = require("ethers");
const fr = require("./locales/fr.json");
const en = require("./locales/en.json");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  next();
});

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const SUPPORTED_LANGS = { fr, en };

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

const LOTTERY_ABI = [
  "function requestHourlyDraw() external",
  "function requestDailyDraw() external",
  "function requestWeeklyDraw() external",
  "function requestMonthlyDraw() external",
  "function getCurrentTicketCount() view returns (uint256)",
  "function getCurrentHourlyPrize() view returns (uint256)",
  "function getJackpots() view returns (uint256, uint256, uint256)",
  "function MIN_PARTICIPANTS() view returns (uint256)",
  "function protocolBalance() view returns (uint256)",
  "function updateParams(uint256, uint256) external",
  "function withdrawHouse(address, uint256) external",
  "event TicketPurchased(address indexed buyer, uint256 quantity, address indexed referrer)",
  "event WinnerPaid(address indexed winner, uint256 amount, uint8 drawType, uint256 roundId)",
  "event ReferralPaid(address indexed referrer, uint256 amount)",
  "event DrawSkipped(uint8 drawType, uint256 timestamp)",
  "function updateDistribution(uint256,uint256,uint256,uint256,uint256,uint256) external",
"function BP_HOURLY() view returns (uint256)",
"function BP_DAILY() view returns (uint256)",
"function BP_WEEKLY() view returns (uint256)",
"function BP_MONTHLY() view returns (uint256)",
"function BP_HOUSE() view returns (uint256)",
"function BP_REFERRAL() view returns (uint256)",
];

let lottery;
if (process.env.LOTTERY_ADDRESS) {
  lottery = new ethers.Contract(process.env.LOTTERY_ADDRESS, LOTTERY_ABI, wallet);
}

// ─────────────────────────────────────────────
// I18N
// ─────────────────────────────────────────────

function t(lang, key) {
  const keys = key.split(".");
  const dict = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS["en"];
  return keys.reduce((obj, k) => obj?.[k], dict) || key;
}

// ─────────────────────────────────────────────
// CRON JOBS
// ─────────────────────────────────────────────

// Toutes les heures
cron.schedule("0 * * * *", async () => {
  if (!lottery) return;
  try {
    const count = await lottery.getCurrentTicketCount();
    const min   = await lottery.MIN_PARTICIPANTS();
    addLog(`[HOURLY] Tickets: ${count} / Min: ${min}`);
    if (count >= min) {
      const tx = await lottery.requestHourlyDraw();
      await tx.wait();
      addLog("[HOURLY] Tirage déclenché ✅");
    } else {
      addLog("[HOURLY] Seuil non atteint - report");
    }
  } catch (e) {
    console.error("[HOURLY] Erreur:", e.message);
  }
});

// Tous les jours à minuit
cron.schedule("0 0 * * *", async () => {
  if (!lottery) return;
  try {
    const tx = await lottery.requestDailyDraw();
    await tx.wait();
    console.log("[DAILY] Jackpot journalier déclenché ✅");
  } catch (e) {
    console.error("[DAILY] Erreur:", e.message);
  }
});

// Tous les lundis à minuit
cron.schedule("0 0 * * 1", async () => {
  if (!lottery) return;
  try {
    const tx = await lottery.requestWeeklyDraw();
    await tx.wait();
    console.log("[WEEKLY] Jackpot hebdo déclenché ✅");
  } catch (e) {
    console.error("[WEEKLY] Erreur:", e.message);
  }
});

// Le 1er de chaque mois à minuit
cron.schedule("0 0 1 * *", async () => {
  if (!lottery) return;
  try {
    const tx = await lottery.requestMonthlyDraw();
    await tx.wait();
    console.log("[MONTHLY] Jackpot mensuel déclenché ✅");
  } catch (e) {
    console.error("[MONTHLY] Erreur:", e.message);
  }
});

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

// État de la loterie
app.get("/api/state", async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    if (!lottery) return res.json({ error: "Contract not configured" });
    const [count, prize, jackpots, min, house] = await Promise.all([
      lottery.getCurrentTicketCount(),
      lottery.getCurrentHourlyPrize(),
      lottery.getJackpots(),
      lottery.MIN_PARTICIPANTS(),
      lottery.protocolBalance()
    ]);
    res.json({
      labels: {
        current_prize:   t(lang, "lottery.current_prize"),
        participants:    t(lang, "lottery.participants"),
        jackpot_daily:   t(lang, "lottery.jackpot_daily"),
        jackpot_weekly:  t(lang, "lottery.jackpot_weekly"),
        jackpot_monthly: t(lang, "lottery.jackpot_monthly"),
        threshold:       t(lang, "lottery.threshold")
      },
      data: {
        tickets:         count.toString(),
        prize:           (Number(prize) / 1e18).toFixed(2),
        jackpot_daily:   (Number(jackpots[0]) / 1e18).toFixed(2),
        jackpot_weekly:  (Number(jackpots[1]) / 1e18).toFixed(2),
        jackpot_monthly: (Number(jackpots[2]) / 1e18).toFixed(2),
        min_participants: min.toString(),
        house_balance:   (Number(house) / 1e18).toFixed(2)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Langues disponibles
app.get("/api/langs", (req, res) => {
  res.json({ supported: Object.keys(SUPPORTED_LANGS) });
});

// ─────────────────────────────────────────────
// ADMIN (protégé par clé)
// ─────────────────────────────────────────────

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/api/admin/params", adminAuth, async (req, res) => {
  const { minParticipants, referralThreshold } = req.body;
  try {
    const tx = await lottery.updateParams(
      BigInt(minParticipants),
      BigInt(referralThreshold)
    );
    await tx.wait();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/withdraw", adminAuth, async (req, res) => {
  const { to, amount } = req.body;
  try {
    const tx = await lottery.withdrawHouse(to, BigInt(amount));
    await tx.wait();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// Modifier les % de distribution
app.post("/api/admin/distribution", adminAuth, async (req, res) => {
  const { hourly, daily, weekly, monthly, house, referral } = req.body;
  try {
    const tx = await lottery.updateDistribution(
      BigInt(hourly), BigInt(daily), BigInt(weekly),
      BigInt(monthly), BigInt(house), BigInt(referral)
    );
    await tx.wait();
    addLog(`Distribution mise à jour: ${hourly}/${daily}/${weekly}/${monthly}/${house}/${referral}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Logs cron jobs
app.get("/api/admin/logs", adminAuth, (req, res) => {
  res.json({ logs: cronLogs });
});

// Cache local events
const fs = require("fs");
const CACHE_FILE = "/root/looka/backend/events_cache.json";
let eventsCache = { lastBlock: 44000000, tickets: [], winners: [] };
if (fs.existsSync(CACHE_FILE)) {
  try { eventsCache = JSON.parse(fs.readFileSync(CACHE_FILE)); } catch(_) {}
}

async function syncEvents() {
  if (!lottery) return;
  try {
    const provider = lottery.runner.provider;
    const latest = await provider.getBlockNumber();
    const from = eventsCache.lastBlock + 1;
    const to = Math.min(latest, from + 1000);
    if (from > latest) return;
    const buyFilter = lottery.filters.TicketPurchased();
    const winFilter = lottery.filters.WinnerPaid();
    const buyEvents = await lottery.queryFilter(buyFilter, from, to);
    await new Promise(r => setTimeout(r, 500));
    const winEvents = await lottery.queryFilter(winFilter, from, to);
    buyEvents.forEach(e => eventsCache.tickets.push({
      buyer: e.args[0], quantity: Number(e.args[1]),
      block: e.blockNumber, txHash: e.transactionHash
    }));
    winEvents.forEach(e => eventsCache.winners.push({
      winner: e.args[0], amount: e.args[1].toString(),
      drawType: Number(e.args[2]), roundId: Number(e.args[3]),
      block: e.blockNumber, txHash: e.transactionHash
    }));
    eventsCache.lastBlock = to;
    if (eventsCache.tickets.length > 1000) eventsCache.tickets = eventsCache.tickets.slice(-1000);
    if (eventsCache.winners.length > 500) eventsCache.winners = eventsCache.winners.slice(-500);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(eventsCache));
    if (buyEvents.length + winEvents.length > 0)
      addLog(`Synced blocks ${from}-${to}: ${buyEvents.length} tickets, ${winEvents.length} winners`);
  } catch(e) { addLog(`syncEvents error: ${e.message}`); }
}
syncEvents();
setInterval(syncEvents, 15000);

// Historique des gagnants
app.get("/api/winners", (req, res) => {
  const winners = eventsCache.winners.slice(-50).reverse().map(e => ({
    winner: e.winner,
    amount: (Number(BigInt(e.amount)) / 1e18).toFixed(2),
    drawType: e.drawType,
    roundId: e.roundId,
    block: e.block,
    txHash: e.txHash
  }));
  res.json({ winners });
});

// Historique tickets par adresse
app.get("/api/tickets", (req, res) => {
  const addr = (req.query.addr || "").toLowerCase();
  const tickets = addr
    ? eventsCache.tickets.filter(t => t.buyer.toLowerCase() === addr).slice(-50).reverse()
    : eventsCache.tickets.slice(-50).reverse();
  res.json({ tickets });
});


// ─── PAGES CMS ───
const path = require("path");

const PAGES_DIR = path.join(__dirname, "pages");

function loadPage(slug) {
  const file = path.join(PAGES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function savePage(slug, data) {
  const file = path.join(PAGES_DIR, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Liste toutes les pages
app.get("/api/pages", (req, res) => {
  const lang = req.query.lang || "en";
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".json"));
  const pages = files.map(f => JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"))).filter(data => data.published === true).map(data => ({slug: data.slug, published: data.published, title: data[lang]?.title || data["en"]?.title}));res.json({ pages }); // REPLACED
const pages_old = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
    return {
      slug:      data.slug,
      published: data.published,
      title:     data[lang]?.title || data["en"]?.title
    };
  });
  res.json({ pages });
});

// Lire une page
app.get("/api/pages/:slug", (req, res) => {
  const lang = req.query.lang || "en";
  const page = loadPage(req.params.slug);
  if (!page || !page.published) return res.status(404).json({ error: "Page not found" });
  res.json({
    slug:    page.slug,
    title:   page[lang]?.title || page["en"]?.title,
    content: page[lang]?.content || page["en"]?.content
  });
});

// Admin — liste toutes les pages (publiées et non publiées)
app.get("/api/admin/pages", adminAuth, (req, res) => {
  const lang = req.query.lang || "en";
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".json"));
  const pages = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
    return {
      slug:      data.slug,
      published: data.published,
      title:     data[lang]?.title || data["en"]?.title
    };
  });
  res.json({ pages });
});

// Admin — lire une page complète
app.get("/api/admin/pages/:slug", adminAuth, (req, res) => {
  const lang = req.query.lang || "en";
  const page = loadPage(req.params.slug);
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json({
    slug:    page.slug,
    published: page.published,
    title:   page[lang]?.title || "",
    content: page[lang]?.content || ""
  });
});

// Admin — créer ou modifier une page
app.post("/api/admin/pages/:slug", adminAuth, (req, res) => {
  const { slug } = req.params;
  const { published, fr, en } = req.body;
  const existing = loadPage(slug) || { slug };
  const updated  = { ...existing, slug, published, fr, en };
  savePage(slug, updated);
  addLog(`[ADMIN] Page mise à jour: ${slug}`);
  res.json({ success: true });
});

// Admin — supprimer une page
app.delete("/api/admin/pages/:slug", adminAuth, (req, res) => {
  const file = path.join(PAGES_DIR, `${req.params.slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  addLog(`[ADMIN] Page supprimée: ${req.params.slug}`);
  res.json({ success: true });
});
// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Looka backend démarré sur le port ${PORT}`);
  console.log(`Langues supportées: ${Object.keys(SUPPORTED_LANGS).join(", ")}`);
  console.log(`Contract: ${process.env.LOTTERY_ADDRESS || "non configuré"}`);
});
