import React, { useEffect } from 'react';
import { useAgentTokens } from '@/hooks/useAgentTokens';
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
    calculateFees 
  } = useAgentTokens(tokenAddress);

  // Test the fee calculation functions
  useEffect(() => {
    console.log('🧪 Testing Fee Functions:');
    console.log('Fee Config:', feeConfig);

    // Test calculateFees with $10,000
    const testAmount = 10000;
    const fees = calculateFees(testAmount);
    console.log(`Fee calculation for $${testAmount}:`, fees);

    // Verify fee breakdown matches expected values
    const expectedTotalFees = testAmount * feeConfig.feePercent;
    const expectedCreatorFee = expectedTotalFees * feeConfig.creatorSplit;
    const expectedPlatformFee = expectedTotalFees * feeConfig.platformSplit;
    const expectedNetAmount = testAmount - expectedTotalFees;

    console.log('✅ Verification:');
    console.log('Fee amount matches:', fees.totalFees === expectedTotalFees);
    console.log('Creator amount matches:', fees.creatorFee === expectedCreatorFee);
    console.log('Platform amount matches:', fees.platformFee === expectedPlatformFee);
    console.log('Net amount matches:', fees.netAmount === expectedNetAmount);
    console.log('Split percentages add up to 100%:', 
      Math.abs((feeConfig.creatorSplit + feeConfig.platformSplit) - 1) < 0.001);
  }, [feeConfig, calculateFees]);

  const testAmount = 10000;
  const fees = calculateFees(testAmount);

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
              <div className="font-mono text-red-600">${fees.totalFees.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Amount:</span>
              <div className="font-mono text-green-600">${fees.netAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Creator Gets:</span>
              <div className="font-mono text-blue-600">${fees.creatorFee.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Gets:</span>
              <div className="font-mono text-purple-600">${fees.platformFee.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Display */}
        <div className="space-y-2">
          <h3 className="font-semibold">Fee Breakdown</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Fees:</span>
              <div className="font-mono text-red-600">${fees.totalFees.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Creator Share:</span>
              <div className="font-mono text-blue-600">${fees.creatorFee.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Share:</span>
              <div className="font-mono text-purple-600">${fees.platformFee.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Amount:</span>
              <div className="font-mono text-green-600">${fees.netAmount.toFixed(2)}</div>
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
                ✅ {fees.totalFees === testAmount * feeConfig.feePercent ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Split percentages valid:</span>
              <Badge variant="default" className="text-xs">
                ✅ {Math.abs((feeConfig.creatorSplit + feeConfig.platformSplit) - 1) < 0.001 ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Fee validation working:</span>
              <Badge variant="default" className="text-xs">
                ✅ {fees.netAmount + fees.totalFees === testAmount ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};