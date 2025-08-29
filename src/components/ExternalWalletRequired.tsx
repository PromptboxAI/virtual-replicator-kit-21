import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ExternalWalletRequiredProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function ExternalWalletRequired({ 
  title = "External Wallet Required",
  description = "To use this feature, please connect an external wallet like MetaMask.",
  children
}: ExternalWalletRequiredProps) {
  const { linkWallet } = useAuth();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center">
          {description}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={linkWallet}
            className="w-full"
            size="lg"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect External Wallet
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Supported wallets: MetaMask, Coinbase Wallet, and more
            </p>
          </div>
        </div>
        
        {children}
      </CardContent>
    </Card>
  );
}