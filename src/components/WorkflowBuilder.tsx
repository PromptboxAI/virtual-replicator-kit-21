import React, { useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
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
  Clock,
  Filter,
  ShuffleIcon as Shuffle,
  Target,
  CheckCircle,
  Wand2
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
    position: { x: 100, y: 200 },
    data: { 
      label: 'User Input',
      type: 'input',
      description: 'User message input',
      icon: MessageSquare,
      color: 'blue'
    },
  },
  {
    id: 'llm-1',
    type: 'default',
    position: { x: 400, y: 200 },
    data: { 
      label: 'OpenAI GPT',
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
    position: { x: 700, y: 200 },
    data: { 
      label: 'Response',
      type: 'output',
      description: 'Response output',
      icon: Send,
      color: 'emerald'
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

// Node categories for better organization
const nodeCategories = [
  {
    name: 'Input/Output',
    nodes: [
      { type: 'input', label: 'Text Input', icon: MessageSquare, color: 'blue', description: 'Accept text input from users' },
      { type: 'input', label: 'File Input', icon: FileText, color: 'blue', description: 'Upload and process files' },
      { type: 'input', label: 'Image Input', icon: Image, color: 'blue', description: 'Process image uploads' },
      { type: 'output', label: 'Text Output', icon: Send, color: 'emerald', description: 'Display final output' },
      { type: 'output', label: 'Email Output', icon: Mail, color: 'emerald', description: 'Send email notifications' },
    ]
  },
  {
    name: 'AI Models',
    nodes: [
      { type: 'llm', label: 'OpenAI GPT', icon: Brain, color: 'purple', description: 'OpenAI language models' },
      { type: 'llm', label: 'Claude', icon: Bot, color: 'orange', description: 'Anthropic Claude model' },
      { type: 'llm', label: 'Gemini', icon: Zap, color: 'indigo', description: 'Google Gemini model' },
    ]
  },
  {
    name: 'Data & APIs',
    nodes: [
      { type: 'api', label: 'HTTP Request', icon: Globe, color: 'cyan', description: 'Make API calls' },
      { type: 'database', label: 'Database', icon: Database, color: 'green', description: 'Query database' },
      { type: 'code', label: 'Code Block', icon: Code, color: 'slate', description: 'Execute custom code' },
    ]
  },
  {
    name: 'Logic & Control',
    nodes: [
      { type: 'filter', label: 'Filter', icon: Filter, color: 'yellow', description: 'Filter and transform data' },
      { type: 'condition', label: 'Condition', icon: Target, color: 'pink', description: 'Conditional logic' },
      { type: 'loop', label: 'Loop', icon: Shuffle, color: 'teal', description: 'Repeat operations' },
      { type: 'delay', label: 'Delay', icon: Clock, color: 'amber', description: 'Add time delays' },
    ]
  },
];

// Flatten for easy access
const availableNodes = nodeCategories.flatMap(category => category.nodes);

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
    <div className="h-[800px] flex bg-background border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Workflow Builder
          </h2>
          <p className="text-sm text-muted-foreground">
            Build powerful AI workflows with visual components
          </p>
        </div>

        {/* Node Library */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Components
            </h3>
            
            {nodeCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {category.name}
                </h4>
                <div className="space-y-1">
                  {category.nodes.map((nodeTemplate) => {
                    const IconComponent = nodeTemplate.icon;
                    return (
                      <div
                        key={`${nodeTemplate.type}-${nodeTemplate.label}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-accent/50 hover:border-border transition-all duration-200 group"
                        onClick={() => addNode(nodeTemplate)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-${nodeTemplate.color}-100 to-${nodeTemplate.color}-200 group-hover:scale-110 transition-transform`}>
                          <IconComponent className={`w-4 h-4 text-${nodeTemplate.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{nodeTemplate.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {nodeTemplate.description}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node Configuration */}
        <div className="border-t p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </h3>
          <div className="max-h-64 overflow-y-auto">
            {renderNodeConfig()}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={saveWorkflow}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Workflow...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Deploy Agent
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-muted/20">
        {/* Toolbar */}
        <div className="p-4 border-b bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                {agentName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {nodes.length} components • {edges.length} connections
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={testWorkflow}
                disabled={isTesting}
                variant="outline"
                size="lg"
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

        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1}
              className="opacity-30"
              color="hsl(var(--muted-foreground))"
            />
            <Controls 
              className="bg-card/90 backdrop-blur border border-border shadow-lg rounded-lg" 
              showInteractive={false}
            />
            <MiniMap 
              className="bg-card/90 backdrop-blur border border-border shadow-lg rounded-lg" 
              nodeColor={(node) => {
                const color = node.data.color as string;
                const colorMap: Record<string, string> = {
                  blue: '#3b82f6',
                  purple: '#8b5cf6',
                  emerald: '#10b981',
                  orange: '#f97316',
                  cyan: '#06b6d4',
                  green: '#22c55e',
                  slate: '#64748b',
                  yellow: '#eab308',
                  pink: '#ec4899',
                  teal: '#14b8a6',
                  amber: '#f59e0b',
                  indigo: '#6366f1'
                };
                return colorMap[color] || '#64748b';
              }}
              nodeStrokeWidth={2}
              maskColor="rgba(0,0,0,0.1)"
            />
          </ReactFlow>
        </div>

        {/* Test Panel */}
        <div className="border-t bg-card/80 backdrop-blur p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="test-input" className="text-sm font-medium mb-2 block">
                💬 Test Input
              </Label>
              <div className="flex gap-2">
                <Input
                  id="test-input"
                  placeholder="Enter a test message to see how your agent responds..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && testInput.trim()) {
                      e.preventDefault();
                      testWorkflow();
                    }
                  }}
                />
                <Button
                  onClick={testWorkflow}
                  disabled={isTesting || !testInput.trim()}
                  size="default"
                  className="min-w-[80px]"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                🤖 Agent Response
              </Label>
              <div className="p-3 border rounded-lg bg-muted/30 min-h-[40px] text-sm overflow-y-auto max-h-24">
                {testOutput ? (
                  <div className="whitespace-pre-wrap">{testOutput}</div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Test your workflow to see how your agent responds...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}