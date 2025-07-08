
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WalletConnect() {
  const { user, signIn } = useAuth();
  const { wallet, connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  if (user || connected) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Base & Ethereum</h3>
            <Button 
              onClick={() => {
                signIn();
                setIsOpen(false);
              }}
              className="w-full"
              variant="outline"
            >
              Connect Base Wallet
            </Button>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Solana</h3>
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
