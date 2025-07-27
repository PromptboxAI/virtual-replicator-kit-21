import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function FactoryDeploymentDebug() {
  const [loading, setLoading] = useState(false);
  const [promptTokenAddress, setPromptTokenAddress] = useState('0x4bfa02f8d386e5a1a6089e83a2d77b5c1995958d');
  const [treasuryAddress, setTreasuryAddress] = useState('0x23d03610584B0f0988A6F9C281a37094D5611388');
  const [result, setResult] = useState<any>(null);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const verifyTokenContract = async () => {
    setVerifyingToken(true);
    try {
      console.log('🔍 Verifying PROMPT token contract...');
      
      const { data, error } = await supabase.functions.invoke('verify-deployment-transaction', {
        body: { 
          contractAddress: promptTokenAddress.trim(),
          network: 'base_sepolia'
        }
      });

      if (error) {
        console.error('❌ Token verification error:', error);
        setTokenValid(false);
        return;
      }

      console.log('📄 Token verification result:', data);
      setTokenValid(data.isValid);
      
    } catch (error: any) {
      console.error('💥 Token verification failed:', error);
      setTokenValid(false);
    } finally {
      setVerifyingToken(false);
    }
  };

  const deployFactory = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔧 Debug Factory Deployment');
      console.log('📍 Prompt Token:', promptTokenAddress);
      console.log('🏦 Treasury:', treasuryAddress);
      
      toast.info('Attempting factory deployment...');
      
      const { data, error } = await supabase.functions.invoke('deploy-factory-contract', {
        body: { 
          promptTokenAddress: promptTokenAddress.trim(),
          treasuryAddress: treasuryAddress.trim()
        }
      });

      console.log('📄 Raw response:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        setResult({ error: error.message, type: 'supabase_error' });
        throw error;
      }

      if (!data) {
        const msg = 'No data returned from edge function';
        console.error('❌ No data:', msg);
        setResult({ error: msg, type: 'no_data' });
        throw new Error(msg);
      }

      if (!data.success) {
        console.error('❌ Deployment failed:', data.error);
        setResult({ error: data.error, type: 'deployment_error', data });
        throw new Error(data.error || 'Deployment failed');
      }

      console.log('✅ Success:', data);
      setResult({ success: true, data });
      toast.success(`Factory deployed at: ${data.contractAddress}`);
      
    } catch (error: any) {
      console.error('💥 Catch block error:', error);
      toast.error(`Deployment failed: ${error.message}`);
      
      if (!result) {
        setResult({ 
          error: error.message, 
          type: 'catch_error',
          stack: error.stack 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factory Deployment Debug</CardTitle>
        <CardDescription>
          Direct test of the deploy-factory-contract edge function with detailed error logging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="promptToken">Prompt Token Address</Label>
          <Input 
            id="promptToken"
            value={promptTokenAddress}
            onChange={(e) => setPromptTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="treasury">Treasury Address</Label>
          <Input 
            id="treasury"
            value={treasuryAddress}
            onChange={(e) => setTreasuryAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={verifyTokenContract} 
            disabled={verifyingToken}
            variant="outline"
            className="flex-1"
          >
            {verifyingToken ? 'Verifying...' : 'Verify Token Contract'}
          </Button>
          {tokenValid !== null && (
            <div className={`px-3 py-2 rounded ${tokenValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {tokenValid ? '✅ Valid' : '❌ Invalid'}
            </div>
          )}
        </div>
        
        <Button 
          onClick={deployFactory} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Deploying...' : 'Deploy Factory (Debug)'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'} - {result.type}
            </h3>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}