import React from 'react';
import { useParams } from 'react-router-dom';
import { FeeTestComponent } from '@/components/FeeTestComponent';

export function FeeTest() {
  const { agentId } = useParams();
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Fee Function Testing</h1>
          <p className="text-muted-foreground">
            Testing the extended useAgentTokens hook fee functions
          </p>
        </div>
        
        {agentId ? (
          <FeeTestComponent 
            agentId={agentId}
            tokenAddress="0x1234567890123456789012345678901234567890"
          />
        ) : (
          <div className="text-center text-muted-foreground">
            No agent ID provided in URL
          </div>
        )}
      </div>
    </div>
  );
}