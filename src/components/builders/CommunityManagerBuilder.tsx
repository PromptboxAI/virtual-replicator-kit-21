import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Users, MessageSquare, Shield, Bot, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunityManagerConfig {
  name: string;
  description: string;
  platforms: string[];
  moderationRules: {
    autoModeration: boolean;
    spamFiltering: boolean;
    toxicityDetection: boolean;
    customWordFilters: string[];
  };
  engagementFeatures: {
    welcomeMessages: boolean;
    autoResponses: boolean;
    eventAnnouncements: boolean;
    polls: boolean;
    contests: boolean;
  };
  communityGrowth: {
    inviteTracking: boolean;
    referralPrograms: boolean;
    levelingSystem: boolean;
    achievements: boolean;
  };
  responseStyle: string;
  operatingHours: {
    timezone: string;
    activeHours: string[];
    alwaysOn: boolean;
  };
}

interface CommunityManagerBuilderProps {
  onNext: (config: CommunityManagerConfig) => void;
  onBack: () => void;
}

const PLATFORMS = [
  { id: 'discord', name: 'Discord', icon: '💬', description: 'Gaming and community servers' },
  { id: 'telegram', name: 'Telegram', icon: '📱', description: 'Messaging groups and channels' },
  { id: 'slack', name: 'Slack', icon: '💼', description: 'Professional workspaces' },
  { id: 'reddit', name: 'Reddit', icon: '🔗', description: 'Community forums and discussions' },
  { id: 'facebook', name: 'Facebook Groups', icon: '👥', description: 'Social media communities' },
  { id: 'twitter', name: 'Twitter Spaces', icon: '🐦', description: 'Social audio conversations' }
];

const RESPONSE_STYLES = [
  { id: 'friendly', name: 'Friendly & Welcoming', description: 'Warm, approachable, community-focused' },
  { id: 'professional', name: 'Professional', description: 'Formal, business-oriented communication' },
  { id: 'casual', name: 'Casual & Fun', description: 'Relaxed, informal, entertainment-focused' },
  { id: 'educational', name: 'Educational', description: 'Informative, teaching-oriented responses' },
  { id: 'supportive', name: 'Supportive', description: 'Helpful, encouraging, problem-solving focused' }
];

const TIME_ZONES = [
  'UTC', 'EST', 'PST', 'GMT', 'CET', 'JST', 'AEST', 'IST'
];

const ACTIVE_HOURS = [
  '00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-24:00'
];

