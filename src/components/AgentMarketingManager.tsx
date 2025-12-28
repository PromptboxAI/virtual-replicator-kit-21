import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image, 
  Video, 
  Upload, 
  Link2, 
  MessageSquare,
  Globe,
  Youtube,
  FileText,
  X,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  MapPin,
  Calendar,
  BookOpen
} from 'lucide-react';

interface AgentMarketingManagerProps {
  agentId: string;
  agentName: string;
}

interface MarketingData {
  description?: string;
  whitepaper_url?: string;
  whitepaper_content?: string;
  website_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  discord_url?: string;
  telegram_url?: string;
  screenshots: string[];
  demo_videos: string[];
}

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  order_index: number;
}

interface RoadmapMilestone {
  id?: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  completed_at?: string;
  order_index: number;
}

export function AgentMarketingManager({ agentId, agentName }: AgentMarketingManagerProps) {
  const [marketingData, setMarketingData] = useState<MarketingData>({
    description: '',
    screenshots: [],
    demo_videos: []
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roadmapMilestones, setRoadmapMilestones] = useState<RoadmapMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing marketing data
  useEffect(() => {
    loadMarketingData();
  }, [agentId]);

  const loadMarketingData = async () => {
    try {
      const [marketingRes, teamRes, roadmapRes] = await Promise.all([
        supabase.from('agent_marketing').select('*').eq('agent_id', agentId).maybeSingle(),
        supabase.from('agent_team_members').select('*').eq('agent_id', agentId).order('order_index'),
        supabase.from('agent_roadmap_milestones').select('*').eq('agent_id', agentId).order('order_index')
      ]);

      if (marketingRes.error && marketingRes.error.code !== 'PGRST116') {
        console.error('Error loading marketing data:', marketingRes.error);
      } else if (marketingRes.data) {
        setMarketingData({
          description: marketingRes.data.description || '',
          whitepaper_url: marketingRes.data.whitepaper_url || '',
          whitepaper_content: marketingRes.data.whitepaper_content || '',
          website_url: marketingRes.data.website_url || '',
          youtube_url: marketingRes.data.youtube_url || '',
          twitter_url: marketingRes.data.twitter_url || '',
          discord_url: marketingRes.data.discord_url || '',
          telegram_url: marketingRes.data.telegram_url || '',
          screenshots: Array.isArray(marketingRes.data.screenshots) ? marketingRes.data.screenshots.filter((s): s is string => typeof s === 'string') : [],
          demo_videos: Array.isArray(marketingRes.data.demo_videos) ? marketingRes.data.demo_videos.filter((v): v is string => typeof v === 'string') : []
        });
      }

      if (!teamRes.error && teamRes.data) {
        setTeamMembers(teamRes.data);
      }

      if (!roadmapRes.error && roadmapRes.data) {
        setRoadmapMilestones(roadmapRes.data.map(m => ({
          ...m,
          status: (m.status as 'upcoming' | 'in_progress' | 'completed') || 'upcoming'
        })));
      }
    } catch (error) {
      console.error('Error loading marketing data:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'screenshot' | 'demo_video') => {
    if (!file) return;

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/${type}s/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('agent-marketing')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('agent-marketing')
        .getPublicUrl(fileName);

      const newData = { ...marketingData };
      if (type === 'screenshot') {
        newData.screenshots = [...newData.screenshots, publicUrl];
      } else {
        newData.demo_videos = [...newData.demo_videos, publicUrl];
      }
      
      setMarketingData(newData);
      toast({
        title: "File uploaded successfully",
        description: `${type === 'screenshot' ? 'Screenshot' : 'Demo video'} has been uploaded.`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (url: string, type: 'screenshot' | 'demo_video') => {
    const newData = { ...marketingData };
    if (type === 'screenshot') {
      newData.screenshots = newData.screenshots.filter(s => s !== url);
    } else {
      newData.demo_videos = newData.demo_videos.filter(v => v !== url);
    }
    setMarketingData(newData);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, {
      name: '',
      role: '',
      order_index: teamMembers.length
    }]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const addRoadmapMilestone = () => {
    setRoadmapMilestones([...roadmapMilestones, {
      title: '',
      status: 'upcoming',
      order_index: roadmapMilestones.length
    }]);
  };

  const updateRoadmapMilestone = (index: number, field: keyof RoadmapMilestone, value: any) => {
    const updated = [...roadmapMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setRoadmapMilestones(updated);
  };

  const removeRoadmapMilestone = (index: number) => {
    setRoadmapMilestones(roadmapMilestones.filter((_, i) => i !== index));
  };

  const saveMarketingData = async () => {
    setIsSaving(true);
    try {
      // Save marketing data
      const { error: marketingError } = await supabase
        .from('agent_marketing')
        .upsert({
          agent_id: agentId,
          ...marketingData
        });

      if (marketingError) throw marketingError;

      // Delete existing team members and roadmap milestones, then insert new ones
      await supabase.from('agent_team_members').delete().eq('agent_id', agentId);
      await supabase.from('agent_roadmap_milestones').delete().eq('agent_id', agentId);

      // Save team members
      if (teamMembers.length > 0) {
        const teamData = teamMembers.map((member, index) => ({
          agent_id: agentId,
          ...member,
          order_index: index
        }));
        const { error: teamError } = await supabase
          .from('agent_team_members')
          .insert(teamData);
        
        if (teamError) throw teamError;
      }

      // Save roadmap milestones
      if (roadmapMilestones.length > 0) {
        const roadmapData = roadmapMilestones.map((milestone, index) => ({
          agent_id: agentId,
          ...milestone,
          order_index: index
        }));
        const { error: roadmapError } = await supabase
          .from('agent_roadmap_milestones')
          .insert(roadmapData);
        
        if (roadmapError) throw roadmapError;
      }

      toast({
        title: "Marketing data saved",
        description: "Your agent's marketing content has been updated."
      });
    } catch (error) {
      console.error('Error saving marketing data:', error);
      toast({
        title: "Save failed",
        description: "Failed to save marketing data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Manager</h2>
          <p className="text-muted-foreground">Manage your agent's marketing content and social presence</p>
        </div>
        <Button onClick={saveMarketingData} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Agent Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agent Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what your agent does, its key features, and unique capabilities..."
              value={marketingData.description || ''}
              onChange={(e) => setMarketingData({ ...marketingData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Whitepaper */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            AI Agent Whitepaper
          </CardTitle>
          <CardDescription>
            Provide comprehensive details about your AI Agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mb-4">
            <p className="text-sm text-muted-foreground">
              Include the following sections in your whitepaper:
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
          
          <div>
            <Label htmlFor="whitepaper_content">Whitepaper Content</Label>
            <RichTextEditor
              id="whitepaper_content"
              value={marketingData.whitepaper_content || ''}
              onChange={(value) => setMarketingData({ ...marketingData, whitepaper_content: value })}
              placeholder="Provide comprehensive details about your AI Agent..."
              className="mt-2"
              maxLength={10000}
              showCharacterCount={true}
            />
          </div>
          
          <div>
            <Label htmlFor="whitepaper_url">External Whitepaper URL (Optional)</Label>
            <Input
              id="whitepaper_url"
              placeholder="https://your-domain.com/whitepaper.pdf"
              value={marketingData.whitepaper_url || ''}
              onChange={(e) => setMarketingData({ ...marketingData, whitepaper_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to an external whitepaper document (PDF or webpage)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Screenshots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Screenshots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketingData.screenshots.map((screenshot, index) => (
              <div key={index} className="relative group">
                <img 
                  src={screenshot} 
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(screenshot, 'screenshot')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add Screenshot</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'screenshot')}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Demo Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Demo Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketingData.demo_videos.map((video, index) => (
              <div key={index} className="relative group">
                <video 
                  src={video} 
                  controls
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(video, 'demo_video')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add Demo Video</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'demo_video')}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Links & Social Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Website Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Website & Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                placeholder="https://your-website.com"
                value={marketingData.website_url || ''}
                onChange={(e) => setMarketingData({ ...marketingData, website_url: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="youtube">YouTube Channel</Label>
              <Input
                id="youtube"
                placeholder="https://youtube.com/@yourchannel"
                value={marketingData.youtube_url || ''}
                onChange={(e) => setMarketingData({ ...marketingData, youtube_url: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input
                id="twitter"
                placeholder="https://x.com/yourusername"
                value={marketingData.twitter_url || ''}
                onChange={(e) => setMarketingData({ ...marketingData, twitter_url: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                placeholder="https://discord.gg/yourserver"
                value={marketingData.discord_url || ''}
                onChange={(e) => setMarketingData({ ...marketingData, discord_url: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/yourchannel"
                value={marketingData.telegram_url || ''}
                onChange={(e) => setMarketingData({ ...marketingData, telegram_url: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium">Team Member {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeamMember(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Role</Label>
                  <Input
                    placeholder="Lead Developer"
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Brief bio..."
                  value={member.bio || ''}
                  onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Avatar URL</Label>
                  <Input
                    placeholder="https://..."
                    value={member.avatar_url || ''}
                    onChange={(e) => updateTeamMember(index, 'avatar_url', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Twitter</Label>
                  <Input
                    placeholder="https://x.com/..."
                    value={member.twitter_url || ''}
                    onChange={(e) => updateTeamMember(index, 'twitter_url', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    placeholder="https://linkedin.com/in/..."
                    value={member.linkedin_url || ''}
                    onChange={(e) => updateTeamMember(index, 'linkedin_url', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            className="w-full"
            onClick={addTeamMember}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Roadmap Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roadmapMilestones.map((milestone, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium">Milestone {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRoadmapMilestone(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Launch Beta Version"
                    value={milestone.title}
                    onChange={(e) => updateRoadmapMilestone(index, 'title', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={milestone.status}
                    onChange={(e) => updateRoadmapMilestone(index, 'status', e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="What will be achieved..."
                  value={milestone.description || ''}
                  onChange={(e) => updateRoadmapMilestone(index, 'description', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={milestone.target_date || ''}
                  onChange={(e) => updateRoadmapMilestone(index, 'target_date', e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            className="w-full"
            onClick={addRoadmapMilestone}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </CardContent>
      </Card>

      {/* Status Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Content Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              {marketingData.description ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span className={marketingData.description ? 'text-foreground' : 'text-muted-foreground'}>
                {marketingData.description ? 'Description added' : 'Description needed'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {marketingData.screenshots.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span className={marketingData.screenshots.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {marketingData.screenshots.length > 0 ? `${marketingData.screenshots.length} screenshot(s) added` : 'Screenshots needed'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {marketingData.demo_videos.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={marketingData.demo_videos.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {marketingData.demo_videos.length > 0 ? `${marketingData.demo_videos.length} demo video(s) added` : 'Demo videos optional'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {(marketingData.website_url || marketingData.youtube_url) ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={(marketingData.website_url || marketingData.youtube_url) ? 'text-foreground' : 'text-muted-foreground'}>
                {(marketingData.website_url || marketingData.youtube_url) ? 'Links added' : 'Links optional'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {(marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url) ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={(marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url) ? 'text-foreground' : 'text-muted-foreground'}>
                {(marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url) ? 'Social media connected' : 'Social media optional'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {teamMembers.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={teamMembers.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {teamMembers.length > 0 ? `${teamMembers.length} team member(s) added` : 'Team members optional'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {roadmapMilestones.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={roadmapMilestones.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {roadmapMilestones.length > 0 ? `${roadmapMilestones.length} milestone(s) added` : 'Roadmap optional'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}