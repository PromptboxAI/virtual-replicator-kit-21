import React, { useState, useCallback, useRef } from 'react';
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
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Target,
  CheckCircle,
  Wand2,
  Upload,
  Download,
  Webhook,
  RotateCcw,
  Save,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy
} from 'lucide-react';

interface WorkflowBuilderProps {
  agentId: string;
  agentName: string;
  onComplete?: (workflowId: string) => void;
}

// Enhanced Node Data Interface
interface NodeData {
  label: string;
  type: string;
  description: string;
  icon: any;
  color: string;
  
  // LLM specific
  model?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  
  // API specific
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  
  // Code specific
  code?: string;
  language?: string;
  
  // Input specific
  inputType?: string;
  placeholder?: string;
  required?: boolean;
  
  // Condition specific
  condition?: string;
  operator?: string;
  value?: string;
  
  // Memory specific
  variableName?: string;
  
  // File specific
  fileTypes?: string[];
  maxSize?: number;
}

// Custom Node Components
const CustomNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const IconComponent = nodeData.icon;
  
  return (
    <div className={`px-4 py-3 border-2 rounded-lg bg-card shadow-sm transition-all duration-200 min-w-[160px] max-w-[220px] ${
      selected 
        ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-${nodeData.color}-100 to-${nodeData.color}-200 shadow-sm`}>
          <IconComponent className={`w-4 h-4 text-${nodeData.color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{nodeData.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{nodeData.type}</p>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {nodeData.description}
      </div>
      
      {/* Node Status/Info */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {nodeData.type === 'llm' && nodeData.model ? nodeData.model : 
           nodeData.type === 'api' && nodeData.method ? nodeData.method :
           nodeData.type === 'input' && nodeData.inputType ? nodeData.inputType :
           'Ready'}
        </Badge>
        
        {selected && (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <div className="w-2 h-2 rounded-full bg-green-300"></div>
          </div>
        )}
      </div>
      
      {/* Handles */}
      {nodeData.type !== 'input' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3 h-3 border-2 border-background"
          style={{ background: `hsl(var(--${nodeData.color}))` }}
        />
      )}
      {nodeData.type !== 'output' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3 h-3 border-2 border-background"
          style={{ background: `hsl(var(--${nodeData.color}))` }}
        />
      )}
    </div>
  );
};

// Node types registry - moved outside component to prevent re-creation
const nodeTypes = {
  custom: CustomNode,
};

// Node categories and templates
const nodeCategories = [
  {
    name: 'Input/Output',
    icon: MessageSquare,
    expanded: true,
    nodes: [
      { 
        type: 'input', 
        label: 'Text Input', 
        icon: MessageSquare, 
        color: 'blue', 
        description: 'Accept text input from users',
        inputType: 'text',
        placeholder: 'Enter your message...',
        required: true
      },
      { 
        type: 'input', 
        label: 'File Upload', 
        icon: Upload, 
        color: 'blue', 
        description: 'Accept file uploads',
        inputType: 'file',
        fileTypes: ['pdf', 'txt', 'docx'],
        maxSize: 10
      },
      { 
        type: 'input', 
        label: 'Image Input', 
        icon: Image, 
        color: 'blue', 
        description: 'Process image uploads',
        inputType: 'image',
        fileTypes: ['jpg', 'png', 'gif', 'webp']
      },
      { 
        type: 'output', 
        label: 'Text Output', 
        icon: Send, 
        color: 'emerald', 
        description: 'Display text response to user'
      },
      { 
        type: 'output', 
        label: 'Email', 
        icon: Mail, 
        color: 'emerald', 
        description: 'Send email notifications'
      },
      { 
        type: 'output', 
        label: 'Webhook', 
        icon: Webhook, 
        color: 'emerald', 
        description: 'Send data to external webhook'
      }
    ]
  },
  {
    name: 'AI Models',
    icon: Brain,
    expanded: true,
    nodes: [
      { 
        type: 'llm', 
        label: 'OpenAI GPT', 
        icon: Brain, 
        color: 'purple', 
        description: 'OpenAI language models',
        model: 'gpt-4o-mini',
        prompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 1000
      },
      { 
        type: 'llm', 
        label: 'Claude', 
        icon: Bot, 
        color: 'orange', 
        description: 'Anthropic Claude models',
        model: 'claude-3-sonnet',
        prompt: 'You are Claude, a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 1000
      },
      { 
        type: 'llm', 
        label: 'Custom Model', 
        icon: Zap, 
        color: 'indigo', 
        description: 'Custom AI model endpoint',
        url: '',
        method: 'POST'
      }
    ]
  },
  {
    name: 'Data & APIs',
    icon: Database,
    expanded: false,
    nodes: [
      { 
        type: 'api', 
        label: 'HTTP Request', 
        icon: Globe, 
        color: 'cyan', 
        description: 'Make API calls to external services',
        url: '',
        method: 'GET',
        headers: {}
      },
      { 
        type: 'database', 
        label: 'Database Query', 
        icon: Database, 
        color: 'green', 
        description: 'Query your database'
      },
      { 
        type: 'memory', 
        label: 'Store Variable', 
        icon: Save, 
        color: 'slate', 
        description: 'Store data for later use',
        variableName: 'myVariable'
      },
      { 
        type: 'code', 
        label: 'Code Block', 
        icon: Code, 
        color: 'slate', 
        description: 'Execute custom JavaScript code',
        code: '// Your code here\nreturn input;',
        language: 'javascript'
      }
    ]
  },
  {
    name: 'Logic & Control',
    icon: Target,
    expanded: false,
    nodes: [
      { 
        type: 'condition', 
        label: 'If/Else', 
        icon: Target, 
        color: 'pink', 
        description: 'Conditional logic branching',
        condition: '',
        operator: 'equals',
        value: ''
      },
      { 
        type: 'filter', 
        label: 'Filter Data', 
        icon: Filter, 
        color: 'yellow', 
        description: 'Filter and transform data'
      },
      { 
        type: 'delay', 
        label: 'Wait/Delay', 
        icon: Clock, 
        color: 'amber', 
        description: 'Add time delays between steps'
      }
    ]
  }
];

// Flatten for easy access
const availableNodes = nodeCategories.flatMap(category => category.nodes);

// Initial workflow nodes
const initialNodes: Node[] = [
  {
    id: 'input-1',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: { 
      label: 'User Input',
      type: 'input',
      description: 'User message input',
      icon: MessageSquare,
      color: 'blue',
      inputType: 'text',
      placeholder: 'Enter your message...',
      required: true
    },
  },
  {
    id: 'llm-1',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { 
      label: 'OpenAI GPT',
      type: 'llm',
      description: 'AI processing node',
      icon: Brain,
      color: 'purple',
      model: 'gpt-4o-mini',
      prompt: 'You are a helpful AI assistant. Respond to the user\'s query in a helpful and informative way.',
      temperature: 0.7,
      maxTokens: 1000
    },
  },
  {
    id: 'output-1',
    type: 'custom',
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
    style: { stroke: 'hsl(var(--primary))' }
  },
  {
    id: 'e2-3',
    source: 'llm-1',
    target: 'output-1',
    animated: true,
    style: { stroke: 'hsl(var(--primary))' }
  },
];

export function WorkflowBuilder({ agentId, agentName, onComplete }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(nodeCategories.map(cat => [cat.name, cat.expanded]))
  );
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: 'hsl(var(--primary))' }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback((nodeTemplate: any) => {
    const newNode: Node = {
      id: `${nodeTemplate.type}-${Date.now()}`,
      type: 'custom',
      position: { 
        x: Math.random() * 300 + 200, 
        y: Math.random() * 200 + 150 
      },
      data: { ...nodeTemplate },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } } 
          : node
      )
    );
    
    // Update selected node if it's the one being updated
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? {
        ...prev,
        data: { ...prev.data, ...newData }
      } : null);
    }
  }, [setNodes, selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const duplicateNode = useCallback((node: Node) => {
    const newNode: Node = {
      ...node,
      id: `${node.data.type}-${Date.now()}`,
      position: { 
        x: node.position.x + 50, 
        y: node.position.y + 50 
      },
      data: {
        ...node.data,
        label: `${node.data.label} Copy`
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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
          version: '1.0',
          nodeCount: nodes.length,
          edgeCount: edges.length
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

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const renderNodeConfig = () => {
    if (!selectedNode) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a node to configure its settings</p>
          <p className="text-xs mt-2">Click on any node in the canvas to start editing</p>
        </div>
      );
    }

    const data = selectedNode.data as unknown as NodeData;
    const IconComponent = data.icon;

    return (
      <div className="space-y-4">
        {/* Node Header */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-${data.color}-100 to-${data.color}-200`}>
            <IconComponent className={`w-5 h-5 text-${data.color}-600`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{data.label}</h3>
            <p className="text-xs text-muted-foreground">{data.description}</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => duplicateNode(selectedNode)}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteNode(selectedNode.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Basic Properties */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="node-label" className="text-sm font-medium">Node Label</Label>
              <Input
                id="node-label"
                value={data.label}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="node-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="node-description"
                value={data.description}
                onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Type-specific configuration */}
          {data.type === 'llm' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="model" className="text-sm font-medium">AI Model</Label>
                <Select
                  value={data.model}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { model: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="prompt" className="text-sm font-medium">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={data.prompt}
                  onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                  rows={4}
                  placeholder="Enter the system prompt for this AI model..."
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="temperature" className="text-sm font-medium">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={data.temperature || 0.7}
                    onChange={(e) => updateNodeData(selectedNode.id, { temperature: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens" className="text-sm font-medium">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={data.maxTokens || 1000}
                    onChange={(e) => updateNodeData(selectedNode.id, { maxTokens: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {data.type === 'api' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="api-url" className="text-sm font-medium">API URL</Label>
                <Input
                  id="api-url"
                  value={data.url || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="method" className="text-sm font-medium">HTTP Method</Label>
                <Select
                  value={data.method}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { method: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="api-body" className="text-sm font-medium">Request Body (JSON)</Label>
                <Textarea
                  id="api-body"
                  value={data.body || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { body: e.target.value })}
                  rows={3}
                  placeholder='{"key": "value"}'
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {data.type === 'input' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="input-type" className="text-sm font-medium">Input Type</Label>
                <Select
                  value={data.inputType}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { inputType: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="placeholder" className="text-sm font-medium">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={data.placeholder || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { placeholder: e.target.value })}
                  placeholder="Enter placeholder text..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={data.required || false}
                  onCheckedChange={(checked) => updateNodeData(selectedNode.id, { required: checked })}
                />
                <Label htmlFor="required" className="text-sm font-medium">Required Field</Label>
              </div>
            </div>
          )}

          {data.type === 'code' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                <Select
                  value={data.language}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { language: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="code" className="text-sm font-medium">Code</Label>
                <Textarea
                  id="code"
                  value={data.code}
                  onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value })}
                  rows={8}
                  placeholder="// Your code here..."
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {data.type === 'condition' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="condition" className="text-sm font-medium">Condition</Label>
                <Input
                  id="condition"
                  value={data.condition || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                  placeholder="variable_name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="operator" className="text-sm font-medium">Operator</Label>
                <Select
                  value={data.operator}
                  onValueChange={(value) => updateNodeData(selectedNode.id, { operator: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="is_empty">Is Empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value" className="text-sm font-medium">Value</Label>
                <Input
                  id="value"
                  value={data.value || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                  placeholder="comparison value"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {data.type === 'memory' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="variable-name" className="text-sm font-medium">Variable Name</Label>
                <Input
                  id="variable-name"
                  value={data.variableName || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { variableName: e.target.value })}
                  placeholder="myVariable"
                  className="mt-1"
                />
              </div>
            </div>
          )}
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
            Drag and drop components to build your AI workflow
          </p>
        </div>

        {/* Node Library */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Components
            </h3>
            
            {nodeCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories[category.name];
              
              return (
                <div key={category.name} className="mb-4">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <CategoryIcon className="w-3 h-3" />
                    {category.name}
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-1 ml-5">
                      {category.nodes.map((nodeTemplate, index) => {
                        const IconComponent = nodeTemplate.icon;
                        return (
                          <div
                            key={`${nodeTemplate.type}-${nodeTemplate.label}-${index}`}
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
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Configuration */}
        <div className="border-t p-4 max-h-96 overflow-y-auto">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </h3>
          {renderNodeConfig()}
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
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
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
              className="bg-card/90 backdrop-blur border border-border shadow-lg rounded-lg !w-32 !h-24" 
              position="bottom-left"
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
              nodeStrokeWidth={1}
              maskColor="rgba(0,0,0,0.1)"
            />
          </ReactFlow>
        </div>

        {/* Test Panel */}
        <div className="border-t bg-card/80 backdrop-blur p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="test-input" className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Test Input
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
              <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Agent Response
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