// ================================================================
//  LOOKA WIN — Configuration contrat
//  Mettre à jour LOOKA_ADDRESS et USDT_ADDRESS après déploiement mainnet
// ================================================================

// ── ADRESSES ─────────────────────────────────────────────────────
// En local (Hardhat) — mettre à jour après chaque redéploiement
// En mainnet — mettre à jour une seule fois définitivement
export const LOOKA_ADDRESS = "0xF46a04EaDDaC99fe9eD79E76aFeCdb4d04EF591C";
export const USDT_ADDRESS  = "0x55d398326f99059fF775485246999027B3197955";

// ── RPC ──────────────────────────────────────────────────────────
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://bsc-dataseed1.binance.org";

// ── ABI LOOKA WIN ────────────────────────────────────────────────
export const LOOKA_ABI = [
  // Lecture état
  "function getCurrentHourlyPrize() view returns (uint256)",
  "function getCurrentTicketCount() view returns (uint256)",
  "function getJackpots() view returns (uint256 daily, uint256 weekly, uint256 monthly)",
  "function getNextHourlyDraw() view returns (uint256)",
  "function getNextProtocolPayout() view returns (uint256)",
  "function getReferralPending(address) view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "function getTicketsForAddress(address) view returns (uint256 hourly, uint256 daily, uint256 weekly, uint256 monthly)",
  "function getPendingWin(address) view returns (uint256)",
  "function referrerOf(address) view returns (address)",
  "function protocolBalance() view returns (uint256)",
  "function roundId() view returns (uint256)",
  "function TICKET_PRICE() view returns (uint256)",
  "function MIN_PARTICIPANTS() view returns (uint256)",

  // Actions joueur
  "function buyTickets(uint256 quantity, address referrer) external",
  "function claimReferral() external",
  "function claimWin() external",

  // Événements
  "event TicketPurchased(address indexed buyer, uint256 quantity, address indexed referrer)",
  "event WinnerPaid(address indexed winner, uint256 amount, uint8 drawType, uint256 roundId)",
  "event ReferrerRegistered(address indexed player, address indexed referrer)",
  "event ReferralPaid(address indexed referrer, uint256 amount)",
  "event ProtocolPaid(address indexed treasury, uint256 amount, uint256 timestamp)",
  "event DrawSkipped(uint8 drawType, uint256 timestamp)",
  "event JackpotRolledOver(uint8 drawType, uint256 amount)",
];

// ── ABI USDT (minimal) ───────────────────────────────────────────
export const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// ── HELPERS ──────────────────────────────────────────────────────
// Convertir micro-USDT (6 décimales) en USDT lisible
export const toUSDT = (microUsdt) => {
  if (!microUsdt || microUsdt === "0") return "0.00";
  try {
    const raw = BigInt(microUsdt.toString());
    const whole = raw / BigInt("1000000000000000000");
    const remainder = raw % BigInt("1000000000000000000");
    const decimal = Number(remainder) / 1e18;
    return (Number(whole) + decimal).toFixed(2);
  } catch { return "0.00"; }
};

// Tronquer une adresse pour l'affichage
export const shortAddr = (addr) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// DrawType enum (correspond au contrat)
export const DRAW_TYPE = {
  0: "None",
  1: "Hourly",
  2: "Daily",
  3: "Weekly",
  4: "Monthly",
  5: "House",
};
