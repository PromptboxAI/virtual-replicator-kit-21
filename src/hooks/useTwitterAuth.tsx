import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TwitterData {
  twitter_id: string;
  twitter_username: string;
  twitter_display_name: string;
  twitter_avatar_url: string;
  access_token: string;
  access_token_secret: string;
}

export const useTwitterAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<TwitterData | null>(null);
  const { toast } = useToast();

  const connectTwitter = async (userId: string) => {
    setIsConnecting(true);
    
    try {
      // Get auth URL from edge function
      const { data, error } = await supabase.functions.invoke('twitter-auth', {
        body: { user_id: userId }
      });

      if (error) throw error;

      const { authUrl } = data;
      
      // Open popup for OAuth
      const popup = window.open(
        authUrl,
        'twitter-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for message from popup with origin validation
      const handleMessage = async (event: MessageEvent) => {
        // Security: Validate the origin of the message
        // Allow messages from the same origin or from Supabase edge functions
        const allowedOrigins = [
          window.location.origin,
          'https://cjzazuuwapsliacmjxfg.supabase.co'
        ];
        
        if (!allowedOrigins.some(origin => event.origin.startsWith(origin) || event.origin === origin)) {
          console.warn('Rejected message from untrusted origin:', event.origin);
          return;
        }
        
        if (event.data.success && event.data.data) {
          const twitterData = event.data.data as TwitterData;
          
          // Update user profile with Twitter data
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              twitter_id: twitterData.twitter_id,
              twitter_username: twitterData.twitter_username,
              twitter_display_name: twitterData.twitter_display_name,
              twitter_avatar_url: twitterData.twitter_avatar_url,
              twitter_access_token: twitterData.access_token,
              twitter_access_token_secret: twitterData.access_token_secret
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            toast({
              title: "Connection failed",
              description: "Failed to save Twitter connection",
              variant: "destructive"
            });
          } else {
            setConnectedAccount(twitterData);
            toast({
              title: "Twitter connected!",
              description: `Successfully connected @${twitterData.twitter_username}`,
            });
          }
          
          window.removeEventListener('message', handleMessage);
          popup?.close();
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without connecting
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Twitter connection error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect Twitter account",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectTwitter = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          twitter_id: null,
          twitter_username: null,
          twitter_display_name: null,
          twitter_avatar_url: null,
          twitter_access_token: null,
          twitter_access_token_secret: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      setConnectedAccount(null);
      toast({
        title: "Twitter disconnected",
        description: "Successfully disconnected Twitter account",
      });
    } catch (error: any) {
      console.error('Twitter disconnection error:', error);
      toast({
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect Twitter account",
        variant: "destructive"
      });
    }
  };

  return {
    connectTwitter,
    disconnectTwitter,
    isConnecting,
    connectedAccount,
    setConnectedAccount
  };
};