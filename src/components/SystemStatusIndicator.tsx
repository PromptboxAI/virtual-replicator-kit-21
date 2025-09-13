import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

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
    </div>
  );
};