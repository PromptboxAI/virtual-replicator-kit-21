import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UniversalAgentDashboard } from '@/components/UniversalAgentDashboard';
import { useAgent } from '@/hooks/useAgent';

const CreatorAgentDashboard = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agent, loading, error } = useAgent(agentId);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <UniversalAgentDashboard agent={agent} isCreatorView={true} />
      </main>

      <Footer />
    </div>
  );
};

export default CreatorAgentDashboard;