import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GraduationTest = () => {
  const [forceResult, setForceResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const callSupabaseFunction = async (functionName: string, body: any) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  };

  const testForceGraduation = async () => {
    setLoading({ ...loading, force: true });
    try {
      const result = await callSupabaseFunction('test-graduation-trigger', {
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        forceGraduation: true
      });
      
      setForceResult(result);
      toast.success('Force graduation test completed');
    } catch (error: any) {
      setForceResult({ error: error.message });
      toast.error('Force graduation test failed');
    } finally {
      setLoading({ ...loading, force: false });
    }
  };

  const testGraduationCheck = async () => {
    setLoading({ ...loading, check: true });
    try {
      const result = await callSupabaseFunction('test-graduation-trigger', {
        agentId: '30d130d1-7da2-4174-a577-bbb5a57f9125',
        forceGraduation: false
      });
      
      setCheckResult(result);
      toast.success('Graduation check test completed');
    } catch (error: any) {
      setCheckResult({ error: error.message });
      toast.error('Graduation check test failed');
    } finally {
      setLoading({ ...loading, check: false });
    }
  };

  const ResultDisplay = ({ result, title }: { result: any; title: string }) => {
    if (!result) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">{title} Result:</h4>
        <pre className={`p-3 rounded-md text-sm overflow-auto ${
          result.error ? 'bg-destructive/10 text-destructive' : 'bg-muted'
        }`}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Graduation System Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the agent graduation trigger and V2 contract deployment system
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test 1: Force Graduation (CryptoOracle Vision)</CardTitle>
            <CardDescription>
              Agent ID: 30d130d1-7da2-4174-a577-bbb5a57f9125<br/>
              Current PROMPT: 7,003 (needs 42,000 to graduate)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testForceGraduation}
              disabled={loading.force}
              className="w-full"
            >
              {loading.force ? 'Testing...' : 'Force Graduation'}
            </Button>
            <ResultDisplay result={forceResult} title="Force Graduation" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 2: Check Graduation Requirements (CryptoOracle Vision)</CardTitle>
            <CardDescription>
              Agent ID: 30d130d1-7da2-4174-a577-bbb5a57f9125<br/>
              Current PROMPT: 42,000 (should pass graduation check)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGraduationCheck}
              disabled={loading.check}
              className="w-full"
            >
              {loading.check ? 'Testing...' : 'Check Requirements'}
            </Button>
            <ResultDisplay result={checkResult} title="Graduation Check" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 3: Query Graduation Events</CardTitle>
            <CardDescription>
              Check the database for graduation events and transaction logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can query graduation events directly in the Supabase dashboard:<br/>
              • graduation_events table<br/>
              • graduation_transaction_logs table
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GraduationTest;