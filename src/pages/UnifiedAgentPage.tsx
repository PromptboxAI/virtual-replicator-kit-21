
import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfessionalTradingInterface } from '@/components/ProfessionalTradingInterface';
import { useAgent } from '@/hooks/useAgent';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';

const UnifiedAgentPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agent, loading, error } = useAgent(agentId);
  
  // Real-time updates for agent data
  const { agentData } = useAgentRealtime(agentId || '', agent || undefined);
  
  // Use real-time data if available, fallback to static data
  // Merge real-time updates with full agent data to preserve all fields
  const currentAgent = agent ? {
    ...agent,
    ...(agentData ? {
      prompt_raised: agentData.prompt_raised,
      current_price: agentData.current_price,
      market_cap: agentData.market_cap,
      token_holders: agentData.token_holders,
      volume_24h: agentData.volume_24h,
      token_address: agentData.token_address
    } : {}),
    // Ensure pricing_model is always included
    pricing_model: agent.pricing_model
  } : null;
  
  // 🔍 DEBUG: Log states at UnifiedAgentPage level
  console.log("UnifiedAgentPage - Privy state:", "N/A - no privy here");
  console.log("UnifiedAgentPage - Agent:", agent);
  console.log("UnifiedAgentPage - Loading:", loading);
  console.log("UnifiedAgentPage - Error:", error);

  if (loading) {
    console.log('UnifiedAgentPage: SHOWING LOADING STATE - loading:', loading, 'error:', error, 'agent:', agent);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading agent...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground">{error || 'Agent does not exist'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  console.log('UnifiedAgentPage: About to render UniversalAgentDashboard with agent:', agent.name);

  // 🔍 Claude's debugging: Check parent component props
  console.log('[UnifiedAgentPage] Passing to UniversalAgentDashboard:', {
    agent,
    agentType: typeof agent,
    agentKeys: agent ? Object.keys(agent) : 'null'
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <ProfessionalTradingInterface 
          agent={currentAgent} 
          onTradeComplete={() => {
            console.log('UnifiedAgentPage: Trade completed callback triggered');
          }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default UnifiedAgentPage;
