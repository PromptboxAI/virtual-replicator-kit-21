import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  description: string;
  current_price: number;
  avatar_url?: string;
}

interface AgentInteraction {
  id: string;
  message_type: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface AgentChatProps {
  agent: Agent;
}

export function AgentChat({ agent }: AgentChatProps) {
  const [interactions, setInteractions] = useState<AgentInteraction[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInteractions();
    
    // Set up real-time subscription for chat interactions
    const interactionsChannel = supabase
      .channel('agent-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_interactions',
          filter: `agent_id=eq.${agent.id}`
        },
        (payload) => {
          setInteractions(prev => [payload.new as AgentInteraction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interactionsChannel);
    };
  }, [agent.id]);

  const fetchInteractions = async () => {
    try {
      const { data: interactionsData } = await supabase
        .from('agent_interactions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setInteractions(interactionsData || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.functions.invoke('agent-runtime', {
        body: { 
          action: 'interact', 
          agentId: agent.id, 
          message: userMessage 
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });
      
      setUserMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the agent",
      });
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message to agent",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading chat...</div>;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Chat with {agent.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Have a conversation with your AI agent. Messages are powered by OpenAI and saved in your database.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-96 p-4 border rounded-lg bg-muted/20">
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet. Send a message to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.slice().reverse().map((interaction) => (
                <div 
                  key={interaction.id} 
                  className={`flex ${interaction.message_type === 'user_message' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    interaction.message_type === 'user_message' 
                      ? 'bg-primary text-primary-foreground ml-8' 
                      : 'bg-card border mr-8'
                  }`}>
                    <p className="text-sm leading-relaxed">{interaction.content}</p>
                    <p className={`text-xs mt-2 ${
                      interaction.message_type === 'user_message' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(interaction.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={handleKeyPress}
            disabled={sendingMessage}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={sendingMessage || !userMessage.trim()}
            size="icon"
          >
            {sendingMessage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}