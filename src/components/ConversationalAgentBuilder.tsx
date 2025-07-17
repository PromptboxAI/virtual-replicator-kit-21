import React from 'react';
import { UniversalAgentDashboard } from './UniversalAgentDashboard';

interface ConversationalAgentBuilderProps {
  agentId: string;
  agentName: string;
  onComplete: (assistantId: string) => void;
}

export function ConversationalAgentBuilder({ agentId, agentName, onComplete }: ConversationalAgentBuilderProps) {
  // Create mock agent object for UniversalAgentDashboard
  const agent = {
    id: agentId,
    name: agentName,
    symbol: agentName.slice(0, 3).toUpperCase(),
    description: '',
    category: 'AI Agent',
    is_active: false
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Create Your AI Agent</h1>
        <p className="text-muted-foreground">
          Follow these steps to build and deploy your custom AI agent
        </p>
      </div>
      
      <UniversalAgentDashboard 
        agent={agent}
        onAgentUpdated={() => {
          // When agent is fully configured and deployed, call onComplete
          onComplete(agentId);
        }}
      />
    </div>
  );
}