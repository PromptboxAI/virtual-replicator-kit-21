import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
  ConnectionMode,
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
  Copy,
  Link,
  Headphones,
  FileJson,
  Sparkles,
  FileCheck,
  FileSearch,
  FileSpreadsheet,
  FilePlus,
  ArrowLeftRight
} from 'lucide-react';
import { WorkflowTab } from './WorkflowBuilderLayout';

interface WorkflowCanvasProps {
  agentId: string;
  agentName: string;
  activeTab: WorkflowTab;
  onComplete?: (workflowId: string) => void;
  onChange: () => void;
}

export interface WorkflowCanvasRef {
  addNode: (nodeData: any) => void;
}

// Enhanced Node Data Interface
interface NodeData {
  label: string;
  type: string;
  description: string;
  icon: string; // Changed to string for icon names
  color: string;
  status?: 'idle' | 'processing' | 'completed' | 'error';
  result?: string;
  
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
  
  // Integration specific
  toEmail?: string;
  webhookUrl?: string;
}

// Import specialized node components
import { ImageUploadNode } from './nodes/ImageUploadNode';
import { AudioUploadNode } from './nodes/AudioUploadNode';
import { FileUploadNode } from './nodes/FileUploadNode';
import { ApiRequestNode } from './nodes/ApiRequestNode';
import { TextInputNode } from './nodes/TextInputNode';

