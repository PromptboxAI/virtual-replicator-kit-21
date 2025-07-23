
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DebugPanelProps {
  agentId: string;
}

interface AgentDebugData {
  id: string;
  name: string;
  symbol: string;
  prompt_raised: number;
  current_price: number;
  market_cap: number;
  token_graduated: boolean;
  is_active: boolean;
  test_mode: boolean;
}

export const TradingDebugPanel = ({ agentId }: DebugPanelProps) => {
  const { user, authenticated } = useAuth();
  const { balance, loading: balanceLoading } = useTokenBalance(user?.id);
  const { toast } = useToast();
  
  const [agentData, setAgentData] = useState<AgentDebugData | null>(null);
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<'checking' | 'available' | 'error'>('checking');
  const [lastTradeAttempt, setLastTradeAttempt] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAgentData = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, symbol, prompt_raised, current_price, market_cap, token_graduated, is_active, test_mode')
        .eq('id', agentId)
        .single();
      
      if (error) throw error;
      setAgentData(data);
    } catch (error) {
      console.error('Debug: Failed to fetch agent data:', error);
    }
  };

  const testEdgeFunction = async () => {
    setEdgeFunctionStatus('checking');
    try {
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: { test: true }
      });
      
      if (error) {
        console.error('🚨 Edge function test failed:', error);
        setEdgeFunctionStatus('error');
      } else {
        console.log('✅ Edge function test successful:', data);
        setEdgeFunctionStatus('available');
      }
    } catch (error) {
      console.error('🚨 Edge function not available:', error);
      setEdgeFunctionStatus('error');
    }
  };

  const copyWalletAddress = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast({ title: "Wallet address copied!", duration: 2000 });
    }
  };

  const runSQLTest = async () => {
    if (!user?.id) return;
    
    console.log('🧪 Running SQL test for user:', user.id);
    try {
      const { data, error } = await supabase.rpc('execute_bonding_curve_trade', {
        p_agent_id: agentId,
        p_user_id: user.id,
        p_prompt_amount: 1,
        p_trade_type: 'buy',
        p_token_amount: 0,
        p_expected_price: agentData?.current_price || 30,
        p_slippage: 0.5
      });
      
      console.log('🧪 SQL Test Result:', { data, error });
      setLastTradeAttempt({ data, error, timestamp: new Date() });
      
      if (error) {
        toast({
          title: "SQL Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "SQL Test Successful",
          description: "Database function is working correctly"
        });
      }
    } catch (error) {
      console.error('🧪 SQL Test Error:', error);
      setLastTradeAttempt({ error, timestamp: new Date() });
    }
  };

  useEffect(() => {
    fetchAgentData();
    testEdgeFunction();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAgentData();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [agentId, autoRefresh]);

  if (!authenticated) {
    return (
      <Card className="mt-4 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <p className="text-yellow-800">Debug Panel: User not authenticated</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-yellow-800">🔧 Trading Debug Panel</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-100' : 'bg-gray-100'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAgentData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-800">👤 User Info</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span>Wallet:</span>
                <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                  {user?.id?.slice(0, 20)}...
                </code>
                <Button variant="ghost" size="sm" onClick={copyWalletAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div>Balance: {balanceLoading ? '...' : `${balance?.toFixed(2) || 0} PROMPT`}</div>
              <div>Authenticated: {authenticated ? '✅' : '❌'}</div>
            </div>
          </div>

          {/* Agent Info */}
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-800">🤖 Agent Info</h4>
            {agentData ? (
              <div className="text-sm space-y-1">
                <div>Name: {agentData.name}</div>
                <div>Symbol: {agentData.symbol}</div>
                <div>PROMPT Raised: {agentData.prompt_raised}</div>
                <div>Price: ${agentData.current_price}</div>
                <div>Active: {agentData.is_active ? '✅' : '❌'}</div>
                <div>Test Mode: {agentData.test_mode ? '✅' : '❌'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading agent data...</div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-yellow-800">⚙️ System Status</h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>Edge Function:</span>
              {edgeFunctionStatus === 'checking' && <Badge variant="secondary">Checking...</Badge>}
              {edgeFunctionStatus === 'available' && <Badge className="bg-green-100 text-green-800">✅ Available</Badge>}
              {edgeFunctionStatus === 'error' && <Badge variant="destructive">❌ Error</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={testEdgeFunction}>
              Test Function
            </Button>
            <Button variant="outline" size="sm" onClick={runSQLTest}>
              Test SQL
            </Button>
          </div>
        </div>

        {/* Last Trade Attempt */}
        {lastTradeAttempt && (
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-800">📊 Last Test Result</h4>
            <div className="bg-yellow-100 p-3 rounded text-xs">
              <div>Time: {lastTradeAttempt.timestamp?.toLocaleTimeString()}</div>
              {lastTradeAttempt.error ? (
                <div className="text-red-600">Error: {lastTradeAttempt.error.message}</div>
              ) : (
                <div className="text-green-600">Success: {JSON.stringify(lastTradeAttempt.data)}</div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-yellow-800">🚀 Quick Actions</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>1. Copy your wallet address above</div>
            <div>2. Run the SQL scripts in the sql-debug folder</div>
            <div>3. Replace YOUR_WALLET_ADDRESS with your copied address</div>
            <div>4. Check console for detailed logs during trades</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
