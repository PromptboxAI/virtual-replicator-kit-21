import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppMode } from '@/hooks/useAppMode';
import { TestTube, Zap } from 'lucide-react';

export const AppModeToggle = () => {
  const { mode, setAppMode, canChangeMode, isTestMode, isLoading } = useAppMode();

  console.log('AppModeToggle - canChangeMode:', canChangeMode, 'isTestMode:', isTestMode, 'mode:', mode, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('AppModeToggle - still loading, showing skeleton');
    return <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />;
  }

  if (!canChangeMode) {
    console.log('AppModeToggle - returning null because canChangeMode is false');
    return null;
  }

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
        onCheckedChange={(checked) => setAppMode(checked ? 'production' : 'test')}
        className="scale-75"
      />
    </div>
  );
};