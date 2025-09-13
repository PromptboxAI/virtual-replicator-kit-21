import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Database, TestTube } from 'lucide-react';

export const SystemStatusIndicator = () => {
  const { isAdmin } = useUserRole();
  const { settings, isLoading } = useAdminSettings();

  if (!isAdmin || isLoading || !settings) return null;

  return (
    <div className="flex items-center gap-2">
      {settings.emergency_pause && (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          Emergency Pause
        </Badge>
      )}
      
      <Badge variant={settings.mev_protection_enabled ? "default" : "secondary"} className="gap-1">
        <Shield className="h-3 w-3" />
        MEV {settings.mev_protection_enabled ? 'Enabled' : 'Disabled'}
      </Badge>
      
      <Badge variant="outline" className="gap-1">
        <Database className="h-3 w-3" />
        {settings.deployment_mode === 'smart_contract' ? 'Smart Contract' : 'Database'}
      </Badge>
      
      <Badge variant={settings.test_mode_enabled ? "secondary" : "default"} className="gap-1">
        <TestTube className="h-3 w-3" />
        {settings.test_mode_enabled ? 'Test' : 'Live'}
      </Badge>
    </div>
  );
};