import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Bot, Settings, Zap, MessageSquare, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssistantConfig {
  name: string;
  description: string;
  instructions: string;
  personality: string;
  goals: string;
  model: string;
  tools: string[];
  knowledgeBase: string;
  telegramBotToken?: string;
}

interface AssistantSetupFlowProps {
  agentId: string;
  agentName: string;
  onComplete: (assistantId: string) => void;
}

export function AssistantSetupFlow({ agentId, agentName, onComplete }: AssistantSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig>({
    name: agentName,
    description: "",
    instructions: "",
    personality: "friendly",
    goals: "",
    model: "gpt-4o-mini",
    tools: [],
    knowledgeBase: "",
    telegramBotToken: ""
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Define Your AI Agent", icon: Bot, description: "Set up your agent's core details" },
    { id: 2, title: "Instructions & Behavior", icon: MessageSquare, description: "Define how your agent should behave" },
    { id: 3, title: "Tools & Capabilities", icon: Zap, description: "Select what your agent can do" },
    { id: 4, title: "Deploy & Test", icon: Settings, description: "Create and test your agent" },
  ];

  const availableTools = [
    // Communication
    { id: "telegram_messaging", name: "Telegram Messaging", description: "Send and receive messages via Telegram", category: "Communication" },
    { id: "discord_messaging", name: "Discord Messaging", description: "Interact in Discord servers", category: "Communication" },
    { id: "email_communication", name: "Email Communication", description: "Send automated emails", category: "Communication" },
    
    // Content Creation
    { id: "social_media_posting", name: "Social Media Posting", description: "Create and post social content", category: "Content" },
    { id: "blog_writing", name: "Blog Writing", description: "Generate blog posts and articles", category: "Content" },
    { id: "newsletter_creation", name: "Newsletter Creation", description: "Create email newsletters", category: "Content" },
    
    // Trading & Finance
    { id: "crypto_trading", name: "Crypto Trading", description: "Execute trades on DEX platforms", category: "Trading" },
    { id: "price_monitoring", name: "Price Monitoring", description: "Track cryptocurrency prices", category: "Trading" },
    { id: "portfolio_management", name: "Portfolio Management", description: "Manage trading portfolios", category: "Trading" },
    { id: "risk_management", name: "Risk Management", description: "Implement trading risk controls", category: "Trading" },
    
    // Analytics & Research
    { id: "data_analysis", name: "Data Analysis", description: "Analyze data and generate insights", category: "Analytics" },
    { id: "market_research", name: "Market Research", description: "Research market trends and opportunities", category: "Analytics" },
    { id: "reporting", name: "Reporting", description: "Generate automated reports", category: "Analytics" },
    
    // Community Management
    { id: "community_moderation", name: "Community Moderation", description: "Moderate community discussions", category: "Community" },
    { id: "user_engagement", name: "User Engagement", description: "Engage with community members", category: "Community" },
    { id: "faq_handling", name: "FAQ Handling", description: "Answer frequently asked questions", category: "Community" },
    
    // DeFi
    { id: "protocol_analysis", name: "Protocol Analysis", description: "Analyze DeFi protocols", category: "DeFi" },
    { id: "yield_farming", name: "Yield Farming", description: "Optimize yield farming strategies", category: "DeFi" },
    { id: "liquidity_management", name: "Liquidity Management", description: "Manage liquidity positions", category: "DeFi" },
  ];

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!assistantConfig.name.trim()) errors.push("Agent name is required");
        if (!assistantConfig.description.trim()) errors.push("Description is required");
        if (!assistantConfig.model) errors.push("Model selection is required");
        break;
      case 2:
        if (!assistantConfig.instructions.trim()) errors.push("Instructions are required");
        if (assistantConfig.instructions.length < 50) errors.push("Instructions should be at least 50 characters");
        if (!assistantConfig.personality) errors.push("Personality style is required");
        if (!assistantConfig.goals.trim()) errors.push("Goals are required");
        break;
      case 3:
        if (assistantConfig.tools.length === 0) errors.push("At least one tool must be selected");
        break;
      case 4:
        // No validation needed for deploy step
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setValidationErrors([]);
  };

  const handleToolToggle = (toolId: string) => {
    setAssistantConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const createAssistant = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
        body: {
          agentId,
          name: assistantConfig.name,
          description: assistantConfig.description,
          instructions: assistantConfig.instructions,
          purpose: assistantConfig.goals,
          customInstructions: assistantConfig.knowledgeBase,
          model: assistantConfig.model,
          functionalities: assistantConfig.tools,
          category: "AI Agent",
          apiKeys: {
            ...(assistantConfig.telegramBotToken && { TELEGRAM_BOT_TOKEN: assistantConfig.telegramBotToken })
          }
        }
      });

      if (error) throw error;

      toast({
        title: "AI Agent Created Successfully! 🎉",
        description: `Your agent "${assistantConfig.name}" is now ready to use.`
      });

      onComplete(data.assistantId);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error Creating Agent",
        description: "Failed to create your agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">AI Agent Name</Label>
              <Input
                id="name"
                value={assistantConfig.name}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ContentCreator Pro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={assistantConfig.description}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your agent does and its main purpose..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={assistantConfig.model}
                onValueChange={(value) => setAssistantConfig(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Advanced reasoning)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="instructions">System Instructions</Label>
              <Textarea
                id="instructions"
                value={assistantConfig.instructions}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="You are an AI agent that specializes in... Define your specific role, expertise, and how you interact with users."
                rows={6}
                className="text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Define how your agent should behave and its core functionality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="goals">Goals & Objectives</Label>
                <Textarea
                  id="goals"
                  value={assistantConfig.goals}
                  onChange={(e) => setAssistantConfig(prev => ({ ...prev, goals: e.target.value }))}
                  placeholder="What should your agent achieve? List specific objectives and success metrics..."
                  rows={4}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Personality Style</Label>
                <div className="space-y-2">
                  {[
                    { id: 'professional', label: 'Professional', desc: 'Formal, business-focused' },
                    { id: 'friendly', label: 'Friendly', desc: 'Casual, approachable' },
                    { id: 'expert', label: 'Expert', desc: 'Technical, authoritative' },
                    { id: 'creative', label: 'Creative', desc: 'Innovative, artistic' },
                    { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic, positive' }
                  ].map((style) => (
                    <div
                      key={style.id}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        assistantConfig.personality === style.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setAssistantConfig(prev => ({ ...prev, personality: style.id }))}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-muted-foreground">{style.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="knowledge">Knowledge Base (Optional)</Label>
              <Textarea
                id="knowledge"
                value={assistantConfig.knowledgeBase}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, knowledgeBase: e.target.value }))}
                placeholder="Add specific knowledge, facts, guidelines, or context your agent needs to know..."
                rows={4}
                className="text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Include FAQs, company information, or domain-specific knowledge.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Select Tools & Capabilities</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose the tools and capabilities your agent will have access to. You can select multiple options.
              </p>
              
              {/* Group tools by category */}
              {Object.entries(
                availableTools.reduce((acc, tool) => {
                  const category = tool.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(tool);
                  return acc;
                }, {} as Record<string, typeof availableTools>)
              ).map(([category, tools]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={tool.id}
                          checked={assistantConfig.tools.includes(tool.id)}
                          onCheckedChange={() => handleToolToggle(tool.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                            {tool.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {assistantConfig.tools.includes("telegram_messaging") && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                  <Label htmlFor="telegram-token">Telegram Bot Token (Optional)</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    value={assistantConfig.telegramBotToken}
                    onChange={(e) => setAssistantConfig(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                    placeholder="Enter your Telegram bot token from @BotFather"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from @BotFather on Telegram by creating a new bot
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Deploy & Test Your AI Agent</h3>
              <p className="text-muted-foreground">
                Review your configuration and deploy your agent to start using it.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h4 className="font-medium mb-3">Configuration Summary</h4>
              
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{assistantConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{assistantConfig.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personality:</span>
                  <span className="font-medium capitalize">{assistantConfig.personality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tools Selected:</span>
                  <span className="font-medium">{assistantConfig.tools.length}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <span className="text-sm text-muted-foreground">Selected Tools:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {assistantConfig.tools.map(toolId => {
                    const tool = availableTools.find(t => t.id === toolId);
                    return (
                      <Badge key={toolId} variant="secondary" className="text-xs">
                        {tool?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🚀 Ready to Deploy
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your AI agent will be created using our OpenAI API and will be ready for use immediately. 
                You can interact with it and see it appear in the OpenAI Assistants dashboard.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.id 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground text-muted-foreground'
            }`}>
              {currentStep > step.id ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-4 ${
                currentStep > step.id ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-center">
        {steps.map((step) => (
          <div key={step.id} className="flex-1">
            <p className={`font-medium ${
              currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.title}
            </p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        
        {currentStep < steps.length ? (
          <Button onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button onClick={createAssistant} disabled={isLoading} size="lg" className="min-w-[160px]">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Agent...
              </>
            ) : (
              <>
                🚀 Deploy Agent
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}