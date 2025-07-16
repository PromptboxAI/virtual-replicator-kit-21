import React from 'react';
import { AssistantSetupFlow } from './AssistantSetupFlow';

interface ConversationalAgentBuilderProps {
  agentId: string;
  agentName: string;
  onComplete: (assistantId: string) => void;
}

export function ConversationalAgentBuilder({ agentId, agentName, onComplete }: ConversationalAgentBuilderProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Create Your AI Assistant</h1>
        <p className="text-muted-foreground">
          Follow these steps to build and deploy your custom AI assistant
        </p>
      </div>
      
      <AssistantSetupFlow 
        agentId={agentId}
        agentName={agentName}
        onComplete={onComplete}
      />
    </div>
  );
}