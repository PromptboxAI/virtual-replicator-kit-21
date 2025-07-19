import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Bot } from 'lucide-react';
import { WorkflowBuilder } from './WorkflowBuilder';

interface AgentTabsInterfaceProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    avatar_url?: string;
    category?: string;
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
        <WorkflowBuilder 
          agentId={agent.id} 
          agentName={agent.name}
          onComplete={() => {
            onAgentUpdated?.();
          }}
        />
      </TabsContent>
    </Tabs>
  );
}