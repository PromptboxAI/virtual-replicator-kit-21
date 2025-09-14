import { useEffect, useState } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAppMode } from '@/hooks/useAppMode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  expected?: any;
  actual?: any;
}

export const AdminSystemValidator = () => {
  const { settings, isLoading: settingsLoading, refreshSettings } = useAdminSettings();
  const { mode, isTestMode, isProductionMode } = useAppMode();
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    // Test 1: Database vs UI Settings Sync
    if (settings) {
      results.push({
        component: 'Database Settings Loading',
        status: 'pass',
        message: 'Admin settings loaded successfully from database'
      });

      // Test deployment mode - just verify it exists and is valid
      const validDeploymentModes = ['database', 'smart_contract'];
      const isValidDeploymentMode = validDeploymentModes.includes(settings.deployment_mode);
      results.push({
        component: 'Deployment Mode',
        status: isValidDeploymentMode ? 'pass' : 'fail',
        message: `Deployment mode is ${isValidDeploymentMode ? 'valid' : 'invalid'}: ${settings.deployment_mode}`,
        expected: 'database or smart_contract',
        actual: settings.deployment_mode
      });

      // Test MEV protection
      const expectedMEV = true;
      results.push({
        component: 'MEV Protection',
        status: settings.mev_protection_enabled === expectedMEV ? 'pass' : 'fail',
        message: `MEV protection ${settings.mev_protection_enabled === expectedMEV ? 'correctly shows' : 'incorrectly shows'} ${settings.mev_protection_enabled ? 'enabled' : 'disabled'}`,
        expected: expectedMEV,
        actual: settings.mev_protection_enabled
      });

      // Test mode sync
      const expectedTestMode = false;
      results.push({
        component: 'Test Mode Sync',
        status: settings.test_mode_enabled === expectedTestMode ? 'pass' : 'fail',
        message: `Test mode ${settings.test_mode_enabled === expectedTestMode ? 'correctly shows' : 'incorrectly shows'} ${settings.test_mode_enabled ? 'enabled' : 'disabled'}`,
        expected: expectedTestMode,
        actual: settings.test_mode_enabled
      });

      // Test navigation sync
      const navigationMode = localStorage.getItem('app-mode');
      const expectedNavMode = settings.test_mode_enabled ? 'test' : 'production';
      results.push({
        component: 'Navigation Sync',
        status: navigationMode === expectedNavMode ? 'pass' : 'warning',
        message: `Navigation mode ${navigationMode === expectedNavMode ? 'synced with' : 'not synced with'} admin settings`,
        expected: expectedNavMode,
        actual: navigationMode
      });
    } else {
      results.push({
        component: 'Database Settings Loading',
        status: 'fail',
        message: 'Failed to load admin settings from database'
      });
    }

    // Test UI Components
    const toggleElements = document.querySelectorAll('[role="switch"]');
    results.push({
      component: 'UI Toggle Elements',
      status: toggleElements.length >= 2 ? 'pass' : 'warning',
      message: `Found ${toggleElements.length} toggle switches in UI`,
      expected: '2+',
      actual: toggleElements.length
    });

    const buttonElements = document.querySelectorAll('button:not([disabled])');
    results.push({
      component: 'Interactive Buttons',
      status: buttonElements.length > 0 ? 'pass' : 'fail',
      message: `Found ${buttonElements.length} interactive buttons`,
      actual: buttonElements.length
    });

    setValidationResults(results);
    setIsValidating(false);
  };

  useEffect(() => {
    if (!settingsLoading && settings) {
      runValidation();
    }
  }, [settings, settingsLoading]);

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">WARN</Badge>;
    }
  };

  const passCount = validationResults.filter(r => r.status === 'pass').length;
  const failCount = validationResults.filter(r => r.status === 'fail').length;
  const warnCount = validationResults.filter(r => r.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Admin System Validation
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Revalidate
          </Button>
        </CardTitle>
        <CardDescription>
          Comprehensive validation of admin system functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{passCount} Passed</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">{failCount} Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{warnCount} Warnings</span>
          </div>
        </div>

        {/* Current State Summary */}
        {settings && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Current Admin Settings</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Deployment Mode: <strong>{settings.deployment_mode}</strong></li>
                <li>MEV Protection: <strong>{settings.mev_protection_enabled ? 'Enabled' : 'Disabled'}</strong></li>
                <li>Test Mode: <strong>{settings.test_mode_enabled ? 'Enabled' : 'Disabled'}</strong></li>
                <li>Emergency Pause: <strong>{settings.emergency_pause ? 'Active' : 'Inactive'}</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Navigation State</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>App Mode: <strong>{mode}</strong></li>
                <li>Is Test Mode: <strong>{isTestMode ? 'Yes' : 'No'}</strong></li>
                <li>Is Production: <strong>{isProductionMode ? 'Yes' : 'No'}</strong></li>
                <li>LocalStorage: <strong>{localStorage.getItem('app-mode') || 'Not Set'}</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* Detailed Results */}
        <div className="space-y-2">
          <h4 className="font-medium">Validation Results</h4>
          {validationResults.map((result, index) => (
            <div key={index} className="flex items-start justify-between p-3 rounded-lg border">
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <h5 className="font-medium text-sm">{result.component}</h5>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {(result.expected !== undefined || result.actual !== undefined) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.expected !== undefined && (
                        <span>Expected: <code className="bg-muted px-1 rounded">{JSON.stringify(result.expected)}</code></span>
                      )}
                      {result.actual !== undefined && (
                        <span className="ml-2">Actual: <code className="bg-muted px-1 rounded">{JSON.stringify(result.actual)}</code></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          ))}
        </div>

        {failCount === 0 && warnCount === 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">All Systems Operational</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All admin system components are functioning correctly and properly synchronized.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};