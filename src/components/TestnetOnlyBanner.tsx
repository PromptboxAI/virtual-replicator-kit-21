import { AlertTriangle } from 'lucide-react';
import { useAppMode } from '@/hooks/useAppMode';

export default function TestnetOnlyBanner() {
  const { isTestMode } = useAppMode();
  if (!isTestMode) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-xs sm:text-sm text-foreground">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <span>
          Testnet-only mode is active. Production features are temporarily disabled until the Token Generation Event (TGE).
        </span>
      </div>
    </div>
  );
}
