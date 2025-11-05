import { AlertTriangle } from 'lucide-react';
import { useAppMode } from '@/hooks/useAppMode';

export default function TestnetOnlyBanner() {
  const { isTestMode } = useAppMode();
  if (!isTestMode) return null;

  return (
    <div className="w-full bg-black">
      <div className="container mx-auto px-4 py-2 flex justify-center items-center gap-2 text-xs sm:text-sm text-white">
        <AlertTriangle className="h-4 w-4 text-white" />
        <span>
          This application is running on Base Sepolia until the Token Generation Event (TGE)
        </span>
      </div>
    </div>
  );
}
