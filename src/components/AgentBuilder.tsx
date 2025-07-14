import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Palette, 
  MessageSquare, 
  Target, 
  Zap, 
  Save,
  Loader2,
  Settings
} from 'lucide-react';

interface AgentBuilderProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    avatar_url?: string;
    category?: string;
    framework?: string;
    is_active?: boolean;
  };
  onAgentUpdated?: () => void;
}

export function AgentBuilder({ agent, onAgentUpdated }: AgentBuilderProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    category: agent.category || '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: "Agent Updated! 🤖",
        description: "Your agent configuration has been saved successfully.",
      });

      onAgentUpdated?.();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update agent",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const agentPersonalities = [
    { name: "Professional", description: "Formal, business-focused responses" },
    { name: "Friendly", description: "Casual, approachable communication style" },
    { name: "Technical", description: "Detailed, technical explanations" },
    { name: "Creative", description: "Innovative, artistic responses" },
    { name: "Analytical", description: "Data-driven, logical approach" }
  ];

  const agentCategories = [
    "DeFi", "Gaming", "Social", "Trading", "Content", "Analytics", "NFTs", "Education"
  ];

  return (
    <div className="space-y-6">
      {/* Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Agent Configuration
          </CardTitle>
          <p className="text-muted-foreground">
            Customize your AI agent's identity and behavior
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              
              <div>
                <Label htmlFor="agent-symbol">Symbol</Label>
                <Input
                  id="agent-symbol"
                  value={agent.symbol}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Symbol cannot be changed after creation
                </p>
              </div>

              <div>
                <Label htmlFor="agent-category">Category</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {agentCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={formData.category === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleInputChange('category', category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent-description">Description</Label>
                <Textarea
                  id="agent-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your agent's purpose and capabilities..."
                  rows={6}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveChanges}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Behavior Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent Behavior
          </CardTitle>
          <p className="text-muted-foreground">
            Configure how your agent interacts and makes decisions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Personality Traits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentPersonalities.map((personality) => (
                <Card key={personality.name} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 mt-1 text-primary" />
                    <div>
                      <h4 className="font-medium">{personality.name}</h4>
                      <p className="text-sm text-muted-foreground">{personality.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Agent Goals & Objectives
          </CardTitle>
          <p className="text-muted-foreground">
            Define what your agent should focus on during autonomous execution
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h4 className="font-medium">Revenue Generation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Focus on activities that generate revenue for token holders
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">Community Engagement</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Prioritize building and engaging with the community
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-green-500" />
                <h4 className="font-medium">AI Innovation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore new AI capabilities and features
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-purple-500" />
                <h4 className="font-medium">Content Creation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate valuable content and insights
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </CardTitle>
          <p className="text-muted-foreground">
            Advanced configuration options for experienced users
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Framework: {agent.framework}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your agent is running on the {agent.framework} framework with advanced AI capabilities.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Execution Frequency:</span>
                <Badge variant="outline">Every 15 minutes</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>AI Model:</span>
                <Badge variant="outline">GPT-4 Turbo</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Decision Engine:</span>
                <Badge variant="outline">Autonomous</Badge>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip:</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your agent learns from interactions and adapts its behavior over time. 
              The more specific your description and goals, the better it will perform!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}