// Custom Node Components
const CustomNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  
  // Render specialized nodes based on type and label
  if (nodeData.type === 'input') {
    switch (nodeData.label) {
      case 'Image':
        return <ImageUploadNode data={nodeData} id={id} selected={selected} />;
      case 'Audio':
        return <AudioUploadNode data={nodeData} id={id} selected={selected} />;
      case 'Files':
        return <FileUploadNode data={nodeData} id={id} selected={selected} />;
      case 'Text Input':
        return <TextInputNode data={nodeData} id={id} selected={selected} />;
    }
  }
  
  if (nodeData.type === 'actions' && nodeData.label === 'HTTP Request') {
    return <ApiRequestNode data={nodeData} id={id} selected={selected} />;
  }
  
  // Default generic node for other types
  const iconMap: { [key: string]: any } = {
    MessageSquare, Brain, Send, FileText, Link, Headphones, Image, 
    FileJson, Download, Sparkles, Zap, Globe, Mail, Webhook, FileCheck,
    FileSearch, Database, FileSpreadsheet, FilePlus, Target, RotateCcw,
    ArrowLeftRight: RotateCcw, Clock, CheckCircle
  };
  
  const IconComponent = iconMap[nodeData.icon] || FileText;
  
  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'processing': return 'border-yellow-500 bg-yellow-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return '';
    }
  };
  
  return (
    <div className={`px-4 py-3 border-2 rounded-lg shadow-sm transition-all duration-200 min-w-[180px] max-w-[240px] ${
      selected 
        ? 'bg-card border-foreground shadow-lg' 
        : 'bg-card border-border hover:border-muted-foreground hover:shadow-md'
    } ${getStatusColor()}`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-${nodeData.color}-100 to-${nodeData.color}-200 shadow-sm`}>
          <IconComponent className={`w-5 h-5 text-${nodeData.color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{nodeData.label}</h3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{nodeData.type}</p>
        </div>
        {nodeData.status === 'processing' && (
          <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
        )}
        {nodeData.status === 'completed' && (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
      </div>
      
      {/* Node Content */}
      <div className="text-xs mb-3 line-clamp-2 text-muted-foreground">
        {nodeData.result ? nodeData.result.substring(0, 100) + '...' : nodeData.description}
      </div>
      
      {/* Node Status/Info */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {nodeData.status === 'processing' ? 'Processing...' :
           nodeData.status === 'completed' ? 'Completed' :
           nodeData.type === 'llm' && nodeData.model ? nodeData.model : 
           nodeData.type === 'api' && nodeData.method ? nodeData.method :
           nodeData.type === 'input' && nodeData.inputType ? nodeData.inputType :
           'Ready'}
        </Badge>
      </div>
      
      {/* Handles - Fixed connectivity logic */}
      {nodeData.type !== 'output' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3 h-3 border-2 border-background bg-primary"
          isConnectable={true}
          style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--background))' }}
        />
      )}
      {nodeData.type !== 'input' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3 h-3 border-2 border-background bg-primary"
          isConnectable={true}
          style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--background))' }}
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
      icon: 'MessageSquare',
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
      icon: 'Brain',
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
      icon: 'Send',
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

const WorkflowCanvas = forwardRef<WorkflowCanvasRef, WorkflowCanvasProps>(({ agentId, agentName, activeTab, onComplete, onChange }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Expose addNode method via ref
  useImperativeHandle(ref, () => ({
    addNode: (nodeData: any) => {
      const newNode: Node = {
        id: `${nodeData.type}-${Date.now()}`,
        type: 'custom',
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }, // Random position
        data: nodeData,
      };
      
      setNodes((nds) => nds.concat(newNode));
      onChange();
    }
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connecting nodes:', params);
      
      if (!params.source || !params.target) {
        console.log('Invalid connection - missing source or target');
        return;
      }
      
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) {
        console.log('Invalid connection - nodes not found');
        return;
      }
      
      console.log('Valid connection established:', {
        from: sourceNode.data.label,
        to: targetNode.data.label
      });
      
      const newEdge: Edge = {
        id: `${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      onChange();
    },
    [setEdges, onChange, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) {
        console.log('No react flow bounds found');
        return;
      }

      try {
        const dragData = event.dataTransfer.getData('application/reactflow');
        console.log('Drop event data:', dragData);
        
        const nodeData = JSON.parse(dragData);
        console.log('Parsed node data:', nodeData);
        
        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };
        console.log('Drop position:', position);

        const newNode: Node = {
          id: `${nodeData.data.type}-${Date.now()}`,
          type: 'custom',
          position,
          data: nodeData.data,
        };

        console.log('Creating new node:', newNode);
        
        setNodes((nds) => {
          const updated = nds.concat(newNode);
          console.log('Updated nodes:', updated);
          return updated;
        });
        onChange();
      } catch (error) {
        console.error('Error processing drop:', error);
      }
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

  const executeWorkflow = async () => {
    setIsRunning(true);
    setExecutionResults({});
    
    try {
      // Find input nodes and get their values
      const inputNodes = nodes.filter(node => (node.data as unknown as NodeData).type === 'input');
      const llmNodes = nodes.filter(node => (node.data as unknown as NodeData).type === 'llm');
      const outputNodes = nodes.filter(node => (node.data as unknown as NodeData).type === 'output');
      
      if (inputNodes.length === 0) {
        toast({
          title: "No Input Found",
          description: "Please add an input node to provide data to the workflow.",
          variant: "destructive",
        });
        return;
      }

      if (llmNodes.length === 0) {
        toast({
          title: "No LLM Found", 
          description: "Please add an LLM node to process the input.",
          variant: "destructive",
        });
        return;
      }

      // Execute workflow step by step
      const results: Record<string, any> = {};
      
      // Step 1: Process input nodes - collect values during execution
      for (const inputNode of inputNodes) {
        const inputData = inputNode.data as unknown as NodeData;
        
        // Update node to show it's processing
        updateNodeData(inputNode.id, { ...inputData, status: 'processing' });
        
        // For demo purposes, prompt for input or use default
        const userInput = prompt(`Enter value for ${inputData.label || 'input'}:`) || 
                         inputData.description || 
                         "Default input value";
        
        results[inputNode.id] = userInput;
        
        // Mark as completed
        updateNodeData(inputNode.id, { ...inputData, status: 'completed', result: userInput });
      }

      // Step 2: Process LLM nodes that are connected to input nodes
      for (const llmNode of llmNodes) {
        const llmData = llmNode.data as unknown as NodeData;
        
        // Find input nodes connected to this LLM
        const connectedInputs = edges
          .filter(edge => edge.target === llmNode.id)
          .map(edge => results[edge.source])
          .filter(Boolean);
        
        if (connectedInputs.length === 0) {
          continue; // Skip if no connected inputs
        }

        const combinedInput = connectedInputs.join(" ");
        
        // Update node to show it's processing
        updateNodeData(llmNode.id, { ...llmData, status: 'processing' });

        // Call the execute-workflow edge function
        const { data, error } = await supabase.functions.invoke('execute-workflow', {
          body: {
            model: llmData.model || 'gpt-4o-mini',
            prompt: llmData.prompt || 'You are a helpful assistant.',
            userInput: combinedInput,
            temperature: llmData.temperature || 0.7,
            maxTokens: llmData.maxTokens || 1000
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to process LLM node');
        }

        results[llmNode.id] = data.response;
        
        // Update node to show completion
        updateNodeData(llmNode.id, { ...llmData, status: 'completed', result: data.response });
      }

      // Step 3: Process output nodes
      for (const outputNode of outputNodes) {
        const outputData = outputNode.data as unknown as NodeData;
        
        // Find LLM nodes connected to this output
        const connectedResults = edges
          .filter(edge => edge.target === outputNode.id)
          .map(edge => results[edge.source])
          .filter(Boolean);
        
        if (connectedResults.length > 0) {
          const finalResult = connectedResults.join("\n\n");
          results[outputNode.id] = finalResult;
          
          // Update output node to show the result
          updateNodeData(outputNode.id, { ...outputData, status: 'completed', result: finalResult });
        }
      }

      setExecutionResults(results);
      
      toast({
        title: "Workflow Completed",
        description: "Check the output nodes for results.",
      });
    } catch (error) {
      console.error('Workflow execution error:', error);
      toast({
        title: "Workflow Failed",
        description: error.message || "There was an error executing your workflow.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Listen for workflow execution events from the Run button
  React.useEffect(() => {
    const handleExecuteWorkflow = () => {
      executeWorkflow();
    };

    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.addEventListener('executeWorkflow', handleExecuteWorkflow);
      return () => {
        reactFlowWrapper.current?.removeEventListener('executeWorkflow', handleExecuteWorkflow);
      };
    }
  }, [nodes]);

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
      <div className="flex-1 relative" ref={reactFlowWrapper} data-testid="rf__wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => {
            console.log('🔗 onConnect triggered:', params);
            onConnect(params);
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode={["Meta", "Ctrl"]}
          snapToGrid
          snapGrid={[15, 15]}
          fitView
          className="bg-gradient-to-br from-background to-muted/20"
          onInit={(reactFlowInstance) => {
            console.log('🚀 ReactFlow initialized:', reactFlowInstance);
          }}
          onConnectStart={(event, params) => {
            console.log('🔵 Connection start:', params);
          }}
          onConnectEnd={(event) => {
            console.log('🔴 Connection end:', event);
          }}
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
                    onFocus={(e) => e.target.select()}
                    placeholder="Enter node label..."
                  />
                </div>

                <div>
                  <Label htmlFor="node-description">Description</Label>
                  <Textarea
                    id="node-description"
                    value={(selectedNode.data as unknown as NodeData).description || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    placeholder="Enter node description..."
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
                      onFocus={(e) => e.target.select()}
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

              {/* Input Node Configuration */}
              {(selectedNode.data as unknown as NodeData).type === 'input' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Input Configuration</h4>
                  
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Note:</span> Input values are collected when the workflow runs
                    </div>
                    <div className="text-xs text-muted-foreground">
                      This node will prompt for input during execution. Use the description field above to specify what input is expected.
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Node Configuration */}
              {['Gmail', 'Google Sheets', 'Slack', 'Twitter/X', 'Discord', 'Zapier'].includes((selectedNode.data as unknown as NodeData).label) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Integration Configuration</h4>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      <span className="font-medium">Integration Required:</span> {(selectedNode.data as unknown as NodeData).label}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      This integration requires authentication setup. Configure your API keys or OAuth settings to use this node.
                    </div>
                  </div>
                  
                  {(selectedNode.data as unknown as NodeData).label === 'Gmail' && (
                    <div>
                      <Label htmlFor="gmail-to">To Email</Label>
                      <Input
                        id="gmail-to"
                        value={(selectedNode.data as unknown as NodeData).toEmail || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { toEmail: e.target.value })}
                        placeholder="recipient@example.com"
                      />
                    </div>
                  )}
                  
                  {(selectedNode.data as unknown as NodeData).label === 'Zapier' && (
                    <div>
                      <Label htmlFor="zapier-webhook">Webhook URL</Label>
                      <Input
                        id="zapier-webhook"
                        value={(selectedNode.data as unknown as NodeData).webhookUrl || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { webhookUrl: e.target.value })}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Output Node Display */}
              {(selectedNode.data as unknown as NodeData).type === 'output' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Output Result</h4>
                  
                  {(selectedNode.data as unknown as NodeData).result ? (
                    <div>
                      <Label>Generated Output</Label>
                      <Textarea
                        value={(selectedNode.data as unknown as NodeData).result || ''}
                        readOnly
                        rows={6}
                        className="bg-muted"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center">
                      Run the workflow to see output results here
                    </div>
                  )}
                </div>
              )}

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
});

export { WorkflowCanvas };