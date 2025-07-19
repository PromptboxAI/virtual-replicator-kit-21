
import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const UnifiedAgentPage = () => {
  const { agentId } = useParams<{ agentId: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Agent Page</h1>
          <p className="text-muted-foreground">Agent ID: {agentId}</p>
          <p className="text-muted-foreground mt-4">Debugging authentication and loading issues...</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnifiedAgentPage;
