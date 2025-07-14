import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Users, Shield, MessageCircle, Save, RotateCcw, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommunityManagerConfig {
  platforms: string[];
  moderationRules: string[];
  responseStyle: string;
  autoModeration: boolean;
  escalationRules: boolean;
  activeHours: string[];
  responseTime: number;
  engagementTypes: string[];
  communityGrowth: boolean;
  contentCuration: boolean;
  eventManagement: boolean;
  analyticsTracking: boolean;
  customResponses: { [key: string]: string };
  toxicityThreshold: number;
  welcomeNewMembers: boolean;
  spamDetection: boolean;
}

interface ConfigurationProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description: string;
    avatar_url: string | null;
    category: string | null;
    framework: string | null;
    is_active: boolean;
  };
  onConfigurationUpdated: () => void;
}

const PLATFORMS = [
  'Discord', 'Telegram', 'Reddit', 'Twitter Spaces', 'Facebook Groups', 'LinkedIn Groups'
];

const MODERATION_RULES = [
  'No Spam', 'No NSFW Content', 'Be Respectful', 'No Self-Promotion', 'Stay On Topic', 
  'No FUD/Trolling', 'Use Appropriate Channels', 'No Personal Attacks'
];

const RESPONSE_STYLES = [
  { value: 'friendly', label: 'Friendly & Welcoming' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'helpful', label: 'Helpful & Educational' }
];

const ENGAGEMENT_TYPES = [
  'Welcome Messages', 'FAQ Responses', 'Event Announcements', 'Daily Check-ins', 
  'Community Challenges', 'Educational Content', 'News Updates'
];

const ACTIVE_HOURS = [
  '00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-24:00'
];

