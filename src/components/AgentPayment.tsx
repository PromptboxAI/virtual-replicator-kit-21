import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useTreasuryConfig } from '@/hooks/useTreasuryConfig';
import { useToast } from '@/hooks/use-toast';

interface AgentPaymentProps {
  agentName: string;
  cost: string;
  agentId?: string;
  onPaymentSuccess: () => void;
  onCancel?: () => void;
}

export function AgentPayment({ agentName, cost, agentId, onPaymentSuccess, onCancel }: AgentPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { 
    isConnected, 
    promptBalance, 
    payForAgentCreation, 
    isEmbeddedWallet,
    address 
  } = usePrivyWallet();
  
  const { toast } = useToast();
  const { treasuryAddress, loading: treasuryLoading } = useTreasuryConfig();
  
  const costNumber = parseFloat(cost);
  const balanceNumber = parseFloat(promptBalance);
  const hasSufficientBalance = balanceNumber >= costNumber;

  const handlePayment = async () => {
    if (!isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an agent.",
        variant: "destructive"
      });
      return;
    }

    if (!hasSufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${cost} $PROMPT tokens but only have ${promptBalance}.`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const success = await payForAgentCreation(cost, treasuryAddress, agentId);
      
      if (success) {
        toast({
          title: "Payment Successful! 🎉",
          description: `Successfully paid ${cost} $PROMPT tokens for ${agentName}`,
        });
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">Wallet Required</h3>
              <p className="text-sm text-muted-foreground">
                Please sign in to create an agent and access your wallet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Agent Creation Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Agent Name:</span>
            <span>{agentName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Creation Cost:</span>
            <Badge variant="outline" className="font-mono">
              {cost} $PROMPT
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              {cost} $PROMPT
            </span>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="font-medium">Payment Wallet</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Type:</span>
              <Badge variant={isEmbeddedWallet ? "default" : "secondary"}>
                {isEmbeddedWallet ? "Embedded" : "Connected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Address:</span>
              <span className="font-mono text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>$PROMPT Balance:</span>
              <span className={`font-mono ${hasSufficientBalance ? 'text-green-600' : 'text-red-600'}`}>
                {promptBalance}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {!hasSufficientBalance && (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Insufficient Balance</h4>
                <p className="text-sm text-yellow-700">
                  You need {cost} $PROMPT tokens but only have {promptBalance}. 
                  Please add more tokens to your wallet to proceed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handlePayment}
            disabled={!hasSufficientBalance || isProcessing || treasuryLoading || !treasuryAddress}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Pay {cost} $PROMPT
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Payment Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            Payment will be processed using your {isEmbeddedWallet ? 'embedded' : 'connected'} wallet. 
            This transaction creates your autonomous agent and grants you ownership tokens.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}