import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/useAdminSettings";

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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  Shield, 
  Settings, 
  Database, 
  Wallet, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  TestTube,
  MonitorSpeaker,
  Briefcase,
  Rocket,
  Search
} from "lucide-react";
import { TGERunbook } from "@/components/TGERunbook";
import { AdminSystemValidator } from "@/components/AdminSystemValidator";
import { TestingGuide } from "@/components/TestingGuide";
import { V6DeploymentPanel } from "@/components/V6DeploymentPanel";

type AdminSection = 
  | 'system-settings'
  | 'seo-metadata'
  | 'testing-development' 
  | 'revenue-analytics'
  | 'monitoring-alerts'
  | 'treasury-contracts'
  | 'tge-operations';

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();
  const { user, authenticated, ready } = useAuth();
  const { settings, refreshSettings } = useAdminSettings();
  const { updateSetting, isUpdating } = useUpdateAdminSettings();
  const [activeSection, setActiveSection] = useState<AdminSection>('system-settings');

  // Log settings changes for debugging
  useEffect(() => {
    if (settings) {
      console.log('🔍 AdminSettings deployment_mode:', settings.deployment_mode);
    }
  }, [settings?.deployment_mode]);

  // AdminProtectedRoute already handles authentication/authorization
  // No need for duplicate checks here

  const sidebarItems = [
    {
      id: 'system-settings' as AdminSection,
      title: 'System & Settings',
      icon: Settings,
      description: 'App mode, admin settings, system status'
    },
    {
      id: 'seo-metadata' as AdminSection,
      title: 'SEO & Metadata',
      icon: Search,
      description: 'Page titles, descriptions, social images'
    },
    {
      id: 'testing-development' as AdminSection,
      title: 'Testing & Development',
      icon: TestTube,
      description: 'Test lab, faucet, development tools'
    },
    {
      id: 'revenue-analytics' as AdminSection,
      title: 'Revenue & Analytics',
      icon: BarChart3,
      description: 'Revenue dashboard, graduation analytics'
    },
    {
      id: 'monitoring-alerts' as AdminSection,
      title: 'Monitoring & Alerts',
      icon: MonitorSpeaker,
      description: 'Production alerts, cron jobs, system health'
    },
    {
      id: 'treasury-contracts' as AdminSection,
      title: 'Treasury & Contracts',
      icon: Wallet,
      description: 'Treasury management, multi-chain deployment'
    },
    {
      id: 'tge-operations' as AdminSection,
      title: 'TGE & Operations',
      icon: Rocket,
      description: 'TGE runbook, operational procedures'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'system-settings':
        return (
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system configuration and status indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {settings && (
                    <>
                      {settings.emergency_pause && (
                        <Badge variant="destructive" className="gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          Emergency Pause
                        </Badge>
                      )}
                      
                      <Badge variant={settings.mev_protection_enabled ? "default" : "secondary"} className="gap-1">
                        <Shield className="h-3 w-3" />
                        MEV Protection {settings.mev_protection_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      
                      <Badge variant="outline" className="gap-1">
                        <Database className="h-3 w-3" />
                        Mode: {settings.deployment_mode || 'database'}
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deployment Mode Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Deployment Mode Configuration
                </CardTitle>
                <CardDescription>
                  Control how agents are deployed system-wide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Global Deployment Mode</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={settings?.deployment_mode === 'database' ? 'default' : 'outline'}
                      onClick={async () => {
                        await updateSetting('deployment_mode', 'database', 'Switched to database mode');
                        refreshSettings();
                      }}
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      <Database className="h-4 w-4" />
                      Database Mode
                    </Button>
                    <Button
                      variant={settings?.deployment_mode === 'smart_contract' ? 'default' : 'outline'}
                      onClick={async () => {
                        await updateSetting('deployment_mode', 'smart_contract', 'Switched to smart contract mode');
                        refreshSettings();
                      }}
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Smart Contract Mode
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {settings?.deployment_mode === 'database' 
                      ? 'Agents are created in database only (faster, testing)'
                      : 'Agents deploy real smart contracts (slower, production)'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* MEV Protection Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  MEV Protection Settings
                </CardTitle>
                <CardDescription>
                  Configure MEV protection features and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>MEV Protection Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable MEV protection for all agent trades
                    </p>
                  </div>
                  <Switch
                    key={`mev-${settings?.mev_protection_enabled}`}
                    checked={!!settings?.mev_protection_enabled}
                    onCheckedChange={async (checked) => {
                      console.log('MEV Toggle - Current:', settings?.mev_protection_enabled, 'New:', checked);
                      const success = await updateSetting('mev_protection_enabled', checked, 
                        checked ? 'Enabled MEV protection' : 'Disabled MEV protection');
                      
                      if (success) {
                        console.log('MEV Toggle - Update successful, refreshing...');
                        await refreshSettings();
                        console.log('MEV Toggle - Refresh complete');
                      } else {
                        console.error('MEV Toggle - Update failed');
                      }
                    }}
                    disabled={isUpdating}
                  />
                </div>
                
                {settings?.mev_protection_enabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label>Available Lock Durations</Label>
                    <div className="flex flex-wrap gap-2">
                      {(settings?.allowed_lock_durations || [15, 60, 240, 1440]).map((duration) => (
                        <Badge key={duration} variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h`}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Users can select from these lock duration options when creating agents
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* App Mode Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application Mode
                </CardTitle>
                <CardDescription>
                  Switch between test and production modes (synced with navigation)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Application Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      {settings?.test_mode_enabled 
                        ? "Test mode is active - showing test agents and using test data" 
                        : "Live mode is active - showing production agents and real data"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      settings?.test_mode_enabled 
                        ? "bg-orange-100 text-orange-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {settings?.test_mode_enabled ? "Test Mode Enabled" : "Live Mode Enabled"}
                    </div>
                    <Switch
                      key={`test-mode-${settings?.test_mode_enabled}`}
                      checked={settings?.test_mode_enabled ?? false}
                      onCheckedChange={async (checked) => {
                        const success = await updateSetting('test_mode_enabled', checked);
                        if (success) {
                          await refreshSettings();
                        }
                      }}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Validation */}
            <AdminSystemValidator />

            {/* Advanced Settings Link */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Access detailed configuration for fees, economics, and emergency controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/admin-settings')} 
                  className="w-full"
                  variant="outline"
                >
                  Open Advanced Settings Panel
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'seo-metadata':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO & Metadata Management
                </CardTitle>
                <CardDescription>
                  Manage page titles, descriptions, social images, and search engine settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/admin/seo')} 
                  className="w-full"
                >
                  Open SEO Manager
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'testing-development':
        return (
          <div className="space-y-6">
            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Test Environments</CardTitle>
                <CardDescription>
                  Navigate to specialized testing environments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => navigate('/graduation-test')} 
                  className="w-full"
                >
                  Graduation Test Environment
                </Button>
                <Button 
                  onClick={() => navigate('/test-lab')} 
                  variant="outline" 
                  className="w-full"
                >
                  Test Lab
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

            {/* Contract Deployment Test */}
            <ContractDeploymentTest />
          </div>
        );

      case 'revenue-analytics':
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 'monitoring-alerts':
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 'treasury-contracts':
        return (
          <div className="space-y-6">
            {/* V6 Contract Deployment */}
            <V6DeploymentPanel />

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
          </div>
        );

      case 'tge-operations':
        return (
          <div className="space-y-6">
            {/* TGE Runbook & Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>TGE Runbook & Checklist</CardTitle>
                <CardDescription>
                  Follow these steps for a safe Token Generation Event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-xs text-muted-foreground">Production is currently locked to testnet until TGE.</div>
                <TGERunbook />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <Header />
        
        <div className="flex w-full">
          <Sidebar className="w-64 border-r">
            <SidebarTrigger className="m-2 self-end" />
            
            <SidebarContent className="pt-12">
              <SidebarGroup>
                <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          onClick={() => setActiveSection(item.id)}
                          className={activeSection === item.id ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 p-6 pt-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                  {sidebarItems.find(item => item.id === activeSection)?.title}
                </h1>
                <p className="text-muted-foreground">
                  {sidebarItems.find(item => item.id === activeSection)?.description}
                </p>
              </div>
              
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;