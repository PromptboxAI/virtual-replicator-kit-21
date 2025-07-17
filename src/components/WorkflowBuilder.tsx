import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Bot,
  MessageSquare,
  Code,
  Zap,
  Send,
  Play,
  Save,
  Plus,
  Settings,
  Trash2,
  Loader2,
  Brain,
  Database,
  Globe,
  Mail,
  FileText,
  Image,
  Video,
  Calculator,
  Clock,
  Filter,
  ShuffleIcon as Shuffle,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface WorkflowBuilderProps {
  agentId: string;
  agentName: string;
  onComplete?: (workflowId: string) => void;
}

// Node types
const nodeTypes = {
  // We'll define custom nodes here
};

// Initial nodes based on Stack AI's approach
const initialNodes: Node[] = [
  {
    id: 'input-1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Input',
      type: 'text',
      description: 'User message input',
      icon: MessageSquare,
      color: 'blue'
    },
  },
  {
    id: 'llm-1',
    type: 'default',
    position: { x: 400, y: 100 },
    data: { 
      label: 'OpenAI',
      type: 'llm',
      description: 'AI processing node',
      icon: Brain,
      color: 'purple',
      model: 'gpt-4o-mini',
      prompt: 'You are a helpful AI assistant. Respond to the user\'s query in a helpful and informative way.'
    },
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 700, y: 100 },
    data: { 
      label: 'Output',
      type: 'text',
      description: 'Response output',
      icon: Send,
      color: 'green'
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'input-1',
    target: 'llm-1',
    animated: true,
  },
  {
    id: 'e2-3',
    source: 'llm-1',
    target: 'output-1',
    animated: true,
  },
];

// Available node types for the sidebar
const availableNodes = [
  { type: 'input', label: 'Text Input', icon: MessageSquare, color: 'blue', description: 'Accept text input from users' },
  { type: 'llm', label: 'OpenAI', icon: Brain, color: 'purple', description: 'AI language model processing' },
  { type: 'llm', label: 'Claude', icon: Bot, color: 'orange', description: 'Anthropic Claude model' },
  { type: 'api', label: 'API Call', icon: Globe, color: 'cyan', description: 'Make HTTP requests to external APIs' },
  { type: 'database', label: 'Database', icon: Database, color: 'green', description: 'Query or store data' },
  { type: 'code', label: 'Code', icon: Code, color: 'gray', description: 'Execute custom Python code' },
  { type: 'filter', label: 'Filter', icon: Filter, color: 'yellow', description: 'Filter and transform data' },
  { type: 'email', label: 'Email', icon: Mail, color: 'red', description: 'Send email notifications' },
  { type: 'file', label: 'File', icon: FileText, color: 'indigo', description: 'Process files and documents' },
  { type: 'output', label: 'Text Output', icon: Send, color: 'green', description: 'Display final output' },
];

