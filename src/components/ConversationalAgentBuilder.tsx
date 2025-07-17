import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Bot, Loader2, Rocket } from 'lucide-react';

interface ConversationalAgentBuilderProps {
  agentId: string;
  agentName: string;
  onComplete: (assistantId: string) => void;
}

export function ConversationalAgentBuilder({ agentId, agentName, onComplete }: ConversationalAgentBuilderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: `Hi! I'm here to help you create your AI agent "${agentName}". Tell me what you want your agent to do, and I'll guide you through the setup process. What should your agent specialize in?`
    }
  ]);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      setIsCreating(true);
      
      // For now, let's create a basic assistant
      const { data: assistantData, error: assistantError } = await supabase.functions.invoke('create-openai-assistant', {
        body: {
          agentId,
          name: agentName,
          description: userMessage,
          purpose: `AI agent that specializes in: ${userMessage}`,
          functionalities: ['general_assistance'],
          customInstructions: userMessage,
          category: 'AI Agent',
          model: 'gpt-4.1-2025-04-14',
          personality: 'helpful',
          apiKeys: {}
        }
      });

      if (assistantError) {
        throw assistantError;
      }

      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `Perfect! I've created your AI agent with the specifications you provided. Your assistant ID is: ${assistantData.assistant_id}. Your agent is now ready to be deployed!` 
      }]);

      toast({
        title: "Agent Created! 🎉",
        description: `Your AI agent has been created successfully!`,
      });

      onComplete(assistantData.assistant_id);
      
    } catch (error: any) {
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `I encountered an error while creating your agent: ${error.message}. Let's try a different approach. Can you tell me more specifically what you want your agent to do?` 
      }]);
      
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create agent",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <Avatar className="h-16 w-16 mx-auto mb-4">
          <AvatarFallback>
            <Bot className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold mb-2">AI-Guided Agent Builder</h1>
        <p className="text-muted-foreground">
          Chat with our AI assistant to create your custom agent
        </p>
      </div>
      
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Configuration Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isCreating && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Creating your agent...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you want your AI agent to do..."
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}