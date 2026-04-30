import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

export const projectId = "a76badfdf543ada7db3fe70ff41921cb";

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

const networks = [bscMainnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

// Initialisation uniquement côté client et en singleton
let modalInstance = null;
if (typeof window !== 'undefined') {
  if (!window.__appKitModal) {
    modalInstance = createAppKit({
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
      themeMode: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      themeVariables: {
        "--w3m-accent": "#b48eef",
        "--w3m-border-radius-master": "22px",
      },
    });
    window.__appKitModal = modalInstance;
  } else {
    modalInstance = window.__appKitModal;
  }
}

export const modal = modalInstance;

// Synchronisation du thème (côté client uniquement)
if (typeof window !== 'undefined' && modal) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    modal.setThemeMode(e.matches ? "dark" : "light");
  });
}
