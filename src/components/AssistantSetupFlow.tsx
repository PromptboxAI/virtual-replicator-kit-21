import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Bot, Settings, Zap, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssistantConfig {
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: string[];
  apiKeys: Record<string, string>;
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
    model: "gpt-4o-mini",
    tools: [],
    apiKeys: {},
    telegramBotToken: ""
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Basic Configuration", icon: Bot, description: "Set up your assistant's core details" },
    { id: 2, title: "Instructions & Behavior", icon: MessageSquare, description: "Define how your assistant should behave" },
    { id: 3, title: "Tools & Capabilities", icon: Zap, description: "Select what your assistant can do" },
    { id: 4, title: "API Keys & Integration", icon: Settings, description: "Connect external services" },
  ];

  const availableTools = [
    { id: "telegram_messaging", name: "Telegram Messaging", description: "Send and receive messages via Telegram" },
    { id: "crypto_trading", name: "Crypto Trading", description: "Execute trades on DEX platforms" },
    { id: "price_monitoring", name: "Price Monitoring", description: "Track cryptocurrency prices" },
    { id: "portfolio_management", name: "Portfolio Management", description: "Manage trading portfolios" },
    { id: "risk_management", name: "Risk Management", description: "Implement trading risk controls" },
  ];

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!assistantConfig.name.trim()) errors.push("Assistant name is required");
        if (!assistantConfig.description.trim()) errors.push("Description is required");
        if (!assistantConfig.model) errors.push("Model selection is required");
        break;
      case 2:
        if (!assistantConfig.instructions.trim()) errors.push("Instructions are required");
        if (assistantConfig.instructions.length < 50) errors.push("Instructions should be at least 50 characters");
        break;
      case 3:
        if (assistantConfig.tools.length === 0) errors.push("At least one tool must be selected");
        break;
      case 4:
        if (assistantConfig.tools.includes("telegram_messaging") && !assistantConfig.telegramBotToken) {
          errors.push("Telegram Bot Token is required for messaging functionality");
        }
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
    if (!validateStep(4)) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
        body: {
          agentId,
          name: assistantConfig.name,
          description: assistantConfig.description,
          instructions: assistantConfig.instructions,
          model: assistantConfig.model,
          functionalities: assistantConfig.tools,
          apiKeys: {
            ...assistantConfig.apiKeys,
            ...(assistantConfig.telegramBotToken && { TELEGRAM_BOT_TOKEN: assistantConfig.telegramBotToken })
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Assistant Created Successfully",
        description: `Your assistant "${assistantConfig.name}" is now ready to use.`
      });

      onComplete(data.assistantId);
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast({
        title: "Error Creating Assistant",
        description: "Failed to create your assistant. Please try again.",
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
              <Label htmlFor="name">Assistant Name</Label>
              <Input
                id="name"
                value={assistantConfig.name}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., TradingBot Pro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={assistantConfig.description}
                onChange={(e) => setAssistantConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your assistant does..."
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
                placeholder="You are a professional trading assistant that helps users make informed trading decisions. You should..."
                rows={8}
                className="text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Define how your assistant should behave, its personality, and any specific guidelines it should follow.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Select Tools & Capabilities</h3>
              <div className="grid gap-4">
                {availableTools.map((tool) => (
                  <div key={tool.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id={tool.id}
                      checked={assistantConfig.tools.includes(tool.id)}
                      onCheckedChange={() => handleToolToggle(tool.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                        {tool.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">API Keys & Integration</h3>
              
              {assistantConfig.tools.includes("telegram_messaging") && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="telegram-token">Telegram Bot Token</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    value={assistantConfig.telegramBotToken}
                    onChange={(e) => setAssistantConfig(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                    placeholder="Enter your Telegram bot token from @BotFather"
                  />
                  <p className="text-sm text-muted-foreground">
                    Get this from @BotFather on Telegram by creating a new bot
                  </p>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Selected Tools Summary:</h4>
                <div className="flex flex-wrap gap-2">
                  {assistantConfig.tools.map(toolId => {
                    const tool = availableTools.find(t => t.id === toolId);
                    return (
                      <Badge key={toolId} variant="secondary">
                        {tool?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
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
          <Button onClick={createAssistant} disabled={isLoading}>
            {isLoading ? "Creating Assistant..." : "Create Assistant"}
          </Button>
        )}
      </div>
    </div>
  );
}