import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Bot } from 'lucide-react';
import { AgentMarketingTab } from './AgentMarketingTab';

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
  };
  onAgentUpdated?: () => void;
}

export function AgentTabsInterface({ agent, onAgentUpdated }: AgentTabsInterfaceProps) {
  const [activeTab, setActiveTab] = useState('trade');

  return (
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
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Trading Interface</h3>
          <p className="text-muted-foreground">
            Trading interface will be implemented in Phase 5 & 6
          </p>
        </div>
      </TabsContent>

      <TabsContent value="ai-agent" className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">AI Agent Interface</h3>
          <p className="text-muted-foreground">
            AI Agent interaction interface will be implemented in Phase 4
          </p>
          <div className="mt-6">
            <AgentMarketingTab agent={agent} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}