import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BytecodeExtractor() {
  const [bytecode, setBytecode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const extractBytecode = async () => {
    setLoading(true);
    try {
      console.log('Calling extract-bytecode function...');
      
      const { data, error } = await supabase.functions.invoke('extract-bytecode', {
        body: {},
      });

      if (error) throw error;

      if (data.success) {
        setBytecode(data.bytecode);
        toast.success(`Bytecode extracted! Length: ${data.length} characters`);
        console.log('✅ Complete bytecode:', data.bytecode);
        console.log('📏 Length:', data.length);
      } else {
        toast.error(`Failed: ${data.error}`);
        console.error('Artifact structure:', data.artifactStructure);
      }
    } catch (error: any) {
      console.error('Error extracting bytecode:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyBytecode = () => {
    navigator.clipboard.writeText(bytecode);
    toast.success('Bytecode copied to clipboard!');
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Bytecode Extractor</h2>
      
      <Button 
        onClick={extractBytecode} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Extracting...' : 'Extract Complete Bytecode'}
      </Button>

      {bytecode && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Length: {bytecode.length} characters
            </p>
            <Button onClick={copyBytecode} variant="outline" size="sm">
              Copy to Clipboard
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs break-all whitespace-pre-wrap font-mono">
              {bytecode}
            </pre>
          </div>

          <div className="text-sm">
            <p className="font-semibold mb-2">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Copy the bytecode above</li>
              <li>Update <code className="bg-muted px-1 rounded">supabase/functions/deploy-prompt-token-v2/prompt-contract.ts</code></li>
              <li>Replace the <code className="bg-muted px-1 rounded">PROMPT_TOKEN_BYTECODE</code> value with this complete bytecode</li>
              <li>Test the deployment again</li>
            </ol>
          </div>
        </div>
      )}
    </Card>
  );
}
