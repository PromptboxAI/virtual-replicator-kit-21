import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppMode } from '@/hooks/useAppMode';
import { useUpdateAdminSettings } from '@/hooks/useAdminSettings';
import { TestTube, Zap } from 'lucide-react';

export const AppModeToggle = () => {
  const { mode, setAppMode, canChangeMode, isTestMode, isLoading } = useAppMode();
  const { updateSetting } = useUpdateAdminSettings();

  if (isLoading) {
    return <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />;
  }

  if (!canChangeMode) {
    return null;
  }

  const handleModeChange = async (checked: boolean) => {
    const newMode = checked ? 'production' : 'test';
    
    console.log('AppModeToggle - handleModeChange called');
    console.log('AppModeToggle - Current mode:', mode, 'isTestMode:', isTestMode);
    console.log('AppModeToggle - Toggle checked:', checked, 'New mode:', newMode);
    
    // Update localStorage (for navigation)
    setAppMode(newMode);
    
    // Update database (for admin panel) 
    // checked = true means production (test_mode_enabled = false)
    // checked = false means test (test_mode_enabled = true)
    const testModeEnabled = !checked; // Invert because checked=true means production
    console.log('AppModeToggle - Setting test_mode_enabled to:', testModeEnabled);
    
    await updateSetting('test_mode_enabled', testModeEnabled, 
      `Switched to ${newMode} mode via navigation toggle`);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
      <div className="flex items-center gap-1.5">
        {isTestMode ? (
          <TestTube className="h-3.5 w-3.5 text-orange-500" />
        ) : (
          <Zap className="h-3.5 w-3.5 text-green-500" />
        )}
        <Badge 
          variant={isTestMode ? "secondary" : "default"} 
          className={`text-xs px-1.5 py-0.5 ${isTestMode ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
        >
          {isTestMode ? "TEST" : "LIVE"}
        </Badge>
      </div>
      
      <Switch
        checked={!isTestMode}
        onCheckedChange={handleModeChange}
        className="scale-75"
      />
    </div>
  );
};