export function CommunityManagerConfiguration({ agent, onConfigurationUpdated }: ConfigurationProps) {
  const [config, setCommunityManagerConfig] = useState<CommunityManagerConfig>({
    platforms: ['Discord'],
    moderationRules: ['No Spam', 'Be Respectful'],
    responseStyle: 'friendly',
    autoModeration: true,
    escalationRules: true,
    activeHours: ['12:00-18:00', '18:00-24:00'],
    responseTime: 5,
    engagementTypes: ['Welcome Messages', 'FAQ Responses'],
    communityGrowth: true,
    contentCuration: true,
    eventManagement: false,
    analyticsTracking: true,
    customResponses: {
      welcome: 'Welcome to our community! Please read the rules and introduce yourself.',
      goodbye: 'Thanks for being part of our community!',
      violation: 'Please keep our community guidelines in mind.'
    },
    toxicityThreshold: 7,
    welcomeNewMembers: true,
    spamDetection: true
  });

  const [originalConfig, setOriginalConfig] = useState<CommunityManagerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, [agent.id]);

  useEffect(() => {
    if (originalConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }
  }, [config, originalConfig]);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('category', 'Community Manager')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedConfig = data.configuration as unknown as CommunityManagerConfig;
        setCommunityManagerConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      } else {
        setOriginalConfig(config);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error Loading Configuration",
        description: "Using default settings",
        variant: "destructive"
      });
      setOriginalConfig(config);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: 'Community Manager',
          configuration: config as any
        });

      if (error) throw error;

      setOriginalConfig(config);
      setHasChanges(false);
      onConfigurationUpdated();

      toast({
        title: "Community Manager Configuration Saved! 👥",
        description: "Your community manager configuration has been updated and will manage your community autonomously.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setCommunityManagerConfig(originalConfig);
      setHasChanges(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setCommunityManagerConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const toggleModerationRule = (rule: string) => {
    setCommunityManagerConfig(prev => ({
      ...prev,
      moderationRules: prev.moderationRules.includes(rule)
        ? prev.moderationRules.filter(r => r !== rule)
        : [...prev.moderationRules, rule]
    }));
  };

  const toggleEngagementType = (type: string) => {
    setCommunityManagerConfig(prev => ({
      ...prev,
      engagementTypes: prev.engagementTypes.includes(type)
        ? prev.engagementTypes.filter(t => t !== type)
        : [...prev.engagementTypes, type]
    }));
  };

  const toggleActiveHour = (hour: string) => {
    setCommunityManagerConfig(prev => ({
      ...prev,
      activeHours: prev.activeHours.includes(hour)
        ? prev.activeHours.filter(h => h !== hour)
        : [...prev.activeHours, hour]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community manager configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Community Manager Configuration</h2>
        <p className="text-muted-foreground">
          Configure your autonomous community management and moderation settings
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Configuration Status</h3>
              <p className="text-sm text-muted-foreground">
                {hasChanges ? "You have unsaved changes" : "Configuration is up to date"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Management */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select platforms to manage</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {PLATFORMS.map((platform) => (
              <Badge
                key={platform}
                variant={config.platforms.includes(platform) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePlatform(platform)}
              >
                {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Enable moderation rules for your community</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {MODERATION_RULES.map((rule) => (
              <Badge
                key={rule}
                variant={config.moderationRules.includes(rule) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleModerationRule(rule)}
              >
                {rule}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Response Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Response Style</Label>
              <Select value={config.responseStyle} onValueChange={(value) => setCommunityManagerConfig(prev => ({ ...prev, responseStyle: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Response Time: {config.responseTime} minutes</Label>
              <div className="mt-2">
                <Slider
                  value={[config.responseTime]}
                  onValueChange={(value) => setCommunityManagerConfig(prev => ({ ...prev, responseTime: value[0] }))}
                  max={60}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Instant</span>
                  <span>1 Hour</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select when your agent should be actively moderating</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {ACTIVE_HOURS.map((hour) => (
              <Badge
                key={hour}
                variant={config.activeHours.includes(hour) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleActiveHour(hour)}
              >
                {hour}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engagement Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Choose types of community engagement</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {ENGAGEMENT_TYPES.map((type) => (
              <Badge
                key={type}
                variant={config.engagementTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleEngagementType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Moderation</Label>
                <p className="text-sm text-muted-foreground">Automatically moderate content</p>
              </div>
              <Switch
                checked={config.autoModeration}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, autoModeration: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Escalation Rules</Label>
                <p className="text-sm text-muted-foreground">Escalate issues to human moderators</p>
              </div>
              <Switch
                checked={config.escalationRules}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, escalationRules: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Community Growth</Label>
                <p className="text-sm text-muted-foreground">Focus on growing the community</p>
              </div>
              <Switch
                checked={config.communityGrowth}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, communityGrowth: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Content Curation</Label>
                <p className="text-sm text-muted-foreground">Curate and share relevant content</p>
              </div>
              <Switch
                checked={config.contentCuration}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, contentCuration: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Event Management</Label>
                <p className="text-sm text-muted-foreground">Organize and announce events</p>
              </div>
              <Switch
                checked={config.eventManagement}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, eventManagement: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">Track community metrics</p>
              </div>
              <Switch
                checked={config.analyticsTracking}
                onCheckedChange={(checked) => setCommunityManagerConfig(prev => ({ ...prev, analyticsTracking: checked }))}
              />
            </div>
          </div>

          <div>
            <Label>Toxicity Threshold: {config.toxicityThreshold}/10</Label>
            <div className="mt-2">
              <Slider
                value={[config.toxicityThreshold]}
                onValueChange={(value) => setCommunityManagerConfig(prev => ({ ...prev, toxicityThreshold: value[0] }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Lenient</span>
                <span>Strict</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="welcome">Welcome Message</Label>
            <Textarea
              id="welcome"
              placeholder="Message for new members..."
              value={config.customResponses.welcome}
              onChange={(e) => setCommunityManagerConfig(prev => ({
                ...prev,
                customResponses: { ...prev.customResponses, welcome: e.target.value }
              }))}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="violation">Rule Violation Message</Label>
            <Textarea
              id="violation"
              placeholder="Message for rule violations..."
              value={config.customResponses.violation}
              onChange={(e) => setCommunityManagerConfig(prev => ({
                ...prev,
                customResponses: { ...prev.customResponses, violation: e.target.value }
              }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Community Management Notice</h3>
              <p className="text-sm text-yellow-700">
                Your agent will manage community interactions autonomously. Ensure you comply with platform 
                terms of service and review moderation actions regularly to maintain community standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}