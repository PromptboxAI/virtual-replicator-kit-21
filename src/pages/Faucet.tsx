import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Coins, Clock, FileCode2, Droplet, Copy, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkMode } from '@/hooks/useNetworkMode';
import { useActivePromptContract } from '@/hooks/useActivePromptContract';
import { PROMPT_TOKEN_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PromptTokenDeployer } from '@/components/PromptTokenDeployer';

const FAUCET_AMOUNT = "1,000";
const COOLDOWN_SECONDS = 3600; // 1 hour

export default function Faucet() {
  const { user, signIn } = useAuth();
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { targetChainId } = useNetworkMode();
  const { address: contractAddress, isLoading: contractLoading } = useActivePromptContract();
  
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Read user's PROMPT balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: PROMPT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!contractAddress && !!address,
      refetchInterval: 10000, // Poll every 10s for balance updates
      staleTime: 5000, // Consider data stale after 5s
    }
  });

  // Read last faucet claim time
  const { data: lastClaimTime, refetch: refetchLastClaim } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: [
      {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "lastFaucetClaim",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'lastFaucetClaim',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!contractAddress && !!address,
    }
  });

  // Write contract for claiming
  const { writeContractAsync, isPending, data: txHash, error: txError } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Calculate cooldown timer
  useEffect(() => {
    if (!lastClaimTime) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const lastClaim = Number(lastClaimTime);
      const nextClaimTime = lastClaim + COOLDOWN_SECONDS;
      const remaining = Math.max(0, nextClaimTime - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastClaimTime]);

  // Show transaction errors
  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      toast.error(`Transaction failed: ${txError.message}`);
    }
  }, [txError]);

  // Show transaction confirmation status
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'tx-confirm' });
    }
  }, [isConfirming]);

  // Refetch balance when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      toast.success('Tokens claimed successfully!', { id: 'tx-confirm' });
      console.log('Transaction confirmed, refetching balance...');
      // Delay slightly to ensure chain state is updated
      setTimeout(() => {
        refetchBalance();
        refetchLastClaim();
      }, 2000);
    }
  }, [isConfirmed, txHash, refetchBalance, refetchLastClaim]);

  const handleClaim = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chain?.id !== baseSepolia.id) {
      toast.error('Please switch to Base Sepolia network');
      return;
    }

    if (timeRemaining > 0) {
      toast.error('Please wait for cooldown to end');
      return;
    }

    if (!contractAddress) {
      toast.error('Contract not deployed. Please contact admin.');
      return;
    }

    console.log('Attempting to claim from contract:', contractAddress);
    console.log('User address:', address);
    console.log('Chain:', chain);
    
    try {
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'faucet',
        account: address,
        chain
      });
      console.log('Transaction hash:', tx);
      toast.success(`Transaction submitted! Hash: ${tx.slice(0, 10)}...`);
    } catch (error: any) {
      console.error('Claim error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected');
      } else if (error.message?.includes('Faucet cooldown')) {
        toast.error('Please wait for cooldown to end');
      } else {
        toast.error(error.shortMessage || error.message || 'Failed to submit transaction');
      }
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: baseSepolia.id });
  };

  const copyAddress = () => {
    if (!contractAddress) return;
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    toast.success('Contract address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const addToMetaMask = async () => {
    if (!contractAddress) return;
    try {
      const wasAdded = await (window as any).ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contractAddress,
            symbol: 'PROMPT',
            decimals: 18,
          },
        },
      });
      if (wasAdded) {
        toast.success('PROMPT token added to MetaMask!');
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
      toast.error('Failed to add token to MetaMask');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedBalance = balance ? formatUnits(balance as bigint, 18) : '0';
  const isWrongNetwork = chain && chain.id !== baseSepolia.id;
  const canClaim = address && !isWrongNetwork && timeRemaining === 0 && !isPending && !isConfirming;

  // Loading state
  if (contractLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <AnimatedBackground />
        <main className="flex-1 container mx-auto px-4 py-8 relative z-10 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading PROMPT token contract...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No contract deployed
  if (!contractAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <AnimatedBackground />
        <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">PROMPT Token Not Deployed</div>
                <p className="text-sm">
                  The PROMPT test token contract has not been deployed to Base Sepolia yet. 
                  Please contact an administrator to deploy the contract.
                </p>
              </AlertDescription>
            </Alert>
            
            <PromptTokenDeployer />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AnimatedBackground />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            PROMPT Token Faucet
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get free testnet tokens for Base Sepolia network
          </p>
          <Badge variant="secondary" className="text-base px-4 py-2">
            Base Sepolia Testnet
          </Badge>
        </div>

        {/* Main Claim Card */}
        <Card className="max-w-2xl mx-auto mb-12 border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              Claim Test Tokens
            </CardTitle>
            <CardDescription>
              Get {FAUCET_AMOUNT} PROMPT tokens every hour
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!address ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to claim tokens
                </AlertDescription>
              </Alert>
            ) : isWrongNetwork ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Please switch to Base Sepolia network</span>
                  <Button onClick={handleSwitchNetwork} variant="outline" size="sm">
                    Switch Network
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {address && !isWrongNetwork && (
              <div className="space-y-4">
                {/* Current Balance */}
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
                  <div className="text-sm text-muted-foreground mb-1">Your Balance</div>
                  <div className="text-3xl font-bold text-primary">
                    {Number(formattedBalance).toLocaleString()} PROMPT
                  </div>
                </div>

                {/* Claim Button */}
                <Button
                  onClick={handleClaim}
                  disabled={!canClaim}
                  size="lg"
                  className="w-full h-14 text-lg"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isPending ? 'Submitting...' : 'Confirming...'}
                    </>
                  ) : timeRemaining > 0 ? (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      Next claim in {formatTime(timeRemaining)}
                    </>
                  ) : (
                    <>
                      <Droplet className="w-5 h-5 mr-2" />
                      Claim {FAUCET_AMOUNT} PROMPT
                    </>
                  )}
                </Button>

                {/* Add to MetaMask */}
                <Button
                  onClick={addToMetaMask}
                  variant="outline"
                  className="w-full"
                >
                  Add PROMPT to MetaMask (Display Tokens)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* What is PROMPT */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                What is PROMPT?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                PROMPT is the testnet token used for:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Creating AI agents</li>
                <li>Testing trading features</li>
                <li>Agent prebuy functionality</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                ⚠️ Testnet tokens have no monetary value
              </p>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-primary" />
                Contract Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Contract Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {contractAddress}
                  </code>
                  <Button
                    onClick={copyAddress}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-medium">PROMPT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decimals:</span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium">Base Sepolia</span>
                </div>
              </div>
              <Button
                onClick={() => window.open(`https://sepolia.basescan.org/address/${contractAddress}`, '_blank')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                View on Basescan
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Faucet Rules */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Faucet Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Claim Amount</span>
                  <span className="font-bold text-primary">{FAUCET_AMOUNT} PROMPT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cooldown</span>
                  <span className="font-bold">1 hour</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <Badge variant="secondary">Base Sepolia</Badge>
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Each address can claim once per hour. The smart contract enforces this limit on-chain.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to Use Section */}
        <Card className="max-w-4xl mx-auto mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">How to Use</CardTitle>
            <CardDescription>Follow these simple steps to claim your tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, text: "Connect your wallet (MetaMask, WalletConnect, etc.)" },
                { step: 2, text: "Switch to Base Sepolia network if needed" },
                { step: 3, text: "Click 'Claim 1,000 PROMPT' button to receive tokens" },
                { step: 4, text: "Confirm the transaction in your wallet" },
                { step: 5, text: "Wait ~10 seconds for confirmation - tokens are now in your wallet" },
                { step: 6, text: "Click 'Add PROMPT to MetaMask' to display them in your token list" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-muted-foreground pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="max-w-4xl mx-auto border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Why do I need PROMPT tokens?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  PROMPT tokens are used to create and test AI agents on our platform. They allow you to participate in the testnet economy and explore all features without using real funds.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I add PROMPT to MetaMask?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  After claiming tokens, click the "Add PROMPT to MetaMask" button to make them visible in your MetaMask token list. This doesn't send tokens - it just tells MetaMask to display the tokens you already own. You can also manually add using contract address: {contractAddress}, symbol "PROMPT", and decimals "18".
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What can I do with these tokens?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Use PROMPT tokens to create AI agents, test trading features, and participate in the testnet economy. You can also use them for agent prebuy during token creation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How long does claiming take?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  After clicking claim and confirming in your wallet, the transaction typically completes within 10-15 seconds on Base Sepolia. Your balance will update automatically.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What if the faucet is empty?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The faucet contract has sufficient tokens for testing. If you encounter issues, please reach out to our support team at <a href="mailto:kevin@promptbox.com" className="text-primary hover:underline">kevin@promptbox.com</a> or check our Discord community for assistance.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Need Testnet ETH Banner */}
        <Alert className="max-w-4xl mx-auto mt-8 border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>Need testnet ETH for gas fees?</span>
            <Button
              onClick={() => window.open('https://www.alchemy.com/faucets/base-sepolia', '_blank')}
              variant="outline"
              size="sm"
            >
              Get Base Sepolia ETH
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      </main>

      <Footer />
    </div>
  );
}
