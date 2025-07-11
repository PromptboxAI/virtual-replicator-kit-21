import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Sparkles, Coins, TrendingUp, Info, AlertCircle, Check, Twitter, Link2, X, Code, Rocket, ExternalLink, Settings, Users, Brain, Shield, Zap, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { useAppMode } from "@/hooks/useAppMode";
import { useUserRole } from "@/hooks/useUserRole";
import { FrameworkSDKService, FRAMEWORK_CONFIGS } from "@/lib/frameworkSDK";
import { useAgentTokenFactory } from "@/hooks/useAgentTokens";
import { useAccount } from 'wagmi';

interface AgentFormData {
  name: string;
  symbol: string;
  description: string;
  category: string;
  framework: string;
  website_url: string;
  twitter_url: string;
  avatar_url: string;
  total_supply: number;
  short_pitch: string;
  agent_overview: string;
  prebuy_amount: number;
}

export default function CreateAgent() {
  const { toast } = useToast();

  // Framework recommendations based on agent category
  const frameworkRecommendations: Record<string, {
    primary: string[];
    secondary: string[];
    explanation: string;
  }> = {
    "Trading Bot": {
      primary: ["PROMPT"],
      secondary: ["AutoGen", "CrewAI"],
      explanation: "PROMPT with G.A.M.E. integration provides bonding curves, autonomous trading, and market analysis - perfect for trading bots."
    },
    "DeFi Assistant": {
      primary: ["PROMPT", "LangChain"],
      secondary: ["AutoGen"],
      explanation: "PROMPT offers tokenization and DeFi integrations, while LangChain excels at complex financial data processing."
    },
    "Content Creator": {
      primary: ["Eliza", "PROMPT"],
      secondary: ["CrewAI"],
      explanation: "Eliza provides advanced conversational AI, while PROMPT offers social media integration and token incentives."
    },
    "Community Manager": {
      primary: ["Eliza", "PROMPT"],
      secondary: ["Swarm", "AutoGen"],
      explanation: "Eliza for engaging conversations and PROMPT for social media management with tokenized communities."
    },
    "Analytics Agent": {
      primary: ["LangChain", "PROMPT"],
      secondary: ["AutoGen", "CrewAI"],
      explanation: "LangChain for data processing and PROMPT for market analysis with real-time trading insights."
    },
    "Gaming Agent": {
      primary: ["PROMPT", "Eliza"],
      secondary: ["AutoGen"],
      explanation: "PROMPT offers tokenization for gaming economies, while Eliza provides immersive character interactions."
    },
    "NFT Agent": {
      primary: ["PROMPT"],
      secondary: ["LangChain", "Eliza"],
      explanation: "PROMPT's tokenization and bonding curves are ideal for NFT market analysis and trading."
    },
    "Research Assistant": {
      primary: ["LangChain", "AutoGen"],
      secondary: ["CrewAI", "PROMPT"],
      explanation: "LangChain excels at complex research tasks, while AutoGen provides multi-agent collaboration."
    }
  };

  const getRecommendedFrameworks = (category: string) => {
    return frameworkRecommendations[category] || { primary: [], secondary: [], explanation: "" };
  };

  const isRecommendedFramework = (framework: string, category: string, type: 'primary' | 'secondary' = 'primary') => {
    const recommendations = getRecommendedFrameworks(category);
    return type === 'primary' 
      ? recommendations.primary.includes(framework)
      : recommendations.secondary.includes(framework);
  };
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { user, loading: authLoading, signIn } = useAuth();
  const { balance, loading: balanceLoading, deductTokens, addTestTokens } = useTokenBalance(user?.id);
  const { connectTwitter, disconnectTwitter, isConnecting, connectedAccount, setConnectedAccount } = useTwitterAuth();
  const { isTestMode: appIsTestMode } = useAppMode();
  const { isAdmin } = useUserRole();
  const CREATION_COST = 100;

  console.log('CreateAgent Debug:', {
    user: !!user,
    authLoading,
    balanceLoading,
    balance,
    currentStep
  });

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    symbol: "",
    description: "",
    category: "",
    framework: "PROMPT",
    website_url: "",
    twitter_url: "",
    avatar_url: "",
    total_supply: 1000000000, // Fixed at 1 billion tokens per Virtuals protocol
    short_pitch: "",
    agent_overview: "",
    prebuy_amount: 0,
  });

  const categories = [
    "DeFi Assistant",
    "Trading Bot", 
    "Content Creator",
    "Research Agent",
    "Community Manager",
    "Analytics Agent",
    "Gaming Agent",
    "Educational Agent",
    "Other"
  ];

  // Get frameworks from SDK with fallback descriptions
  const frameworks = Object.keys(FRAMEWORK_CONFIGS).reduce((acc, key) => {
    acc[key] = FRAMEWORK_CONFIGS[key].description;
    return acc;
  }, {} as Record<string, string>);

  // Only use frameworks from SDK that have actual deployment handlers
  const allFrameworks = frameworks;

  // Load existing Twitter connection
  useEffect(() => {
    const loadTwitterConnection = async () => {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('twitter_id, twitter_username, twitter_display_name, twitter_avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profile?.twitter_id) {
        setConnectedAccount({
          twitter_id: profile.twitter_id,
          twitter_username: profile.twitter_username,
          twitter_display_name: profile.twitter_display_name,
          twitter_avatar_url: profile.twitter_avatar_url,
          access_token: '',
          access_token_secret: ''
        });
        // Auto-populate Twitter URL if connected
        if (profile.twitter_username) {
          setFormData(prev => ({ 
            ...prev, 
            twitter_url: `https://twitter.com/${profile.twitter_username}` 
          }));
        }
      }
    };

    loadTwitterConnection();
  }, [user?.id, setConnectedAccount]);

  const handleInputChange = (field: keyof AgentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: previewUrl }));
    }
  };

  const validateForm = () => {
    if (!formData.avatar_url || !avatarFile) {
      toast({ title: "Error", description: "AI Agent avatar is required", variant: "destructive" });
      return false;
    }
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "AI Agent name is required", variant: "destructive" });
      return false;
    }
    if (!formData.symbol.trim()) {
      toast({ title: "Error", description: "Token symbol is required", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Error", description: "AI Agent description is required", variant: "destructive" });
      return false;
    }
    if (!formData.category) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      return false;
    }
    if (!formData.framework) {
      toast({ title: "Error", description: "Please select a framework", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleCreateAgent = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create an AI Agent",
        variant: "destructive"
      });
      return;
    }

    // In production mode, require wallet connection
    if (!appIsTestMode) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to create agents in production mode",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) return;

    const totalCost = CREATION_COST + formData.prebuy_amount;
    
    // Check if user has sufficient balance (only in test mode)
    if (appIsTestMode && balance < totalCost) {
      const shortfall = totalCost - balance;
      toast({
        title: "Insufficient Balance",
        description: `You need ${shortfall} more $PROMPT tokens. Please reduce your pre-buy amount or add more tokens to your wallet.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check token balance and deduct tokens (only in test mode)
    if (appIsTestMode) {
      const success = await deductTokens(totalCost);
      if (!success) return;
    }
    
    setIsCreating(true);
    try {
      // Upload avatar if provided
      let finalAvatarUrl = null;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agent-avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ 
            title: "Warning", 
            description: "Avatar upload failed, but AI Agent will be created without an avatar", 
            variant: "default" 
          });
          // Continue without avatar instead of stopping
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('agent-avatars')
            .getPublicUrl(fileName);
          
          finalAvatarUrl = urlData.publicUrl;
        }
      }

      // Create agent in database
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          name: formData.name,
          symbol: formData.symbol.toUpperCase(),
          description: formData.description,
          category: formData.category,
          framework: formData.framework,
          website_url: formData.website_url || null,
          twitter_url: formData.twitter_url || null,
          avatar_url: finalAvatarUrl,
          total_supply: formData.total_supply,
          current_price: 0.00001, // Fixed initial price for all tokens
          market_cap: 0, // Will be calculated based on trading
          creation_cost: CREATION_COST,
          is_active: true,
          creator_id: user.id,
          status: 'ACTIVATING',
          test_mode: appIsTestMode, // Set based on current app mode
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({ title: "Error", description: "Failed to create AI Agent", variant: "destructive" });
        return;
      }

      const agentId = data.id;

      // Deploy agent to framework if SDK integration is available
      const frameworkConfig = FrameworkSDKService.getFrameworkConfig(formData.framework);
      if (frameworkConfig) {
        try {
          toast({
            title: "Deploying Agent",
            description: `Deploying ${formData.name} to ${formData.framework}...`,
          });

          const { data: deployResult, error: deployError } = await supabase.functions.invoke('deploy-agent', {
            body: {
              agentId,
              framework: formData.framework,
              name: formData.name,
              description: formData.description,
              environment: {
                totalSupply: formData.total_supply,
                prebuyAmount: formData.prebuy_amount
              }
            }
          });

          if (deployError) {
            console.error('Deployment error:', deployError);
            toast({
              title: "Warning",
              description: `Agent created but deployment to ${formData.framework} failed. You can retry deployment later.`,
              variant: "destructive"
            });
          } else if (deployResult?.success) {
            toast({
              title: "Deployment Successful!",
              description: `${formData.name} has been successfully deployed to ${formData.framework}`,
            });
          }
        } catch (deploymentError) {
          console.error('Deployment error:', deploymentError);
          toast({
            title: "Warning",
            description: `Agent created but deployment to ${formData.framework} failed. You can retry deployment later.`,
            variant: "destructive"
          });
        }
      }

      toast({ 
        title: "Success!", 
        description: `${formData.name} has been created successfully! (${CREATION_COST} tokens deducted)`,
      });
      
      // Navigate back to home to see the new AI Agent
      navigate('/');
      
    } catch (error) {
      console.error('Creation error:', error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleNext = () => {
    if (!validateForm()) return;
    setCurrentStep(1); // Move to Project Pitch step
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Show loading state only for authentication
  if (authLoading) {
    console.log('Showing loading state', { authLoading, balanceLoading });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login required state
  if (!user) {
    console.log('No user found, showing login');
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Wallet Connection Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to connect your wallet to create an AI Agent. Click below to get started.
            </p>
            <Button onClick={signIn}>Connect Wallet</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('Rendering main CreateAgent form');

  const estimatedMarketCap = 0; // Will be determined by bonding curve

  // Progress steps
  const steps = [
    "AI Agent Details",
    "Project Pitch", 
    "Framework",
    "Tokenomics",
    "Summary"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-cyber bg-clip-text text-transparent">
                Create New AI Agent on Base
              </span>
            </h1>
            <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
              Create your AI Agent on Base
              <img 
                src="/lovable-uploads/653131a0-191a-4ba3-9126-6f9aef2d6a80.png" 
                alt="Base logo" 
                className="w-5 h-5"
              />
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentStep 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {index < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        index === currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 mt-[-16px] ${
                      index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
          </div>


          {/* Token Balance & Cost Display */}
          <div className="mb-8 flex justify-center">
            <Alert className="w-fit">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-4">
                  <span>
                    {appIsTestMode ? (
                      <>
                        Your Balance: 
                        {balanceLoading ? (
                          <span className="inline-flex items-center gap-1 ml-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            <strong>Loading...</strong>
                          </span>
                        ) : (
                          <strong> {balance} tokens</strong>
                        )}
                      </>
                    ) : (
                      <strong>Wallet Connection Required</strong>
                    )}
                  </span>
                  <span>•</span>
                  <span>Creation Cost: <strong>{CREATION_COST} tokens</strong></span>
                  {appIsTestMode && !balanceLoading && balance < CREATION_COST && (
                    <span className="text-destructive">• Insufficient tokens!</span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Test Token Button */}
          {appIsTestMode && !balanceLoading && balance < CREATION_COST && (
            <div className="mb-8 flex justify-center">
              <Button 
                onClick={() => addTestTokens(5000)}
                variant="outline" 
                className="text-primary border-primary hover:bg-primary/10"
              >
                Get 5,000 Test Tokens
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className={`${currentStep === 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
              
              {/* Step 0: AI Agent Details */}
              {currentStep === 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Agent Details
                      </CardTitle>
                      <CardDescription>
                        Define your AI Agent's identity and purpose
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="avatar">AI Agent Avatar *</Label>
                        <div className="mt-2 flex items-center gap-4">
                          <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('avatar')?.click()}
                            className="flex items-center gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Avatar
                          </Button>
                          {formData.avatar_url && (
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={formData.avatar_url} />
                              <AvatarFallback>{formData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">AI Agent Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g. AlphaTrader"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="symbol">Token Symbol *</Label>
                          <Input
                            id="symbol"
                            placeholder="e.g. ALPHA"
                            value={formData.symbol}
                            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                            maxLength={10}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your AI Agent does, its capabilities, and unique features..."
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={4}
                          maxLength={100}
                        />
                        <div className="flex justify-end mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formData.description.length} / 100
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Socials */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Socials
                      </CardTitle>
                      <CardDescription>
                        Connect your AI Agent's social presence
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="website">Website URL</Label>
                          <Input
                            id="website"
                            placeholder="https://youraiagent.com"
                            value={formData.website_url}
                            onChange={(e) => handleInputChange('website_url', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Twitter/X</Label>
                          {connectedAccount ? (
                            <div className="mt-2 p-3 border rounded-lg bg-green-50 border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={connectedAccount.twitter_avatar_url} />
                                    <AvatarFallback>
                                      <Twitter className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-green-800">
                                      @{connectedAccount.twitter_username}
                                    </p>
                                    <p className="text-sm text-green-600">
                                      {connectedAccount.twitter_display_name}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => user?.id && disconnectTwitter(user.id)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Disconnect
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => user?.id && connectTwitter(user.id)}
                                disabled={isConnecting}
                                className="w-full flex items-center gap-2"
                              >
                                {isConnecting ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : (
                                  <Twitter className="h-4 w-4 text-blue-500" />
                                )}
                                {isConnecting ? 'Connecting...' : 'Connect X Account'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 0 Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!formData.name || !formData.symbol || !formData.description || !formData.category}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 1: Project Pitch */}
              {currentStep === 1 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Project Pitch
                      </CardTitle>
                      <CardDescription>
                        Create a compelling pitch for your AI Agent
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="short_pitch" className="flex items-center gap-1">
                          Short Pitch <span className="text-red-500">*</span>
                        </Label>
                         <Textarea
                          id="short_pitch"
                          placeholder="A concise, engaging summary of your AI Agent (max 500 characters)"
                          value={formData.short_pitch}
                          onChange={(e) => handleInputChange('short_pitch', e.target.value)}
                          rows={8}
                          maxLength={500}
                          className="mt-2 min-h-[200px]"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-muted-foreground">
                            Keep it concise and engaging
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formData.short_pitch.length} / 500
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="agent_overview" className="flex items-center gap-1">
                          AI Agent Overview <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Treat this as your whitepaper. Tell us more about this AI Agent. Include capability, roadmap, key partnership, if any.
                        </p>
                         <Textarea
                          id="agent_overview"
                          placeholder="Provide a detailed overview of your AI Agent..."
                          value={formData.agent_overview}
                          onChange={(e) => handleInputChange('agent_overview', e.target.value)}
                          rows={12}
                          className="mt-2 min-h-[300px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 1 Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setCurrentStep(0)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.short_pitch.trim() || !formData.agent_overview.trim()}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Framework */}
              {currentStep === 2 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Framework
                      </CardTitle>
                      <CardDescription>
                        Select the framework your AI Agent is built with
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label htmlFor="framework">AI Agent Framework *</Label>
                          {formData.category && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-primary">
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">Recommended for {formData.category}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {getRecommendedFrameworks(formData.category).explanation}
                                  </p>
                                  
                                  {getRecommendedFrameworks(formData.category).primary.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-green-600 mb-1">Best Match:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {getRecommendedFrameworks(formData.category).primary.map((fw) => (
                                          <Badge key={fw} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                            {fw}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {getRecommendedFrameworks(formData.category).secondary.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-blue-600 mb-1">Also Good:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {getRecommendedFrameworks(formData.category).secondary.map((fw) => (
                                          <Badge key={fw} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                            {fw}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        
                         <Select value={formData.framework} onValueChange={(value) => handleInputChange('framework', value)}>
                            <SelectTrigger>
                               <SelectValue placeholder="Select a framework">
                                 {formData.framework && (
                                   <div className="flex items-center gap-2">
                                     <span>
                                       {formData.framework === "PROMPT" 
                                         ? "PROMPT (Default Framework)" 
                                         : formData.framework
                                       }
                                     </span>
                                     {formData.framework === "PROMPT" && (
                                       <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                         Recommended
                                       </Badge>
                                     )}
                                   </div>
                                 )}
                               </SelectValue>
                             </SelectTrigger>
                               <SelectContent>
                                 {Object.keys(allFrameworks).map((framework) => {                               
                                   return (
                                     <SelectItem key={framework} value={framework}>
                                       <div className="flex items-center gap-2 w-full">
                                         <span>{framework}</span>
                                         {framework === "PROMPT" && (
                                           <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                             Recommended
                                           </Badge>
                                         )}
                                       </div>
                                     </SelectItem>
                                   );
                                 })}
                             </SelectContent>
                         </Select>
                         
                          {/* Framework Description & SDK Status */}
                          {formData.framework && allFrameworks[formData.framework as keyof typeof allFrameworks] && (
                            <div className="mt-3 space-y-3">
                              <div className="p-3 bg-muted/50 rounded-lg border">
                                <p className="text-sm text-muted-foreground">
                                  {allFrameworks[formData.framework as keyof typeof allFrameworks]}
                                </p>
                              </div>
                              
                              {/* SDK Integration Status */}
                              {FRAMEWORK_CONFIGS[formData.framework] && (
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Rocket className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">SDK Integration Available</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {FRAMEWORK_CONFIGS[formData.framework].sdkType}
                                      </Badge>
                                      {FRAMEWORK_CONFIGS[formData.framework].requiresAPIKey && (
                                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                          API Key Required
                                        </Badge>
                                      )}
                                    </div>
                                     <div className="flex flex-wrap gap-1">
                                       {FRAMEWORK_CONFIGS[formData.framework].supportedFeatures.map((feature) => {
                                         const getFeatureIcon = (feature: string) => {
                                           switch (feature) {
                                             case 'tokenization':
                                             case 'governance': 
                                               return <Shield className="h-3 w-3" />;
                                             case 'multi_agent':
                                             case 'team_collaboration':
                                               return <Users className="h-3 w-3" />;
                                             case 'conversation':
                                             case 'personality':
                                               return <Brain className="h-3 w-3" />;
                                             case 'autonomous_execution':
                                             case 'autonomous_trading':
                                               return <Zap className="h-3 w-3" />;
                                             default:
                                               return <Settings className="h-3 w-3" />;
                                           }
                                         };
                                         
                                         return (
                                           <Badge key={feature} variant="secondary" className="text-xs">
                                             <span className="flex items-center gap-1">
                                               {getFeatureIcon(feature)}
                                               {feature.replace(/_/g, ' ')}
                                             </span>
                                           </Badge>
                                         );
                                       })}
                                     </div>
                                     
                                     {/* API Key Requirement */}
                                     {FRAMEWORK_CONFIGS[formData.framework].requiresAPIKey && (
                                       <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                         ⚠️ This framework requires an API key for deployment
                                       </div>
                                     )}
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-2">
                                           <Code className="h-3 w-3 text-muted-foreground" />
                                           <span className="text-xs text-muted-foreground">
                                             Auto-generates deployment code
                                           </span>
                                         </div>
                                         <div className="flex gap-2">
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button variant="outline" size="sm">
                                                 <Code className="h-3 w-3 mr-1" />
                                                 <span className="text-xs">View Code</span>
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-2xl">
                                               <DialogHeader>
                                                 <DialogTitle>Generated {formData.framework} Agent Code</DialogTitle>
                                                 <DialogDescription>
                                                   This code will be automatically generated and deployed for your agent
                                                 </DialogDescription>
                                               </DialogHeader>
                                               <div className="mt-4">
                                                 <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                                                   <code>{FrameworkSDKService.generateAgentCode(formData.framework, {
                                                     name: formData.name,
                                                     description: formData.description,
                                                     framework: formData.framework
                                                   })}</code>
                                                 </pre>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                           <Button variant="outline" size="sm" asChild>
                                             <a href={FRAMEWORK_CONFIGS[formData.framework].documentationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                               <ExternalLink className="h-3 w-3" />
                                               <span className="text-xs">Docs</span>
                                             </a>
                                           </Button>
                                         </div>
                                       </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </CardContent>
                   </Card>



                   {/* Step 2 Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Tokenomics */}
              {currentStep === 3 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Tokenomics
                      </CardTitle>
                      <CardDescription>
                        Your agent follows PROMPT Agentic Framework's fair launch principles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Fair Launch Protocol
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Fixed Total Supply</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              1,000,000,000 tokens (non-configurable)
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">No Pre-Mine</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              All tokens added to liquidity pool
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Liquidity Locked</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              10-year lock for stability
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Bonding Curve</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              Graduates at 42k $PROMPT volume
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Trading Tax</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              1% fee (70% to creator, 30% to protocol)
                            </p>
                          </div>
                        </div>
                      </div>


                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>PROMPT PROTOCOL:</strong> Your agent launches with a fixed 1B token supply on a bonding curve. 
                          Graduates at 42k $PROMPT volume. 
                          All launches are fair with no insider allocations.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* Step 3 Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(4)}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 4: Summary */}
              {currentStep === 4 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Summary & Launch
                      </CardTitle>
                      <CardDescription>
                        Review your AI Agent details and launch it
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Agent Summary */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={formData.avatar_url} />
                            <AvatarFallback>{formData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-bold">{formData.name}</h3>
                            <p className="text-muted-foreground">${formData.symbol}</p>
                            <Badge variant="secondary">{formData.category}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Framework:</p>
                            <p className="text-muted-foreground">{formData.framework}</p>
                          </div>
                          <div>
                            <p className="font-medium">Total Supply:</p>
                            <p className="text-muted-foreground">{formData.total_supply.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="font-medium">Initial Price:</p>
                            <p className="text-muted-foreground">Auto-determined</p>
                          </div>
                          <div>
                            <p className="font-medium">Pre-buy Amount:</p>
                            <p className="text-muted-foreground">{formData.prebuy_amount} $PROMPT</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2">Description:</p>
                          <p className="text-sm text-muted-foreground break-words">{formData.description}</p>
                        </div>
                      </div>

                      {/* Pre-buy Section */}
                      <div className="border-t pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Pre-buy Your Token (Optional)</h3>
                          <p className="text-sm text-muted-foreground">
                            Purchase your agent's tokens at launch price before they become available to others.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {!user ? (
                              <div className="p-4 border border-dashed rounded-lg text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                  Wallet connection required for pre-buy
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  You can connect when launching your agent
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-3 bg-muted rounded-lg">
                                  {appIsTestMode ? (
                                    <>
                                      <div className="text-sm text-muted-foreground">Your $PROMPT Balance</div>
                                      <div className="text-lg font-semibold">
                                        {balance.toLocaleString()} $PROMPT
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addTestTokens()}
                                        className="mt-2"
                                      >
                                        Add 5,000 Test Tokens
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-sm text-muted-foreground">Wallet Required</div>
                                      <div className="text-lg font-semibold text-green-600">
                                        Wallet Connection Required
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Connect your wallet to use real $PROMPT tokens for agent creation.
                                      </p>
                                    </>
                                  )}
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor="prebuy_amount">Buy ${formData.symbol || 'TOKEN'} with $PROMPT</Label>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleInputChange('prebuy_amount', Math.min(1000, Math.max(0, balance - 100)))}
                                    >
                                      Max
                                    </Button>
                                  </div>
                                  <Input
                                    id="prebuy_amount"
                                    type="number"
                                    value={formData.prebuy_amount === 0 ? "" : formData.prebuy_amount.toString()}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "") {
                                        handleInputChange('prebuy_amount', 0);
                                      } else {
                                        const numValue = parseInt(value) || 0;
                                        handleInputChange('prebuy_amount', numValue);
                                      }
                                    }}
                                    onFocus={(e) => {
                                      if (formData.prebuy_amount === 0) {
                                        e.target.select();
                                      }
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max={Math.min(1000, Math.max(0, balance - 100))}
                                  />
                                  <div className="text-sm text-muted-foreground">
                                    Amount in $PROMPT (Max: {Math.min(1000, Math.max(0, balance - 100))})
                                  </div>
                                  {formData.prebuy_amount > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                      You'll receive: ~{(formData.prebuy_amount * 1000).toLocaleString()} ${formData.symbol}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-medium mb-2">Pre-buy Benefits</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Get tokens at the initial launch price</li>
                                <li>• Secure your position before public launch</li>
                                <li>• Support your agent's initial liquidity</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                        <div className="p-4 border rounded-lg">
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span>Agent Creation Fee:</span>
                              <span className="font-medium">100 $PROMPT</span>
                            </div>
                            {formData.prebuy_amount > 0 && (
                              <div className="flex justify-between">
                                <span>Pre-buy Amount:</span>
                                <span className="font-medium">{formData.prebuy_amount} $PROMPT</span>
                              </div>
                            )}
                            <hr />
                            <div className="flex justify-between font-medium text-base">
                              <span>Total Required:</span>
                              <span>{100 + formData.prebuy_amount} $PROMPT</span>
                            </div>
                            {user && balance < (100 + formData.prebuy_amount) && (
                              <div className="text-red-500 text-xs mt-2">
                                Insufficient balance. You need {(100 + formData.prebuy_amount) - balance} more $PROMPT.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                   {/* Step 4 Action Buttons */}
                   <div className="flex gap-4">
                     <Button
                       onClick={() => setCurrentStep(3)}
                       variant="outline"
                       className="flex-1"
                     >
                       Back
                    </Button>
                     <Button
                       onClick={handleCreateAgent}
                       disabled={isCreating || balanceLoading}
                       className="flex-1 bg-gradient-primary hover:opacity-90"
                     >
                       {isCreating ? (
                         <div className="flex items-center gap-2">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                           Creating...
                         </div>
                       ) : (
                         "Launch Agent"
                       )}
                     </Button>
                  </div>
                </>
              )}

            </div>

            {/* Preview - Only show on step 0 */}
            {currentStep === 0 && (
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      AI Agent Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={formData.avatar_url} />
                          <AvatarFallback>
                            {formData.name ? formData.name.slice(0, 2).toUpperCase() : "AG"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {formData.name || "AI Agent Name"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ${formData.symbol || "SYMBOL"}
                          </p>
                        </div>
                      </div>

                      {formData.category && (
                        <Badge variant="secondary" className="w-fit">
                          {formData.category}
                        </Badge>
                      )}

                      <p className="text-sm text-muted-foreground break-words">
                        {formData.description || "AI Agent description will appear here..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}