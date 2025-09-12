import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/useAdminSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeploymentModeIndicator } from '@/components/ui/deployment-mode-indicator';
import { Navigate } from 'react-router-dom';
import { 
  Shield, 
  Database, 
  Settings, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Activity,
  Users
} from 'lucide-react';

export default function AdminSettings() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { settings, isLoading, error, refreshSettings } = useAdminSettings();
  const { updateSetting, updateMultipleSettings, isUpdating } = useUpdateAdminSettings();

  const [localSettings, setLocalSettings] = useState(settings);

  if (roleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load admin settings: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) return null;

  const handleSettingChange = async (key: string, value: any) => {
    await updateSetting(key as any, value);
    refreshSettings();
  };

  const handleEmergencyPause = async () => {
    const newValue = !settings.emergency_pause;
    await updateSetting('emergency_pause', newValue, 
      newValue ? 'Emergency pause activated' : 'Emergency pause deactivated'
    );
    refreshSettings();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and controls</p>
        </div>
        <div className="flex items-center gap-2">
          <DeploymentModeIndicator mode={settings.deployment_mode} />
          {settings.emergency_pause && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Emergency Pause Active
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="deployment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="deployment" className="gap-2">
            <Database className="h-4 w-4" />
            Deployment
          </TabsTrigger>
          <TabsTrigger value="mev" className="gap-2">
            <Shield className="h-4 w-4" />
            MEV Protection
          </TabsTrigger>
          <TabsTrigger value="economics" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Economics
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Deployment Configuration
              </CardTitle>
              <CardDescription>
                Control how agents are deployed and which frameworks are available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Global Deployment Mode</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={settings.deployment_mode === 'database' ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('deployment_mode', 'database')}
                    className="gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Database Mode
                  </Button>
                  <Button
                    variant={settings.deployment_mode === 'smart_contract' ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('deployment_mode', 'smart_contract')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Smart Contract Mode
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {settings.deployment_mode === 'database' 
                    ? 'Agents are created in database only (faster, testing)'
                    : 'Agents deploy real smart contracts (slower, production)'}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Allowed Frameworks</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.allowed_frameworks.map((framework) => (
                    <Badge key={framework} variant="secondary">
                      {framework}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Users can only select from these whitelisted frameworks
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.test_mode_enabled}
                  onCheckedChange={(checked) => handleSettingChange('test_mode_enabled', checked)}
                />
                <Label>Test Mode Enabled</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mev">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                MEV Protection Settings
              </CardTitle>
              <CardDescription>
                Configure MEV protection features and lock durations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.mev_protection_enabled}
                  onCheckedChange={(checked) => handleSettingChange('mev_protection_enabled', checked)}
                />
                <Label>MEV Protection Enabled</Label>
              </div>

              <div className="space-y-3">
                <Label>Allowed Lock Durations (minutes)</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.allowed_lock_durations.map((duration) => (
                    <Badge key={duration} variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {duration}m
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Users can only select from these lock duration options
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Economic Parameters
              </CardTitle>
              <CardDescription>
                Configure fees, limits, and graduation thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Creation Fee (PROMPT)</Label>
                  <Input
                    type="number"
                    value={settings.creation_fee}
                    onChange={(e) => handleSettingChange('creation_fee', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trading Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.trading_fee_percent}
                    onChange={(e) => handleSettingChange('trading_fee_percent', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Prebuy (PROMPT)</Label>
                  <Input
                    type="number"
                    value={settings.max_prebuy_amount}
                    onChange={(e) => handleSettingChange('max_prebuy_amount', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Threshold</Label>
                  <Input
                    type="number"
                    value={settings.graduation_threshold}
                    onChange={(e) => handleSettingChange('graduation_threshold', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>
                Monitor system health and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Deployment Mode</Label>
                  <DeploymentModeIndicator mode={settings.deployment_mode} />
                </div>
                <div className="space-y-2">
                  <Label>MEV Protection</Label>
                  <Badge variant={settings.mev_protection_enabled ? "default" : "secondary"}>
                    {settings.mev_protection_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={refreshSettings} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                Refresh Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Emergency Controls
              </CardTitle>
              <CardDescription>
                Emergency overrides and system pause controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant={settings.emergency_pause ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {settings.emergency_pause 
                    ? "Emergency pause is ACTIVE. All agent creation is disabled."
                    : "System is operating normally."}
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleEmergencyPause}
                variant={settings.emergency_pause ? "default" : "destructive"}
                className="w-full"
                disabled={isUpdating}
              >
                {settings.emergency_pause ? "Deactivate Emergency Pause" : "Activate Emergency Pause"}
              </Button>

              <div className="space-y-2">
                <Button
                  onClick={() => handleSettingChange('deployment_mode', 'database')}
                  variant="outline"
                  className="w-full"
                  disabled={settings.deployment_mode === 'database'}
                >
                  Force Database Mode
                </Button>
                <p className="text-sm text-muted-foreground">
                  Immediately switch to database mode for all new agents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}