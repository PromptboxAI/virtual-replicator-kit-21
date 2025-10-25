
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Learn from "./pages/Learn";
import CreateAgent from "./pages/CreateAgent";
import MyAgents from "./pages/MyAgents";
import UnifiedAgentPage from "./pages/UnifiedAgentPage";
import CreatorAgentDashboard from "./pages/CreatorAgentDashboard";
import Admin from "./pages/Admin";
import AdminSettings from "./pages/AdminSettings";
import Market from "./pages/Market";
import AllAgents from "./pages/AllAgents";
import NotFound from "./pages/NotFound";
import TokenAgents from "./pages/TokenAgents";
import Faucet from "./pages/Faucet";
import TestLab from "./pages/TestLab";
import GraduationTest from "./pages/GraduationTest";
import { FeeTest } from "./pages/FeeTest";
import PriceAuditDashboard from "./pages/PriceAuditDashboard";
import HealthCheck from "./pages/HealthCheck";
import { LegacyTradeRedirect } from "./components/LegacyRedirect";
import { useUserRole } from "./hooks/useUserRole";
import { Header } from "./components/Header";
import { ContractDeploymentTest } from "./components/ContractDeploymentTest";

const queryClient = new QueryClient();

const AuthProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, ready, login } = usePrivy();
  
  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!authenticated) {
    sessionStorage.setItem('auth_return_url', window.location.pathname);
    login();
    return null;
  }
  
  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useUserRole();
  const { ready } = usePrivy();
  
  console.log('AdminProtectedRoute - ready:', ready, 'isLoading:', isLoading, 'isAdmin:', isAdmin);
  console.log('AdminProtectedRoute - Route accessed:', window.location.pathname);
  
  // Wait for both Privy to be ready AND user role to be loaded
  if (!ready || isLoading) {
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
  <ErrorBoundary>
    <PrivyProvider
    appId="cmcv2r72202fqld0lnr5kgq3k"
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#10b981',
        logo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
        showWalletLoginFirst: false,
      },
      loginMethods: ['email'],
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
        createOnLogin: 'off',
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
              <Route path="/faucet" element={<Faucet />} />
              <Route path="/create" element={<CreateAgent />} />
              <Route path="/my-agents" element={<MyAgents />} />
              <Route path="/my-agents/:agentId" element={<CreatorAgentDashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/agents" element={<AllAgents />} />
              <Route path="/agent/:agentId" element={<UnifiedAgentPage />} />
              <Route path="/admin" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />
              <Route path="/admin-settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
              <Route path="/test-simple" element={<div><h1>Simple Test Route Working!</h1></div>} />
              <Route path="/contract-test" element={
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-6">Contract Deployment Test</h1>
                    <ContractDeploymentTest />
                  </div>
                </div>
              } />
              <Route path="/test-lab" element={
                <div>
                  <h1>Test Lab Route Reached</h1>
                  <AdminProtectedRoute><TestLab /></AdminProtectedRoute>
                </div>
              } />
              <Route path="/graduation-test" element={
                <div>
                  <h1>Graduation Test Route Reached</h1>
                  <p>Testing without admin protection...</p>
                  <GraduationTest />
                </div>
              } />
              <Route path="/price-audit" element={<AdminProtectedRoute><PriceAuditDashboard /></AdminProtectedRoute>} />
              <Route path="/token-agents" element={<TokenAgents />} />
              <Route path="/fee-test/:agentId" element={<AdminProtectedRoute><FeeTest /></AdminProtectedRoute>} />
              <Route path="/healthz" element={<HealthCheck />} />
              {/* Legacy redirect for old trade routes */}
              <Route path="/trade/:agentId" element={<LegacyTradeRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <div>
                  <h1>404 - Route not found</h1>
                  <p>Current path: {window.location.pathname}</p>
                  <NotFound />
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </PrivyProvider>
  </ErrorBoundary>
);

export default App;
