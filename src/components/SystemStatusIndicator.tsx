import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { DeploymentModeIndicator } from '@/components/ui/deployment-mode-indicator';
import { AlertTriangle, Shield, Database } from 'lucide-react';

export const SystemStatusIndicator = () => {
  const { isAdmin } = useUserRole();
  const { settings, isLoading } = useAdminSettings();

  if (!isAdmin || isLoading || !settings) return null;

  return (
    <div className="flex items-center gap-2">
      <DeploymentModeIndicator mode={settings.deployment_mode} />
      
      {settings.emergency_pause && (
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          Emergency Pause
        </Badge>
      )}
      
      {!settings.mev_protection_enabled && (
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          MEV Disabled
        </Badge>
      )}
    </div>
  );
};