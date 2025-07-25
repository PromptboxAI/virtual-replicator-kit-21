
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Learn from "./pages/Learn";
import CreateAgent from "./pages/CreateAgent";
import MyAgents from "./pages/MyAgents";
import UnifiedAgentPage from "./pages/UnifiedAgentPage";
import CreatorAgentDashboard from "./pages/CreatorAgentDashboard";
import Admin from "./pages/Admin";
import Market from "./pages/Market";
import AllAgents from "./pages/AllAgents";
import NotFound from "./pages/NotFound";
import TokenAgents from "./pages/TokenAgents";
import TestLab from "./pages/TestLab";
import GraduationTest from "./pages/GraduationTest";
import { FeeTest } from "./pages/FeeTest";
import { LegacyTradeRedirect } from "./components/LegacyRedirect";
import { useUserRole } from "./hooks/useUserRole";

const queryClient = new QueryClient();

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useUserRole();
  
  console.log('AdminProtectedRoute - isLoading:', isLoading, 'isAdmin:', isAdmin);
  console.log('AdminProtectedRoute - Route accessed:', window.location.pathname);
  
  if (isLoading) {
    console.log('AdminProtectedRoute - showing loading...');
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAdmin) {
    console.log('AdminProtectedRoute - redirecting to home because not admin');
    return <Navigate to="/" replace />;
  }
  
  console.log('AdminProtectedRoute - allowing access');
  return <>{children}</>;
};

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
          id: 84532,
          name: 'Base Sepolia',
          network: 'base-sepolia',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
          blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
        },
      ],
      defaultChain: {
        id: 84532,
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
        blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
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
              <Route path="/" element={<TokenAgents />} />
              <Route path="/ai-agents" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/create" element={<CreateAgent />} />
              <Route path="/my-agents" element={<MyAgents />} />
              <Route path="/my-agents/:agentId" element={<CreatorAgentDashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/agents" element={<AllAgents />} />
              <Route path="/agent/:agentId" element={<UnifiedAgentPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/test-lab" element={
                <div>
                  <h1>Test Lab Route Reached</h1>
                  <AdminProtectedRoute><TestLab /></AdminProtectedRoute>
                </div>
              } />
              <Route path="/graduation-test" element={
                <div>
                  <h1>Graduation Test Route Reached</h1>
                  <AdminProtectedRoute><GraduationTest /></AdminProtectedRoute>
                </div>
              } />
              <Route path="/token-agents" element={<TokenAgents />} />
              <Route path="/fee-test/:agentId" element={<AdminProtectedRoute><FeeTest /></AdminProtectedRoute>} />
              {/* Legacy redirect for old trade routes */}
              <Route path="/trade/:agentId" element={<LegacyTradeRedirect />} />
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
