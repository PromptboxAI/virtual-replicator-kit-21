import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TwitterCredentialsFormProps {
  agentId: string;
  onCredentialsAdded: () => void;
}

interface TwitterCredentials {
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
}

export const TwitterCredentialsForm = ({ agentId, onCredentialsAdded }: TwitterCredentialsFormProps) => {
  const [credentials, setCredentials] = useState<TwitterCredentials>({
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate all fields are filled
      if (!credentials.consumer_key || !credentials.consumer_secret || 
          !credentials.access_token || !credentials.access_token_secret) {
        throw new Error('All Twitter API credentials are required');
      }

      // Test the credentials by attempting to get user info
      const { data, error } = await supabase.functions.invoke('test-twitter-credentials', {
        body: { 
          agentId,
          credentials 
        }
      });

      if (error) throw error;

      if (data.success) {
        // Store credentials securely for this agent
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            twitter_api_configured: true,
            twitter_username: data.username
          } as any)
          .eq('id', agentId);

        if (updateError) throw updateError;

        toast({
          title: "Twitter API Connected!",
          description: `Agent can now post as @${data.username}`,
        });

        onCredentialsAdded();
      } else {
        throw new Error(data.error || 'Invalid Twitter credentials');
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Twitter API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Twitter className="h-5 w-5" />
          Connect Twitter API
        </CardTitle>
        <CardDescription>
          Add your Twitter API credentials to enable your agent to post tweets
          <br />
          <a 
            href="https://developer.twitter.com/en/portal/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
          >
            Get API keys from Twitter Developer Portal <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consumer_key">API Key (Consumer Key)</Label>
            <Input
              id="consumer_key"
              type="text"
              value={credentials.consumer_key}
              onChange={(e) => setCredentials(prev => ({ ...prev, consumer_key: e.target.value }))}
              placeholder="Your Twitter API Key"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consumer_secret">API Secret (Consumer Secret)</Label>
            <Input
              id="consumer_secret"
              type="password"
              value={credentials.consumer_secret}
              onChange={(e) => setCredentials(prev => ({ ...prev, consumer_secret: e.target.value }))}
              placeholder="Your Twitter API Secret"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token">Access Token</Label>
            <Input
              id="access_token"
              type="text"
              value={credentials.access_token}
              onChange={(e) => setCredentials(prev => ({ ...prev, access_token: e.target.value }))}
              placeholder="Your Twitter Access Token"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token_secret">Access Token Secret</Label>
            <Input
              id="access_token_secret"
              type="password"
              value={credentials.access_token_secret}
              onChange={(e) => setCredentials(prev => ({ ...prev, access_token_secret: e.target.value }))}
              placeholder="Your Twitter Access Token Secret"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Testing Connection...' : 'Connect Twitter API'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">Required Permissions:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>• Read and Write permissions</li>
            <li>• Tweet posting capabilities</li>
            <li>• User context access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};