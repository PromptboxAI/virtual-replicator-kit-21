import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Link,
  Headphones,
  Image,
  Send,
  FileJson,
  Download,
  Brain,
  MessageSquare,
  Zap,
  Globe,
  Mail,
  Webhook,
  Database,
  FileSearch,
  FileSpreadsheet,
  FilePlus,
  FileCheck,
  Target,
  RotateCcw,
  ArrowLeftRight,
  Clock,
  Sparkles,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { WorkflowTab } from './WorkflowBuilderLayout';

interface WorkflowSidebarProps {
  activeTab: WorkflowTab;
  onChange: () => void;
  onAddNode: (nodeData: any) => void; // Add this prop
}

// Stack AI style node categories
const stackAICategories = [
  {
    name: 'Inputs',
    icon: FileText,
    expanded: false,
    nodes: [
      { label: 'Files', icon: 'FileText', color: 'blue', description: 'Upload and process files' },
      { label: 'URL', icon: 'Link', color: 'blue', description: 'Fetch content from URLs' },
      { label: 'Audio', icon: 'Headphones', color: 'blue', description: 'Process audio inputs' },
      { label: 'Image', icon: 'Image', color: 'blue', description: 'Process image inputs' },
      { label: 'Text Input', icon: 'MessageSquare', color: 'blue', description: 'Accept text input' }
    ]
  },
  {
    name: 'Outputs',
    icon: Send,
    expanded: false,
    nodes: [
      { label: 'Text', icon: 'FileText', color: 'emerald', description: 'Output text response' },
      { label: 'JSON', icon: 'FileJson', color: 'emerald', description: 'Structured data output' },
      { label: 'File', icon: 'Download', color: 'emerald', description: 'Generate file downloads' }
    ]
  },
  {
    name: 'LLMs',
    icon: Brain,
    expanded: false,
    nodes: [
      { label: 'OpenAI GPT', icon: 'Brain', color: 'purple', description: 'GPT-4, GPT-3.5 models' },
      { label: 'Claude', icon: 'MessageSquare', color: 'orange', description: 'Anthropic Claude models' },
      { label: 'Gemini', icon: 'Sparkles', color: 'blue', description: 'Google Gemini models' },
      { label: 'Custom', icon: 'Zap', color: 'indigo', description: 'Custom model endpoint' }
    ]
  },
  {
    name: 'Integrations',
    icon: Globe,
    expanded: false,
    nodes: [
      { label: 'Gmail', icon: 'Mail', color: 'red', description: 'Send emails via Gmail' },
      { label: 'Google Sheets', icon: 'FileSpreadsheet', color: 'green', description: 'Read/write spreadsheets' },
      { label: 'Slack', icon: 'MessageSquare', color: 'purple', description: 'Send Slack messages' },
      { label: 'Twitter/X', icon: 'MessageSquare', color: 'blue', description: 'Post to Twitter/X' },
      { label: 'Discord', icon: 'MessageSquare', color: 'indigo', description: 'Send Discord messages' },
      { label: 'Zapier', icon: 'Zap', color: 'orange', description: 'Trigger Zapier workflows' }
    ]
  },
  {
    name: 'Actions',
    icon: Zap,
    expanded: false,
    nodes: [
      { label: 'HTTP Request', icon: 'Globe', color: 'cyan', description: 'API calls and webhooks' },
      { label: 'Email', icon: 'Mail', color: 'red', description: 'Send email notifications' },
      { label: 'Webhook', icon: 'Webhook', color: 'yellow', description: 'Trigger external webhooks' },
      { label: 'Code', icon: 'FileCheck', color: 'slate', description: 'Execute custom code' }
    ]
  },
  {
    name: 'Knowledge Base',
    icon: Database,
    expanded: false,
    nodes: [
      { label: 'Vector Search', icon: 'FileSearch', color: 'green', description: 'Semantic search' },
      { label: 'Document Q&A', icon: 'FileText', color: 'green', description: 'Query documents' }
    ]
  },
  {
    name: 'Databases',
    icon: Database,
    expanded: false,
    nodes: [
      { label: 'SQL Query', icon: 'Database', color: 'blue', description: 'Execute SQL queries' },
      { label: 'NoSQL', icon: 'FileJson', color: 'green', description: 'NoSQL operations' },
      { label: 'Redis', icon: 'Database', color: 'red', description: 'Redis cache operations' }
    ]
  },
  {
    name: 'Document Readers',
    icon: FileText,
    expanded: false,
    nodes: [
      { label: 'PDF', icon: 'FileText', color: 'red', description: 'Extract PDF content' },
      { label: 'CSV', icon: 'FileSpreadsheet', color: 'green', description: 'Parse CSV files' },
      { label: 'TXT', icon: 'FileText', color: 'gray', description: 'Process text files' },
      { label: 'DOC', icon: 'FilePlus', color: 'blue', description: 'Read Word documents' }
    ]
  },
  {
    name: 'Logic',
    icon: Target,
    expanded: false,
    nodes: [
      { label: 'If/Else', icon: 'Target', color: 'pink', description: 'Conditional branching' },
      { label: 'Loop', icon: 'RotateCcw', color: 'purple', description: 'Iterate over data' },
      { label: 'Switch', icon: 'ArrowLeftRight', color: 'yellow', description: 'Multiple conditions' },
      { label: 'Delay', icon: 'Clock', color: 'amber', description: 'Add time delays' }
    ]
  },
  {
    name: 'Utils',
    icon: Settings,
    expanded: false,
    nodes: [
      { label: 'Format', icon: 'Sparkles', color: 'teal', description: 'Format data' },
      { label: 'Transform', icon: 'ArrowLeftRight', color: 'cyan', description: 'Transform data' },
      { label: 'Validate', icon: 'CheckCircle', color: 'green', description: 'Validate inputs' },
      { label: 'Cache', icon: 'Database', color: 'slate', description: 'Cache results' }
    ]
  }
];

