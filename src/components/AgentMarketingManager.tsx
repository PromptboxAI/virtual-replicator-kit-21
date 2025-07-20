import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Save
} from 'lucide-react';

interface AgentMarketingManagerProps {
  agentId: string;
  agentName: string;
}

interface MarketingData {
  description?: string;
  whitepaper_url?: string;
  website_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  discord_url?: string;
  telegram_url?: string;
  screenshots: string[];
  demo_videos: string[];
}

export function AgentMarketingManager({ agentId, agentName }: AgentMarketingManagerProps) {
  const [marketingData, setMarketingData] = useState<MarketingData>({
    description: '',
    screenshots: [],
    demo_videos: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing marketing data
  useEffect(() => {
    loadMarketingData();
  }, [agentId]);

  const loadMarketingData = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_marketing')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading marketing data:', error);
        return;
      }

      if (data) {
        setMarketingData({
          description: data.description || '',
          whitepaper_url: data.whitepaper_url || '',
          website_url: data.website_url || '',
          youtube_url: data.youtube_url || '',
          twitter_url: data.twitter_url || '',
          discord_url: data.discord_url || '',
          telegram_url: data.telegram_url || '',
          screenshots: Array.isArray(data.screenshots) ? data.screenshots.filter((s): s is string => typeof s === 'string') : [],
          demo_videos: Array.isArray(data.demo_videos) ? data.demo_videos.filter((v): v is string => typeof v === 'string') : []
        });
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

  const saveMarketingData = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_marketing')
        .upsert({
          agent_id: agentId,
          ...marketingData
        });

      if (error) throw error;

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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what your agent does, its key features, and unique capabilities..."
              value={marketingData.description || ''}
              onChange={(e) => setMarketingData({ ...marketingData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
          
          <div>
            <Label htmlFor="whitepaper">Whitepaper URL</Label>
            <Input
              id="whitepaper"
              placeholder="https://your-domain.com/whitepaper.pdf"
              value={marketingData.whitepaper_url || ''}
              onChange={(e) => setMarketingData({ ...marketingData, whitepaper_url: e.target.value })}
            />
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

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>✅ {marketingData.description ? 'Description added' : 'Description needed'}</p>
            <p>✅ {marketingData.screenshots.length > 0 ? `${marketingData.screenshots.length} screenshot(s) added` : 'Screenshots needed'}</p>
            <p>✅ {marketingData.demo_videos.length > 0 ? `${marketingData.demo_videos.length} demo video(s) added` : 'Demo videos optional'}</p>
            <p>✅ {(marketingData.website_url || marketingData.youtube_url) ? 'Links added' : 'Links optional'}</p>
            <p>✅ {(marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url) ? 'Social media connected' : 'Social media optional'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}