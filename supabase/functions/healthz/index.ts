import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminSettings {
  test_mode_enabled?: boolean;
  deployment_mode?: 'database' | 'smart_contract';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch admin settings
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['test_mode_enabled', 'deployment_mode']);

    if (error) {
      console.error('Error fetching admin settings:', error);
      // Fallback to defaults if settings can't be fetched
      return new Response(
        JSON.stringify({
          ok: true,
          ts: Date.now(),
          mode: 'testnet',
          apiVersion: 'v1',
          error: 'Could not fetch settings, using defaults'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Parse settings
    const adminSettings: AdminSettings = {};
    if (settings) {
      for (const setting of settings) {
        if (setting.key === 'test_mode_enabled') {
          adminSettings.test_mode_enabled = setting.value === true || setting.value === 'true';
        } else if (setting.key === 'deployment_mode') {
          adminSettings.deployment_mode = setting.value as 'database' | 'smart_contract';
        }
      }
    }

    // Determine mode
    let mode: string;
    
    if (adminSettings.test_mode_enabled === true) {
      // Test mode enabled = testnet/sepolia
      mode = 'sepolia';
    } else if (adminSettings.deployment_mode === 'smart_contract') {
      // Production with smart contracts = mainnet
      mode = 'mainnet';
    } else {
      // Database mode or fallback = mock
      mode = 'mock';
    }

    console.log('Health check:', { 
      test_mode: adminSettings.test_mode_enabled, 
      deployment_mode: adminSettings.deployment_mode,
      computed_mode: mode 
    });

    return new Response(
      JSON.stringify({
        ok: true,
        ts: Date.now(),
        mode,
        apiVersion: 'v1',
        settings: {
          testMode: adminSettings.test_mode_enabled ?? false,
          deploymentMode: adminSettings.deployment_mode ?? 'database'
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30' // Cache for 30 seconds
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        ts: Date.now(),
        mode: 'unknown',
        apiVersion: 'v1',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
