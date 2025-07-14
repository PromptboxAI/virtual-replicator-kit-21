import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { BarChart3, Database, AlertCircle, Save, RotateCcw, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsConfig {
  dataSources: string[];
  reportTypes: string[];
  reportFrequency: string;
  alertThresholds: { [key: string]: number };
  dashboardWidgets: string[];
  automatedInsights: boolean;
  customMetrics: boolean;
  realTimeMonitoring: boolean;
  dataRetention: number;
  exportFormats: string[];
  visualizations: string[];
  alertChannels: string[];
  anomalyDetection: boolean;
  trendAnalysis: boolean;
  forecastingEnabled: boolean;
  dataAccuracy: number;
}

interface ConfigurationProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description: string;
    avatar_url: string | null;
    category: string | null;
    framework: string | null;
    is_active: boolean;
  };
  onConfigurationUpdated: () => void;
}

const DATA_SOURCES = [
  'Web Analytics', 'Social Media APIs', 'Database Queries', 'CSV Files', 'API Endpoints', 
  'Blockchain Data', 'Market Data', 'User Behavior', 'Financial Data', 'Custom Sources'
];

const REPORT_TYPES = [
  'Performance Dashboard', 'Trend Analysis', 'User Segmentation', 'Revenue Reports', 
  'Growth Metrics', 'Engagement Analysis', 'Conversion Funnels', 'A/B Test Results'
];

const DASHBOARD_WIDGETS = [
  'Line Charts', 'Bar Charts', 'Pie Charts', 'Tables', 'KPI Cards', 'Heat Maps', 
  'Funnel Charts', 'Scatter Plots', 'Gauge Charts', 'Treemaps'
];

const EXPORT_FORMATS = [
  'PDF', 'CSV', 'Excel', 'JSON', 'PNG', 'SVG'
];

const VISUALIZATIONS = [
  'Time Series', 'Geographic Maps', 'Correlation Matrix', 'Distribution Plots', 
  'Box Plots', 'Histograms', 'Cohort Analysis', 'Sankey Diagrams'
];

const ALERT_CHANNELS = [
  'Email', 'Slack', 'Discord', 'Webhook', 'SMS', 'Push Notifications'
];

