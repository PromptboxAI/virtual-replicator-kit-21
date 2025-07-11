import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppMode } from '@/hooks/useAppMode';
import { TestTube, Zap } from 'lucide-react';

export const AppModeToggle = () => {
  const { mode, setAppMode, canChangeMode, isTestMode } = useAppMode();

  console.log('AppModeToggle - canChangeMode:', canChangeMode, 'isTestMode:', isTestMode, 'mode:', mode);

  if (!canChangeMode) {
    console.log('AppModeToggle - returning null because canChangeMode is false');
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        {isTestMode ? (
          <TestTube className="h-4 w-4 text-orange-500" />
        ) : (
          <Zap className="h-4 w-4 text-green-500" />
        )}
        <Badge variant={isTestMode ? "secondary" : "default"} className={isTestMode ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
          {isTestMode ? "TEST MODE" : "PRODUCTION"}
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Label htmlFor="mode-toggle" className="text-sm">
          Production Mode
        </Label>
        <Switch
          id="mode-toggle"
          checked={!isTestMode}
          onCheckedChange={(checked) => setAppMode(checked ? 'production' : 'test')}
        />
      </div>
    </div>
  );
};