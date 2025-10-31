import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TestSepoliaToken() {
  // Hardcoded PROMPT token address (replace with actual deployed address)
  const PROMPT_TOKEN_ADDRESS = '0x3ecfc3181fa4054f1cad103973a50cf7c998eec0';
  
  const { address, promptBalance, isLoading } = usePrivyWallet();
  const { toast } = useToast();
  const [currentPrice, setCurrentPrice] = useState('0.0000075');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [txParams, setTxParams] = useState<any>(null);
  const [estimatedImpact, setEstimatedImpact] = useState<any>(null);
  const [agentId, setAgentId] = useState<string>('');
  const [buildingTx, setBuildingTx] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Fetch agent ID and price from deployed contract
  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from('deployed_contracts')
        .select('agent_id')
        .eq('contract_address', PROMPT_TOKEN_ADDRESS)
        .eq('is_active', true)
        .maybeSingle();
      
      if (contractError) {
        console.error('Database error fetching contract:', contractError);
        toast({
          title: 'Database Error',
          description: contractError.message,
          variant: 'destructive'
        });
        return;
      }

      if (!contractData) {
        console.log('Contract not found in database:', PROMPT_TOKEN_ADDRESS);
        toast({
          title: 'Contract Not Found',
          description: 'This contract address is not registered in the database. Deploy a token first.',
          variant: 'destructive'
        });
        return;
      }

      if (contractData.agent_id) {
        setAgentId(contractData.agent_id);
        console.log('Found agent ID:', contractData.agent_id);
        
        // Fetch agent price
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('current_price')
          .eq('id', contractData.agent_id)
          .maybeSingle();
        
        if (agentError) {
          console.error('Error fetching agent price:', agentError);
        } else if (agent) {
          setCurrentPrice(agent.current_price?.toString() || '0.0000075');
        }
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contract data',
        variant: 'destructive'
      });
    }
  };

  const handleBuildTransaction = async () => {
    if (!address) {
      toast({
        title: 'Wallet Required',
        description: 'Connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Enter a valid trade amount',
        variant: 'destructive'
      });
      return;
    }

    if (!agentId) {
      toast({
        title: 'Agent Not Found',
        description: 'Could not find agent for this token',
        variant: 'destructive'
      });
      return;
    }

    setBuildingTx(true);
    try {
      // Call build-trade-tx edge function
      const { data, error } = await supabase.functions.invoke('build-trade-tx', {
        body: {
          agentId,
          tradeType,
          amount: parseFloat(tradeAmount),
          userAddress: address
        }
      });

      if (error) throw error;
      
      setTxParams(data.transaction);
      console.log('✅ Transaction built:', data);
      
      toast({
        title: 'Transaction Built',
        description: 'Transaction parameters ready for signing',
      });
    } catch (error: any) {
      console.error('❌ Failed to build transaction:', error);
      toast({
        title: 'Build Failed',
        description: error.message || 'Failed to build transaction',
        variant: 'destructive'
      });
    } finally {
      setBuildingTx(false);
    }
  };

  const handleSimulatePriceImpact = async () => {
    if (!tradeAmount || !agentId) return;
    
    setSimulating(true);
    try {
      const { data, error } = await supabase.rpc('simulate_price_impact', {
        p_agent_id: agentId,
        p_prompt_amount: parseFloat(tradeAmount),
        p_trade_type: tradeType
      });

      if (error) throw error;
      setEstimatedImpact(data?.[0]);
      
      toast({
        title: 'Impact Calculated',
        description: `Price impact: ${data?.[0]?.price_impact_percent?.toFixed(2)}%`,
      });
    } catch (error: any) {
      console.error('Failed to simulate impact:', error);
      toast({
        title: 'Simulation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sepolia PROMPT Token Test</span>
              <Badge variant="outline">Base Sepolia</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Contract:</strong> <code className="bg-muted px-2 py-1 rounded">{PROMPT_TOKEN_ADDRESS}</code></p>
              <p><strong>Network:</strong> Base Sepolia (84532)</p>
              <p><strong>Purpose:</strong> Validate Day 4 transaction building</p>
              {agentId && <p><strong>Agent ID:</strong> <code className="bg-muted px-2 py-1 rounded">{agentId}</code></p>}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Status */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Address:</strong> {address ? <code className="bg-muted px-2 py-1 rounded text-xs">{address}</code> : 'Not connected'}</p>
            <p><strong>Balance:</strong> {isLoading ? 'Loading...' : `${promptBalance} PROMPT`}</p>
            <p><strong>Current Price:</strong> ${currentPrice}</p>
          </CardContent>
        </Card>

        {/* Trade Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Build Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={tradeType === 'buy' ? 'default' : 'outline'}
                onClick={() => setTradeType('buy')}
              >
                Buy
              </Button>
              <Button
                variant={tradeType === 'sell' ? 'default' : 'outline'}
                onClick={() => setTradeType('sell')}
              >
                Sell
              </Button>
            </div>

            <Input
              type="number"
              placeholder="Amount (PROMPT)"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
            />

            <div className="flex gap-2">
              <Button 
                onClick={handleSimulatePriceImpact}
                disabled={simulating || !tradeAmount}
                variant="outline"
              >
                {simulating ? 'Simulating...' : 'Simulate Impact'}
              </Button>
              <Button 
                onClick={handleBuildTransaction} 
                disabled={buildingTx || !tradeAmount}
              >
                {buildingTx ? 'Building...' : 'Build TX Params'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Impact Display */}
        {estimatedImpact && (
          <Card>
            <CardHeader>
              <CardTitle>Price Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Current Price:</strong> ${estimatedImpact.current_price}</p>
              <p><strong>Impact Price:</strong> ${estimatedImpact.impact_price}</p>
              <p><strong>Impact %:</strong> {estimatedImpact.price_impact_percent?.toFixed(4)}%</p>
              <p><strong>Estimated Tokens:</strong> {estimatedImpact.estimated_tokens?.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}

        {/* Transaction Params Display */}
        {txParams && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Parameters (Ready for Wallet)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded font-mono text-xs space-y-1 overflow-x-auto">
                <p><strong>to:</strong> {txParams.to}</p>
                <p><strong>data:</strong> {txParams.data?.slice(0, 66)}...</p>
                <p><strong>value:</strong> {txParams.value}</p>
                <p><strong>gasLimit:</strong> {txParams.gasLimit}</p>
                <p><strong>from:</strong> {txParams.from}</p>
              </div>
              <Button className="w-full" disabled>
                Send Transaction (Integration Pending)
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Transaction builder validated ✅ Next: Wire to wagmi sendTransaction
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