export function CommunityManagerBuilder({ onNext, onBack }: CommunityManagerBuilderProps) {
  const [config, setConfig] = useState<CommunityManagerConfig>({
    name: '',
    description: '',
    platforms: [],
    moderationRules: {
      autoModeration: true,
      spamFiltering: true,
      toxicityDetection: true,
      customWordFilters: []
    },
    engagementFeatures: {
      welcomeMessages: true,
      autoResponses: true,
      eventAnnouncements: true,
      polls: false,
      contests: false
    },
    communityGrowth: {
      inviteTracking: true,
      referralPrograms: false,
      levelingSystem: false,
      achievements: false
    },
    responseStyle: 'friendly',
    operatingHours: {
      timezone: 'UTC',
      activeHours: ['12:00-18:00', '18:00-24:00'],
      alwaysOn: false
    }
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
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }

    onNext(config);
  };

  const togglePlatform = (platformId: string) => {
    setConfig(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const toggleActiveHour = (hour: string) => {
    setConfig(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        activeHours: prev.operatingHours.activeHours.includes(hour)
          ? prev.operatingHours.activeHours.filter(h => h !== hour)
          : [...prev.operatingHours.activeHours, hour]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Community Manager Configuration</h2>
        <p className="text-muted-foreground">Configure your AI community management assistant</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Manager Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Community Guardian"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your community manager's role and personality..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Community Platforms
          </CardTitle>
          <CardDescription>Select the platforms your manager will operate on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.platforms.includes(platform.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => togglePlatform(platform.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{platform.icon}</div>
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Response Style
          </CardTitle>
          <CardDescription>Define how your manager communicates with the community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESPONSE_STYLES.map((style) => (
              <Card
                key={style.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.responseStyle === style.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setConfig(prev => ({ ...prev, responseStyle: style.id }))}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{style.name}</h3>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Moderation</Label>
                <p className="text-sm text-muted-foreground">Automatically moderate content</p>
              </div>
              <Switch
                checked={config.moderationRules.autoModeration}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  moderationRules: { ...prev.moderationRules, autoModeration: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Spam Filtering</Label>
                <p className="text-sm text-muted-foreground">Filter spam messages</p>
              </div>
              <Switch
                checked={config.moderationRules.spamFiltering}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  moderationRules: { ...prev.moderationRules, spamFiltering: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Toxicity Detection</Label>
                <p className="text-sm text-muted-foreground">Detect harmful content</p>
              </div>
              <Switch
                checked={config.moderationRules.toxicityDetection}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  moderationRules: { ...prev.moderationRules, toxicityDetection: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Engagement Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Welcome Messages</Label>
                <p className="text-sm text-muted-foreground">Greet new members</p>
              </div>
              <Switch
                checked={config.engagementFeatures.welcomeMessages}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  engagementFeatures: { ...prev.engagementFeatures, welcomeMessages: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Responses</Label>
                <p className="text-sm text-muted-foreground">Respond to common questions</p>
              </div>
              <Switch
                checked={config.engagementFeatures.autoResponses}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  engagementFeatures: { ...prev.engagementFeatures, autoResponses: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Event Announcements</Label>
                <p className="text-sm text-muted-foreground">Share community events</p>
              </div>
              <Switch
                checked={config.engagementFeatures.eventAnnouncements}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  engagementFeatures: { ...prev.engagementFeatures, eventAnnouncements: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Polls & Surveys</Label>
                <p className="text-sm text-muted-foreground">Create community polls</p>
              </div>
              <Switch
                checked={config.engagementFeatures.polls}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  engagementFeatures: { ...prev.engagementFeatures, polls: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Contests & Giveaways</Label>
                <p className="text-sm text-muted-foreground">Run community contests</p>
              </div>
              <Switch
                checked={config.engagementFeatures.contests}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  engagementFeatures: { ...prev.engagementFeatures, contests: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Community Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Invite Tracking</Label>
                <p className="text-sm text-muted-foreground">Track member referrals</p>
              </div>
              <Switch
                checked={config.communityGrowth.inviteTracking}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  communityGrowth: { ...prev.communityGrowth, inviteTracking: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Referral Programs</Label>
                <p className="text-sm text-muted-foreground">Reward member referrals</p>
              </div>
              <Switch
                checked={config.communityGrowth.referralPrograms}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  communityGrowth: { ...prev.communityGrowth, referralPrograms: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Leveling System</Label>
                <p className="text-sm text-muted-foreground">Member progression levels</p>
              </div>
              <Switch
                checked={config.communityGrowth.levelingSystem}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  communityGrowth: { ...prev.communityGrowth, levelingSystem: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Achievements</Label>
                <p className="text-sm text-muted-foreground">Award member milestones</p>
              </div>
              <Switch
                checked={config.communityGrowth.achievements}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  communityGrowth: { ...prev.communityGrowth, achievements: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Always Active</Label>
              <p className="text-sm text-muted-foreground">24/7 community management</p>
            </div>
            <Switch
              checked={config.operatingHours.alwaysOn}
              onCheckedChange={(checked) => setConfig(prev => ({
                ...prev,
                operatingHours: { ...prev.operatingHours, alwaysOn: checked }
              }))}
            />
          </div>

          {!config.operatingHours.alwaysOn && (
            <>
              <Separator />
              <div>
                <Label>Timezone</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TIME_ZONES.map((tz) => (
                    <Badge
                      key={tz}
                      variant={config.operatingHours.timezone === tz ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        operatingHours: { ...prev.operatingHours, timezone: tz }
                      }))}
                    >
                      {tz}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Active Hours</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ACTIVE_HOURS.map((hour) => (
                    <Badge
                      key={hour}
                      variant={config.operatingHours.activeHours.includes(hour) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleActiveHour(hour)}
                    >
                      {hour}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
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