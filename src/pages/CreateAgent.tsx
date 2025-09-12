import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Sparkles, Coins, TrendingUp, Info, AlertCircle, Check, Twitter, Link2, X, Code, Rocket, ExternalLink, Settings, Users, Brain, Shield, Zap, HelpCircle, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { useAppMode } from "@/hooks/useAppMode";
import { useUserRole } from "@/hooks/useUserRole";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { FrameworkSDKService, FRAMEWORK_CONFIGS } from "@/lib/frameworkSDK";
import { WalletConnectionGuard } from "@/components/WalletConnectionGuard";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { getPlainTextFromHTML } from "@/lib/utils";
// import { useAgentTokens } from "@/hooks/useAgentTokens";
import { useAccount } from 'wagmi';
import { getCurrentPriceV3, BONDING_CURVE_V3_CONFIG } from "@/lib/bondingCurveV3";

// Hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


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
  // 🔒 MEV Protection Fields
  creation_locked: boolean;
  lock_duration_minutes: number;
  creator_prebuy_amount: number;
  // 📈 Smart Contract Integration Fields
  creation_mode: 'database' | 'smart_contract';
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
  const { balance, loading: balanceLoading, deductTokens, addTestTokens, refundTokens } = useTokenBalance(user?.id);
  const { connectTwitter, disconnectTwitter, isConnecting, connectedAccount, setConnectedAccount } = useTwitterAuth();
  const { isTestMode: appIsTestMode } = useAppMode();
  const { isAdmin } = useUserRole();
  const { isConnected, promptBalance } = usePrivyWallet();
  // Note: Agent token creation is handled directly in the database for now
  
  // Check if contracts are deployed (from localStorage)
  const promptTokenAddress = typeof window !== 'undefined' ? localStorage.getItem('promptTokenAddress') : null;
  const factoryAddress = typeof window !== 'undefined' ? localStorage.getItem('factoryAddress') : null;
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
    // 🔒 MEV Protection Defaults
    creation_locked: false,
    lock_duration_minutes: 60, // Default 1 hour
    creator_prebuy_amount: 0,
    // 📈 Smart Contract Integration Defaults
    creation_mode: 'database', // Default to database mode
  });

  // Symbol validation states (after formData is declared)
  const [symbolAvailable, setSymbolAvailable] = useState<boolean | null>(null);
  const [checkingSymbol, setCheckingSymbol] = useState(false);
  const debouncedSymbol = useDebounce(formData.symbol, 500);

  const categories = [
    "Trading Bot",
    "DeFi Assistant", 
    "Content Creator",
    "Community Manager",
    "Analytics Agent",
    "Research Agent",
    "Gaming Agent",
    "Educational Agent",
    "Custom Agent"
  ];

  // Get frameworks from SDK with fallback descriptions
  const frameworks = Object.keys(FRAMEWORK_CONFIGS).reduce((acc, key) => {
    acc[key] = FRAMEWORK_CONFIGS[key].description;
    return acc;
  }, {} as Record<string, string>);

  // Only use frameworks from SDK that have actual deployment handlers
  const allFrameworks = frameworks;

  // Real-time symbol validation
  useEffect(() => {
    if (!debouncedSymbol || debouncedSymbol.length < 2) {
      setSymbolAvailable(null);
      return;
    }

    const checkSymbol = async () => {
      setCheckingSymbol(true);
      try {
        const { data } = await supabase
          .from('agents')
          .select('symbol')
          .eq('symbol', debouncedSymbol.toUpperCase())
          .maybeSingle();

        setSymbolAvailable(!data);
      } catch (error) {
        console.error('Symbol validation error:', error);
        setSymbolAvailable(null);
      } finally {
        setCheckingSymbol(false);
      }
    };

    checkSymbol();
  }, [debouncedSymbol]);

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
  }, [user?.id]);

  const handleInputChange = (field: keyof AgentFormData, value: string | number | boolean) => {
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

    // Require wallet connection for agent creation
    if (!isConnected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to create agents",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) return;

    // PRE-VALIDATION: Check symbol uniqueness BEFORE deducting tokens
    try {
      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select('symbol')
        .eq('symbol', formData.symbol.toUpperCase())
        .maybeSingle();

      if (checkError) {
        toast({
          title: "Error",
          description: "Failed to validate symbol availability",
          variant: "destructive"
        });
        return;
      }

      if (existingAgent) {
        toast({
          title: "Symbol Already Used",
          description: `The symbol ${formData.symbol.toUpperCase()} is already used on this platform. Please choose a different one.`,
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Symbol validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate symbol availability",
        variant: "destructive"
      });
      return;
    }

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
    
    // NOW deduct tokens after validation passes
    let tokensDeducted = false;
    if (appIsTestMode) {
      const success = await deductTokens(totalCost);
      if (!success) return;
      tokensDeducted = true;
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

      // Calculate initial bonding curve price
      const initialPrice = getCurrentPriceV3(0); // Start at bonding curve beginning
      
      // Calculate creation expiry time if locked
      let creationExpiresAt = null;
      if (formData.creation_locked) {
        creationExpiresAt = new Date(Date.now() + (formData.lock_duration_minutes * 60 * 1000));
      }
      
      // Create basic agent/token record in database first
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
          current_price: initialPrice, // Use actual bonding curve price
          market_cap: 0, // Will be calculated based on trading
          creation_cost: CREATION_COST,
          prompt_raised: 0, // Start with 0 PROMPT raised
          is_active: false, // Not active until AI is configured
          creator_id: user.id,
          status: 'ACTIVATING', // Agent is being set up
          test_mode: appIsTestMode, // Set based on current app mode
          
          // ✅ V3 BONDING CURVE FIELDS
          pricing_model: 'linear_v3',           // Use V3 linear bonding curve
          bonding_curve_supply: 0,              // Initialize token supply at 0
          migration_validated: true,            // No migration needed - native V3
          
          // 🔒 MEV PROTECTION FIELDS
          creation_locked: formData.creation_locked,
          creation_expires_at: creationExpiresAt,
          creator_prebuy_amount: formData.creator_prebuy_amount,
          creation_mode: formData.creation_mode,
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // REFUND tokens if they were deducted
        if (tokensDeducted) {
          await refundTokens(totalCost);
        }
        
        if (error.code === '23505' && error.message?.includes('symbol')) {
          toast({ 
            title: "Creation Failed", 
            description: "This symbol is already used on the platform. Your tokens have been refunded.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Creation Failed", 
            description: `Failed to create AI Agent${tokensDeducted ? '. Your tokens have been refunded' : ''}.`, 
            variant: "destructive" 
          });
        }
        return;
      }

      const agentId = data.id;

      // 📈 PHASE 3.2: Smart Contract Integration
      // Handle deployment based on selected mode
      if (formData.creation_mode === 'smart_contract') {
        try {
          toast({
            title: "Deploying Smart Contract...",
            description: "Creating agent token with atomic MEV protection",
          });

          // Call atomic deployment function
          const { data: deploymentData, error: deploymentError } = await supabase.functions.invoke(
            'deploy-agent-atomic',
            {
              body: {
                agent_id: agentId,
                name: formData.name,
                symbol: formData.symbol.toUpperCase(),
                creator_address: user.id, // Will be mapped to wallet address
                prebuy_amount: formData.prebuy_amount || 0
              }
            }
          );

          if (deploymentError || !deploymentData?.success) {
            console.error('Smart contract deployment failed:', deploymentError);
            throw new Error(deploymentError?.message || 'Smart contract deployment failed');
          }

          toast({
            title: "Smart Contract Deployed!",
            description: `Token deployed at: ${deploymentData.contract_address}`,
          });

          if (deploymentData.tokens_received && parseFloat(deploymentData.tokens_received) > 0) {
            toast({
              title: "Atomic Prebuy Successful!",
              description: `Received ${parseFloat(deploymentData.tokens_received).toLocaleString()} ${formData.symbol} tokens`,
            });
          }

        } catch (error) {
          console.error('Smart contract deployment error:', error);
          toast({
            title: "Smart Contract Deployment Failed",
            description: "Falling back to database mode. Your agent has been created.",
            variant: "destructive"
          });
          
          // Update agent to database mode on failure
          await supabase
            .from('agents')
            .update({ creation_mode: 'database' })
            .eq('id', agentId);
        }
      } else {
        // Database mode - show info about creation
        toast({
          title: "Agent Created Successfully", 
          description: `Database mode with initial price: ${initialPrice.toFixed(8)} PROMPT per token`,
          variant: "default"
        });
      }

      // Initialize agent runtime status for future configuration
      try {
        const { error: runtimeError } = await supabase
          .from('agent_runtime_status')
          .insert([{
            agent_id: agentId,
            is_active: false,
            current_goal: `Awaiting AI configuration for ${formData.name}`,
            performance_metrics: {},
            revenue_generated: 0,
            tasks_completed: 0
          }]);

        if (runtimeError) {
          console.error('Failed to initialize runtime status:', runtimeError);
        }
      } catch (error) {
        console.error('Runtime initialization error:', error);
      }

      // PHASE 2.1: Execute Pre-buy After Creation (Database Mode Only)
      // For smart contract mode, prebuy is handled atomically above
      if (formData.creation_mode === 'database' && formData.prebuy_amount && formData.prebuy_amount > 0) {
        console.log(`🚀 Executing pre-buy: ${formData.prebuy_amount} PROMPT for ${formData.symbol}`);
        
        toast({
          title: "Executing pre-buy...",
          description: `Purchasing ${formData.prebuy_amount} PROMPT worth of ${formData.symbol} tokens`,
        });

        try {
          const { data: tradeData, error: tradeError } = await supabase.functions.invoke(
            'execute-bonding-curve-trade-v3',
            {
              body: {
                agentId: agentId,
                userId: user.id,
                tradeType: 'buy',
                promptAmount: formData.prebuy_amount,
                automated: false,
                userApproved: true
              }
            }
          );

          if (tradeError) {
            console.error('Pre-buy trade failed:', tradeError);
            toast({
              title: "Pre-buy Failed",
              description: `Agent created but pre-buy failed: ${tradeError.message}. You can buy tokens manually.`,
              variant: "destructive",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/agent/${agentId}`)}
                >
                  Go to Agent
                </Button>
              )
            });
          } else if (tradeData?.success) {
            const tokensReceived = tradeData.tokens_bought || tradeData.token_amount || 0;
            toast({
              title: "Pre-buy Successful!",
              description: `Purchased ${tokensReceived.toLocaleString()} ${formData.symbol} tokens`,
            });
            console.log(`✅ Pre-buy completed: ${tokensReceived} tokens received`);
          } else {
            console.warn('Pre-buy returned unexpected response:', tradeData);
            toast({
              title: "Pre-buy Status Unknown",
              description: "Pre-buy completed but status unclear. Check your holdings on the agent page.",
              variant: "default"
            });
          }
        } catch (error) {
          console.error('Pre-buy execution error:', error);
          toast({
            title: "Pre-buy Error",
            description: "Agent created but pre-buy encountered an error. You can buy tokens manually.",
            variant: "destructive"
          });
        }
      }

      toast({ 
        title: "Token Created Successfully!", 
        description: `${formData.name} token has been created${formData.prebuy_amount > 0 ? ' and pre-buy executed' : ''}. Now configure your AI agent.`,
      });
      
      // Navigate to agent page to configure AI
      navigate(`/agent/${agentId}`);
      
    } catch (error: any) {
      console.error('Creation error:', error);
      
      // REFUND tokens if they were deducted
      if (tokensDeducted) {
        await refundTokens(totalCost);
      }
      
      toast({ 
        title: "Error", 
        description: `Something went wrong${tokensDeducted ? '. Your tokens have been refunded' : ''}.`, 
        variant: "destructive" 
      });
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
  // Show onboarding guide if user not properly set up
  if (!user || !isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Create AI Agent</h1>
              <p className="text-muted-foreground mb-8">
                Get started by setting up your account and connecting your wallet.
              </p>
            </div>
            <OnboardingGuide />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('Rendering main CreateAgent form');

  const estimatedMarketCap = 0; // Will be determined by bonding curve

  // Progress steps - Simplified flow for speed
  const steps = [
    "Basic Details",
    "Project Pitch", 
    "Framework",
    "Tokenomics",
    "Launch"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WalletConnectionGuard 
        title="External Wallet Required for Agent Creation"
        description="Creating an AI agent requires an external wallet to handle token transactions and payments."
      >
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
                     Your Balance: 
                     {balanceLoading ? (
                       <span className="inline-flex items-center gap-1 ml-1">
                         <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                         <strong>Loading...</strong>
                       </span>
                     ) : (
                       <strong> {appIsTestMode ? balance : promptBalance} $PROMPT</strong>
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
                            type="text"
                            placeholder="e.g. ALPHA"
                            value={formData.symbol}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                              handleInputChange('symbol', value);
                            }}
                           maxLength={10}
                          />
                          {/* Symbol validation feedback */}
                          {formData.symbol && (
                            <div className="mt-2 flex items-center gap-2">
                              {checkingSymbol && (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">Checking availability...</p>
                                </>
                              )}
                              {!checkingSymbol && symbolAvailable === false && (
                                <>
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                  <p className="text-sm text-destructive">This symbol is already used on this platform</p>
                                </>
                              )}
                              {!checkingSymbol && symbolAvailable === true && (
                                <>
                                  <Check className="h-4 w-4 text-green-500" />
                                  <p className="text-sm text-green-500">Symbol available on platform</p>
                                </>
                              )}
                            </div>
                          )}
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
                          className="mt-2 min-h-[300px]"
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
                          AI Agent Whitepaper <span className="text-red-500">*</span>
                        </Label>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-muted-foreground">
                            Provide comprehensive details about your AI Agent:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                            <li>• <strong>Capabilities:</strong> What can your agent do? What problems does it solve?</li>
                            <li>• <strong>Technology:</strong> How does it work? What frameworks or models does it use?</li>
                            <li>• <strong>Roadmap:</strong> What are your development plans and milestones?</li>
                            <li>• <strong>Partnerships:</strong> Any strategic collaborations or integrations?</li>
                            <li>• <strong>Tokenomics:</strong> How does your token create value for holders?</li>
                            <li>• <strong>Use Cases:</strong> Real-world applications and target markets</li>
                          </ul>
                        </div>
                        <RichTextEditor
                          id="agent_overview"
                          value={formData.agent_overview}
                          onChange={(value) => handleInputChange('agent_overview', value)}
                          placeholder="Provide comprehensive details about your AI Agent..."
                          className="mt-2"
                          maxLength={5000}
                          showCharacterCount={true}
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
                      disabled={!formData.short_pitch.trim() || !formData.agent_overview.trim() || getPlainTextFromHTML(formData.agent_overview).length > 5000}
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
                        Launch
                      </CardTitle>
                      <CardDescription>
                        Launch your AI Agent on the bonding curve
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

                       {/* Deployment Mode Selection */}
                      <div className="border-t pt-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Deployment Mode
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Choose how your agent token will be deployed and launched.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Database Mode */}
                            <Card className={`cursor-pointer border-2 transition-colors ${
                              formData.creation_mode === 'database' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleInputChange('creation_mode', 'database')}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    formData.creation_mode === 'database' 
                                      ? 'border-primary bg-primary' 
                                      : 'border-muted-foreground'
                                  }`} />
                                  <h4 className="font-semibold">Database Mode</h4>
                                  <Badge variant="outline" className="text-xs">Default</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Fast deployment with optional MEV protection through time locks.
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>Instant deployment</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>Optional MEV protection</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>Low gas costs</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Smart Contract Mode */}
                            <Card className={`cursor-pointer border-2 transition-colors ${
                              formData.creation_mode === 'smart_contract' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleInputChange('creation_mode', 'smart_contract')}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    formData.creation_mode === 'smart_contract' 
                                      ? 'border-primary bg-primary' 
                                      : 'border-muted-foreground'
                                  }`} />
                                  <h4 className="font-semibold">Smart Contract</h4>
                                  <Badge variant="secondary" className="text-xs">Ultimate MEV Protection</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Atomic deployment + prebuy in a single transaction.
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-blue-500" />
                                    <span>Atomic MEV protection</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-blue-500" />
                                    <span>Single transaction</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Code className="h-3 w-3 text-blue-500" />
                                    <span>On-chain verification</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>

                       {/* Pre-buy Section */}
                      <div className="border-t pt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Pre-buy Your Token (Optional)</h3>
                          <p className="text-sm text-muted-foreground">
                            Purchase your agent's tokens at launch price before they become available to others.
                            {formData.creation_mode === 'smart_contract' && (
                              <span className="block mt-1 text-primary font-medium">
                                Smart contract mode provides atomic MEV protection for your prebuy.
                              </span>
                            )}
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
                                   ) : isConnected ? (
                                     <>
                                       <div className="text-sm text-muted-foreground">Your $PROMPT Balance</div>
                                       <div className="text-lg font-semibold text-green-600">
                                         {balance.toLocaleString()} $PROMPT
                                       </div>
                                       <p className="text-sm text-muted-foreground mt-2">
                                         Wallet connected • Production mode
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <div className="text-sm text-muted-foreground">Wallet Required</div>
                                       <div className="text-lg font-semibold text-orange-600">
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
                                      You'll receive: ~{(formData.prebuy_amount / BONDING_CURVE_V3_CONFIG.P0).toLocaleString()} ${formData.symbol}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* 🔒 MEV PROTECTION SECTION */}
                          <div className="space-y-4">
                            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30 dark:bg-purple-950/30">
                              <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5 text-purple-600" />
                                <h4 className="font-medium text-purple-900 dark:text-purple-100">MEV Protection</h4>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 mr-3">
                                    <Label className="text-sm font-medium">Enable Creator Lock</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Prevent MEV attacks by restricting trading to you during the initial period
                                    </p>
                                  </div>
                                  <Switch
                                    checked={formData.creation_locked}
                                    onCheckedChange={(checked) => handleInputChange('creation_locked', checked)}
                                  />
                                </div>

                                {formData.creation_locked && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="lock_duration">Lock Duration</Label>
                                      <Select 
                                        value={formData.lock_duration_minutes.toString()} 
                                        onValueChange={(value) => handleInputChange('lock_duration_minutes', parseInt(value))}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="15">15 minutes</SelectItem>
                                          <SelectItem value="60">1 hour</SelectItem>
                                          <SelectItem value="240">4 hours</SelectItem>
                                          <SelectItem value="1440">24 hours</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="creator_prebuy">Creator Pre-buy (during lock)</Label>
                                      <Input
                                        id="creator_prebuy"
                                        type="number"
                                        value={formData.creator_prebuy_amount === 0 ? "" : formData.creator_prebuy_amount.toString()}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          handleInputChange('creator_prebuy_amount', value);
                                        }}
                                        placeholder="0"
                                        min="0"
                                        max="5000"
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Additional amount only you can buy during the lock period
                                      </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm">
                                          <p className="font-medium text-blue-900 dark:text-blue-100">Protection Active</p>
                                          <p className="text-blue-700 dark:text-blue-300">
                                            Only you can trade for {formData.lock_duration_minutes >= 60 ? 
                                              `${Math.floor(formData.lock_duration_minutes / 60)}h ${formData.lock_duration_minutes % 60}m` : 
                                              `${formData.lock_duration_minutes}m`} after launch
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
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
                       disabled={isCreating || balanceLoading || checkingSymbol || symbolAvailable === false}
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
      </WalletConnectionGuard>
      <Footer />
    </div>
  );
}