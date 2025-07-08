import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, ExternalLink, AlertCircle } from "lucide-react";
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
import { useEffect } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, error, isError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

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
      
      // Check if wallet is installed
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another web3 wallet to continue.",
          variant: "destructive",
        });
        return;
      }

      await connect({ connector: injected() });
      console.log('Wallet connection initiated');
    } catch (err) {
      console.error('Connection error:', err);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please check your wallet and try again.",
        variant: "destructive",
      });
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
      disabled={isPending}
      variant="outline" 
      className="flex items-center space-x-2 border-primary/50 hover:border-primary hover:bg-primary/10 disabled:opacity-50"
    >
      {isPending ? (
        <>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </>
      ) : isError ? (
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