import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Sparkles, Coins, TrendingUp, Info, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

interface AgentFormData {
  name: string;
  symbol: string;
  description: string;
  category: string;
  website_url: string;
  twitter_url: string;
  avatar_url: string;
  total_supply: number;
  initial_price: number;
}

export default function CreateAgent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { user, loading: authLoading, signIn } = useAuth();
  const { balance, loading: balanceLoading, deductTokens, addTestTokens, isTestMode } = useTokenBalance(user?.id);
  const CREATION_COST = 100;

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    symbol: "",
    description: "",
    category: "",
    website_url: "",
    twitter_url: "",
    avatar_url: "",
    total_supply: 1000000,
    initial_price: 0.01,
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
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Agent name is required", variant: "destructive" });
      return false;
    }
    if (!formData.symbol.trim()) {
      toast({ title: "Error", description: "Token symbol is required", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Error", description: "Agent description is required", variant: "destructive" });
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
        description: "You must be logged in to create an agent",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) return;
    
    // Check token balance and deduct tokens
    const success = await deductTokens(CREATION_COST);
    if (!success) return;
    
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
            description: "Avatar upload failed, but agent will be created without an avatar", 
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
          website_url: formData.website_url || null,
          twitter_url: formData.twitter_url || null,
          avatar_url: finalAvatarUrl,
          total_supply: formData.total_supply,
          current_price: formData.initial_price,
          market_cap: formData.total_supply * formData.initial_price,
          creation_cost: CREATION_COST,
          is_active: true,
          creator_id: user.id,
          status: 'ACTIVATING',
        }]);

      if (error) {
        console.error('Database error:', error);
        toast({ title: "Error", description: "Failed to create agent", variant: "destructive" });
        return;
      }

      toast({ 
        title: "Success!", 
        description: `${formData.name} has been created successfully! (${CREATION_COST} tokens deducted)`,
      });
      
      // Navigate back to home to see the new agent
      navigate('/');
      
    } catch (error) {
      console.error('Creation error:', error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state
  if (authLoading || balanceLoading) {
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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Wallet Connection Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to connect your wallet to create an agent. Click below to get started.
            </p>
            <Button onClick={signIn}>Connect Wallet</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const estimatedMarketCap = formData.total_supply * formData.initial_price;

  // Progress steps
  const steps = [
    "Agent Details",
    "Token Economics", 
    "Launch Details",
    "Summary"
  ];
  const currentStep = 0; // Currently on first step

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-cyber bg-clip-text text-transparent">
                Create New Agent on Base
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
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-sm font-medium">{steps[currentStep]}</p>
                <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
          </div>

          {/* Standard Launch Info */}
          <div className="mb-8">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Standard Launch</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Tokenomics</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>87.5% (Public Sale)</div>
                      <div>12.5% (Liquidity Pool)</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Mechanism</h4>
                    <p className="text-sm text-muted-foreground">
                      Launch a brand new token directly. Your agent will be deployed on Base network with automated liquidity provisioning.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    {CREATION_COST} $PROMPT tokens non-refundable creation fee
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token Balance & Cost Display */}
          <div className="mb-8 flex justify-center">
            <Alert className="w-fit">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-4">
                  {isTestMode && <span className="text-primary font-medium">TEST MODE</span>}
                  <span>Your Balance: <strong>{balance} tokens</strong></span>
                  <span>•</span>
                  <span>Creation Cost: <strong>{CREATION_COST} tokens</strong></span>
                  {balance < CREATION_COST && (
                    <span className="text-destructive">• Insufficient tokens!</span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Test Token Button */}
          {isTestMode && balance < CREATION_COST && (
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
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Agent Details
                  </CardTitle>
                  <CardDescription>
                    Define your AI agent's identity and purpose
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Agent Name *</Label>
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
                      placeholder="Describe what your AI agent does, its capabilities, and unique features..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                    />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        placeholder="https://youragent.com"
                        value={formData.website_url}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter URL</Label>
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/youragent"
                        value={formData.twitter_url}
                        onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="avatar">Agent Avatar</Label>
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
                        className="flex items-center gap-2"
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
                </CardContent>
              </Card>

              {/* Token Economics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Token Economics
                  </CardTitle>
                  <CardDescription>
                    Configure your agent's token parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supply">Total Supply</Label>
                      <Input
                        id="supply"
                        type="number"
                        value={formData.total_supply}
                        onChange={(e) => handleInputChange('total_supply', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Initial Price (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.001"
                        value={formData.initial_price}
                        onChange={(e) => handleInputChange('initial_price', parseFloat(e.target.value) || 0)}
                        min="0.001"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium">Estimated Market Cap</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ${estimatedMarketCap.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  className="flex-1"
                >
                  {previewMode ? "Edit" : "Preview"}
                </Button>
                <Button
                  onClick={handleCreateAgent}
                  disabled={isCreating || balance < CREATION_COST}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {isCreating ? "Creating..." : 
                   balance < CREATION_COST ? `Need ${CREATION_COST - balance} more tokens` :
                   "Create Agent"}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Agent Preview
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
                          {formData.name || "Agent Name"}
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

                    <p className="text-sm text-muted-foreground">
                      {formData.description || "Agent description will appear here..."}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Initial Price:</span>
                        <span className="font-medium">${formData.initial_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Supply:</span>
                        <span className="font-medium">{formData.total_supply.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Cap:</span>
                        <span className="font-medium">${estimatedMarketCap.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}