const REPORT_FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export function AnalyticsAgentConfiguration({ agent, onConfigurationUpdated }: ConfigurationProps) {
  const [config, setConfig] = useState<AnalyticsConfig>({
    dataSources: ['Web Analytics', 'Database Queries'],
    reportTypes: ['Performance Dashboard', 'Trend Analysis'],
    reportFrequency: 'daily',
    alertThresholds: {
      performance: 80,
      errors: 5,
      users: 1000
    },
    dashboardWidgets: ['Line Charts', 'KPI Cards'],
    automatedInsights: true,
    customMetrics: true,
    realTimeMonitoring: true,
    dataRetention: 90,
    exportFormats: ['PDF', 'CSV'],
    visualizations: ['Time Series', 'Distribution Plots'],
    alertChannels: ['Email'],
    anomalyDetection: true,
    trendAnalysis: true,
    forecastingEnabled: false,
    dataAccuracy: 8
  });

  const [originalConfig, setOriginalConfig] = useState<AnalyticsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, [agent.id]);

  useEffect(() => {
    if (originalConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }
  }, [config, originalConfig]);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('category', 'Analytics Agent')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedConfig = data.configuration as unknown as AnalyticsConfig;
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      } else {
        setOriginalConfig(config);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error Loading Configuration",
        description: "Using default settings",
        variant: "destructive"
      });
      setOriginalConfig(config);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: 'Analytics Agent',
          configuration: config as any
        });

      if (error) throw error;

      setOriginalConfig(config);
      setHasChanges(false);
      onConfigurationUpdated();

      toast({
        title: "Analytics Agent Configuration Saved! 📊",
        description: "Your analytics agent configuration has been updated and will generate insights autonomously.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(originalConfig);
      setHasChanges(false);
    }
  };

  const toggleDataSource = (source: string) => {
    setConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.includes(source)
        ? prev.dataSources.filter(s => s !== source)
        : [...prev.dataSources, source]
    }));
  };

  const toggleReportType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      reportTypes: prev.reportTypes.includes(type)
        ? prev.reportTypes.filter(t => t !== type)
        : [...prev.reportTypes, type]
    }));
  };

  const toggleWidget = (widget: string) => {
    setConfig(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.includes(widget)
        ? prev.dashboardWidgets.filter(w => w !== widget)
        : [...prev.dashboardWidgets, widget]
    }));
  };

  const toggleExportFormat = (format: string) => {
    setConfig(prev => ({
      ...prev,
      exportFormats: prev.exportFormats.includes(format)
        ? prev.exportFormats.filter(f => f !== format)
        : [...prev.exportFormats, format]
    }));
  };

  const toggleVisualization = (viz: string) => {
    setConfig(prev => ({
      ...prev,
      visualizations: prev.visualizations.includes(viz)
        ? prev.visualizations.filter(v => v !== viz)
        : [...prev.visualizations, viz]
    }));
  };

  const toggleAlertChannel = (channel: string) => {
    setConfig(prev => ({
      ...prev,
      alertChannels: prev.alertChannels.includes(channel)
        ? prev.alertChannels.filter(c => c !== channel)
        : [...prev.alertChannels, channel]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Analytics Agent Configuration</h2>
        <p className="text-muted-foreground">
          Configure your autonomous analytics and reporting settings
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Configuration Status</h3>
              <p className="text-sm text-muted-foreground">
                {hasChanges ? "You have unsaved changes" : "Configuration is up to date"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select data sources to analyze</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {DATA_SOURCES.map((source) => (
              <Badge
                key={source}
                variant={config.dataSources.includes(source) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleDataSource(source)}
              >
                {source}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Report Frequency</Label>
            <Select value={config.reportFrequency} onValueChange={(value) => setConfig(prev => ({ ...prev, reportFrequency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Report Types</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {REPORT_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={config.reportTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleReportType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Dashboard Widgets</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {DASHBOARD_WIDGETS.map((widget) => (
                <Badge
                  key={widget}
                  variant={config.dashboardWidgets.includes(widget) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleWidget(widget)}
                >
                  {widget}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Visualization Types</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {VISUALIZATIONS.map((viz) => (
                <Badge
                  key={viz}
                  variant={config.visualizations.includes(viz) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleVisualization(viz)}
                >
                  {viz}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="performanceThreshold">Performance Threshold (%)</Label>
              <Input
                id="performanceThreshold"
                type="number"
                value={config.alertThresholds.performance}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, performance: Number(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="errorThreshold">Error Rate (%)</Label>
              <Input
                id="errorThreshold"
                type="number"
                value={config.alertThresholds.errors}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, errors: Number(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="userThreshold">User Count</Label>
              <Input
                id="userThreshold"
                type="number"
                value={config.alertThresholds.users}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  alertThresholds: { ...prev.alertThresholds, users: Number(e.target.value) }
                }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Alert Channels</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {ALERT_CHANNELS.map((channel) => (
                <Badge
                  key={channel}
                  variant={config.alertChannels.includes(channel) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAlertChannel(channel)}
                >
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export & Sharing */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Export Formats</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXPORT_FORMATS.map((format) => (
                <Badge
                  key={format}
                  variant={config.exportFormats.includes(format) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleExportFormat(format)}
                >
                  {format}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Data Retention: {config.dataRetention} days</Label>
            <div className="mt-2">
              <Slider
                value={[config.dataRetention]}
                onValueChange={(value) => setConfig(prev => ({ ...prev, dataRetention: value[0] }))}
                max={365}
                min={7}
                step={7}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 Week</span>
                <span>1 Year</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Automated Insights</Label>
                <p className="text-sm text-muted-foreground">Generate AI-powered insights</p>
              </div>
              <Switch
                checked={config.automatedInsights}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, automatedInsights: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Real-time Monitoring</Label>
                <p className="text-sm text-muted-foreground">Monitor data in real-time</p>
              </div>
              <Switch
                checked={config.realTimeMonitoring}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, realTimeMonitoring: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Anomaly Detection</Label>
                <p className="text-sm text-muted-foreground">Detect unusual patterns</p>
              </div>
              <Switch
                checked={config.anomalyDetection}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, anomalyDetection: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Trend Analysis</Label>
                <p className="text-sm text-muted-foreground">Analyze trends and patterns</p>
              </div>
              <Switch
                checked={config.trendAnalysis}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, trendAnalysis: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Forecasting</Label>
                <p className="text-sm text-muted-foreground">Predict future trends</p>
              </div>
              <Switch
                checked={config.forecastingEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, forecastingEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Custom Metrics</Label>
                <p className="text-sm text-muted-foreground">Create custom KPIs</p>
              </div>
              <Switch
                checked={config.customMetrics}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, customMetrics: checked }))}
              />
            </div>
          </div>

          <div>
            <Label>Data Accuracy: {config.dataAccuracy}/10</Label>
            <div className="mt-2">
              <Slider
                value={[config.dataAccuracy]}
                onValueChange={(value) => setConfig(prev => ({ ...prev, dataAccuracy: value[0] }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Basic</span>
                <span>High Precision</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Analytics Data Notice</h3>
              <p className="text-sm text-yellow-700">
                Your agent will process and analyze data autonomously. Ensure you have proper permissions 
                for all data sources and comply with data privacy regulations (GDPR, CCPA, etc.).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}