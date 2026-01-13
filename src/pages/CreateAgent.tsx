import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles, Coins, TrendingUp, Info, AlertCircle, Check, Twitter, Link2, X, Rocket, Shield, Zap, Loader2, Clock } from "lucide-react";
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
import { useAdminSettings } from "@/hooks/useAdminSettings";
// Framework SDK removed - now model agnostic
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ExternalWalletRequired } from "@/components/ExternalWalletRequired";
import { ExternalWalletRequiredModal } from "@/components/ExternalWalletRequiredModal";
import { useSmartContractCreation } from "@/hooks/useSmartContractCreation";
import { useSmartContractCreationV8 } from "@/hooks/useSmartContractCreationV8";
import { CreatorPrebuyPanel } from "@/components/CreatorPrebuyPanel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { useAgentTokens } from "@/hooks/useAgentTokens";
import { useAccount } from 'wagmi';
import { calculateBuyReturn } from "@/lib/bondingCurveV7";
import { V7_CONSTANTS } from "@/lib/constants";
import { V8_CONSTANTS } from "@/lib/contractsV8";
import { retrySupabaseUpdate } from "@/lib/retryUtils";

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
  project_pitch: string; // Rich HTML content for "How it works" section
  prebuy_amount: number;
  // 🔒 MEV Protection Fields
  creation_locked: boolean;
  lock_duration_minutes: number;
  creator_prebuy_amount: number;
}

