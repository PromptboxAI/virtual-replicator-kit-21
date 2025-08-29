import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { ExternalWalletRequired } from './ExternalWalletRequired';

interface WalletConnectionGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function WalletConnectionGuard({ 
  children, 
  title = "External Wallet Required",
  description = "To access this feature, please connect an external wallet like MetaMask."
}: WalletConnectionGuardProps) {
  const { authenticated } = useAuth();
  const { hasExternalWallet } = usePrivyWallet();

  // If user is not authenticated, show children (let auth flow handle it)
  if (!authenticated) {
    return <>{children}</>;
  }

  // If user is authenticated but doesn't have external wallet, show wallet required screen
  if (!hasExternalWallet) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ExternalWalletRequired 
          title={title}
          description={description}
        />
      </div>
    );
  }

  // User has external wallet, show children
  return <>{children}</>;
}