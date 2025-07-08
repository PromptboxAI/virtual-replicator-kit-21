import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import Index from "./pages/Index";
import About from "./pages/About";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <PrivyProvider
    appId="cmcv2r72202fqld0lnr5kgq3k"
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#10b981',
        logo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
        showWalletLoginFirst: false,
      },
      loginMethods: ['email', 'wallet'],
      supportedChains: [
        {
          id: 1,
          name: 'Ethereum',
          network: 'ethereum',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.ankr.com/eth'] } },
          blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
        },
        {
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
          blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
        },
      ],
      defaultChain: {
        id: 8453,
        name: 'Base',
        network: 'base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
        blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
      },
      solanaClusters: [
        {
          name: 'mainnet-beta',
          rpcUrl: 'https://api.mainnet-beta.solana.com',
        },
      ],
      embeddedWallets: {
        createOnLogin: 'users-without-wallets',
        requireUserPasswordOnCreate: false,
      },
    }}
  >
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/learn" element={<Learn />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </PrivyProvider>
);

export default App;
