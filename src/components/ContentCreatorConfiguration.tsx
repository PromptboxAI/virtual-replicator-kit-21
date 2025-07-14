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
import { PenTool, Calendar, Users, Save, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContentCreatorConfig {
  contentTypes: string[];
  platforms: string[];
  postingFrequency: string;
  contentThemes: string[];
  toneOfVoice: string;
  targetAudience: string;
  hashtagStrategy: boolean;
  crossPosting: boolean;
  contentCalendar: boolean;
  engagementTracking: boolean;
  autoReply: boolean;
  postingTimes: string[];
  contentLength: number;
  visualContent: boolean;
  trendFollowing: boolean;
  originalityLevel: number;
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

const CONTENT_TYPES = [
  'Text Posts', 'Images', 'Videos', 'Stories', 'Threads', 'Polls', 'Live Streams', 'Articles'
];

const PLATFORMS = [
  'Twitter', 'Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'YouTube', 'Reddit', 'Discord'
];

const CONTENT_THEMES = [
  'Technology', 'Finance', 'Lifestyle', 'Education', 'Entertainment', 'News', 'Memes', 'Art', 'Gaming', 'Health'
];

const POSTING_FREQUENCIES = [
  { value: 'hourly', label: 'Every Hour' },
  { value: '4hours', label: 'Every 4 Hours' },
  { value: 'daily', label: 'Daily' },
  { value: '3times_daily', label: '3 Times Daily' },
  { value: 'weekly', label: 'Weekly' }
];

const TONES_OF_VOICE = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'educational', label: 'Educational' },
  { value: 'inspirational', label: 'Inspirational' }
];

const POSTING_TIMES = [
  '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'
];

export function ContentCreatorConfiguration({ agent, onConfigurationUpdated }: ConfigurationProps) {
  const [config, setConfig] = useState<ContentCreatorConfig>({
    contentTypes: ['Text Posts', 'Images'],
    platforms: ['Twitter'],
    postingFrequency: 'daily',
    contentThemes: ['Technology'],
    toneOfVoice: 'professional',
    targetAudience: 'Tech enthusiasts and developers',
    hashtagStrategy: true,
    crossPosting: false,
    contentCalendar: true,
    engagementTracking: true,
    autoReply: false,
    postingTimes: ['09:00', '15:00'],
    contentLength: 5,
    visualContent: true,
    trendFollowing: true,
    originalityLevel: 7
  });

  const [originalConfig, setOriginalConfig] = useState<ContentCreatorConfig | null>(null);
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
        .eq('category', 'Content Creator')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedConfig = data.configuration as unknown as ContentCreatorConfig;
        setConfig(loadedConfig);
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
          category: 'Content Creator',
          configuration: config as any
        });

      if (error) throw error;

      setOriginalConfig(config);
      setHasChanges(false);
      onConfigurationUpdated();

      toast({
        title: "Content Creator Configuration Saved! 🎨",
        description: "Your content creator configuration has been updated and will generate engaging content autonomously.",
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
      setConfig(originalConfig);
      setHasChanges(false);
    }
  };

  const toggleContentType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  const togglePlatform = (platform: string) => {
    setConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const toggleTheme = (theme: string) => {
    setConfig(prev => ({
      ...prev,
      contentThemes: prev.contentThemes.includes(theme)
        ? prev.contentThemes.filter(t => t !== theme)
        : [...prev.contentThemes, theme]
    }));
  };

  const togglePostingTime = (time: string) => {
    setConfig(prev => ({
      ...prev,
      postingTimes: prev.postingTimes.includes(time)
        ? prev.postingTimes.filter(t => t !== time)
        : [...prev.postingTimes, time]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content creator configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <PenTool className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Content Creator Configuration</h2>
        <p className="text-muted-foreground">
          Configure your autonomous content creation and social media management settings
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

      {/* Content Types & Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm font-medium">Select content formats to create</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {CONTENT_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={config.contentTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleContentType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm font-medium">Choose platforms for content distribution</Label>
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
      </div>

      {/* Content Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Content Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Posting Frequency</Label>
              <Select value={config.postingFrequency} onValueChange={(value) => setConfig(prev => ({ ...prev, postingFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSTING_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tone of Voice</Label>
              <Select value={config.toneOfVoice} onValueChange={(value) => setConfig(prev => ({ ...prev, toneOfVoice: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES_OF_VOICE.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Textarea
              id="audience"
              placeholder="Describe your target audience..."
              value={config.targetAudience}
              onChange={(e) => setConfig(prev => ({ ...prev, targetAudience: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Content Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select topics and themes for content creation</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {CONTENT_THEMES.map((theme) => (
              <Badge
                key={theme}
                variant={config.contentThemes.includes(theme) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTheme(theme)}
              >
                {theme}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Posting Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select optimal posting times</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {POSTING_TIMES.map((time) => (
              <Badge
                key={time}
                variant={config.postingTimes.includes(time) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePostingTime(time)}
              >
                {time}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hashtag Strategy</Label>
                <p className="text-sm text-muted-foreground">Auto-generate relevant hashtags</p>
              </div>
              <Switch
                checked={config.hashtagStrategy}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hashtagStrategy: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Cross-Platform Posting</Label>
                <p className="text-sm text-muted-foreground">Adapt content for each platform</p>
              </div>
              <Switch
                checked={config.crossPosting}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, crossPosting: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Content Calendar</Label>
                <p className="text-sm text-muted-foreground">Plan content in advance</p>
              </div>
              <Switch
                checked={config.contentCalendar}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, contentCalendar: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Engagement Tracking</Label>
                <p className="text-sm text-muted-foreground">Monitor performance metrics</p>
              </div>
              <Switch
                checked={config.engagementTracking}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, engagementTracking: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Reply</Label>
                <p className="text-sm text-muted-foreground">Respond to comments automatically</p>
              </div>
              <Switch
                checked={config.autoReply}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoReply: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Trend Following</Label>
                <p className="text-sm text-muted-foreground">Create content based on trending topics</p>
              </div>
              <Switch
                checked={config.trendFollowing}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, trendFollowing: checked }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label>Content Length: {config.contentLength}/10</Label>
              <div className="mt-2">
                <Slider
                  value={[config.contentLength]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, contentLength: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Originality Level: {config.originalityLevel}/10</Label>
              <div className="mt-2">
                <Slider
                  value={[config.originalityLevel]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, originalityLevel: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Curated</span>
                  <span>Original</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Content Creation Notice</h3>
              <p className="text-sm text-yellow-700">
                Your agent will create and post content autonomously. Ensure you comply with platform guidelines 
                and review generated content regularly to maintain quality and brand consistency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}