import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📖 Reading compilation artifact...');
    
    // Read the artifact file
    const artifactPath = '../deploy-prompt-token-v2/artifacts/PromptTestToken_compData.json';
    const artifactText = await Deno.readTextFile(artifactPath);
    const artifact = JSON.parse(artifactText);

    console.log('🔍 Extracting bytecode...');
    
    // Navigate through the artifact structure to find bytecode
    // Common paths: 
    // - artifact.contracts['PromptTestToken.sol'].PromptTestToken.evm.bytecode.object
    // - artifact.bytecode
    // - artifact.evm.bytecode.object
    
    let bytecode = null;
    
    // Try different possible paths
    if (artifact.contracts) {
      const contractFile = Object.keys(artifact.contracts)[0];
      const contractName = Object.keys(artifact.contracts[contractFile])[0];
      bytecode = artifact.contracts[contractFile][contractName]?.evm?.bytecode?.object;
    } else if (artifact.evm?.bytecode?.object) {
      bytecode = artifact.evm.bytecode.object;
    } else if (artifact.bytecode) {
      bytecode = artifact.bytecode;
    }

    if (!bytecode) {
      // Return the structure so we can see what's in the artifact
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not find bytecode in artifact',
          artifactStructure: Object.keys(artifact),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure bytecode starts with 0x
    if (!bytecode.startsWith('0x')) {
      bytecode = '0x' + bytecode;
    }

    console.log('✅ Bytecode extracted');
    console.log('📏 Length:', bytecode.length, 'characters');
    console.log('🔤 First 66 chars:', bytecode.substring(0, 66));
    console.log('🔤 Last 66 chars:', bytecode.substring(bytecode.length - 66));

    return new Response(
      JSON.stringify({
        success: true,
        bytecode,
        length: bytecode.length,
        preview: {
          start: bytecode.substring(0, 66),
          end: bytecode.substring(bytecode.length - 66),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
