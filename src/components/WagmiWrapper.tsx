import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { ReactNode } from 'react';

/**
 * Wrapper component to provide Wagmi context to specific pages that need it
 * Used for pages with on-chain interactions (Faucet, some admin tools)
 */
export function WagmiWrapper({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}
