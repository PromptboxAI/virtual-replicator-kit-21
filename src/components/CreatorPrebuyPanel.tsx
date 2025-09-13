import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { formatEther, parseEther } from 'viem';
import { useSmartContractCreation } from '@/hooks/useSmartContractCreation';
import { FACTORY_ADDRESS } from '@/lib/contracts';

interface CreatorPrebuyPanelProps {
  requiredAmount: number;
  onApprovalComplete: () => void;
}

export const CreatorPrebuyPanel = ({ requiredAmount, onApprovalComplete }: CreatorPrebuyPanelProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'insufficient'>('pending');
  
  const { 
    isConnected, 
    promptBalance, 
    allowance, 
    approvePrompt 
  } = useSmartContractCreation();

  const currentAllowance = parseFloat(allowance || '0');
  const currentBalance = parseFloat(promptBalance || '0');
  const isApproved = currentAllowance >= requiredAmount;
  const hasSufficientBalance = currentBalance >= requiredAmount;

  useEffect(() => {
    if (!hasSufficientBalance) {
      setApprovalStatus('insufficient');
    } else if (isApproved) {
      setApprovalStatus('approved');
      onApprovalComplete();
    } else {
      setApprovalStatus('pending');
    }
  }, [isApproved, hasSufficientBalance, onApprovalComplete]);

  const handleApprove = async () => {
    if (!isConnected || !FACTORY_ADDRESS) {
      return;
    }

    setIsApproving(true);
    try {
      await approvePrompt(
        FACTORY_ADDRESS as `0x${string}`, 
        parseEther(requiredAmount.toString())
      );
      // Status will be updated by the useEffect when allowance changes
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection Required</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to proceed with atomic deployment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PROMPT Token Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Balance Check */}
          <div className="flex justify-between">
            <span>Your PROMPT Balance:</span>
            <span className={currentBalance < requiredAmount ? 'text-destructive' : 'text-foreground'}>
              {parseFloat(promptBalance || '0').toLocaleString()} PROMPT
            </span>
          </div>

          {/* Current Allowance Display */}
          <div className="flex justify-between">
            <span>Current Allowance:</span>
            <span>{currentAllowance.toLocaleString()} PROMPT</span>
          </div>

          {/* Required Amount */}
          <div className="flex justify-between">
            <span>Required:</span>
            <span className="font-medium">{requiredAmount} PROMPT</span>
          </div>

          {/* Insufficient Balance Warning */}
          {!hasSufficientBalance && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                Insufficient PROMPT balance. You need {requiredAmount} PROMPT but only have {currentBalance.toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Button */}
          {hasSufficientBalance && !isApproved && (
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve PROMPT Spending'
              )}
            </Button>
          )}

          {/* Success Status */}
          {isApproved && hasSufficientBalance && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Ready for atomic deployment
                <Badge className="ml-2 bg-green-100 text-green-800">
                  Max MEV Protection
                </Badge>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};