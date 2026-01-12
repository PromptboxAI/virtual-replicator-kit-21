import { useMemo, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WagmiWrapper } from "./components/WagmiWrapper";
import { DynamicSEO } from "./components/DynamicSEO";

import { LegacyTradeRedirect } from "./components/LegacyRedirect";
import { useUserRole } from "./hooks/useUserRole";
import { Header } from "./components/Header";
import { ContractDeploymentTest } from "./components/ContractDeploymentTest";

// Route-level code splitting to avoid loading the entire app graph on first paint.
// This helps prevent Vite module transform cascades that show up as 500s for /src/... files.
const TokenAgents = lazy(() => import("./pages/TokenAgents"));
const Auth = lazy(() => import("./pages/Auth"));
const About = lazy(() => import("./pages/About"));
const Learn = lazy(() => import("./pages/Learn"));
const CreateAgent = lazy(() => import("./pages/CreateAgent"));
const MyAgents = lazy(() => import("./pages/MyAgents"));
const UnifiedAgentPage = lazy(() => import("./pages/UnifiedAgentPage"));
const CreatorAgentDashboard = lazy(() => import("./pages/CreatorAgentDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminSEO = lazy(() => import("./pages/AdminSEO"));
const Market = lazy(() => import("./pages/Market"));
const AllAgents = lazy(() => import("./pages/AllAgents"));
const Faucet = lazy(() => import("./pages/Faucet"));
const TestLab = lazy(() => import("./pages/TestLab"));
const GraduationTest = lazy(() => import("./pages/GraduationTest"));
const PriceAuditDashboard = lazy(() => import("./pages/PriceAuditDashboard"));
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const PromptboxDPA = lazy(() => import("./pages/PromptboxDPA"));
const Careers = lazy(() => import("./pages/Careers"));
const Status = lazy(() => import("./pages/Status"));
const ApiReference = lazy(() => import("./pages/ApiReference"));
const PressReleases = lazy(() => import("./pages/PressReleases"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const AIAgentsHub = lazy(() => import("./pages/platform/AIAgentsHub"));
const AIAgentDetail = lazy(() => import("./pages/platform/AIAgentDetail"));
const AIAgentsMarketplace = lazy(() => import("./pages/AIAgentsMarketplace"));
const BuildYourFirstAgent = lazy(() => import("./pages/BuildYourFirstAgent"));
const AgentShowcase = lazy(() => import("./pages/AgentShowcase"));
const AgentCreationSuccess = lazy(() => import("./components/AgentCreationSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

const FeeTest = lazy(() =>
  import("./pages/FeeTest").then((m) => ({ default: m.FeeTest }))
);

const queryClient = new QueryClient();

const FullScreenLoader = ({ extraLine = false }: { extraLine?: boolean }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted" />
      <div className="h-4 w-32 rounded bg-muted" />
      {extraLine && <div className="h-3 w-24 rounded bg-muted" />}
    </div>
  </div>
);

const AuthProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, ready, login } = usePrivy();

  if (!ready) return <FullScreenLoader />;

  if (!authenticated) {
    sessionStorage.setItem("auth_return_url", window.location.pathname);
    login();
    return null;
  }

  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useUserRole();
  const { ready } = usePrivy();

  // Wait for both Privy to be ready AND user role to be loaded
  if (!ready || isLoading) return <FullScreenLoader extraLine />;

  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const App = () => {
  // Memoize Privy config to prevent re-initialization on re-renders
  const privyConfig: PrivyClientConfig = useMemo(() => ({
    appearance: {
      theme: 'dark',
      accentColor: '#10b981' as `#${string}`,
      logo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
      showWalletLoginFirst: false,
    },
    embeddedWallets: {
      createOnLogin: 'off',
      requireUserPasswordOnCreate: false,
    },
  }), []);

  return (
  <ErrorBoundary>
    <HelmetProvider>
    <PrivyProvider
      appId="cmcv2r72202fqld0lnr5kgq3k"
      config={privyConfig}
    >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DynamicSEO />
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<TokenAgents />} />
              <Route path="/ai-agents" element={<AIAgentsMarketplace />} />
              <Route path="/ai-agents/:agentId" element={<AgentShowcase />} />
              <Route
                path="/build-your-first-ai-agent"
                element={<BuildYourFirstAgent />}
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/learn" element={<Learn />} />
              <Route
                path="/faucet"
                element={
                  <WagmiWrapper>
                    <Faucet />
                  </WagmiWrapper>
                }
              />
              <Route
                path="/create"
                element={
                  <WagmiWrapper>
                    <CreateAgent />
                  </WagmiWrapper>
                }
              />
              <Route
                path="/agent-created/:agentId"
                element={<AgentCreationSuccess />}
              />
              <Route path="/dashboard" element={<MyAgents />} />
              <Route path="/my-agents" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/:agentId" element={<CreatorAgentDashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/agents" element={<AllAgents />} />
              <Route path="/agent/:agentId" element={<UnifiedAgentPage />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <WagmiWrapper>
                      <Admin />
                    </WagmiWrapper>
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin-settings"
                element={
                  <AdminProtectedRoute>
                    <WagmiWrapper>
                      <AdminSettings />
                    </WagmiWrapper>
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/seo"
                element={
                  <AdminProtectedRoute>
                    <AdminSEO />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/test-simple" element={<div><h1>Simple Test Route Working!</h1></div>} />
              <Route
                path="/contract-test"
                element={
                  <div className="min-h-screen bg-background">
                    <Header />
                    <div className="container mx-auto px-4 py-8">
                      <h1 className="text-2xl font-bold mb-6">
                        Contract Deployment Test
                      </h1>
                      <ContractDeploymentTest />
                    </div>
                  </div>
                }
              />
              <Route
                path="/test-lab"
                element={
                  <AdminProtectedRoute>
                    <TestLab />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/graduation-test"
                element={
                  <div>
                    <h1>Graduation Test Route Reached</h1>
                    <p>Testing without admin protection...</p>
                    <GraduationTest />
                  </div>
                }
              />
              <Route
                path="/price-audit"
                element={
                  <AdminProtectedRoute>
                    <PriceAuditDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/token-agents" element={<TokenAgents />} />
              <Route
                path="/fee-test/:agentId"
                element={
                  <AdminProtectedRoute>
                    <FeeTest />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/healthz" element={<HealthCheck />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/promptbox-dpa" element={<PromptboxDPA />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/status" element={<Status />} />
              <Route path="/api-reference" element={<ApiReference />} />
              <Route path="/press-releases" element={<PressReleases />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/platform/ai-agents" element={<AIAgentsHub />} />
              <Route path="/platform/ai-agents/:agentId" element={<AIAgentDetail />} />
              {/* Legacy redirect for old trade routes */}
              <Route path="/trade/:agentId" element={<LegacyTradeRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <div>
                    <h1>404 - Route not found</h1>
                    <p>Current path: {window.location.pathname}</p>
                    <NotFound />
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </PrivyProvider>
    </HelmetProvider>
  </ErrorBoundary>
  );
};

export default App;
