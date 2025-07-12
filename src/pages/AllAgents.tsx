import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/hooks/useAgents';
import { useAppMode } from '@/hooks/useAppMode';
import { Search, TrendingUp, TrendingDown, Filter, Star, Users, DollarSign, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AllAgents() {
  const { agents, loading, error } = useAgents();
  const { mode } = useAppMode();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAgents = agents
    ?.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] as number || 0;
      const bVal = b[sortBy as keyof typeof b] as number || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(3);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading agents...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-destructive">Error loading agents: {error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Agents
            </h1>
          </div>
          <p className="text-muted-foreground">
            Discover and trade autonomous AI agents in the decentralized economy
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'market_cap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('market_cap')}
            >
              Market Cap
            </Button>
            <Button
              variant={sortBy === 'volume_24h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('volume_24h')}
            >
              Volume
            </Button>
            <Button
              variant={sortBy === 'price_change_24h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price_change_24h')}
            >
              24h Change
            </Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border font-semibold text-sm text-muted-foreground">
            <div className="col-span-3">AI Agents</div>
            <div className="col-span-1">Ascended At</div>
            <div className="col-span-1">TVL</div>
            <div className="col-span-1">FDV</div>
            <div className="col-span-1">24h Chg</div>
            <div className="col-span-1">24h Vol</div>
            <div className="col-span-1">Token Price</div>
            <div className="col-span-1">Holders</div>
            <div className="col-span-1">Agentic Level</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {filteredAgents?.map((agent, index) => (
              <div 
                key={agent.id} 
                className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => navigate(`/trade/${agent.id}`)}
              >
                {/* Agent Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">{index + 1}</span>
                  </div>
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={agent.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {agent.symbol.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-foreground">{agent.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      ${agent.symbol}
                      <Badge variant="secondary" className="text-xs py-0 px-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full mr-1" />
                        Lvl 1
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ascended At */}
                <div className="col-span-1 text-sm text-muted-foreground">
                  11 Jan 2025
                </div>

                {/* TVL */}
                <div className="col-span-1 text-sm text-foreground">
                  {agent.market_cap ? formatMarketCap(agent.market_cap * 0.7) : 'N/A'}
                </div>

                {/* FDV */}
                <div className="col-span-1 text-sm text-foreground">
                  {agent.market_cap ? formatMarketCap(agent.market_cap) : 'N/A'}
                </div>

                {/* 24h Change */}
                <div className="col-span-1">
                  {agent.price_change_24h !== undefined ? (
                    <div className={`flex items-center gap-1 text-sm ${
                      agent.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {agent.price_change_24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(agent.price_change_24h).toFixed(2)}%
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>

                {/* 24h Volume */}
                <div className="col-span-1 text-sm text-foreground">
                  {agent.volume_24h ? formatMarketCap(agent.volume_24h) : 'N/A'}
                </div>

                {/* Token Price */}
                <div className="col-span-1 text-sm text-foreground font-medium">
                  ${formatPrice(agent.current_price)}
                </div>

                {/* Holders */}
                <div className="col-span-1 text-sm text-foreground">
                  {Math.floor(Math.random() * 5000) + 100}
                </div>

                {/* Agentic Level */}
                <div className="col-span-1">
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-1" />
                    Lvl 1
                  </Badge>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trade/${agent.id}`);
                    }}
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredAgents?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No agents found matching your search.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}