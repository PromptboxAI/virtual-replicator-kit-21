import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

import { ContractDeploymentTest } from "@/components/ContractDeploymentTest";
import { AppModeToggle } from "@/components/AppModeToggle";
import { AdminFaucet } from "@/components/AdminFaucet";
import { TreasuryManagement } from "@/components/TreasuryManagement";
import { RevenueDashboard } from "@/components/RevenueDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Settings, Database, Wallet, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System administration and configuration</p>
            </div>
          </div>
        </div>
      </div>

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

        {/* Token Faucet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Token Management
            </CardTitle>
            <CardDescription>
              Distribute test tokens to user wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminFaucet />
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

        {/* Contract Deployment Test */}
        <ContractDeploymentTest />

      </div>
    </div>
  );
};

export default Admin;