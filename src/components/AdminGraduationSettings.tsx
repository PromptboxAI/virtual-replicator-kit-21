/**
 * Admin Panel for Graduation Mode Configuration
 * Allows switching between database (42K fixed) and smart_contract ($65K USD dynamic) modes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export function AdminGraduationSettings() {
  const { toast } = useToast();
  const { settings, isLoading, refreshSettings } = useAdminSettings();
  
  const [graduationMode, setGraduationMode] = useState<'database' | 'smart_contract'>('database');
  const [targetMarketCapUsd, setTargetMarketCapUsd] = useState<number>(65000);
  const [promptUsdRate, setPromptUsdRate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load live FX rate from agent_metrics_normalized
  useEffect(() => {
    const loadLiveFxRate = async () => {
      const { data } = await supabase
        .from('agent_metrics_normalized')
        .select('fx')
        .limit(1)
        .single();
      
      if (data?.fx) {
        setPromptUsdRate(String(data.fx));
      }
    };
    
    if (!isLoading) {
      loadLiveFxRate();
    }
  }, [isLoading]);

  // Load current settings from graduation_config
  useEffect(() => {
    const loadGraduationConfig = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'graduation_config')
        .maybeSingle();
      
      if (data?.value) {
        const config = data.value as any;
        setGraduationMode(config.graduation_mode || 'database');
        setTargetMarketCapUsd(config.target_market_cap_usd || 65000);
      }
    };
    
    if (!isLoading) {
      loadGraduationConfig();
    }
  }, [isLoading]);

  // Validate production settings
  const validateSettings = (): boolean => {
    setValidationError(null);

    if (graduationMode === 'smart_contract') {
      // Production validation: minimum $65K USD
      if (targetMarketCapUsd < 65000) {
        setValidationError('Production mode requires minimum $65K USD market cap target');
        return false;
      }

      if (promptUsdRate == null || parseFloat(promptUsdRate) <= 0) {
        setValidationError('PROMPT USD rate must be greater than 0');
        return false;
      }

      // Calculate graduation threshold
      const graduationThreshold = targetMarketCapUsd / parseFloat(promptUsdRate);
      if (graduationThreshold < 50000 || graduationThreshold > 750000) {
        setValidationError(
          `Calculated graduation threshold (${graduationThreshold.toLocaleString()} PROMPT) is outside safe range (50K-750K PROMPT)`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    setIsSaving(true);
    try {
      // Update admin settings
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'graduation_config',
          value: {
            graduation_mode: graduationMode,
            target_market_cap_usd: targetMarketCapUsd,
            prompt_usd_rate: promptUsdRate,
            updated_at: new Date().toISOString()
          }
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `Graduation mode updated to ${graduationMode}`,
      });

      refreshSettings();
    } catch (error) {
      console.error('Failed to save graduation settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save graduation settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state if FX not loaded
  if (isLoading || promptUsdRate == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Graduation Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading FX rate...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculatedGraduationThreshold = graduationMode === 'database' 
    ? 42160 // V7 default
    : targetMarketCapUsd / parseFloat(promptUsdRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Graduation Mode Configuration</CardTitle>
        <CardDescription>
          Configure agent graduation thresholds for test and production environments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Graduation Mode Selection */}
        <div className="space-y-3">
          <Label>Graduation Mode</Label>
          <RadioGroup value={graduationMode} onValueChange={(value) => setGraduationMode(value as 'database' | 'smart_contract')}>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="database" id="database" />
              <div className="space-y-1">
                <Label htmlFor="database" className="font-normal">
                  Database Mode (Test)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Fixed 42,000 PROMPT threshold for test tokens (no USD dependency)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="smart_contract" id="smart_contract" />
              <div className="space-y-1">
                <Label htmlFor="smart_contract" className="font-normal">
                  Smart Contract Mode (Production)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Dynamic USD-based threshold (minimum $65K market cap)
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Production Mode Settings */}
        {graduationMode === 'smart_contract' && (
          <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="targetMarketCap">Target Market Cap (USD)</Label>
              <Input
                id="targetMarketCap"
                type="number"
                value={targetMarketCapUsd}
                onChange={(e) => setTargetMarketCapUsd(Number(e.target.value))}
                min={65000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                Minimum $65,000 USD required for production graduation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptUsdRate">PROMPT USD Rate</Label>
              <Input
                id="promptUsdRate"
                type="number"
                value={promptUsdRate}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Live FX rate from database: ${promptUsdRate} per PROMPT
              </p>
            </div>
          </div>
        )}

        {/* Calculated Threshold Display */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Calculated Graduation Threshold</p>
              <p className="text-2xl font-bold">{calculatedGraduationThreshold.toLocaleString()} PROMPT</p>
              {graduationMode === 'smart_contract' && promptUsdRate && (
                <p className="text-sm text-muted-foreground">
                  = ${targetMarketCapUsd.toLocaleString()} USD / ${promptUsdRate} per PROMPT
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !!validationError}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Graduation Settings
        </Button>
      </CardContent>
    </Card>
  );
}
