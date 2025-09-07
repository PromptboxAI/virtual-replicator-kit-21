import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

import { ContractDeploymentTest } from "@/components/ContractDeploymentTest";
import { AppModeToggle } from "@/components/AppModeToggle";
import { AdminFaucet } from "@/components/AdminFaucet";
import { TreasuryManagement } from "@/components/TreasuryManagement";
import { RevenueDashboard } from "@/components/RevenueDashboard";
import { RevenueAuditDashboard } from "@/components/RevenueAuditDashboard";
import { RevenueFunctionTest } from "@/components/RevenueFunctionTest";
import { GraduationAnalyticsDashboard } from "@/components/GraduationAnalyticsDashboard";
import { CronJobStatus } from "@/components/CronJobStatus";
import { ProductionAlertsPanel } from "@/components/ProductionAlertsPanel";
import MultiChainDeployment from "@/components/MultiChainDeployment";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Settings, Database, Wallet, BarChart3, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { TGERunbook } from "@/components/TGERunbook";
import { TestingGuide } from "@/components/TestingGuide";
const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();
  const { user, authenticated, ready } = useAuth();

  console.log('Admin page - auth state:', { user: !!user, authenticated, ready, isAdmin, isLoading });

  useEffect(() => {
    if (ready && !isLoading) {
      if (!authenticated) {
        console.log('Admin page - not authenticated, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        console.log('Admin page - not admin, redirecting to home');
        navigate('/');
        return;
      }
    }
  }, [authenticated, ready, isAdmin, isLoading, navigate]);

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* App Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Mode
            </CardTitle>
            <CardDescription>
              Switch between test and production modes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppModeToggle />
          </CardContent>
        </Card>

        {/* TGE Runbook & Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>TGE Runbook & Checklist</CardTitle>
            <CardDescription>
              Follow these steps for a safe Token Generation Event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ... keep existing code (runbook content component) */}
            <div className="mb-4 text-xs text-muted-foreground">Production is currently locked to testnet until TGE.</div>
            {/* We'll render the runbook */}
            <div>
              <TGERunbook />
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
            <CardDescription>
              Navigate to admin tools and test pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => navigate('/graduation-test')} 
              className="w-full"
            >
              Go to Graduation Test
            </Button>
            <Button 
              onClick={() => navigate('/test-lab')} 
              variant="outline" 
              className="w-full"
            >
              Go to Test Lab
            </Button>
            <Button 
              onClick={() => navigate('/price-audit')} 
              variant="outline" 
              className="w-full flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Price Audit Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Token Management & Testing Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              🧪 Comprehensive Testing Setup
            </CardTitle>
            <CardDescription>
              Complete testing environment with 200K off-chain PROMPT balance and on-chain token minting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AdminFaucet />
            <TestingGuide />
          </CardContent>
        </Card>

        {/* Treasury Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Treasury Configuration
            </CardTitle>
            <CardDescription>
              Configure treasury addresses for testnet and mainnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TreasuryManagement />
          </CardContent>
        </Card>

        {/* Revenue Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Revenue
            </CardTitle>
            <CardDescription>
              Monitor platform revenue from agent creation and trading fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueDashboard />
          </CardContent>
        </Card>

        {/* Revenue Audit Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Revenue Audit & Activity
            </CardTitle>
            <CardDescription>
              Detailed audit trail of all revenue events and agent performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueAuditDashboard />
          </CardContent>
        </Card>

        {/* Production Alerts & Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Production Alerts & Monitoring
            </CardTitle>
            <CardDescription>
              Monitor system health, LP locks, liquidity levels, and graduation failures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionAlertsPanel />
          </CardContent>
        </Card>

        {/* Multi-Chain Deployment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Multi-Chain Deployment
            </CardTitle>
            <CardDescription>
              Deploy contracts across multiple blockchain networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiChainDeployment />
          </CardContent>
        </Card>

        {/* Cron Job Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Automated Job Status
            </CardTitle>
            <CardDescription>
              Monitor scheduled tasks: price synchronization and health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CronJobStatus />
          </CardContent>
        </Card>

        {/* Graduation Analytics Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Graduation Analytics
            </CardTitle>
            <CardDescription>
              Track graduated agents, LP values, and platform token allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraduationAnalyticsDashboard />
          </CardContent>
        </Card>

        {/* Revenue Function Testing */}
        <RevenueFunctionTest />

        {/* Contract Deployment Test */}
        <ContractDeploymentTest />

      </div>
    </div>
  );
};

export default Admin;