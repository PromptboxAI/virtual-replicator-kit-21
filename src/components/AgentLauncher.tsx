import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play, Pause, Settings, Activity, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AgentLauncherProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description: string;
    category: string | null;
    is_active: boolean;
  };
  onConfigurationClick: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export function AgentLauncher({ agent, onConfigurationClick }: AgentLauncherProps) {
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSetupStatus();
    loadRuntimeStatus();
  }, [agent.id]);

  const checkSetupStatus = async () => {
    try {
      // Check configuration completeness
      const { data: configs, error } = await supabase
        .from('agent_configurations')
        .select('category, configuration')
        .eq('agent_id', agent.id);

      if (error) throw error;

      const configMap = new Map();
      configs?.forEach(config => {
        configMap.set(config.category, config.configuration);
      });

      const hasAPIKeys = configMap.has('api_keys') && Object.keys(configMap.get('api_keys') || {}).length > 0;
      const hasCategoryConfig = configMap.has(agent.category) && Object.keys(configMap.get(agent.category) || {}).length > 0;

      const steps: SetupStep[] = [
        {
          id: 'basic_info',
          title: 'Basic Information',
          description: 'Agent name, description, and category',
          completed: !!(agent.name && agent.description && agent.category),
          required: true
        },
        {
          id: 'category_config',
          title: 'Category Configuration',
          description: `Configure ${agent.category} specific settings`,
          completed: hasCategoryConfig,
          required: true
        },
        {
          id: 'api_keys',
          title: 'API Keys',
          description: 'External service API keys for autonomous operations',
          completed: hasAPIKeys,
          required: true
        },
        {
          id: 'runtime_test',
          title: 'Runtime Test',
          description: 'Test agent execution and verify functionality',
          completed: false,
          required: false
        }
      ];

      setSetupSteps(steps);
    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRuntimeStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-runtime', {
        body: {
          action: 'get_status',
          agentId: agent.id
        }
      });

      if (!error && data.success) {
        setRuntimeStatus(data.status);
        setIsRunning(data.status?.is_active || false);
      }
    } catch (error) {
      console.error('Error loading runtime status:', error);
    }
  };

  const toggleAgentExecution = async () => {
    if (isRunning) {
      // Stop agent
      setIsRunning(false);
      toast({
        title: "Agent Paused",
        description: `${agent.name} has been paused and will stop autonomous operations.`,
      });
      return;
    }

    // Check if ready to launch
    const requiredSteps = setupSteps.filter(step => step.required);
    const incompleteSteps = requiredSteps.filter(step => !step.completed);

    if (incompleteSteps.length > 0) {
      toast({
        title: "Setup Incomplete",
        description: `Please complete: ${incompleteSteps.map(s => s.title).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRunning(true);
      
      const { data, error } = await supabase.functions.invoke('agent-runtime', {
        body: {
          action: 'execute_cycle',
          agentId: agent.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Agent Launched! 🚀",
          description: `${agent.name} is now running autonomously and generating value for token holders.`,
        });
        
        // Mark runtime test as completed
        setSetupSteps(prev => prev.map(step => 
          step.id === 'runtime_test' ? { ...step, completed: true } : step
        ));
        
        loadRuntimeStatus();
      }
    } catch (error: any) {
      setIsRunning(false);
      toast({
        title: "Launch Failed",
        description: error.message || "Failed to start agent execution",
        variant: "destructive"
      });
    }
  };

  const completionPercentage = setupSteps.length > 0 
    ? Math.round((setupSteps.filter(step => step.completed).length / setupSteps.length) * 100)
    : 0;

  const canLaunch = setupSteps.filter(step => step.required).every(step => step.completed);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking agent readiness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Status Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {agent.name}
                {isRunning ? (
                  <Badge className="bg-green-500 text-white">
                    <Activity className="h-3 w-3 mr-1" />
                    Running
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Pause className="h-3 w-3 mr-1" />
                    Stopped
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{agent.category} • {agent.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Setup Complete</div>
            </div>
          </div>
          
          <Progress value={completionPercentage} className="mb-4" />
          
          <div className="flex gap-2">
            <Button
              onClick={toggleAgentExecution}
              disabled={!canLaunch && !isRunning}
              className={isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Agent
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Launch Agent
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onConfigurationClick}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                    {step.title}
                  </h4>
                  {step.required && !step.completed && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Runtime Status */}
      {runtimeStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Runtime Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{runtimeStatus.tasks_completed || 0}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${(runtimeStatus.revenue_generated || 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Revenue Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {runtimeStatus.last_activity_at ? 'Active' : 'Idle'}
                </div>
                <div className="text-sm text-muted-foreground">Current Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {!canLaunch && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Setup Required</h3>
                <p className="text-sm text-yellow-700">
                  Complete the required setup steps to launch your autonomous agent. 
                  Your agent needs proper configuration and API keys to operate effectively.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}