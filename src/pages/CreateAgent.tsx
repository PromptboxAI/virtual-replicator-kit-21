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
import { Upload, Sparkles, Coins, TrendingUp, Info, AlertCircle, Check, Twitter, Link2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { user, loading: authLoading, signIn } = useAuth();
  const { balance, loading: balanceLoading, deductTokens, addTestTokens, isTestMode } = useTokenBalance(user?.id);
  const { connectTwitter, disconnectTwitter, isConnecting, connectedAccount, setConnectedAccount } = useTwitterAuth();
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
        toast({ title: "Error", description: "Failed to create AI Agent", variant: "destructive" });
        return;
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
              You need to connect your wallet to create an AI Agent. Click below to get started.
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
    "AI Agent Details",
    "Project Pitch", 
    "Framework",
    "Socials",
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

              {/* Action Buttons */}
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
            </div>

            {/* Preview */}
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

                    <p className="text-sm text-muted-foreground">
                      {formData.description || "AI Agent description will appear here..."}
                    </p>

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