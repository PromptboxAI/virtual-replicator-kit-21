import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Palette, Calendar, Hash, Zap, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentCreatorConfig {
  name: string;
  description: string;
  contentTypes: string[];
  platforms: string[];
  postingSchedule: {
    frequency: string;
    timeSlots: string[];
    timezone: string;
  };
  contentThemes: string[];
  toneOfVoice: string;
  hashtagStrategy: boolean;
  seoOptimization: boolean;
  trendsAnalysis: boolean;
  audienceEngagement: boolean;
  contentCalendar: boolean;
  analytics: boolean;
  crossPosting: boolean;
}

interface ContentCreatorBuilderProps {
  onNext: (config: ContentCreatorConfig) => void;
  onBack: () => void;
}

const CONTENT_TYPES = [
  { id: 'text_posts', name: 'Text Posts', description: 'Social media text content' },
  { id: 'images', name: 'Images', description: 'Visual content and graphics' },
  { id: 'videos', name: 'Videos', description: 'Video content creation' },
  { id: 'blogs', name: 'Blog Posts', description: 'Long-form written content' },
  { id: 'threads', name: 'Threads', description: 'Multi-part social media stories' },
  { id: 'newsletters', name: 'Newsletters', description: 'Email marketing content' },
  { id: 'podcasts', name: 'Podcasts', description: 'Audio content scripts' },
  { id: 'infographics', name: 'Infographics', description: 'Data visualization content' }
];

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'medium', name: 'Medium', icon: '📝' },
  { id: 'substack', name: 'Substack', icon: '📰' },
  { id: 'discord', name: 'Discord', icon: '💬' }
];

const CONTENT_THEMES = [
  'Technology', 'Cryptocurrency', 'DeFi', 'AI & Machine Learning', 'Startup Culture',
  'Personal Development', 'Industry News', 'Educational', 'Entertainment', 'Lifestyle'
];

const TONE_OPTIONS = [
  { id: 'professional', name: 'Professional', description: 'Formal and business-oriented' },
  { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
  { id: 'humorous', name: 'Humorous', description: 'Fun and entertaining' },
  { id: 'educational', name: 'Educational', description: 'Informative and teaching-focused' },
  { id: 'inspirational', name: 'Inspirational', description: 'Motivating and uplifting' },
  { id: 'authoritative', name: 'Authoritative', description: 'Expert and knowledgeable' }
];

const POSTING_FREQUENCIES = [
  { id: 'multiple_daily', name: 'Multiple Times Daily', posts: '3-5 posts/day' },
  { id: 'daily', name: 'Daily', posts: '1 post/day' },
  { id: 'few_weekly', name: 'Few Times Weekly', posts: '3-4 posts/week' },
  { id: 'weekly', name: 'Weekly', posts: '1-2 posts/week' },
  { id: 'custom', name: 'Custom Schedule', posts: 'Define your own' }
];

export function ContentCreatorBuilder({ onNext, onBack }: ContentCreatorBuilderProps) {
  const [config, setConfig] = useState<ContentCreatorConfig>({
    name: '',
    description: '',
    contentTypes: [],
    platforms: [],
    postingSchedule: {
      frequency: 'daily',
      timeSlots: ['09:00', '15:00', '20:00'],
      timezone: 'UTC'
    },
    contentThemes: [],
    toneOfVoice: 'professional',
    hashtagStrategy: true,
    seoOptimization: true,
    trendsAnalysis: true,
    audienceEngagement: true,
    contentCalendar: true,
    analytics: true,
    crossPosting: false
  });

  const { toast } = useToast();

  const handleNext = () => {
    if (!config.name || !config.description) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields to continue",
        variant: "destructive"
      });
      return;
    }

    if (config.platforms.length === 0) {
      toast({
        title: "Platform Required",
        description: "Please select at least one social media platform",
        variant: "destructive"
      });
      return;
    }

    if (config.contentTypes.length === 0) {
      toast({
        title: "Content Type Required",
        description: "Please select at least one content type",
        variant: "destructive"
      });
      return;
    }

    onNext(config);
  };

  const toggleContentType = (typeId: string) => {
    setConfig(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter(t => t !== typeId)
        : [...prev.contentTypes, typeId]
    }));
  };

  const togglePlatform = (platformId: string) => {
    setConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Content Creator Configuration</h2>
        <p className="text-muted-foreground">Configure your AI content creation assistant</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Creator Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., AI Content Wizard"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your content creator's purpose and style..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Content Types
          </CardTitle>
          <CardDescription>Select the types of content your assistant will create</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTENT_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.contentTypes.includes(type.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleContentType(type.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Media Platforms
          </CardTitle>
          <CardDescription>Choose where your content will be published</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all hover:shadow-md text-center ${
                  config.platforms.includes(platform.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => togglePlatform(platform.id)}
              >
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <h3 className="font-semibold text-sm">{platform.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Content Themes
          </CardTitle>
          <CardDescription>Select the topics your assistant will focus on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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

      {/* Tone of Voice */}
      <Card>
        <CardHeader>
          <CardTitle>Tone of Voice</CardTitle>
          <CardDescription>Define your brand's communication style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TONE_OPTIONS.map((tone) => (
              <Card
                key={tone.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.toneOfVoice === tone.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setConfig(prev => ({ ...prev, toneOfVoice: tone.id }))}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{tone.name}</h3>
                  <p className="text-sm text-muted-foreground">{tone.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Posting Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Posting Frequency</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {POSTING_FREQUENCIES.map((freq) => (
                <Card
                  key={freq.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.postingSchedule.frequency === freq.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    postingSchedule: { ...prev.postingSchedule, frequency: freq.id }
                  }))}
                >
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm">{freq.name}</h4>
                    <p className="text-xs text-muted-foreground">{freq.posts}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={config.postingSchedule.timezone}
              onValueChange={(value) => setConfig(prev => ({
                ...prev,
                postingSchedule: { ...prev.postingSchedule, timezone: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="EST">Eastern Time</SelectItem>
                <SelectItem value="PST">Pacific Time</SelectItem>
                <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                <SelectItem value="CET">Central European Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hashtag Strategy</Label>
                <p className="text-sm text-muted-foreground">Optimize hashtag usage</p>
              </div>
              <Switch
                checked={config.hashtagStrategy}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hashtagStrategy: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SEO Optimization</Label>
                <p className="text-sm text-muted-foreground">Optimize for search engines</p>
              </div>
              <Switch
                checked={config.seoOptimization}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, seoOptimization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Trends Analysis</Label>
                <p className="text-sm text-muted-foreground">Follow trending topics</p>
              </div>
              <Switch
                checked={config.trendsAnalysis}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, trendsAnalysis: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Audience Engagement</Label>
                <p className="text-sm text-muted-foreground">Auto-engage with audience</p>
              </div>
              <Switch
                checked={config.audienceEngagement}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, audienceEngagement: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Content Calendar</Label>
                <p className="text-sm text-muted-foreground">Automated scheduling</p>
              </div>
              <Switch
                checked={config.contentCalendar}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, contentCalendar: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics & Insights</Label>
                <p className="text-sm text-muted-foreground">Performance tracking</p>
              </div>
              <Switch
                checked={config.analytics}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, analytics: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue to API Setup
        </Button>
      </div>
    </div>
  );
}