export default function CreateAgent() {
  const { toast } = useToast();

  const navigate = useNavigate();

  // Persist form progress so accidental refreshes don't wipe user input
  const DRAFT_KEY = 'create_agent_draft_v1';

  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { user, loading: authLoading, signIn } = useAuth();
  const { balance, loading: balanceLoading, deductTokens, addTestTokens, refundTokens } = useTokenBalance(user?.id);
  const { connectTwitter, disconnectTwitter, isConnecting, connectedAccount, setConnectedAccount } = useTwitterAuth();
  const { isTestMode: appIsTestMode } = useAppMode();
  const { isAdmin } = useUserRole();
  const { isConnected, promptBalance, hasExternalWallet, address: walletAddress } = usePrivyWallet();
  const { settings: adminSettings, isLoading: adminSettingsLoading } = useAdminSettings();
  
  // Smart contract creation hooks - V6 (legacy) and V8 (on-chain trading)
  const { deployAgentV6, executePrebuy, approvePrompt, isDeploying: isDeployingV6, isApproving: isApprovingV6, promptBalance: contractPromptBalance, allowance } = useSmartContractCreation();
  const { deployAgentV8, executePrebuyV8, isDeploying: isDeployingV8, isApproving: isApprovingV8 } = useSmartContractCreationV8();
  
  // Combined deploying/approving state
  const isDeploying = isDeployingV6 || isDeployingV8;
  const isApproving = isApprovingV6 || isApprovingV8;
  
  // Check if contracts are deployed (from localStorage)
  const promptTokenAddress = typeof window !== 'undefined' ? localStorage.getItem('promptTokenAddress') : null;
  const factoryAddress = typeof window !== 'undefined' ? localStorage.getItem('factoryAddress') : null;
  const CREATION_COST = 100;

  // Debug logging removed to prevent console spam during re-renders

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
    project_pitch: "",
    prebuy_amount: 0,
    // 🔒 MEV Protection Defaults
    creation_locked: false,
    lock_duration_minutes: 60, // Default 1 hour
    creator_prebuy_amount: 0
  });

  // Restore draft on first mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { formData?: Partial<AgentFormData>; currentStep?: number };
      if (!parsed?.formData) return;

      setFormData((prev) => ({
        ...prev,
        ...parsed.formData,
        // A local File can't be restored after refresh, so force re-upload.
        avatar_url: '',
      }));
      setAvatarFile(null);
      if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);

      toast({
        title: 'Draft restored',
        description: 'Your inputs were restored. Please re-upload the avatar before submitting.',
      });
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft continuously (cheap + prevents lost work)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          formData: {
            ...formData,
            // Never persist object URLs; they won't survive a refresh anyway.
            avatar_url: '',
          },
          currentStep,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // ignore quota / private mode
    }
  }, [formData, currentStep]);

  // Symbol validation states (after formData is declared)
  const [symbolAvailable, setSymbolAvailable] = useState<boolean | null>(null);
  const [checkingSymbol, setCheckingSymbol] = useState(false);
  const [deployMethod, setDeployMethod] = useState<'sequential' | 'atomic'>('sequential');
  const [approvalReady, setApprovalReady] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
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

    // Check for external wallet connection before proceeding
    if (!hasExternalWallet) {
      setShowWalletModal(true);
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
    
    // Get deployment mode early
    const deploymentMode = adminSettings?.deployment_mode || 'database';
    
    // For smart contract mode, check on-chain PROMPT balance
    // Factory charges 100 PROMPT, prebuy handled via trading-engine-v7
    if (deploymentMode === 'smart_contract') {
      const onChainBalance = parseFloat(contractPromptBalance || '0');
      const requiredPrompt = 100; // Factory fee
      if (onChainBalance < requiredPrompt) {
        toast({
          title: "Insufficient PROMPT",
          description: `You need ${requiredPrompt} PROMPT in your wallet. You have ${onChainBalance.toFixed(2)}.`,
          variant: "destructive"
        });
        return;
      }
      console.log('[CreateAgent] Smart contract mode - PROMPT balance check passed:', onChainBalance);
    } else {
      // Database mode - check test mode balance
      if (appIsTestMode && balance < totalCost) {
        const shortfall = totalCost - balance;
        toast({
          title: "Insufficient Balance",
          description: `You need ${shortfall} more $PROMPT tokens.`,
          variant: "destructive"
        });
        return;
      }
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

      // Calculate initial bonding curve price using V7 constants
      const initialPrice = V7_CONSTANTS.DEFAULT_P0; // Start at bonding curve beginning
      
      // Calculate creation expiry time if locked
      let creationExpiresAt = null;
      if (formData.creation_locked) {
        creationExpiresAt = new Date(Date.now() + (formData.lock_duration_minutes * 60 * 1000));
      }
      
      // ✅ V4 DYNAMIC PRICING: Fetch live FX rate
      const { data: fxData } = await supabase
        .from('prompt_fx')
        .select('fx_rate_usd')
        .order('asof', { ascending: false })
        .limit(1)
        .single();
      
      if (!fxData?.fx_rate_usd) {
        toast({
          title: "Error",
          description: "Unable to fetch current FX rate. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      const currentPromptUsdRate = fxData.fx_rate_usd;
      
      // Get graduation mode from admin settings
      const { data: graduationConfigData } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'graduation_config')
        .maybeSingle();
      
      const graduationConfig = graduationConfigData?.value as any;
      const graduationMode = graduationConfig?.graduation_mode || 'database';
      const targetMarketCapUsd = graduationMode === 'smart_contract' ? 65000 : null;
      
      // Get deployment mode early
      const deploymentMode = adminSettings?.deployment_mode || 'database';
      
      // 🎯 Use V8 constants for smart_contract mode, V7 for database mode
      const isV8Mode = deploymentMode === 'smart_contract';
      // V8 uses string values, V7 uses numbers - convert to string for DB
      const P0_str = isV8Mode ? V8_CONSTANTS.P0_STRING : String(V7_CONSTANTS.DEFAULT_P0);
      const P1_str = isV8Mode ? V8_CONSTANTS.P1_STRING : String(V7_CONSTANTS.DEFAULT_P1);
      const P0_num = isV8Mode ? parseFloat(V8_CONSTANTS.P0_STRING) : V7_CONSTANTS.DEFAULT_P0;
      const graduationThreshold = isV8Mode ? V8_CONSTANTS.GRADUATION_THRESHOLD : V7_CONSTANTS.GRADUATION_THRESHOLD;
      const pricingModel = isV8Mode ? 'bonding_curve_v8' : 'linear_v7';
      const effectiveGraduationMode = isV8Mode ? 'smart_contract' : graduationMode;
      
      // Create agent metadata record (required for both modes)
      // In smart_contract mode: metadata only, trading blocked until contract deployed
      // In database mode: full simulated token with database trading
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          name: formData.name,
          symbol: formData.symbol.toUpperCase(),
          description: formData.description,
          project_pitch: formData.project_pitch || null,
          category: formData.category,
          framework: formData.framework,
          website_url: formData.website_url || null,
          twitter_url: formData.twitter_url || null,
          avatar_url: finalAvatarUrl,
          total_supply: formData.total_supply,
          current_price: P0_num,
          market_cap: 0,
          creation_cost: CREATION_COST,
          prompt_raised: 0,
          // Database mode agents are active immediately; smart contract mode waits for deployment
          is_active: deploymentMode === 'database',
          creator_id: user.id,
          status: deploymentMode === 'database' ? 'ACTIVE' : 'ACTIVATING',
          test_mode: appIsTestMode,
          
          // ✅ V8/V7 PRICING FIELDS - mode-specific
          created_prompt_usd_rate: currentPromptUsdRate,
          created_p0: P0_num,
          created_p1: parseFloat(P1_str),
          graduation_mode: effectiveGraduationMode,
          target_market_cap_usd: targetMarketCapUsd,
          
          // ✅ V8 FLAG - CRITICAL for routing
          is_v8: isV8Mode,
          
          // ✅ Pricing model based on mode
          pricing_model: pricingModel,
          bonding_curve_supply: 0,
          migration_validated: true,
          
          // ✅ Graduation threshold - V8 uses 42160, V7 uses 42000
          graduation_threshold: graduationThreshold,
          
          // 🔒 MEV PROTECTION & DEPLOYMENT
          creation_locked: formData.creation_locked,
          creation_expires_at: creationExpiresAt,
          creator_prebuy_amount: formData.creator_prebuy_amount,
          creation_mode: deploymentMode,
          deployment_status: deploymentMode === 'smart_contract' ? 'pending' : 'not_deployed',
          
          // ✅ Creator & Deployment Info
          creator_wallet_address: walletAddress || null,
          deployment_method: deploymentMode === 'smart_contract' ? 'factory' : null,
          
          // ✅ On-chain fields initialized for V8
          on_chain_supply: 0,
          on_chain_reserve: 0,
          on_chain_price: isV8Mode ? P0_num : null,
          
          // 🎓 Graduation should ONLY occur after threshold is reached
          token_graduated: false,
          graduation_phase: 'not_started',
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        if (error.code === '23505' && error.message?.includes('symbol')) {
          toast({ 
            title: "Creation Failed", 
            description: "This symbol is already used on the platform.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Creation Failed", 
            description: "Failed to create AI Agent.", 
            variant: "destructive" 
          });
        }
        return;
      }

      const agentId = data.id;
      let deployedTokenAddress: string | undefined;

      // 📈 V8 Smart Contract Integration (on-chain trading)
      if (deploymentMode === 'smart_contract') {
        console.log('[CreateAgent] V8 Smart Contract Mode: Deploying via user wallet...');
        try {
          // V8 Flow: User wallet calls AgentFactoryV8.createAgent(agentId, name, symbol, creator)
          // Factory charges 100 PROMPT and deploys PrototypeToken registered with V8 bonding curve
          const deployResult = await deployAgentV8({
            id: agentId, // Required for V8 - links on-chain to database
            name: formData.name,
            symbol: formData.symbol.toUpperCase(),
          });

          if (deployResult.success && deployResult.tokenAddress) {
            console.log('[CreateAgent] V8 deployment successful:', deployResult);
            deployedTokenAddress = deployResult.tokenAddress;
            
            // CRITICAL: Update agent with V8 token address + tx hash
            // Uses retry logic to ensure database sync succeeds
            const { error: updateError } = await retrySupabaseUpdate(
              async () => {
                const result = await supabase
                  .from('agents')
                  .update({ 
                    // V8 uses prototype_token_address instead of token_contract_address
                    prototype_token_address: deployResult.tokenAddress,
                    token_address: deployResult.tokenAddress,
                    deployment_tx_hash: deployResult.txHash,
                    deployment_status: 'deployed',
                    deployment_method: 'factory',
                    deployed_at: new Date().toISOString(),
                    creator_wallet_address: walletAddress || null,
                    status: 'ACTIVE',
                    token_graduated: false,
                    is_active: true,
                    // V8 on-chain fields
                    on_chain_supply: 0,
                    on_chain_reserve: 0,
                    on_chain_price: parseFloat(V8_CONSTANTS.P0_STRING),
                  })
                  .eq('id', agentId);
                return result;
              },
              { maxRetries: 5, initialDelayMs: 500 }
            );

            if (updateError) {
              console.error('[CreateAgent] CRITICAL: Failed to update agent after all retries:', updateError);

              // Last resort: Call sync function to recover
              try {
                console.log('[CreateAgent] Attempting recovery via sync-agent-deployment...');
                await supabase.functions.invoke('sync-agent-deployment', {
                  body: {
                    agentId,
                    txHash: deployResult.txHash,
                    tokenAddress: deployResult.tokenAddress,
                    isV8: true
                  }
                });
                console.log('[CreateAgent] Recovery sync initiated');
              } catch (syncError) {
                console.error('[CreateAgent] Recovery sync also failed:', syncError);
              }

              // Show user the contract address so they can recover manually if needed
              toast({
                title: "Database Sync Issue",
                description: `V8 Contract deployed at ${deployResult.tokenAddress}. If issues persist, contact support with this address.`,
                variant: "destructive",
                duration: 30000,
              });
            } else {
              toast({
                title: "V8 Agent Token Deployed!",
                description: `Prototype token at: ${deployResult.tokenAddress.slice(0, 10)}...${deployResult.tokenAddress.slice(-8)}`,
              });
            }

            // V8: Execute prebuy via V8 bonding curve if specified
            if (formData.prebuy_amount && formData.prebuy_amount > 0) {
              console.log('[CreateAgent] Executing V8 prebuy:', formData.prebuy_amount);
              const prebuySuccess = await executePrebuyV8(agentId, formData.prebuy_amount);
              if (prebuySuccess) {
                toast({
                  title: "V8 Prebuy Successful!",
                  description: `Purchased ${formData.prebuy_amount} PROMPT worth of ${formData.symbol}`,
                });
              }
            }
          } else {
            // Deployment failed but continue with database mode
            console.error('[CreateAgent] V8 deployment failed:', deployResult.error);
            toast({
              title: "V8 Contract Deployment Failed",
              description: deployResult.error || "Falling back to database mode.",
              variant: "destructive"
            });
            
            // Update agent to database mode on failure - clear deployment_status
            await supabase
              .from('agents')
              .update({ 
                creation_mode: 'database',
                is_v8: false, // Revert V8 flag on failure
                token_graduated: false,
                status: 'ACTIVE',
                deployment_status: 'failed',
                is_active: true
              })
              .eq('id', agentId);
          }
        } catch (error) {
          console.error('[CreateAgent] V8 smart contract deployment error:', error);
          toast({
            title: "V8 Deployment Error",
            description: "Falling back to database mode. Your agent has been created.",
            variant: "destructive"
          });
          
          // Update agent to database mode on failure - clear deployment_status
          await supabase
            .from('agents')
            .update({ 
              creation_mode: 'database',
              is_v8: false, // Revert V8 flag on failure
              token_graduated: false,
              status: 'ACTIVE',
              deployment_status: 'failed',
              is_active: true
            })
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
      if (deploymentMode === 'database' && formData.prebuy_amount && formData.prebuy_amount > 0) {
        console.log(`🚀 Executing pre-buy: ${formData.prebuy_amount} PROMPT for ${formData.symbol}`);
        
        toast({
          title: "Executing pre-buy...",
          description: `Purchasing ${formData.prebuy_amount} PROMPT worth of ${formData.symbol} tokens`,
        });

        try {
          const { data: tradeData, error: tradeError } = await supabase.functions.invoke(
            'execute-bonding-curve-trade-v4',
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
        description: `${formData.name} token has been created${formData.prebuy_amount > 0 ? ' and pre-buy executed' : ''}.`,
      });

      // Clear draft now that creation finished successfully
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      
      // Navigate to success page with options
      navigate(`/agent-created/${agentId}`, {
        state: {
          agentName: formData.name,
          agentSymbol: formData.symbol.toUpperCase(),
          tokenAddress: deployedTokenAddress,
          prebuyAmount: formData.prebuy_amount
        }
      });
      
    } catch (error: any) {
      console.error('Creation error:', error);
      
      toast({ 
        title: "Error", 
        description: "Something went wrong during agent creation.", 
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

  // Show loading state for authentication and admin settings
  if (authLoading || adminSettingsLoading) {
    console.log('Showing loading state', { authLoading, adminSettingsLoading, balanceLoading });
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {authLoading ? 'Authenticating...' : 'Loading admin settings...'}
          </p>
        </div>
      </div>
    );
  }

  // Show login required state
  // Show onboarding guide if user not properly set up
  if (!user || !isConnected) {
    return (
      <div className="min-h-screen relative">
        <Header />
        <AnimatedBackground />
        <div className="container mx-auto px-4 py-8 pb-32 relative z-10">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-foreground">
                Create A New AI Agent
              </h1>
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

  const estimatedMarketCap = 0; // Will be determined by bonding curve

  // Progress steps - Simplified flow for speed
  const steps = [
    "Basic Details",
    "Project Pitch", 
    "Tokenomics",
    "Launch"
  ];

  return (
    <div className="min-h-screen relative">
      <Header />
      <AnimatedBackground />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-4 text-foreground">
              Create A New AI Agent
            </h1>
            <p className="text-base sm:text-xl text-foreground flex items-center justify-center gap-2">
              Launch your AI Agent on Base
              <img 
                src="/lovable-uploads/653131a0-191a-4ba3-9126-6f9aef2d6a80.png" 
                alt="Base logo" 
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </p>
          </div>

          {/* Informational Banner for Email-Only Users */}
          {user && !hasExternalWallet && (
            <Alert className="mb-4 sm:mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
              <Coins className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-900 dark:text-orange-200">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium text-sm sm:text-base">💡 Connect a wallet to create agents</p>
                    <p className="text-xs sm:text-sm mt-1">Creating agents requires 100 PROMPT tokens. Connect an external wallet like MetaMask to get started.</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}


          {/* Progress Bar - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            {/* Mobile: Compact progress */}
            <div className="flex sm:hidden items-center justify-between mb-3 px-2">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                      index <= currentStep 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-foreground/30 text-foreground'
                    }`}>
                      {index < currentStep ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 -mx-1 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="sm:hidden text-center">
              <p className="text-sm font-medium text-primary">{steps[currentStep]}</p>
              <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
            </div>
            
            {/* Desktop: Full progress */}
            <div className="hidden sm:flex items-center justify-center mb-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentStep 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-foreground/30 text-foreground'
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
            <div className="hidden sm:flex justify-center mt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
          </div>


          {/* Token Balance & Cost Display */}
          <div className="mb-6 sm:mb-8 flex justify-center px-2">
            <Alert className="w-full sm:w-fit">
              <Coins className="h-4 w-4 shrink-0" />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                   <span>
                     Balance: 
                     {balanceLoading ? (
                       <span className="inline-flex items-center gap-1 ml-1">
                         <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                         <strong>Loading...</strong>
                       </span>
                     ) : (
                       <strong> {appIsTestMode ? balance : promptBalance} $PROMPT</strong>
                     )}
                   </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Cost: <strong>{CREATION_COST} tokens</strong></span>
                  {appIsTestMode && !balanceLoading && balance > 0 && balance < CREATION_COST && (
                    <span className="text-destructive">Insufficient!</span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Test Token Button */}
          {appIsTestMode && !balanceLoading && balance > 0 && balance < CREATION_COST && (
            <div className="mb-6 sm:mb-8 flex justify-center">
              <Button 
                onClick={() => addTestTokens(5000)}
                variant="outline" 
                className="text-primary border-primary hover:bg-primary/10"
              >
                Get 5,000 Test Tokens
              </Button>
            </div>
          )}

          {/* Form - full width centered */}
          <div className="space-y-4 sm:space-y-6">
              
              {/* Step 0: AI Agent Details */}
              {currentStep === 0 && (
                <>
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Agent Details
                      </CardTitle>
                      <CardDescription className="text-foreground/80">
                        Define your AI Agent's identity and purpose
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="avatar">AI Agent Avatar *</Label>
                        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-3">
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
                      </div>

                      <div>
                        <Label htmlFor="name">AI Agent Name *</Label>
                        <Textarea
                          id="name"
                          placeholder="e.g. Personal Life Manager with Telegram, Google Services & Voice-Enabled AI"
                          value={formData.name}
                          onChange={(e) => {
                            if (e.target.value.length <= 100) {
                              handleInputChange('name', e.target.value);
                            }
                          }}
                          rows={2}
                          maxLength={100}
                          className="resize-none"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-muted-foreground">
                            Be descriptive - include key features & integrations
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formData.name.length} / 100
                          </p>
                        </div>
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
                          className="max-w-[200px]"
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
                      
                      <div>
                        <Label htmlFor="description">Card Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your AI Agent does, its capabilities, and unique features..."
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={4}
                          maxLength={100}
                        />
                        <div className="flex justify-end mt-1">
                          <p className="text-xs text-foreground/80">
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
                        <p className="text-xs text-foreground/80 mt-1">
                          You can change this later in the Agent Dashboard
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Socials */}
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Socials
                      </CardTitle>
                      <CardDescription className="text-foreground/80">
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

                  {/* AI Agent Preview - Inline after Socials */}
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        AI Agent Preview
                      </CardTitle>
                      <CardDescription className="text-foreground/80">
                        Preview how your agent will appear in the marketplace
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-sm mx-auto">
                        {/* Preview Card matching AgentMarketplaceCard style */}
                        <div className="p-5 border border-border rounded-xl bg-card">
                          {/* Integration boxes row - 4 boxes like n8n */}
                          <div className="flex items-center gap-2 mb-4">
                            {/* Box 1 */}
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">1</span>
                            </div>
                            {/* Box 2 */}
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">2</span>
                            </div>
                            {/* Box 3 */}
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">3</span>
                            </div>
                            {/* Box 4 - Overflow indicator */}
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">+X</span>
                            </div>
                          </div>

                          {/* Agent name */}
                          <h3 className="font-semibold text-foreground mb-3 line-clamp-2">
                            {formData.name || "AI Agent Name"}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                            {formData.description || "Agent description will appear here..."}
                          </p>

                          {/* Creator with avatar */}
                          <div className="flex items-center gap-2">
                            {formData.avatar_url ? (
                              <div className="w-6 h-6 rounded-full overflow-hidden">
                                <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <span className="text-[10px] font-medium text-primary">
                                  {formData.symbol ? formData.symbol.slice(0, 2) : "AG"}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-foreground/80">
                              ${formData.symbol || "SYMBOL"}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-foreground/80 text-center mt-3">
                          Add integrations later in the Agent Dashboard
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 0 Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!formData.name || !formData.symbol || !formData.description || !formData.category}
                      className="flex-1 bg-gradient-primary hover:opacity-90 order-1 sm:order-2"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 1: Project Pitch */}
              {currentStep === 1 && (
                <>
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Project Pitch
                      </CardTitle>
                      <CardDescription className="text-foreground/80">
                        Create a compelling pitch for your AI Agent. This will appear in the "How it works" section on your agent's showcase page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="project_pitch" className="flex items-center gap-1 mb-2">
                          Project Pitch <span className="text-red-500">*</span>
                        </Label>
                        <RichTextEditor
                          id="project_pitch"
                          value={formData.project_pitch}
                          onChange={(value) => handleInputChange('project_pitch', value)}
                          placeholder="Describe how your AI Agent works, its key features, and step-by-step usage instructions..."
                          maxLength={5000}
                          showCharacterCount={true}
                        />
                        <p className="text-xs text-foreground/80 mt-2">
                          Explain your agent's functionality, including key features, step-by-step instructions, and any important details.
                        </p>
                      </div>

                      <p className="text-xs text-foreground/80 mt-2">
                        You can add a detailed AI Agent Whitepaper later in the Agent Dashboard Marketing tab.
                      </p>
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
                      disabled={!formData.project_pitch.trim() || formData.project_pitch === '<p><br></p>'}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Tokenomics */}
              {currentStep === 2 && (
                <>
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Tokenomics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-muted/50 p-6 rounded-lg border border-border">
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
                            <p className="text-sm text-foreground/80 ml-6">
                              1,000,000,000 tokens (non-configurable)
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Token Allocation</span>
                            </div>
                            <p className="text-sm text-foreground/80 ml-6">
                              14% LP (locked 3 years) • 45% Team (vesting & milestone unlocks) • 5% Ecosystem • 36% Variable Pool
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">Liquidity Locked</span>
                            </div>
                            <p className="text-sm text-foreground/80 ml-6">
                              LP locked for 3 years
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Bonding Curve</span>
                            </div>
                            <p className="text-sm text-foreground/80 ml-6">
                              Graduates at 42K $PROMPT raised
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Trading Fee</span>
                            </div>
                            <p className="text-sm text-foreground/80 ml-6">
                              5% fee (50% Creator, 50% Platform)
                            </p>
                          </div>
                        </div>
                      </div>


                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>PROMPT PROTOCOL:</strong> Your agent launches with a fixed 1B token supply on a bonding curve. 
                          Graduates at 42K $PROMPT raised. 
                          Fair launch with transparent token allocation.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* Step 2 Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex-1 order-2 sm:order-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-gradient-primary hover:opacity-90 order-1 sm:order-2"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Launch */}
              {currentStep === 3 && (
                <>
                  <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Launch
                      </CardTitle>
                      <CardDescription className="text-foreground/80">
                        Launch your AI Agent on the bonding curve
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {/* AI Agent Summary */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                            <AvatarImage src={formData.avatar_url} />
                            <AvatarFallback>{formData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold truncate">{formData.name}</h3>
                            <p className="text-foreground/80 text-sm">${formData.symbol}</p>
                            <Badge variant="secondary" className="text-xs">{formData.category}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                          <div>
                            <p className="font-medium text-xs sm:text-sm">Total Supply:</p>
                            <p className="text-foreground/80 text-xs sm:text-sm">{formData.total_supply.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="font-medium text-xs sm:text-sm">Initial Price (per token):</p>
                            <p className="text-foreground/80 text-xs sm:text-sm">0.00004 PROMPT</p>
                          </div>
                          <div>
                            <p className="font-medium text-xs sm:text-sm">Graduation Price (per token):</p>
                            <p className="text-foreground/80 text-xs sm:text-sm">0.0003 PROMPT</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2 text-sm">Description:</p>
                          <p className="text-xs sm:text-sm text-foreground/80 break-words">{formData.description}</p>
                        </div>
                      </div>


                       {/* Pre-buy Section */}
                      <div className="border-t pt-4 sm:pt-6">
                        <div className="mb-4">
                          <h3 className="text-base sm:text-lg font-semibold mb-2">Pre-buy Your Token (Optional)</h3>
                          <p className="text-xs sm:text-sm text-foreground/80">
                            Purchase your agent's tokens at launch price before they become available to others.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-4">
                            {!user ? (
                              <div className="p-4 border border-dashed rounded-lg text-center">
                              <p className="text-sm text-foreground/80 mb-3">
                                  Wallet connection required for pre-buy
                                </p>
                                <p className="text-xs text-foreground/80">
                                  You can connect when launching your agent
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                 <div className="p-3 bg-muted rounded-lg">
                                   {appIsTestMode ? (
                                     <>
                                       <div className="text-sm text-foreground/80">Your $PROMPT Balance</div>
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
                                       <div className="text-sm text-foreground/80">Your $PROMPT Balance</div>
                                       <div className="text-lg font-semibold text-green-600">
                                         {balance.toLocaleString()} $PROMPT
                                       </div>
                                       <p className="text-sm text-foreground/80 mt-2">
                                         Wallet connected • Production mode
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <div className="text-sm text-foreground/80">Wallet Required</div>
                                       <div className="text-lg font-semibold text-orange-600">
                                         Wallet Connection Required
                                       </div>
                                       <p className="text-sm text-foreground/80 mt-2">
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
                                      onClick={() => handleInputChange('prebuy_amount', Math.min(adminSettings?.max_prebuy_amount || 1000, Math.max(0, balance - 100)))}
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
                                     max={Math.min(adminSettings?.max_prebuy_amount || 1000, Math.max(0, balance - 100))}
                                   />
                                   <div className="text-sm text-foreground/80">
                                     Amount in $PROMPT (Max: {Math.min(adminSettings?.max_prebuy_amount || 1000, Math.max(0, balance - 100))})
                                  </div>
                                  {formData.prebuy_amount > 0 && (() => {
                                    const buyResult = calculateBuyReturn(0, formData.prebuy_amount);
                                    const percentOfTradeable = (buyResult.sharesOut / V7_CONSTANTS.TRADEABLE_CAP) * 100;
                                    return (
                                      <div className="text-sm text-foreground/80 space-y-1">
                                        <div className="font-bold text-foreground">You'll receive: ~{Math.floor(buyResult.sharesOut).toLocaleString()} ${formData.symbol || 'tokens'}</div>
                                        <div className="text-xs text-muted-foreground">
                                          ({percentOfTradeable.toFixed(2)}% of tradeable supply • 5% fee: {buyResult.fee.toFixed(2)} PROMPT)
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-medium mb-2">Pre-buy Benefits</h4>
                              <ul className="text-sm text-foreground/80 space-y-1">
                                <li>• Get tokens at the initial launch price</li>
                                <li>• Secure your position before public launch</li>
                                <li>• Support your agent's initial liquidity</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="border-t pt-4 sm:pt-6">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Payment Summary</h3>
                        <div className="p-3 sm:p-4 border rounded-lg">
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span>Creation Fee:</span>
                              <span className="font-medium">100 $PROMPT</span>
                            </div>
                            {formData.prebuy_amount > 0 && (
                              <div className="flex justify-between">
                                <span>Pre-buy:</span>
                                <span className="font-medium">{formData.prebuy_amount} $PROMPT</span>
                              </div>
                            )}
                            <hr />
                            <div className="flex justify-between font-medium text-sm sm:text-base">
                              <span>Total:</span>
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
                   <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                     {(() => {
                        const totalCost = (adminSettings?.creation_fee || CREATION_COST) + formData.prebuy_amount;
                        const deploymentMode = adminSettings?.deployment_mode || 'database';
                       return (
                         <>
                           <Button
                             onClick={() => setCurrentStep(2)}
                             variant="outline"
                             className="flex-1 order-2 sm:order-1"
                           >
                             Back
                           </Button>
                            <Button
                              onClick={handleCreateAgent}
                              className="flex-1 bg-gradient-primary hover:opacity-90 text-white order-1 sm:order-2"
                              disabled={isCreating || isDeploying || !user || (appIsTestMode && balance < totalCost)}
                            >
                              {(isCreating || isDeploying) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : deploymentMode === 'smart_contract' ? (
                                <Shield className="h-4 w-4 mr-2" />
                              ) : (
                                <Rocket className="h-4 w-4 mr-2" />
                              )}
                              <span className="truncate">
                                {(isCreating || isDeploying)
                                  ? "Creating..."
                                  : `Create (${totalCost} $PROMPT)`
                                }
                              </span>
                            </Button>
                          </>
                        );
                      })()}
                   </div>
                 </>
               )}

          </div>
        </div>
      </div>

      {/* External Wallet Required Modal */}
      <ExternalWalletRequiredModal 
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        title="Connect Wallet to Create Agent"
        description="Creating an agent requires 100 PROMPT tokens. Connect an external wallet to continue."
        actionRequired="Agent Creation"
      />

      <Footer />
    </div>
  );
}