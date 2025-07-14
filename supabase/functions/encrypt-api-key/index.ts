import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET') || 'default-encryption-key-change-in-production';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple encryption function (in production, use proper encryption libraries)
function encrypt(text: string, key: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ keyData[i % keyData.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

function decrypt(encryptedText: string, key: string): string {
  try {
    const encrypted = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyData[i % keyData.length];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

interface EncryptionRequest {
  action: 'encrypt' | 'decrypt';
  agentId: string;
  apiKeys?: Record<string, string>;
  keyNames?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, agentId, apiKeys, keyNames }: EncryptionRequest = await req.json();

    if (action === 'encrypt' && apiKeys) {
      // Encrypt API keys and store them
      const encryptedKeys: Record<string, string> = {};
      
      for (const [keyName, keyValue] of Object.entries(apiKeys)) {
        if (keyValue && keyValue.trim()) {
          encryptedKeys[keyName] = encrypt(keyValue, encryptionKey);
        }
      }

      // Store encrypted keys in the database
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agentId,
          category: 'encrypted_api_keys',
          configuration: encryptedKeys
        });

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true,
        message: 'API keys encrypted and stored successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'decrypt' && keyNames) {
      // Decrypt and return specific API keys
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('configuration')
        .eq('agent_id', agentId)
        .eq('category', 'encrypted_api_keys')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const decryptedKeys: Record<string, string> = {};
      
      if (data?.configuration) {
        const encryptedKeys = data.configuration as Record<string, string>;
        
        for (const keyName of keyNames) {
          if (encryptedKeys[keyName]) {
            decryptedKeys[keyName] = decrypt(encryptedKeys[keyName], encryptionKey);
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        apiKeys: decryptedKeys
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action or missing parameters');
    }

  } catch (error: any) {
    console.error('Encryption service error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Encryption operation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});