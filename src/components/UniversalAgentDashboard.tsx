import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  Circle, 
  Bot, 
  Sparkles, 
  Play, 
  Settings, 
  MessageSquare,
  Loader2,
  ArrowRight,
  Lightbulb,
  Rocket,
  Brain
} from 'lucide-react';

interface UniversalAgentDashboardProps {
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

interface AgentConfiguration {
  instructions?: string;
  personality?: string;
  goals?: string;
  tools?: string[];
  knowledge_base?: string;
  [key: string]: any;
}

export function UniversalAgentDashboard({ agent, onAgentUpdated }: UniversalAgentDashboardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [configuration, setConfiguration] = useState<AgentConfiguration>({
    instructions: '',
    personality: 'friendly',
    goals: '',
    tools: [],
    knowledge_base: ''
  });
  const { toast } = useToast();

  // Fetch existing configuration
  const { data: existingConfig, refetch } = useQuery({
    queryKey: ['agent-config', agent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Initialize configuration from existing data
  useState(() => {
    if (existingConfig?.configuration) {
      const config = existingConfig.configuration as AgentConfiguration;
      setConfiguration(config);
      // Determine which step to show based on completion
      if (config.instructions) {
        setCurrentStep(2);
        if (config.goals) {
          setCurrentStep(3);
          if (config.knowledge_base) {
            setCurrentStep(4);
          }
        }
      }
    }
  });

  const setupSteps = [
    {
      id: 1,
      title: "Define Your Agent",
      description: "Tell your AI what it should do and how it should behave",
      icon: Brain,
      completed: !!configuration.instructions
    },
    {
      id: 2,
      title: "Set Goals & Personality", 
      description: "Give your agent specific objectives and a unique personality",
      icon: Sparkles,
      completed: !!configuration.goals && !!configuration.personality
    },
    {
      id: 3,
      title: "Add Knowledge",
      description: "Provide context and information your agent needs to know",
      icon: Lightbulb,
      completed: !!configuration.knowledge_base
    },
    {
      id: 4,
      title: "Test & Launch",
      description: "Try out your agent and activate it for autonomous operation",
      icon: Rocket,
      completed: agent.is_active
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  const getInstructionsPlaceholder = (category?: string) => {
    const placeholders = {
      'Trading Bot': 'You are an AI trading assistant. Your job is to analyze market data, identify trading opportunities, and execute trades based on predefined strategies. You should be knowledgeable about technical analysis, risk management, and maintain a data-driven approach.',
      'Content Creator': 'You are a content creation specialist. Your job is to generate engaging blog posts, social media content, and marketing materials. You should be creative, understand current trends, and maintain brand consistency.',
      'Community Manager': 'You are a community manager for a crypto project. Your job is to engage with community members, answer questions, moderate discussions, and foster a positive environment. You should be knowledgeable about the project and maintain a helpful, professional tone.',
      'DeFi Assistant': 'You are a DeFi protocol assistant. Your job is to help users understand DeFi concepts, navigate protocols, and make informed decisions. You should be knowledgeable about yield farming, liquidity provision, and maintain an educational approach.',
      'Analytics Agent': 'You are a data analytics specialist. Your job is to analyze data, generate insights, and create reports. You should be analytical, detail-oriented, and able to explain complex data in simple terms.'
    };
    
    return placeholders[category as keyof typeof placeholders] || 'You are an AI assistant. Define your specific role, responsibilities, and how you should interact with users. Be specific about your expertise and communication style.';
  };

  const handleSaveConfiguration = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: agent.category || 'universal',
          configuration: configuration as any
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved! 🎉",
        description: "Your agent configuration has been updated.",
      });

      refetch();
      onAgentUpdated?.();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestAgent = async () => {
    if (!testMessage.trim()) return;
    
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-runtime', {
        body: {
          action: 'test_message',
          agentId: agent.id,
          message: testMessage
        }
      });

      if (error) throw error;

      toast({
        title: "Test Successful! 🤖",
        description: "Your agent responded correctly. Ready for launch!",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Agent test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
      setTestMessage('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Define Your AI Agent</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start by telling your agent what it should do. Think of this as hiring instructions for your AI assistant.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent Instructions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  What should your agent do? Be specific about its role and responsibilities.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={getInstructionsPlaceholder(agent.category)}
                  value={configuration.instructions}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={!configuration.instructions || isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Pro Tips:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Be specific about what your agent should and shouldn't do</li>
                    <li>• Include the tone and personality you want</li>
                    <li>• Mention any special expertise or knowledge areas</li>
                    <li>• Think about your target audience and goals</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Goals & Personality</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Give your agent specific objectives and define its unique personality traits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Goals</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    What are the main objectives your agent should work towards?
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Example: Increase token holder engagement by 25%, post 3 high-quality content pieces daily, respond to community questions within 30 minutes, identify trending topics in crypto space"
                    value={configuration.goals}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, goals: e.target.value }))}
                    rows={5}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personality Style</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How should your agent communicate and interact?
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 'professional', label: 'Professional', desc: 'Formal, business-focused' },
                    { id: 'friendly', label: 'Friendly', desc: 'Casual, approachable' },
                    { id: 'expert', label: 'Expert', desc: 'Technical, authoritative' },
                    { id: 'creative', label: 'Creative', desc: 'Innovative, artistic' },
                    { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic, positive' }
                  ].map((style) => (
                    <div
                      key={style.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        configuration.personality === style.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setConfiguration(prev => ({ ...prev, personality: style.id }))}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-muted-foreground">{style.desc}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleSaveConfiguration}
                disabled={!configuration.goals || isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Add Knowledge</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Provide your agent with specific information, facts, and context it needs to operate effectively.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Include important information, guidelines, FAQs, or any specific knowledge your agent needs.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Example: Our token launched on January 2024 with a total supply of 1B tokens. Main features include: staking rewards (12% APY), governance voting, exclusive NFT drops. Community guidelines: be respectful, no spam, help newcomers. Key partnerships: DeFiPlatform, CryptoExchange. Roadmap: Q2 - Mobile app, Q3 - Cross-chain bridge."
                  value={configuration.knowledge_base}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, knowledge_base: e.target.value }))}
                  rows={8}
                  className="resize-none"
                />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={!configuration.knowledge_base || isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 Knowledge Tips:</h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• Include key facts about your project/business</li>
                    <li>• Add frequently asked questions and answers</li>
                    <li>• Provide guidelines for interactions</li>
                    <li>• Include relevant links, dates, and numbers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Test & Launch</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Test your agent to make sure it works as expected, then launch it for autonomous operation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Test Your Agent
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Send a test message to see how your agent responds
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Test Message</Label>
                    <Textarea
                      placeholder="Ask your agent something related to its role..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleTestAgent}
                    disabled={!testMessage.trim() || isTesting}
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Test Agent
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Launch Status
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your agent is ready for autonomous operation
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Configuration</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Knowledge Base</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Goals & Personality</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    size="lg"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Agent
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={agent.avatar_url} alt={agent.name} />
            <AvatarFallback>
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.symbol} • {agent.category || 'AI Agent'}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Setup Progress</span>
            <Badge variant="secondary">{completedSteps}/{setupSteps.length} Complete</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {setupSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      currentStep === step.id 
                        ? 'bg-primary/10 border-primary' 
                        : step.completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStepContent()}
    </div>
  );
}