export function WorkflowBuilder({ agentId, agentName, onComplete }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = useCallback((nodeTemplate: typeof availableNodes[0]) => {
    const newNode: Node = {
      id: `${nodeTemplate.type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: {
        label: nodeTemplate.label,
        type: nodeTemplate.type,
        description: nodeTemplate.description,
        icon: nodeTemplate.icon,
        color: nodeTemplate.color,
        ...(nodeTemplate.type === 'llm' && { 
          model: 'gpt-4o-mini', 
          prompt: 'You are a helpful assistant.' 
        }),
        ...(nodeTemplate.type === 'api' && { 
          url: '', 
          method: 'GET',
          headers: {}
        }),
        ...(nodeTemplate.type === 'code' && { 
          code: '# Your Python code here\nresult = input_data' 
        }),
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const workflowData = {
        agent_id: agentId,
        nodes: nodes,
        edges: edges,
        metadata: {
          name: `${agentName} Workflow`,
          description: 'AI Agent Workflow created with visual builder',
          version: '1.0'
        }
      };

      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agentId,
          category: 'workflow',
          configuration: workflowData as any
        });

      if (error) throw error;

      toast({
        title: "Workflow Saved! 🎉",
        description: "Your AI agent workflow has been saved successfully.",
      });

      onComplete?.(agentId);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save workflow",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWorkflow = async () => {
    if (!testInput.trim()) {
      toast({
        title: "Test Input Required",
        description: "Please enter some test input to run the workflow",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestOutput('');

    try {
      // Find the LLM node to get the prompt
      const llmNode = nodes.find(node => node.data.type === 'llm');
      if (!llmNode) {
        throw new Error('No LLM node found in workflow');
      }

      const { data, error } = await supabase.functions.invoke('test-assistant', {
        body: {
          message: testInput,
          prompt: llmNode.data.prompt || 'You are a helpful assistant.',
          model: llmNode.data.model || 'gpt-4o-mini'
        }
      });

      if (error) throw error;

      setTestOutput(data.response || 'Test completed successfully!');
      toast({
        title: "Test Successful! 🚀",
        description: "Your workflow is working correctly!",
      });
    } catch (error: any) {
      setTestOutput(`Error: ${error.message}`);
      toast({
        title: "Test Failed",
        description: error.message || "Workflow test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderNodeConfig = () => {
    if (!selectedNode) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select a node to configure its settings</p>
        </div>
      );
    }

    const IconComponent = selectedNode.data.icon as React.ComponentType<any>;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${selectedNode.data.color}-100`}>
            <IconComponent className={`w-4 h-4 text-${selectedNode.data.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold">{selectedNode.data.label as string}</h3>
            <p className="text-xs text-muted-foreground">{selectedNode.data.description as string}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="node-label">Node Label</Label>
            <Input
              id="node-label"
              value={selectedNode.data.label as string}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            />
          </div>

          {selectedNode.data.type === 'llm' && (
            <>
              <div>
                <Label htmlFor="model">Model</Label>
                <Select
                  value={selectedNode.data.model as string}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={selectedNode.data.prompt as string}
                  onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                  rows={4}
                  placeholder="Enter the system prompt for this AI model..."
                />
              </div>
            </>
          )}

          {selectedNode.data.type === 'api' && (
            <>
              <div>
                <Label htmlFor="api-url">API URL</Label>
                <Input
                  id="api-url"
                  value={(selectedNode.data.url as string) || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <Label htmlFor="method">Method</Label>
                <Select
                  value={selectedNode.data.method as string}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedNode.data.type === 'code' && (
            <div>
              <Label htmlFor="code">Python Code</Label>
              <Textarea
                id="code"
                value={selectedNode.data.code as string}
                onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value })}
                rows={8}
                placeholder="# Your Python code here..."
                className="font-mono text-sm"
              />
            </div>
          )}

          <Button
            onClick={() => deleteNode(selectedNode.id)}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Node
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[800px] flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2">Workflow Builder</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop components to build your AI agent workflow
          </p>
        </div>

        {/* Node Library */}
        <div className="p-4 border-b">
          <h3 className="font-medium mb-3">Components</h3>
          <div className="space-y-2">
            {availableNodes.map((nodeTemplate) => {
              const IconComponent = nodeTemplate.icon;
              return (
                <div
                  key={`${nodeTemplate.type}-${nodeTemplate.label}`}
                  className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => addNode(nodeTemplate)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${nodeTemplate.color}-100`}>
                    <IconComponent className={`w-4 h-4 text-${nodeTemplate.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{nodeTemplate.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nodeTemplate.description}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Configuration */}
        <div className="p-4 flex-1">
          <h3 className="font-medium mb-3">Configuration</h3>
          {renderNodeConfig()}
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={saveWorkflow}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Workflow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold">{agentName} Workflow</h1>
              <p className="text-sm text-muted-foreground">
                {nodes.length} nodes, {edges.length} connections
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={testWorkflow}
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Test Panel */}
        {(testInput || testOutput || isTesting) && (
          <div className="border-t bg-card p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-input">Test Input</Label>
                <Textarea
                  id="test-input"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test message..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Test Output</Label>
                <div className="mt-1 p-3 bg-muted rounded-md min-h-[76px] text-sm">
                  {isTesting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing workflow...
                    </div>
                  ) : testOutput ? (
                    <pre className="whitespace-pre-wrap">{testOutput}</pre>
                  ) : (
                    <span className="text-muted-foreground">Test output will appear here...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}