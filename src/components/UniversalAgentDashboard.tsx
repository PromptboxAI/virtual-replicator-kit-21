import { useState, useEffect } from 'react';
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
import { ConversationalAgentBuilder } from './ConversationalAgentBuilder';
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
  Brain,
  Wand2,
  Zap,
  Send,
  Eye
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
  model?: string;
  assistantId?: string;
  apiKeys?: Record<string, string>;
  [key: string]: any;
}

export function UniversalAgentDashboard({ agent, onAgentUpdated }: UniversalAgentDashboardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [builderMode, setBuilderMode] = useState<'form' | 'conversational'>('conversational');
  const [configuration, setConfiguration] = useState<AgentConfiguration>({
    instructions: '',
    personality: 'friendly',
    goals: '',
    tools: [],
    knowledge_base: '',
    model: 'gpt-4o-mini',
    apiKeys: {}
  });
  const { toast } = useToast();

  // Fetch existing configuration
  const { data: existingConfig, refetch, isLoading: configLoading } = useQuery({
    queryKey: ['agent-config', agent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agent config:', error);
        // Don't throw on "not found" errors, just return null
        return null;
      }
      return data;
    },
  });

  // Initialize configuration from existing data
  useEffect(() => {
    if (existingConfig?.configuration) {
      const config = existingConfig.configuration as AgentConfiguration;
      setConfiguration(config);
      // Determine which step to show based on completion
      if (config.instructions) {
        if (config.goals) {
          if (config.knowledge_base) {
            setCurrentStep(4);
          } else {
            setCurrentStep(3);
          }
        } else {
          setCurrentStep(2);
        }
      } else {
        setCurrentStep(1);
      }
    }
  }, [existingConfig]);

  const setupSteps = [
    {
      id: 1,
      title: "Define Your AI Agent",
      description: "Set core instructions, model selection, and basic configuration",
      icon: Brain,
      completed: !!configuration.instructions && !!configuration.model
    },
    {
      id: 2,
      title: "Instructions & Behavior", 
      description: "Define personality, goals, and how your agent should interact",
      icon: Sparkles,
      completed: !!configuration.goals && !!configuration.personality
    },
    {
      id: 3,
      title: "Tools & Capabilities",
      description: "Select tools and configure API keys for your agent's capabilities",
      icon: Lightbulb,
      completed: !!configuration.tools && configuration.tools.length > 0
    },
    {
      id: 4,
      title: "Deploy & Test",
      description: "Create your OpenAI Assistant and test it before going live",
      icon: Rocket,
      completed: !!configuration.assistantId
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
      console.log('Saving configuration for agent:', agent.id);
      console.log('Configuration data:', configuration);
      
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: agent.category || 'universal',
          configuration: configuration as any
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // If this is the first save and we have a complete configuration, create OpenAI Assistant
      if (!existingConfig && configuration.instructions && configuration.goals && configuration.knowledge_base) {
        console.log('Creating OpenAI Assistant...');
        try {
          const { data: assistantData, error: assistantError } = await supabase.functions.invoke('create-openai-assistant', {
            body: {
              agentId: agent.id,
              name: agent.name,
              description: configuration.instructions,
              purpose: configuration.goals,
              functionalities: ['trading', 'telegram'], // Based on user's telegram trading bot request
              customInstructions: configuration.knowledge_base,
              category: agent.category || 'Trading Bot',
              apiKeys: {}
            }
          });
          
          if (assistantError) {
            console.error('Assistant creation error:', assistantError);
            toast({
              title: "Configuration Saved ✅",
              description: "Configuration saved but OpenAI Assistant creation failed. You can retry later.",
              variant: "default"
            });
          } else {
            console.log('Assistant created successfully:', assistantData);
            toast({
              title: "Agent Created! 🎉",
              description: "Your OpenAI Assistant has been created and configured successfully.",
            });
          }
        } catch (assistantError: any) {
          console.error('Assistant creation failed:', assistantError);
          toast({
            title: "Configuration Saved ✅",
            description: "Configuration saved but OpenAI Assistant creation failed. You can retry later.",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Configuration Saved! 🎉",
          description: "Your agent configuration has been updated.",
        });
      }

      // Auto-advance to next step based on what was just completed
      if (currentStep === 1 && configuration.instructions) {
        setCurrentStep(2);
      } else if (currentStep === 2 && configuration.goals && configuration.personality) {
        setCurrentStep(3);
      } else if (currentStep === 3 && configuration.knowledge_base) {
        setCurrentStep(4);
      }

      refetch();
      onAgentUpdated?.();
    } catch (error: any) {
      console.error('Full error details:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration. Please check your authentication and try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestAgent = async () => {
    if (!testMessage.trim()) return;
    
    setIsTesting(true);
    setTestResponse('');
    
    try {
      // If assistant already exists, test with OpenAI directly
      if (configuration.assistantId) {
        const { data, error } = await supabase.functions.invoke('test-assistant', {
          body: {
            assistantId: configuration.assistantId,
            message: testMessage
          }
        });

        if (error) throw error;
        
        setTestResponse(data.response || "Agent responded successfully!");
        toast({
          title: "Test Successful! 🤖",
          description: "Your agent is working correctly!",
        });
      } else {
        // Create assistant first, then test
        await createAssistant();
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Agent test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const createAssistant = async () => {
    try {
      console.log('Creating OpenAI Assistant...');
        const { data: assistantData, error: assistantError } = await supabase.functions.invoke('create-openai-assistant', {
          body: {
            agentId: agent.id,
            name: agent.name,
            description: configuration.instructions,
            purpose: configuration.goals,
            functionalities: configuration.tools || [],
            customInstructions: configuration.knowledge_base,
            category: agent.category || 'AI Agent',
            model: configuration.model || 'gpt-4o-mini',
            personality: configuration.personality || 'friendly',
            apiKeys: configuration.apiKeys || {}
          }
        });
      
      if (assistantError) {
        console.error('Assistant creation error:', assistantError);
        throw assistantError;
      }

      console.log('Assistant created successfully:', assistantData);
      
      // Update configuration with assistant ID
      setConfiguration(prev => ({ ...prev, assistantId: assistantData.assistant_id }));
      
      // Save updated configuration
      await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: agent.category || 'universal',
          configuration: { ...configuration, assistantId: assistantData.assistant_id } as any
        });
      
      toast({
        title: "Agent Created! 🎉",
        description: `Your OpenAI Assistant has been created successfully. ID: ${assistantData.assistant_id}`,
      });

      refetch();
      return assistantData.assistant_id;
    } catch (error: any) {
      console.error('Assistant creation failed:', error);
      throw error;
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

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">AI Model</Label>
                    <Select
                      value={configuration.model}
                      onValueChange={(value) => setConfiguration(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Advanced reasoning)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={!configuration.instructions || !configuration.model || isUpdating}
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
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Tools & Capabilities</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select the tools your agent will use and configure the necessary API keys for each capability.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Available Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Tools</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose which capabilities your agent should have. You can select multiple tools.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Communication Tools */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Communication</h4>
                      <div className="grid gap-3">
                        {[
                          { id: 'telegram_messaging', name: 'Telegram Messaging', desc: 'Send and receive messages via Telegram' },
                          { id: 'discord_messaging', name: 'Discord Messaging', desc: 'Interact in Discord servers' },
                          { id: 'email_communication', name: 'Email Communication', desc: 'Send automated emails' }
                        ].map((tool) => (
                          <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={tool.id}
                              checked={configuration.tools?.includes(tool.id)}
                              onCheckedChange={(checked) => {
                                const newTools = checked 
                                  ? [...(configuration.tools || []), tool.id]
                                  : (configuration.tools || []).filter(t => t !== tool.id);
                                setConfiguration(prev => ({ ...prev, tools: newTools }));
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                                {tool.name}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Creation Tools */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Content Creation</h4>
                      <div className="grid gap-3">
                        {[
                          { id: 'social_media_posting', name: 'Social Media Posting', desc: 'Create and post social content' },
                          { id: 'blog_writing', name: 'Blog Writing', desc: 'Generate blog posts and articles' },
                          { id: 'newsletter_creation', name: 'Newsletter Creation', desc: 'Create email newsletters' }
                        ].map((tool) => (
                          <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={tool.id}
                              checked={configuration.tools?.includes(tool.id)}
                              onCheckedChange={(checked) => {
                                const newTools = checked 
                                  ? [...(configuration.tools || []), tool.id]
                                  : (configuration.tools || []).filter(t => t !== tool.id);
                                setConfiguration(prev => ({ ...prev, tools: newTools }));
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                                {tool.name}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trading Tools */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Trading & DeFi</h4>
                      <div className="grid gap-3">
                        {[
                          { id: 'crypto_trading', name: 'Crypto Trading', desc: 'Execute trades on DEX platforms' },
                          { id: 'price_monitoring', name: 'Price Monitoring', desc: 'Track cryptocurrency prices' },
                          { id: 'defi_analysis', name: 'DeFi Protocol Analysis', desc: 'Analyze DeFi protocols and opportunities' }
                        ].map((tool) => (
                          <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={tool.id}
                              checked={configuration.tools?.includes(tool.id)}
                              onCheckedChange={(checked) => {
                                const newTools = checked 
                                  ? [...(configuration.tools || []), tool.id]
                                  : (configuration.tools || []).filter(t => t !== tool.id);
                                setConfiguration(prev => ({ ...prev, tools: newTools }));
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                                {tool.name}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Key Configuration */}
              {configuration.tools && configuration.tools.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>API Key Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure API keys for the selected tools. These are securely encrypted and stored.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {configuration.tools?.includes('telegram_messaging') && (
                      <div>
                        <Label htmlFor="telegram-token">Telegram Bot Token</Label>
                        <Input
                          id="telegram-token"
                          type="password"
                          value={configuration.apiKeys?.TELEGRAM_BOT_TOKEN || ''}
                          onChange={(e) => setConfiguration(prev => ({ 
                            ...prev, 
                            apiKeys: { ...prev.apiKeys, TELEGRAM_BOT_TOKEN: e.target.value }
                          }))}
                          placeholder="Enter your Telegram bot token from @BotFather"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Create a bot with @BotFather on Telegram to get this token
                        </p>
                      </div>
                    )}

                    {configuration.tools?.includes('discord_messaging') && (
                      <div>
                        <Label htmlFor="discord-token">Discord Bot Token</Label>
                        <Input
                          id="discord-token"
                          type="password"
                          value={configuration.apiKeys?.DISCORD_BOT_TOKEN || ''}
                          onChange={(e) => setConfiguration(prev => ({ 
                            ...prev, 
                            apiKeys: { ...prev.apiKeys, DISCORD_BOT_TOKEN: e.target.value }
                          }))}
                          placeholder="Enter your Discord bot token"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Create a bot in Discord Developer Portal to get this token
                        </p>
                      </div>
                    )}

                    {configuration.tools?.includes('email_communication') && (
                      <div className="space-y-2">
                        <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                        <Input
                          id="sendgrid-key"
                          type="password"
                          value={configuration.apiKeys?.SENDGRID_API_KEY || ''}
                          onChange={(e) => setConfiguration(prev => ({ 
                            ...prev, 
                            apiKeys: { ...prev.apiKeys, SENDGRID_API_KEY: e.target.value }
                          }))}
                          placeholder="Enter your SendGrid API key"
                        />
                        <p className="text-xs text-muted-foreground">
                          Get this from SendGrid dashboard for email functionality
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Knowledge Base */}
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add specific knowledge, facts, and context your agent needs to know.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Example: Our token launched on January 2024 with a total supply of 1B tokens. Main features include: staking rewards (12% APY), governance voting, exclusive NFT drops. Community guidelines: be respectful, no spam, help newcomers."
                    value={configuration.knowledge_base}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, knowledge_base: e.target.value }))}
                    rows={6}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                onClick={handleSaveConfiguration}
                disabled={!configuration.tools || configuration.tools.length === 0 || isUpdating}
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

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Deploy & Test</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your OpenAI Assistant and test it to ensure it works correctly before going live.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Configuration Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review your agent configuration before deployment
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Agent Name:</span>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">AI Model:</span>
                      <span className="font-medium">{configuration.model || 'gpt-4o-mini'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Personality:</span>
                      <span className="font-medium capitalize">{configuration.personality}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tools Selected:</span>
                      <span className="font-medium">{configuration.tools?.length || 0}</span>
                    </div>
                    {configuration.assistantId && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Assistant ID:</span>
                        <span className="font-medium text-green-600">{configuration.assistantId}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Test Your Agent
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Test your agent by sending it a message to ensure it responds correctly
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="test-message">Test Message</Label>
                      <Textarea
                        id="test-message"
                        placeholder="Ask your agent something related to its role..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleTestAgent}
                      disabled={!testMessage.trim() || isTesting || (!configuration.instructions || !configuration.goals)}
                      className="w-full"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {configuration.assistantId ? 'Testing...' : 'Creating & Testing...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {configuration.assistantId ? 'Test Agent' : 'Create & Test Agent'}
                        </>
                      )}
                    </Button>

                    {testResponse && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Agent Response:</h4>
                        <p className="text-sm">{testResponse}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Deployment Status
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Check your agent's deployment status and launch when ready
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Instructions Configured</span>
                        {configuration.instructions ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Goals & Personality Set</span>
                        {configuration.goals && configuration.personality ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tools Selected</span>
                        {configuration.tools && configuration.tools.length > 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">OpenAI Assistant Created</span>
                        {configuration.assistantId ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {!configuration.assistantId && (
                      <Button 
                        onClick={createAssistant}
                        disabled={!configuration.instructions || !configuration.goals || !configuration.tools || isUpdating}
                        className="w-full"
                        variant="outline"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Assistant...
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 mr-2" />
                            Create OpenAI Assistant
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      size="lg"
                      disabled={!configuration.assistantId}
                      onClick={() => {
                        toast({
                          title: "Agent Launched! 🚀",
                          description: "Your AI agent is now live and ready to operate autonomously!",
                        });
                        onAgentUpdated?.();
                      }}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      {configuration.assistantId ? 'Launch Agent' : 'Create Assistant First'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
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

  const handleAssistantComplete = (assistantId: string) => {
    toast({
      title: "Agent Created! 🎉",
      description: `Your OpenAI Assistant has been created successfully with ID: ${assistantId}`,
    });
    refetch();
    onAgentUpdated?.();
  };

  // Show loading state while configuration is loading
  if (configLoading) {
    return (
      <div className="space-y-8">
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
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading agent configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Builder Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Building Mode</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how you want to build your agent
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                builderMode === 'conversational' 
                  ? 'bg-primary/10 border-primary' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setBuilderMode('conversational')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI-Guided Builder</h3>
                  <p className="text-sm text-green-600 font-medium">✨ Recommended</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Conversational setup with an AI assistant that guides you through the entire process, 
                identifies required integrations, and helps configure everything step-by-step.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Auto Integration Detection</Badge>
                <Badge variant="secondary" className="text-xs">API Key Setup</Badge>
                <Badge variant="secondary" className="text-xs">Testing & Validation</Badge>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                builderMode === 'form' 
                  ? 'bg-primary/10 border-primary' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setBuilderMode('form')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Manual Form Builder</h3>
                  <p className="text-sm text-gray-600">Basic Setup</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Traditional step-by-step forms to configure your agent. 
                Good for simple agents but requires manual integration setup.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Step-by-Step Forms</Badge>
                <Badge variant="outline" className="text-xs">Manual Setup</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
      {builderMode === 'conversational' ? (
        <ConversationalAgentBuilder
          agentId={agent.id}
          agentName={agent.name}
          onComplete={handleAssistantComplete}
        />
      ) : (
        renderStepContent()
      )}
    </div>
  );
}