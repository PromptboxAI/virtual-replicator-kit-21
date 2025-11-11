import { useAppMode } from '@/hooks/useAppMode';
import { ArrowRight } from 'lucide-react';

export default function TestnetOnlyBanner() {
  const { isTestMode } = useAppMode();
  if (!isTestMode) return null;

  return (
    <div className="w-full bg-black">
      <div className="container mx-auto px-4 py-2 flex justify-center items-center text-sm sm:text-base text-white">
        <span className="flex items-center gap-1">
          Currently on Base Sepolia until TGE. Read More
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
