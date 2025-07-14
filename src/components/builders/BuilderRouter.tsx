import React, { useState } from 'react';
import { TradingBotBuilder } from './TradingBotBuilder';
import { DeFiAssistantBuilder } from './DeFiAssistantBuilder';
import { ContentCreatorBuilder } from './ContentCreatorBuilder';
import { CommunityManagerBuilder } from './CommunityManagerBuilder';
import { AnalyticsAgentBuilder } from './AnalyticsAgentBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';

interface BuilderRouterProps {
  selectedCategory: string;
  onBack: () => void;
  onNext: (config: any) => void;
}

export function BuilderRouter({ selectedCategory, onBack, onNext }: BuilderRouterProps) {
  const [showCategoryInfo, setShowCategoryInfo] = useState(true);

  const getCategoryInfo = (category: string) => {
    const info = {
      "Trading Bot": {
        title: "Trading Bot Agent",
        description: "Create an autonomous trading agent that can execute trades across multiple exchanges",
        features: ["Multi-exchange support", "Risk management", "Strategy backtesting", "Real-time monitoring"],
        icon: "📈"
      },
      "DeFi Assistant": {
        title: "DeFi Yield Optimizer",
        description: "Build an agent that maximizes DeFi yields across protocols",
        features: ["Protocol integration", "Auto-compounding", "Risk diversification", "Cross-chain operations"],
        icon: "🏦"
      },
      "Content Creator": {
        title: "AI Content Creator",
        description: "Develop an agent that creates and manages content across social platforms",
        features: ["Multi-platform posting", "Content scheduling", "Trend analysis", "SEO optimization"],
        icon: "🎨"
      },
      "Community Manager": {
        title: "Community Management Agent",
        description: "Build an agent that manages and grows online communities",
        features: ["Auto-moderation", "Member engagement", "Event management", "Growth tracking"],
        icon: "👥"
      },
      "Analytics Agent": {
        title: "Data Analytics Assistant",
        description: "Create an agent that analyzes data and provides actionable insights",
        features: ["Multi-source data analysis", "Predictive modeling", "Custom dashboards", "Automated reports"],
        icon: "📊"
      },
      "Research Agent": {
        title: "Research Assistant",
        description: "Build an agent that conducts research and analysis",
        features: ["Information gathering", "Report generation", "Trend analysis", "Data synthesis"],
        icon: "🔬"
      },
      "Gaming Agent": {
        title: "Gaming Assistant",
        description: "Create an agent for gaming communities and economics",
        features: ["Game integration", "Economy management", "Player engagement", "NFT trading"],
        icon: "🎮"
      },
      "Educational Agent": {
        title: "Educational Assistant",
        description: "Build an agent that provides educational content and support",
        features: ["Course creation", "Student engagement", "Progress tracking", "Personalized learning"],
        icon: "📚"
      }
    };

    return info[category as keyof typeof info] || {
      title: "Generic Agent",
      description: "Create a custom AI agent",
      features: ["Basic AI capabilities", "Custom configuration"],
      icon: "🤖"
    };
  };

  const renderBuilder = () => {
    const commonProps = {
      onNext,
      onBack: () => setShowCategoryInfo(true)
    };

    switch (selectedCategory) {
      case "Trading Bot":
        return <TradingBotBuilder {...commonProps} />;
      case "DeFi Assistant":  
        return <DeFiAssistantBuilder {...commonProps} />;
      case "Content Creator":
        return <ContentCreatorBuilder {...commonProps} />;
      case "Community Manager":
        return <CommunityManagerBuilder {...commonProps} />;
      case "Analytics Agent":
        return <AnalyticsAgentBuilder {...commonProps} />;
      default:
        // For categories not yet implemented, show coming soon
        return (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              The {selectedCategory} builder is currently in development.
            </p>
            <Button onClick={() => setShowCategoryInfo(true)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        );
    }
  };

  if (showCategoryInfo) {
    const categoryInfo = getCategoryInfo(selectedCategory);
    
    return (
      <div className="space-y-6">
        {/* Category Overview */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{categoryInfo.icon}</div>
            <CardTitle className="text-2xl">{categoryInfo.title}</CardTitle>
            <CardDescription className="text-lg">
              {categoryInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h4 className="font-semibold mb-3 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                Key Features
              </h4>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {categoryInfo.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Choose Different Category
                </Button>
                <Button onClick={() => setShowCategoryInfo(false)}>
                  Start Building
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Build Section */}
        <Card>
          <CardHeader>
            <CardTitle>What You'll Build</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Configure Your Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up specialized parameters and features for your {selectedCategory.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Connect APIs & Services</h4>
                  <p className="text-sm text-muted-foreground">
                    Integrate with relevant platforms and services for your use case
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Deploy & Monitor</h4>
                  <p className="text-sm text-muted-foreground">
                    Launch your agent and track its performance in real-time
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">Earn & Optimize</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate value and continuously improve your agent's performance
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return renderBuilder();
}