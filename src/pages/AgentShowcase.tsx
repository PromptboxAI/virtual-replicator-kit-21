import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, Share2, Twitter, Calendar, User, Tag, Globe, Users, Target, Clock, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Helmet } from "react-helmet-async";

// Integration icon mapping
const integrationIcons: Record<string, { icon: string; name: string }> = {
  salesforce: { icon: "/src/assets/salesforce-logo.png", name: "Salesforce" },
  openai: { icon: "/src/assets/openai-logo.png", name: "OpenAI" },
  claude: { icon: "/src/assets/claude-logo.png", name: "Claude" },
  gemini: { icon: "/src/assets/gemini-logo.png", name: "Gemini" },
  github: { icon: "/src/assets/github-logo.png", name: "GitHub" },
  supabase: { icon: "/src/assets/supabase-logo.png", name: "Supabase" },
  privy: { icon: "/src/assets/privy-logo.png", name: "Privy" },
};

interface AgentData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  project_pitch: string | null;
  avatar_url: string | null;
  category: string | null;
  creator_id: string | null;
  creator_wallet_address: string | null;
  created_at: string;
  token_address: string | null;
  token_graduated: boolean | null;
  website_url: string | null;
  twitter_url: string | null;
  framework: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
}

interface RoadmapMilestone {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  target_date: string | null;
}

interface MarketingData {
  screenshots: string[];
  demo_videos: string[];
  whitepaper_content: string | null;
  youtube_url: string | null;
  discord_url: string | null;
  telegram_url: string | null;
}

