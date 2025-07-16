import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestedIntegrations?: string[];
    requiredApiKeys?: string[];
    currentStep?: string;
    validationResult?: boolean;
  };
}

interface ConversationalAgentBuilderProps {
  agentId: string;
  agentName: string;
  onComplete: (assistantId: string) => void;
}

export function ConversationalAgentBuilder({ agentId, agentName, onComplete }: ConversationalAgentBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm here to help you build your custom AI agent "${agentName}". I'll guide you through the entire process, identify the integrations you need, and help you configure everything properly.\n\nTo get started, tell me in detail what you want your agent to do. For example:\n- "I want a Telegram trading bot that monitors crypto prices and executes trades"\n- "I need a social media agent that posts content and responds to mentions"\n- "I want an agent that analyzes data and sends reports via email"\n\nWhat would you like your agent to accomplish?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [buildingPhase, setBuildingPhase] = useState<'discovery' | 'integration_setup' | 'configuration' | 'testing' | 'complete'>('discovery');
  const [identifiedIntegrations, setIdentifiedIntegrations] = useState<string[]>([]);
  const [configuredIntegrations, setConfiguredIntegrations] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    try {
      // Call the agent builder assistant
      const { data, error } = await supabase.functions.invoke('conversational-agent-builder', {
        body: {
          message: userMessage,
          agentId,
          agentName,
          buildingPhase,
          identifiedIntegrations,
          configuredIntegrations,
          conversationHistory: messages.map(m => ({
            role: m.type === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const response = data.response;
      
      addMessage({
        type: 'assistant',
        content: response.content,
        metadata: response.metadata
      });

      // Update state based on assistant response
      if (response.metadata) {
        if (response.metadata.suggestedIntegrations) {
          setIdentifiedIntegrations(response.metadata.suggestedIntegrations);
        }
        if (response.metadata.currentStep) {
          setBuildingPhase(response.metadata.currentStep as any);
        }
        if (response.metadata.assistantCreated) {
          onComplete(response.metadata.assistantId);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      addMessage({
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
      });
      toast({
        title: "Error",
        description: "Failed to communicate with the agent builder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'discovery': return 'bg-blue-500';
      case 'integration_setup': return 'bg-orange-500';
      case 'configuration': return 'bg-purple-500';
      case 'testing': return 'bg-yellow-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header with progress */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Building Agent: {agentName}</h2>
          <Badge className={`${getPhaseColor(buildingPhase)} text-white`}>
            {buildingPhase.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        {identifiedIntegrations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Required Integrations:</h3>
            <div className="flex flex-wrap gap-2">
              {identifiedIntegrations.map(integration => (
                <Badge 
                  key={integration} 
                  variant={configuredIntegrations.includes(integration) ? "default" : "outline"}
                  className="flex items-center gap-1"
                >
                  {configuredIntegrations.includes(integration) && <CheckCircle className="h-3 w-3" />}
                  {integration}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type !== 'user' && (
                <div className="flex-shrink-0">
                  {message.type === 'assistant' ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              )}
              
              <Card className={`max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.type === 'system'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-muted'
              }`}>
                <CardContent className="p-3">
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  
                  {message.metadata?.requiredApiKeys && message.metadata.requiredApiKeys.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-2">Required API Keys:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.metadata.requiredApiKeys.map(key => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {message.type === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want your agent to do..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}