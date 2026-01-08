import { useAppMode } from '@/hooks/useAppMode';
import { ArrowRight } from 'lucide-react';

export default function TestnetOnlyBanner() {
  const { isTestMode, isLoading } = useAppMode();
  
  // Reserve space during loading to prevent layout shift
  if (isLoading) {
    return <div className="w-full h-[40px] bg-black" />;
  }
  
  if (!isTestMode) return null;

  return (
    <div className="w-full bg-black">
      <div className="container mx-auto px-4 py-2 flex justify-center items-center text-sm sm:text-base text-white">
        <span>
          This app is running on Base Sepolia.{' '}
          <a href="/roadmap" className="underline inline-flex items-center gap-1">
            Read More <ArrowRight className="h-4 w-4 inline" />
          </a>
        </span>
      </div>
    </div>
  );
}
