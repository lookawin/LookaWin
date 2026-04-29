import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

export const projectId = "a76badfdf543ada7db3fe70ff41921cb";

// BSC Mainnet
export const bscMainnet = {
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://bsc-dataseed1.binance.org"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
};

// Hardhat Local (pour les tests)
export const hardhatLocal = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://looka.win/rpc"] },
  },
};

const networks = [bscMainnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: bscMainnet,
  projectId,
  metadata: {
    name: "LookaWin",
    description: "Première loterie décentralisée et immuable",
    url: "https://looka.win",
    icons: ["https://looka.win/favicon.svg"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
  themeVariables: {
    "--w3m-accent": "#b48eef",
    "--w3m-border-radius-master": "22px",
  },
});

// Synchroniser le modal WalletConnect avec le thème OS
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      modal.setThemeMode(e.matches ? "dark" : "light");
    });
}