export default function AgentShowcase() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (agentId) {
      loadAgentData();
    }
  }, [agentId]);

  const loadAgentData = async () => {
    setIsLoading(true);
    try {
      // Fetch agent data
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, name, symbol, description, project_pitch, avatar_url, category, creator_id, creator_wallet_address, created_at, token_address, token_graduated, website_url, twitter_url, framework')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;
      setAgent(agentData);

      // Fetch marketing data
      const { data: marketingData } = await supabase
        .from('agent_marketing')
        .select('screenshots, demo_videos, whitepaper_content, youtube_url, discord_url, telegram_url')
        .eq('agent_id', agentId)
        .single();

      if (marketingData) {
        setMarketing({
          screenshots: (marketingData.screenshots as string[]) || [],
          demo_videos: (marketingData.demo_videos as string[]) || [],
          whitepaper_content: marketingData.whitepaper_content,
          youtube_url: marketingData.youtube_url,
          discord_url: marketingData.discord_url,
          telegram_url: marketingData.telegram_url,
        });
      }

      // Fetch team members
      const { data: teamData } = await supabase
        .from('agent_team_members')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (teamData) {
        setTeamMembers(teamData);
      }

      // Fetch roadmap
      const { data: roadmapData } = await supabase
        .from('agent_roadmap_milestones')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (roadmapData) {
        setRoadmap(roadmapData);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast({
        title: "Error",
        description: "Failed to load agent data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this page with others",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTwitterShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${agent?.name} on Promptbox!`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const getTradeUrl = () => {
    if (!agent) return '#';
    // If graduated, link to external trading subdomain
    if (agent.token_graduated && agent.token_address) {
      return `https://trade.promptbox.com/${agent.token_address}`;
    }
    // Otherwise, link to internal agent page for bonding curve trading
    return `/agent/${agent.id}`;
  };

  const truncateAddress = (address: string) => {
    if (address.startsWith("0x") && address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address.length > 20 ? `${address.slice(0, 17)}...` : address;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <p className="text-muted-foreground mb-8">The agent you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/ai-agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Agents
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{agent.name} | Promptbox AI Agents</title>
        <meta name="description" content={agent.description || `Learn about ${agent.name} - an AI agent on Promptbox`} />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          to="/ai-agents" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Agents
        </Link>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Content */}
          <div className="lg:col-span-2">
            {/* Integration Icons Row */}
            <div className="flex items-center gap-3 mb-6">
              {agent.avatar_url && (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar_url} alt={agent.name} />
                  <AvatarFallback>{agent.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {agent.framework && integrationIcons[agent.framework.toLowerCase()] && (
                <div 
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                  title={integrationIcons[agent.framework.toLowerCase()].name}
                >
                  <img 
                    src={integrationIcons[agent.framework.toLowerCase()].icon} 
                    alt={agent.framework} 
                    className="w-6 h-6 object-contain" 
                  />
                </div>
              )}
              {agent.category && (
                <Badge variant="secondary" className="text-sm">
                  {agent.category}
                </Badge>
              )}
            </div>

            {/* Agent Name */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {agent.name}
            </h1>

            {/* Short Description */}
            <p className="text-lg text-muted-foreground mb-6">
              {agent.description}
            </p>

            {/* Trade Button */}
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6"
              onClick={() => window.location.href = getTradeUrl()}
            >
              Trade ${agent.symbol}
              <ExternalLink className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Preview Image */}
            {marketing?.screenshots && marketing.screenshots.length > 0 && (
              <div className="aspect-video rounded-xl overflow-hidden border bg-muted">
                <img 
                  src={marketing.screenshots[0]} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta Info */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Created By */}
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Created by</p>
                    <p className="font-medium">
                      {agent.creator_wallet_address 
                        ? truncateAddress(agent.creator_wallet_address)
                        : truncateAddress(agent.creator_id || 'Unknown')}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Last Update */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Category */}
                {agent.category && (
                  <>
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                        <Badge variant="outline">{agent.category}</Badge>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Links */}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mr-auto">Share</p>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleShare}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleTwitterShare}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  {agent.website_url && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(agent.website_url!, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Section - How it works */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Project Pitch / How it works */}
            {agent.project_pitch && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: agent.project_pitch }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Whitepaper */}
            {marketing?.whitepaper_content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Whitepaper</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marketing.whitepaper_content }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Screenshots Gallery */}
            {marketing?.screenshots && marketing.screenshots.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {marketing.screenshots.slice(1).map((screenshot, index) => (
                      <div 
                        key={index} 
                        className="aspect-video rounded-lg overflow-hidden border bg-muted"
                      >
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 2}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demo Videos */}
            {marketing?.demo_videos && marketing.demo_videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Demo Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketing.demo_videos.map((video, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden border bg-muted">
                        <video 
                          src={video} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Team & Roadmap */}
          <div className="space-y-6">
            {/* Team Members */}
            {teamMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                        {member.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.bio}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {member.twitter_url && (
                            <a 
                              href={member.twitter_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Twitter className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Roadmap */}
            {roadmap.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roadmap.map((milestone, index) => (
                    <div key={milestone.id} className="relative pl-6 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {index < roadmap.length - 1 && (
                        <div className="absolute left-[7px] top-3 bottom-0 w-px bg-border" />
                      )}
                      {/* Status dot */}
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                        milestone.status === 'completed' 
                          ? 'bg-primary border-primary' 
                          : milestone.status === 'in_progress'
                          ? 'bg-yellow-500 border-yellow-500'
                          : 'bg-background border-muted-foreground'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{milestone.title}</p>
                          {milestone.status && (
                            <Badge 
                              variant={
                                milestone.status === 'completed' ? 'default' :
                                milestone.status === 'in_progress' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        {milestone.target_date && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(milestone.target_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(marketing?.discord_url || marketing?.telegram_url || marketing?.youtube_url || agent.twitter_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.twitter_url && (
                    <a 
                      href={agent.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter/X
                    </a>
                  )}
                  {marketing?.discord_url && (
                    <a 
                      href={marketing.discord_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Discord
                    </a>
                  )}
                  {marketing?.telegram_url && (
                    <a 
                      href={marketing.telegram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Telegram
                    </a>
                  )}
                  {marketing?.youtube_url && (
                    <a 
                      href={marketing.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      YouTube
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
