import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Database, Brain, AlertTriangle, Clock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsAgentConfig {
  name: string;
  description: string;
  dataSources: string[];
  analysisTypes: string[];
  reportingFrequency: string;
  dashboards: {
    realTimeDashboard: boolean;
    customCharts: boolean;
    alertSystem: boolean;
    exportOptions: boolean;
  };
  aiInsights: {
    trendAnalysis: boolean;
    predictiveModeling: boolean;
    anomalyDetection: boolean;
    recommendationEngine: boolean;
  };
  integrations: {
    googleAnalytics: boolean;
    mixpanel: boolean;
    amplitude: boolean;
    segment: boolean;
    customAPIs: boolean;
  };
  notifications: {
    emailReports: boolean;
    slackAlerts: boolean;
    thresholdAlerts: boolean;
    weeklyDigest: boolean;
  };
}

interface AnalyticsAgentBuilderProps {
  onNext: (config: AnalyticsAgentConfig) => void;
  onBack: () => void;
}

const DATA_SOURCES = [
  { id: 'web_analytics', name: 'Web Analytics', icon: '🌐', description: 'Website traffic and user behavior' },
  { id: 'social_media', name: 'Social Media', icon: '📱', description: 'Social platform metrics and engagement' },
  { id: 'email_marketing', name: 'Email Marketing', icon: '📧', description: 'Email campaign performance' },
  { id: 'sales_data', name: 'Sales Data', icon: '💰', description: 'Sales metrics and revenue tracking' },
  { id: 'customer_data', name: 'Customer Data', icon: '👥', description: 'Customer behavior and demographics' },
  { id: 'marketing_campaigns', name: 'Marketing Campaigns', icon: '📢', description: 'Campaign performance metrics' },
  { id: 'financial_data', name: 'Financial Data', icon: '💹', description: 'Financial performance and KPIs' },
  { id: 'blockchain_data', name: 'Blockchain Data', icon: '🔗', description: 'On-chain analytics and DeFi metrics' }
];

const ANALYSIS_TYPES = [
  { id: 'descriptive', name: 'Descriptive Analytics', description: 'What happened? Historical data analysis' },
  { id: 'diagnostic', name: 'Diagnostic Analytics', description: 'Why did it happen? Root cause analysis' },
  { id: 'predictive', name: 'Predictive Analytics', description: 'What will happen? Future trend predictions' },
  { id: 'prescriptive', name: 'Prescriptive Analytics', description: 'What should we do? Actionable recommendations' },
  { id: 'cohort', name: 'Cohort Analysis', description: 'User behavior over time segments' },
  { id: 'funnel', name: 'Funnel Analysis', description: 'Conversion process optimization' }
];

const REPORTING_FREQUENCIES = [
  { id: 'real_time', name: 'Real-time', description: 'Continuous updates' },
  { id: 'hourly', name: 'Hourly', description: 'Every hour' },
  { id: 'daily', name: 'Daily', description: 'Once per day' },
  { id: 'weekly', name: 'Weekly', description: 'Once per week' },
  { id: 'monthly', name: 'Monthly', description: 'Once per month' },
  { id: 'custom', name: 'Custom', description: 'Define your own schedule' }
];

