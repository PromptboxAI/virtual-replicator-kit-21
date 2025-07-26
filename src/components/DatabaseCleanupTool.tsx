import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function DatabaseCleanupTool() {
  const [agentId, setAgentId] = useState('30d130d1-7da2-4174-a577-bbb5a57f9125');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const performCompleteCleanup = async () => {
    if (!agentId.trim()) {
      toast.error('Please enter an agent ID');
      return;
    }

    setLoading(true);
    try {
      console.log('🧹 Starting complete cleanup for agent:', agentId);

      // Step 1: Clear agent references first
      const { error: agentError } = await supabase
        .from('agents')
        .update({ 
          graduation_event_id: null,
          token_address: null,
          token_graduated: false,
          status: 'PENDING',
          prompt_raised: 7003
        })
        .eq('id', agentId);
      
      if (agentError) throw agentError;

      // Step 2: Get graduation event IDs before deleting
      const { data: graduationEvents, error: getEventsError } = await supabase
        .from('agent_graduation_events')
        .select('id')
        .eq('agent_id', agentId);
      
      if (getEventsError) throw getEventsError;

      const eventIds = graduationEvents?.map(e => e.id) || [];

      // Step 3: Delete graduation transaction logs
      if (eventIds.length > 0) {
        const { error: logsError } = await supabase
          .from('graduation_transaction_logs')
          .delete()
          .in('graduation_event_id', eventIds);
        
        if (logsError) {
          console.warn('Could not clean graduation logs:', logsError);
        }
      }

      // Step 4: Delete graduation events
      const { error: eventsError } = await supabase
        .from('agent_graduation_events')
        .delete()
        .eq('agent_id', agentId);
      
      if (eventsError) {
        console.warn('Could not clean graduation events:', eventsError);
      }

      // Step 5: Mark deployed contracts as inactive
      const { error: contractsError } = await supabase
        .from('deployed_contracts')
        .update({ is_active: false })
        .eq('agent_id', agentId);
      
      if (contractsError) {
        console.warn('Could not update deployed contracts:', contractsError);
      }

      // Step 6: Clean revenue events (optional)
      const { error: revenueError } = await supabase
        .from('revenue_events')
        .delete()
        .eq('agent_id', agentId);
      
      if (revenueError) {
        console.warn('Could not clean revenue events:', revenueError);
      }

      // Step 7: Verification - Get final state
      const { data: finalAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      const { data: remainingEvents } = await supabase
        .from('agent_graduation_events')
        .select('count')
        .eq('agent_id', agentId);

      const { data: activeContracts } = await supabase
        .from('deployed_contracts')
        .select('count')
        .eq('agent_id', agentId)
        .eq('is_active', true);

      const cleanupResults = {
        agentState: finalAgent,
        graduationEventsRemaining: remainingEvents?.length || 0,
        activeContractsRemaining: activeContracts?.length || 0,
        eventIdsProcessed: eventIds.length,
        timestamp: new Date().toISOString()
      };

      setResults(cleanupResults);
      
      console.log('✅ Complete cleanup finished');
      toast.success('Complete cleanup successful - agent ready for fresh testing');

    } catch (error: any) {
      console.error('Cleanup failed:', error);
      toast.error(`Cleanup failed: ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Cleanup Tool</CardTitle>
        <CardDescription>
          Completely reset an agent's graduation state and clean all related data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="agentId">Agent ID</Label>
          <Input
            id="agentId"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter agent ID to clean up"
          />
        </div>

        <Button
          onClick={performCompleteCleanup}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? 'Cleaning...' : 'Perform Complete Cleanup'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Cleanup Results:</h3>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>

            {results.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-800">❌ Error: {results.error}</p>
              </div>
            )}

            {!results.error && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  ✅ Cleanup completed successfully
                </p>
                <p className="text-sm text-green-600 mt-2">
                  • Agent state reset<br/>
                  • {results.eventIdsProcessed} graduation events processed<br/>
                  • {results.graduationEventsRemaining} graduation events remaining<br/>
                  • {results.activeContractsRemaining} active contracts remaining
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}