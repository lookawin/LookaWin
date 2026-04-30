import "@/styles/globals.css";
import { wagmiAdapter, modal } from "../walletconfig";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DepositProvider, CHAIN } from "@particle-network/universal-deposit/react";
void modal;
const queryClient = new QueryClient();
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e.message + " | " + e.stack?.slice(0, 300) }; }
  render() {
    if (this.state.error) return (
      <div style={{background:"#000",color:"#f00",padding:"20px",fontSize:"12px",wordBreak:"break-all",whiteSpace:"pre-wrap"}}>
        ERROR: {this.state.error}
      </div>
    );
    return this.props.children;
  }
}
export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DepositProvider config={{
            destination: { chainId: CHAIN.BSC },
            autoSweep: true,
            minValueUSD: 2,
          }}>
            <Component {...pageProps} />
          </DepositProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
