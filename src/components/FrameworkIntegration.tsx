import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code, ExternalLink, Rocket, Zap, Settings, Users, Brain, Shield } from "lucide-react";
import { FrameworkSDKService, FrameworkConfig } from "@/lib/frameworkSDK";

interface FrameworkIntegrationProps {
  framework: string;
  agentName: string;
  agentDescription: string;
}

export const FrameworkIntegration: React.FC<FrameworkIntegrationProps> = ({
  framework,
  agentName,
  agentDescription
}) => {
  const [showCode, setShowCode] = useState(false);
  const config = FrameworkSDKService.getFrameworkConfig(framework);

  if (!config) return null;

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'tokenization':
      case 'governance': 
        return <Shield className="h-3 w-3" />;
      case 'multi_agent':
      case 'team_collaboration':
        return <Users className="h-3 w-3" />;
      case 'conversation':
      case 'personality':
        return <Brain className="h-3 w-3" />;
      case 'autonomous_execution':
      case 'autonomous_trading':
        return <Zap className="h-3 w-3" />;
      default:
        return <Settings className="h-3 w-3" />;
    }
  };

  const generatedCode = FrameworkSDKService.generateAgentCode(framework, {
    name: agentName,
    description: agentDescription,
    framework
  });

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-base text-primary">SDK Integration</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {config.sdkType}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Your agent will be deployed to {framework} with full SDK integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Features */}
        <div>
          <h4 className="text-sm font-medium mb-2">Enabled Features</h4>
          <div className="flex flex-wrap gap-1">
            {config.supportedFeatures.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                <span className="flex items-center gap-1">
                  {getFeatureIcon(feature)}
                  {feature.replace(/_/g, ' ')}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Requirements */}
        {config.requiresAPIKey && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ This framework requires an API key for deployment
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Code className="h-3 w-3 mr-1" />
                View Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generated {framework} Agent Code</DialogTitle>
                <DialogDescription>
                  This code will be automatically generated and deployed for your agent
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" asChild>
            <a href={config.documentationUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Docs
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};