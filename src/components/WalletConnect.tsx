import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, ExternalLink, AlertCircle, Download } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, error, isError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [isWalletInstalled, setIsWalletInstalled] = useState<boolean | null>(null);

  // Check if wallet is installed
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined') {
        // Be more strict about MetaMask detection
        const hasEthereum = typeof window.ethereum !== 'undefined';
        const isMetaMask = hasEthereum && window.ethereum.isMetaMask === true;
        const isCoinbase = hasEthereum && window.ethereum.isCoinbaseWallet === true;
        const hasWorkingWallet = isMetaMask || isCoinbase;
        
        console.log('=== WALLET DETECTION DEBUG ===');
        console.log('window.ethereum exists:', hasEthereum);
        console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask);
        console.log('window.ethereum.isCoinbaseWallet:', window.ethereum?.isCoinbaseWallet);
        console.log('isMetaMask:', isMetaMask);
        console.log('isCoinbase:', isCoinbase);
        console.log('hasWorkingWallet:', hasWorkingWallet);
        console.log('Setting isWalletInstalled to:', hasWorkingWallet);
        console.log('==============================');
        
        setIsWalletInstalled(hasWorkingWallet);
      }
    };

    checkWallet();
    
    // Also check when the page loads completely
    if (document.readyState === 'loading') {
      window.addEventListener('load', checkWallet);
      return () => window.removeEventListener('load', checkWallet);
    }
  }, []);

  // Handle connection errors
  useEffect(() => {
    if (isError && error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const handleConnect = async () => {
    try {
      console.log('Attempting to connect wallet...');
      
      // Double-check wallet installation before connecting
      if (!isWalletInstalled) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask to continue.",
          variant: "destructive",
        });
        return;
      }

      // Add timeout to prevent infinite pending state
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      const connectPromise = connect({ connector: injected() });

      await Promise.race([connectPromise, timeoutPromise]);
      console.log('Wallet connection initiated');
    } catch (err: any) {
      console.error('Connection error:', err);
      
      if (err.message === 'Connection timeout') {
        toast({
          title: "Connection Timeout",
          description: "Please check your wallet and try again. Make sure to approve the connection request.",
          variant: "destructive",
        });
      } else if (err.message?.includes('User rejected')) {
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the wallet connection.",
        });
      } else {
        toast({
          title: "Connection Error", 
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
    });
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  console.log('=== RENDER STATE DEBUG ===');
  console.log('isWalletInstalled:', isWalletInstalled);
  console.log('isPending:', isPending);
  console.log('isConnected:', isConnected);
  console.log('isError:', isError);
  
  // Add manual reset if stuck
  if (isPending) {
    console.log('STUCK IN PENDING - Adding manual reset option');
  }
  console.log('=========================');

  // Show install prompt if wallet is not detected
  if (isWalletInstalled === false) {
    console.log('RENDERING: Install MetaMask button');
    return (
      <div className="flex flex-col items-center space-y-3">
        <Button 
          onClick={() => {
            console.log('Install MetaMask button clicked');
            window.open('https://metamask.io/download/', '_blank');
          }}
          variant="outline" 
          className="flex items-center space-x-2 border-destructive/50 hover:border-destructive hover:bg-destructive/10"
        >
          <Download className="h-4 w-4" />
          <span>Install MetaMask</span>
        </Button>
        <div className="text-xs text-muted-foreground text-center max-w-56">
          You need a web3 wallet like MetaMask to connect to PromptBox
        </div>
      </div>
    );
  }

  // Show loading while checking wallet
  if (isWalletInstalled === null) {
    console.log('RENDERING: Checking wallet state');
    return (
      <Button 
        disabled
        variant="outline" 
        className="flex items-center space-x-2 border-border opacity-50"
      >
        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
        <span>Checking...</span>
      </Button>
    );
  }

  // If wallet is connecting, show connecting state with reset option
  if (isPending) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <Button 
            disabled
            variant="outline" 
            className="flex items-center space-x-2 border-primary/50 opacity-50"
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline" 
            size="sm"
            className="border-destructive/50 hover:border-destructive text-destructive"
          >
            Reset
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center max-w-60">
          If stuck, click Reset or try installing fresh MetaMask
        </div>
      </div>
    );
  }

  // Connected wallet dropdown
  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2 bg-success/10 border-success/50 hover:border-success">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">{formatAddress(address)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Etherscan
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button 
      onClick={handleConnect}
      variant="outline" 
      className="flex items-center space-x-2 border-primary/50 hover:border-primary hover:bg-primary/10"
    >
      {isError ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span>Retry Connection</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </Button>
  );
}