export function AnalyticsAgentBuilder({ onNext, onBack }: AnalyticsAgentBuilderProps) {
  const [config, setConfig] = useState<AnalyticsAgentConfig>({
    name: '',
    description: '',
    dataSources: [],
    analysisTypes: [],
    reportingFrequency: 'daily',
    dashboards: {
      realTimeDashboard: true,
      customCharts: true,
      alertSystem: true,
      exportOptions: true
    },
    aiInsights: {
      trendAnalysis: true,
      predictiveModeling: false,
      anomalyDetection: true,
      recommendationEngine: false
    },
    integrations: {
      googleAnalytics: false,
      mixpanel: false,
      amplitude: false,
      segment: false,
      customAPIs: false
    },
    notifications: {
      emailReports: true,
      slackAlerts: false,
      thresholdAlerts: true,
      weeklyDigest: true
    }
  });

  const { toast } = useToast();

  const handleNext = () => {
    if (!config.name || !config.description) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields to continue",
        variant: "destructive"
      });
      return;
    }

    if (config.dataSources.length === 0) {
      toast({
        title: "Data Source Required",
        description: "Please select at least one data source",
        variant: "destructive"
      });
      return;
    }

    if (config.analysisTypes.length === 0) {
      toast({
        title: "Analysis Type Required",
        description: "Please select at least one analysis type",
        variant: "destructive"
      });
      return;
    }

    onNext(config);
  };

  const toggleDataSource = (sourceId: string) => {
    setConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.includes(sourceId)
        ? prev.dataSources.filter(s => s !== sourceId)
        : [...prev.dataSources, sourceId]
    }));
  };

  const toggleAnalysisType = (typeId: string) => {
    setConfig(prev => ({
      ...prev,
      analysisTypes: prev.analysisTypes.includes(typeId)
        ? prev.analysisTypes.filter(t => t !== typeId)
        : [...prev.analysisTypes, typeId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Analytics Agent Configuration</h2>
        <p className="text-muted-foreground">Configure your AI-powered analytics assistant</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Data Insights Agent"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your analytics agent's purpose and focus areas..."
              rows={3}
            />
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
          <CardDescription>Select the data sources your agent will analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATA_SOURCES.map((source) => (
              <Card
                key={source.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.dataSources.includes(source.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleDataSource(source.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{source.icon}</div>
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Types
          </CardTitle>
          <CardDescription>Choose the types of analysis your agent will perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ANALYSIS_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.analysisTypes.includes(type.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleAnalysisType(type.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reporting Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reporting Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REPORTING_FREQUENCIES.map((freq) => (
              <Card
                key={freq.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.reportingFrequency === freq.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setConfig(prev => ({ ...prev, reportingFrequency: freq.id }))}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold mb-2">{freq.name}</h3>
                  <p className="text-sm text-muted-foreground">{freq.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Features */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Real-time Dashboard</Label>
                <p className="text-sm text-muted-foreground">Live data visualization</p>
              </div>
              <Switch
                checked={config.dashboards.realTimeDashboard}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  dashboards: { ...prev.dashboards, realTimeDashboard: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Custom Charts</Label>
                <p className="text-sm text-muted-foreground">Customizable visualizations</p>
              </div>
              <Switch
                checked={config.dashboards.customCharts}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  dashboards: { ...prev.dashboards, customCharts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alert System</Label>
                <p className="text-sm text-muted-foreground">Automated threshold alerts</p>
              </div>
              <Switch
                checked={config.dashboards.alertSystem}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  dashboards: { ...prev.dashboards, alertSystem: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Export Options</Label>
                <p className="text-sm text-muted-foreground">Download reports and data</p>
              </div>
              <Switch
                checked={config.dashboards.exportOptions}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  dashboards: { ...prev.dashboards, exportOptions: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Trend Analysis</Label>
                <p className="text-sm text-muted-foreground">Identify patterns and trends</p>
              </div>
              <Switch
                checked={config.aiInsights.trendAnalysis}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  aiInsights: { ...prev.aiInsights, trendAnalysis: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Predictive Modeling</Label>
                <p className="text-sm text-muted-foreground">Forecast future outcomes</p>
              </div>
              <Switch
                checked={config.aiInsights.predictiveModeling}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  aiInsights: { ...prev.aiInsights, predictiveModeling: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Anomaly Detection</Label>
                <p className="text-sm text-muted-foreground">Detect unusual patterns</p>
              </div>
              <Switch
                checked={config.aiInsights.anomalyDetection}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  aiInsights: { ...prev.aiInsights, anomalyDetection: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Recommendation Engine</Label>
                <p className="text-sm text-muted-foreground">AI-driven recommendations</p>
              </div>
              <Switch
                checked={config.aiInsights.recommendationEngine}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  aiInsights: { ...prev.aiInsights, recommendationEngine: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Google Analytics</Label>
                <p className="text-sm text-muted-foreground">Web analytics integration</p>
              </div>
              <Switch
                checked={config.integrations.googleAnalytics}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, googleAnalytics: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mixpanel</Label>
                <p className="text-sm text-muted-foreground">Product analytics</p>
              </div>
              <Switch
                checked={config.integrations.mixpanel}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, mixpanel: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Amplitude</Label>
                <p className="text-sm text-muted-foreground">User behavior analytics</p>
              </div>
              <Switch
                checked={config.integrations.amplitude}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, amplitude: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Segment</Label>
                <p className="text-sm text-muted-foreground">Customer data platform</p>
              </div>
              <Switch
                checked={config.integrations.segment}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, segment: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Custom APIs</Label>
                <p className="text-sm text-muted-foreground">Connect your own data sources</p>
              </div>
              <Switch
                checked={config.integrations.customAPIs}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, customAPIs: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Reports</Label>
                <p className="text-sm text-muted-foreground">Automated email reports</p>
              </div>
              <Switch
                checked={config.notifications.emailReports}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailReports: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Slack Alerts</Label>
                <p className="text-sm text-muted-foreground">Real-time Slack notifications</p>
              </div>
              <Switch
                checked={config.notifications.slackAlerts}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, slackAlerts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Threshold Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert when metrics exceed limits</p>
              </div>
              <Switch
                checked={config.notifications.thresholdAlerts}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, thresholdAlerts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">Summary of weekly insights</p>
              </div>
              <Switch
                checked={config.notifications.weeklyDigest}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, weeklyDigest: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue to API Setup
        </Button>
      </div>
    </div>
  );
}