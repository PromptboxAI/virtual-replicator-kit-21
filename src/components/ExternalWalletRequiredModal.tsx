import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ExternalWalletRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionRequired?: string;
}

export function ExternalWalletRequiredModal({ 
  open,
  onOpenChange,
  title = "External Wallet Required",
  description = "To create an agent, you need to connect an external wallet to pay the 100 PROMPT token fee.",
  actionRequired = "Agent Creation"
}: ExternalWalletRequiredModalProps) {
  const { linkWallet } = useAuth();

  const handleConnectWallet = async () => {
    try {
      await linkWallet();
      onOpenChange(false);
    } catch (error) {
      console.error('Error linking wallet:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Coins className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Why do I need a wallet?</p>
              <p className="text-sm text-muted-foreground">
                Creating agents requires 100 PROMPT tokens as a creation fee. An external wallet (like MetaMask) is needed to hold and transfer these tokens securely.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleConnectWallet}
            className="w-full"
            size="lg"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect External Wallet
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Supported wallets: MetaMask, Coinbase Wallet, WalletConnect and more
            </p>
          </div>

          <Button 
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
