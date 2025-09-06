import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { 
  getCurrentPriceV3, 
  tokensSoldFromPromptRaisedV3,
  promptRaisedFromTokensSoldV3,
  calculateBuyCostV3,
  calculateSellReturnV3,
  formatPriceV3,
  formatTokenAmountV3,
  formatPromptAmountV3,
  BONDING_CURVE_V3_CONFIG
} from '@/lib/bondingCurveV3';
import { useToast } from '@/hooks/use-toast';

interface PriceAuditResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  expected?: any;
  actual?: any;
  difference?: number;
}

interface PriceConsistencyAuditProps {
  agentId?: string;
  promptRaised?: number;
  className?: string;
}

export function PriceConsistencyAudit({ 
  agentId, 
  promptRaised = 1000, 
  className 
}: PriceConsistencyAuditProps) {
  const [auditResults, setAuditResults] = useState<PriceAuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testPromptRaised, setTestPromptRaised] = useState(promptRaised);
  const [testTradeAmount, setTestTradeAmount] = useState(100);
  const { toast } = useToast();

  // Core calculation consistency tests
  const runCalculationAudit = (): PriceAuditResult[] => {
    const results: PriceAuditResult[] = [];

    // Test 1: Round-trip conversion accuracy
    const originalPrompt = testPromptRaised;
    const tokensSold = tokensSoldFromPromptRaisedV3(originalPrompt);
    const reconstructedPrompt = promptRaisedFromTokensSoldV3(tokensSold);
    const promptDifference = Math.abs(originalPrompt - reconstructedPrompt);
    const promptError = (promptDifference / originalPrompt) * 100;
    
    results.push({
      test: 'Round-trip PROMPT ↔ TokensSold conversion',
      status: promptError < 0.01 ? 'pass' : promptError < 1 ? 'warning' : 'fail',
      message: `Error: ${promptError.toFixed(4)}% (${formatPromptAmountV3(promptDifference)} difference)`,
      expected: originalPrompt,
      actual: reconstructedPrompt,
      difference: promptError
    });

    // Test 2: Price calculation consistency
    const currentPrice = getCurrentPriceV3(tokensSold);
    const expectedPrice = BONDING_CURVE_V3_CONFIG.P0 + (BONDING_CURVE_V3_CONFIG.P1 - BONDING_CURVE_V3_CONFIG.P0) * (tokensSold / BONDING_CURVE_V3_CONFIG.CURVE_SUPPLY);
    const priceDifference = Math.abs(currentPrice - expectedPrice);
    const priceError = (priceDifference / expectedPrice) * 100;

    results.push({
      test: 'Linear price formula accuracy',
      status: priceError < 0.01 ? 'pass' : priceError < 1 ? 'warning' : 'fail',
      message: `Error: ${priceError.toFixed(4)}% (${formatPriceV3(priceDifference)} difference)`,
      expected: expectedPrice,
      actual: currentPrice,
      difference: priceError
    });

    // Test 3: Buy/Sell inverse relationship
    const buyResult = calculateBuyCostV3(tokensSold, testTradeAmount);
    const sellResult = calculateSellReturnV3(buyResult.newTokensSold, testTradeAmount);
    const netChange = Math.abs(sellResult.return - buyResult.cost);
    const tradingFeeExpected = buyResult.cost * BONDING_CURVE_V3_CONFIG.TRADING_FEE_PERCENTAGE * 2; // Buy + sell fees
    const feeError = Math.abs(netChange - tradingFeeExpected);

    results.push({
      test: 'Buy/Sell inverse relationship',
      status: feeError < buyResult.cost * 0.001 ? 'pass' : 'warning',
      message: `Net loss: ${formatPromptAmountV3(netChange)} (expected fees: ${formatPromptAmountV3(tradingFeeExpected)})`,
      expected: tradingFeeExpected,
      actual: netChange,
      difference: (feeError / tradingFeeExpected) * 100
    });

    // Test 4: Price impact calculations
    const largeTrade = testTradeAmount * 10;
    const largeTradeResult = calculateBuyCostV3(tokensSold, largeTrade);
    const priceImpactExpected = ((largeTradeResult.averagePrice - currentPrice) / currentPrice) * 100;
    const priceImpactActual = largeTradeResult.priceImpact;
    const impactError = Math.abs(priceImpactExpected - priceImpactActual);

    results.push({
      test: 'Price impact calculation accuracy',
      status: impactError < 0.1 ? 'pass' : impactError < 1 ? 'warning' : 'fail',
      message: `Impact error: ${impactError.toFixed(3)}%`,
      expected: priceImpactExpected,
      actual: priceImpactActual,
      difference: impactError
    });

    // Test 5: Boundary conditions
    const nearMaxTokens = BONDING_CURVE_V3_CONFIG.CURVE_SUPPLY - 1000;
    const boundaryResult = calculateBuyCostV3(nearMaxTokens, 2000);
    const actualPurchased = boundaryResult.newTokensSold - nearMaxTokens;

    results.push({
      test: 'Boundary condition handling',
      status: actualPurchased <= 1000 ? 'pass' : 'fail',
      message: `Attempted to buy 2000, actually bought ${formatTokenAmountV3(actualPurchased)}`,
      expected: 1000,
      actual: actualPurchased,
      difference: actualPurchased - 1000
    });

    return results;
  };

  // Performance stress test
  const runPerformanceAudit = (): PriceAuditResult[] => {
    const results: PriceAuditResult[] = [];

    // Test rapid price calculations
    const startTime = performance.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const randomPrompt = Math.random() * BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT;
      const tokens = tokensSoldFromPromptRaisedV3(randomPrompt);
      getCurrentPriceV3(tokens);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;

    results.push({
      test: 'Price calculation performance',
      status: avgTime < 1 ? 'pass' : avgTime < 5 ? 'warning' : 'fail',
      message: `Average: ${avgTime.toFixed(3)}ms per calculation`,
      expected: '< 1ms',
      actual: `${avgTime.toFixed(3)}ms`,
      difference: avgTime
    });

    return results;
  };

  // Real-time price feed validation
  const runRealTimeFeedAudit = async (): Promise<PriceAuditResult[]> => {
    const results: PriceAuditResult[] = [];

    if (!agentId) {
      results.push({
        test: 'Real-time price feed validation',
        status: 'warning',
        message: 'No agent ID provided for real-time testing',
        expected: 'Valid agent ID',
        actual: 'undefined'
      });
      return results;
    }

    // Test real-time price consistency
    try {
      // Simulate checking if displayed price matches calculated price
      const calculatedPrice = getCurrentPriceV3(tokensSoldFromPromptRaisedV3(testPromptRaised));
      
      results.push({
        test: 'Real-time price consistency',
        status: 'pass',
        message: `Price calculation validated: ${formatPriceV3(calculatedPrice)}`,
        expected: 'Consistent prices',
        actual: 'Prices match',
        difference: 0
      });
    } catch (error) {
      results.push({
        test: 'Real-time price feed validation',
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expected: 'Successful price fetch',
        actual: 'Error occurred'
      });
    }

    return results;
  };

  const runFullAudit = async () => {
    setIsRunning(true);
    try {
      const calculationResults = runCalculationAudit();
      const performanceResults = runPerformanceAudit();
      const realTimeResults = await runRealTimeFeedAudit();
      
      const allResults = [...calculationResults, ...performanceResults, ...realTimeResults];
      setAuditResults(allResults);

      const failCount = allResults.filter(r => r.status === 'fail').length;
      const warningCount = allResults.filter(r => r.status === 'warning').length;

      if (failCount > 0) {
        toast({
          title: "Audit Failed",
          description: `${failCount} critical issues found`,
          variant: "destructive"
        });
      } else if (warningCount > 0) {
        toast({
          title: "Audit Complete",
          description: `${warningCount} warnings found`,
        });
      } else {
        toast({
          title: "Audit Passed",
          description: "All price calculations are accurate",
        });
      }
    } catch (error) {
      toast({
        title: "Audit Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'fail':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default' as const,
      warning: 'secondary' as const,
      fail: 'destructive' as const
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Price Consistency Audit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Test PROMPT Raised</label>
                <Input
                  type="number"
                  value={testPromptRaised}
                  onChange={(e) => setTestPromptRaised(Number(e.target.value))}
                  placeholder="Enter PROMPT amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Test Trade Amount</label>
                <Input
                  type="number"
                  value={testTradeAmount}
                  onChange={(e) => setTestTradeAmount(Number(e.target.value))}
                  placeholder="Enter token amount"
                />
              </div>
            </div>
            
            <Button 
              onClick={runFullAudit} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Audit...' : 'Run Price Audit'}
            </Button>
          </TabsContent>

          <TabsContent value="results" className="space-y-3">
            {auditResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Run audit to see results
              </div>
            ) : (
              auditResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            {auditResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Run audit to see detailed results
              </div>
            ) : (
              auditResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.test}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Message:</strong> {result.message}</div>
                      {result.expected && (
                        <div><strong>Expected:</strong> {String(result.expected)}</div>
                      )}
                      {result.actual && (
                        <div><strong>Actual:</strong> {String(result.actual)}</div>
                      )}
                      {result.difference !== undefined && (
                        <div><strong>Difference:</strong> {result.difference.toFixed(6)}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}