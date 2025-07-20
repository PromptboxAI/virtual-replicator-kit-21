import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Bot } from 'lucide-react';
import { AgentMarketingTab } from './AgentMarketingTab';
import { MigrationBanner } from './MigrationBanner';
import { EnhancedTradingInterface } from './EnhancedTradingInterface';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { useMigrationPolling } from '@/hooks/useMigrationPolling';

interface AgentTabsInterfaceProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    avatar_url?: string;
    category?: string;
    framework?: string;
    creator_id?: string;
    created_at: string;
    current_price: number;
    market_cap?: number;
    token_holders?: number;
    prompt_raised?: number;
    token_graduated?: boolean;
    is_active?: boolean;
    token_address?: string | null; // Phase 4: Track token deployment
  };
  onAgentUpdated?: () => void;
}

export function AgentTabsInterface({ agent, onAgentUpdated }: AgentTabsInterfaceProps) {
  // 🔍 DEBUG: Log states at AgentTabsInterface level  
  console.log("AgentTabsInterface - Privy state:", "N/A - no privy here");
  console.log("AgentTabsInterface - Agent:", agent);
  
  console.log('AgentTabsInterface rendering with agent:', agent.name);
  const [activeTab, setActiveTab] = useState('trade');

  // Real-time migration status - Phase 4 implementation
  const { isMigrating } = useAgentRealtime(agent.id, {
    id: agent.id,
    prompt_raised: agent.prompt_raised || 0,
    current_price: agent.current_price,
    market_cap: agent.market_cap,
    token_holders: agent.token_holders,
    token_address: agent.token_address
  });

  // Migration polling
  useMigrationPolling({
    agentId: agent.id,
    isEnabled: isMigrating,
    onComplete: () => {
      console.log('Migration completed for agent:', agent.id);
      onAgentUpdated?.();
    }
  });

  return (
    <div className="space-y-6">
      {/* Migration Banner - Phase 4 */}
      {isMigrating && (
        <MigrationBanner 
          agentName={agent.name}
          onComplete={() => console.log('Migration banner acknowledged')}
        />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="trade" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Trade
        </TabsTrigger>
        <TabsTrigger value="ai-agent" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Agent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trade" className="space-y-6">
        <EnhancedTradingInterface 
          agent={agent}
          onAgentUpdated={onAgentUpdated}
          isMigrating={isMigrating}
        />
      </TabsContent>

      <TabsContent value="ai-agent" className="space-y-6">
        <AgentMarketingTab agent={agent} />
      </TabsContent>
      </Tabs>
    </div>
  );
}