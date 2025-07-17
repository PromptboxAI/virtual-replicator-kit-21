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
  Copy
} from 'lucide-react';
import { WorkflowTab } from './WorkflowBuilderLayout';

interface WorkflowCanvasProps {
  agentId: string;
  agentName: string;
  activeTab: WorkflowTab;
  onComplete?: (workflowId: string) => void;
  onChange: () => void;
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
    <div className={`px-4 py-3 border-2 rounded-lg bg-card shadow-sm transition-all duration-200 min-w-[180px] max-w-[240px] ${
      selected 
        ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-${nodeData.color}-100 to-${nodeData.color}-200 shadow-sm`}>
          <IconComponent className={`w-5 h-5 text-${nodeData.color}-600`} />
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
      
      {/* Handles - Always visible for better UX */}
      {nodeData.type !== 'input' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3 h-3 border-2 border-background bg-primary opacity-80 hover:opacity-100"
        />
      )}
      {nodeData.type !== 'output' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3 h-3 border-2 border-background bg-primary opacity-80 hover:opacity-100"
        />
      )}
    </div>
  );
};

// Node types registry
const nodeTypes = {
  custom: CustomNode,
};

// Initial workflow nodes
const initialNodes: Node[] = [
  {
    id: 'input-1',
    type: 'custom',
    position: { x: 150, y: 250 },
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
    position: { x: 450, y: 250 },
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
    position: { x: 750, y: 250 },
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
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
  },
  {
    id: 'e2-3',
    source: 'llm-1',
    target: 'output-1',
    animated: true,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
  },
];

export function WorkflowCanvas({ agentId, agentName, activeTab, onComplete, onChange }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      onChange();
    },
    [setEdges, onChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode: Node = {
        id: `${nodeData.data.type}-${Date.now()}`,
        type: 'custom',
        position,
        data: nodeData.data,
      };

      setNodes((nds) => nds.concat(newNode));
      onChange();
    },
    [setNodes, onChange]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Toggle: if clicking the same node, close the panel
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  }, [selectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } } 
          : node
      )
    );
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? {
        ...prev,
        data: { ...prev.data, ...newData }
      } : null);
    }
    onChange();
  }, [setNodes, selectedNode, onChange]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    onChange();
  }, [setNodes, setEdges, onChange]);

  const testWorkflow = async () => {
    if (!testInput.trim()) {
      toast({
        title: "Test Input Required",
        description: "Please enter some test input to run the workflow.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestOutput('');
    
    try {
      // Find the input and LLM nodes to execute the workflow
      const inputNode = nodes.find(node => (node.data as unknown as NodeData).type === 'input');
      const llmNode = nodes.find(node => (node.data as unknown as NodeData).type === 'llm');
      
      if (!llmNode) {
        setTestOutput('No LLM node found in workflow. Please add an LLM processing node to test the workflow.');
        return;
      }

      const llmData = llmNode.data as unknown as NodeData;
      
      // Call the test-assistant edge function to process the input
      const { data, error } = await supabase.functions.invoke('test-assistant', {
        body: {
          model: llmData.model || 'gpt-4o-mini',
          prompt: llmData.prompt || 'You are a helpful assistant.',
          userInput: testInput,
          temperature: llmData.temperature || 0.7,
          maxTokens: llmData.maxTokens || 1000
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process workflow');
      }

      setTestOutput(data.response || 'No response received');
      
      toast({
        title: "Workflow Test Complete",
        description: "Your workflow has been successfully tested with real AI processing.",
      });
    } catch (error) {
      console.error('Workflow test error:', error);
      setTestOutput(`Error: ${error.message}\n\nMake sure your OpenAI API key is configured and the model settings are correct.`);
      toast({
        title: "Test Failed",
        description: "There was an error testing your workflow. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Render different content based on active tab
  if (activeTab !== 'workflow') {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold capitalize">{activeTab}</h3>
          <p className="text-muted-foreground max-w-md">
            {activeTab === 'export' && 'Export functionality will be implemented here. You\'ll be able to export your workflow as JSON, generate sharing links, and create embed codes.'}
            {activeTab === 'analytics' && 'Analytics dashboard will be implemented here. You\'ll see execution history, performance metrics, and usage statistics.'}
            {activeTab === 'manager' && 'Workflow management interface will be implemented here. You\'ll be able to manage settings, versions, and collaboration.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Main Flow Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gradient-to-br from-background to-muted/20"
        >
          <Controls 
            className="bg-card shadow-lg border"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap 
            className="bg-card border shadow-lg"
            zoomable
            pannable
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            className="opacity-30"
          />
        </ReactFlow>
      </div>

      {/* Configuration Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-card/50 backdrop-blur-sm flex flex-col h-screen">
          {/* Header - Fixed */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Node Configuration</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Basic Node Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-label">Label</Label>
                  <Input
                    id="node-label"
                    value={(selectedNode.data as unknown as NodeData).label || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    placeholder="Node label"
                  />
                </div>

                <div>
                  <Label htmlFor="node-description">Description</Label>
                  <Textarea
                    id="node-description"
                    value={(selectedNode.data as unknown as NodeData).description || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                    placeholder="Node description"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Node Type Specific Configuration */}
              {(selectedNode.data as unknown as NodeData).type === 'llm' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">LLM Configuration</h4>
                  
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Select 
                      value={(selectedNode.data as unknown as NodeData).model || ''} 
                      onValueChange={(value) => updateNodeData(selectedNode.id, { model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4O Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prompt">System Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={(selectedNode.data as unknown as NodeData).prompt || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                      placeholder="Enter system prompt..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature: {(selectedNode.data as unknown as NodeData).temperature || 0.7}</Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={(selectedNode.data as unknown as NodeData).temperature || 0.7}
                      onChange={(e) => updateNodeData(selectedNode.id, { temperature: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={(selectedNode.data as unknown as NodeData).maxTokens || 1000}
                      onChange={(e) => updateNodeData(selectedNode.id, { maxTokens: parseInt(e.target.value) })}
                      placeholder="1000"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Test Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Test Workflow</h4>
                
                <div>
                  <Label htmlFor="test-input">Test Input</Label>
                  <Textarea
                    id="test-input"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter test input..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={testWorkflow} 
                  disabled={isTesting}
                  className="w-full gap-2"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isTesting ? 'Testing...' : 'Test Workflow'}
                </Button>

                {testOutput && (
                  <div>
                    <Label>Test Output</Label>
                    <Textarea
                      value={testOutput}
                      readOnly
                      rows={6}
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Delete Section - Moved to bottom for safety */}
              <div className="pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="w-full gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Node
                </Button>
              </div>
            </div>
            {/* Extra bottom padding to ensure scrolling works properly */}
            <div className="h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
}