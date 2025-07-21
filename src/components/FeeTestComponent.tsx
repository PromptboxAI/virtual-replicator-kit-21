import React, { useEffect } from 'react';
import { useAgentToken } from '@/hooks/useAgentTokens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeeTestComponentProps {
  agentId: string;
  tokenAddress?: string;
}

export const FeeTestComponent: React.FC<FeeTestComponentProps> = ({ 
  agentId, 
  tokenAddress 
}) => {
  const { 
    feeConfig, 
    calculateTransactionFees, 
    prepareTransactionAmounts 
  } = useAgentToken(tokenAddress, agentId);

  // Test the fee calculation functions
  useEffect(() => {
    console.log('🧪 Testing Fee Functions:');
    console.log('Fee Config:', feeConfig);

    // Test calculateTransactionFees with $10,000
    const testAmount = 10000;
    const fees = calculateTransactionFees(testAmount);
    console.log(`Fee calculation for $${testAmount}:`, fees);

    // Test prepareTransactionAmounts for buy
    const buyAmounts = prepareTransactionAmounts(testAmount, true);
    console.log('Buy transaction preparation:', buyAmounts);

    // Test prepareTransactionAmounts for sell
    const sellAmounts = prepareTransactionAmounts(testAmount, false);
    console.log('Sell transaction preparation:', sellAmounts);

    // Verify fee breakdown matches expected values
    const expectedFeeAmount = testAmount * feeConfig.feePercent;
    const expectedCreatorAmount = expectedFeeAmount * feeConfig.creatorSplit;
    const expectedPlatformAmount = expectedFeeAmount * feeConfig.platformSplit;
    const expectedNetAmount = testAmount - expectedFeeAmount;

    console.log('✅ Verification:');
    console.log('Fee amount matches:', fees.feeAmount === expectedFeeAmount);
    console.log('Creator amount matches:', fees.creatorAmount === expectedCreatorAmount);
    console.log('Platform amount matches:', fees.platformAmount === expectedPlatformAmount);
    console.log('Net amount matches:', fees.netAmount === expectedNetAmount);
    console.log('Split percentages add up to 100%:', 
      Math.abs((feeConfig.creatorSplit + feeConfig.platformSplit) - 1) < 0.001);
  }, [feeConfig, calculateTransactionFees, prepareTransactionAmounts]);

  const testAmount = 10000;
  const fees = calculateTransactionFees(testAmount);
  const buyAmounts = prepareTransactionAmounts(testAmount, true);
  const sellAmounts = prepareTransactionAmounts(testAmount, false);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Fee Function Testing
          <Badge variant="outline">Agent: {agentId.slice(0, 8)}...</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee Configuration */}
        <div className="space-y-2">
          <h3 className="font-semibold">Fee Configuration</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fee Percent:</span>
              <div className="font-mono">{(feeConfig.feePercent * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Creator Split:</span>
              <div className="font-mono">{(feeConfig.creatorSplit * 100)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Split:</span>
              <div className="font-mono">{(feeConfig.platformSplit * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Fee Calculation Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">calculateTransactionFees($10,000)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fee Amount:</span>
              <div className="font-mono text-red-600">${fees.feeAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Amount:</span>
              <div className="font-mono text-green-600">${fees.netAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Creator Gets:</span>
              <div className="font-mono text-blue-600">${fees.creatorAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Gets:</span>
              <div className="font-mono text-purple-600">${fees.platformAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Buy Transaction Preparation */}
        <div className="space-y-2">
          <h3 className="font-semibold">prepareTransactionAmounts (Buy)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Amount:</span>
              <div className="font-mono">${buyAmounts.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Trade Amount:</span>
              <div className="font-mono">${buyAmounts.netTradeAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Display Amount:</span>
              <div className="font-mono">${buyAmounts.displayAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Fee Amount:</span>
              <div className="font-mono text-red-600">${buyAmounts.fees.feeAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Sell Transaction Preparation */}
        <div className="space-y-2">
          <h3 className="font-semibold">prepareTransactionAmounts (Sell)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Amount:</span>
              <div className="font-mono">${sellAmounts.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Receive Amount:</span>
              <div className="font-mono">${sellAmounts.netReceiveAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Display Amount:</span>
              <div className="font-mono">${sellAmounts.displayAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Fee Amount:</span>
              <div className="font-mono text-red-600">${sellAmounts.fees.feeAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Validation Status</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Fee calculations working:</span>
              <Badge variant="default" className="text-xs">
                ✅ {fees.feeAmount === testAmount * feeConfig.feePercent ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Split percentages valid:</span>
              <Badge variant="default" className="text-xs">
                ✅ {Math.abs((feeConfig.creatorSplit + feeConfig.platformSplit) - 1) < 0.001 ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Transaction prep working:</span>
              <Badge variant="default" className="text-xs">
                ✅ {buyAmounts.totalAmount === testAmount && sellAmounts.totalAmount === testAmount ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};