export function WorkflowSidebar({ activeTab, onChange, onAddNode }: WorkflowSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(stackAICategories.map(cat => [cat.name, cat.expanded]))
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const filteredCategories = stackAICategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  if (activeTab !== 'workflow') {
    return (
      <div className="w-96 border-r bg-card/30 backdrop-blur-sm p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg capitalize">{activeTab}</h3>
          <div className="text-sm text-muted-foreground">
            {activeTab === 'export' && 'Export your workflow as JSON, share links, or generate embed codes.'}
            {activeTab === 'analytics' && 'View execution history, performance metrics, and usage statistics.'}
            {activeTab === 'manager' && 'Manage workflow settings, versions, and collaboration.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-r bg-card/30 backdrop-blur-sm flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredCategories.map((category) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories[category.name];
          
          return (
            <div key={category.name}>
              {/* Category Header */}
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center gap-3 w-full">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
              </Button>

              {/* Category Nodes */}
              {isExpanded && (
                <div className="ml-4 space-y-1 mt-2">
                  {category.nodes.map((node, index) => {
                    // Icon mapping for rendering in sidebar
                    const iconMap: { [key: string]: any } = {
                      FileText, Link, Headphones, Image, MessageSquare, Send, FileJson, Download,
                      Brain, Sparkles, Zap, Globe, Mail, Webhook, FileCheck, FileSearch,
                      Database, FileSpreadsheet, FilePlus, Target, RotateCcw, ArrowLeftRight,
                      Clock, CheckCircle
                    };
                    
                    const NodeIcon = iconMap[node.icon as string] || FileText;
                    
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => {
                          const nodeType = category.name.toLowerCase() === 'llms' ? 'llm' : 
                                         category.name.toLowerCase() === 'inputs' ? 'input' :
                                         category.name.toLowerCase() === 'outputs' ? 'output' :
                                         category.name.toLowerCase();
                          
                          console.log('Dragging node:', { ...node, type: nodeType });
                          
                          e.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'custom',
                            data: {
                              ...node,
                              type: nodeType,
                            }
                          }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => {
                          // Handle click to add
                          const nodeType = category.name.toLowerCase() === 'llms' ? 'llm' : 
                                         category.name.toLowerCase() === 'inputs' ? 'input' :
                                         category.name.toLowerCase() === 'outputs' ? 'output' :
                                         category.name.toLowerCase();
                          
                          onAddNode({
                            ...node,
                            type: nodeType,
                          });
                        }}
                        className="group p-3 rounded-lg border bg-background hover:bg-accent cursor-pointer transition-all duration-200 hover:border-foreground hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-${node.color}-100 to-${node.color}-200 shadow-sm group-hover:shadow-md transition-shadow`}>
                            <NodeIcon className={`w-4 h-4 text-${node.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {node.label}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {category !== filteredCategories[filteredCategories.length - 1] && (
                <Separator className="mt-3" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}