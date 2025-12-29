import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Share, Rocket, Save, MoreHorizontal } from 'lucide-react';
import { WorkflowTab } from './WorkflowBuilderLayout';

interface WorkflowTopNavProps {
  activeTab: WorkflowTab;
  onTabChange: (tab: WorkflowTab) => void;
  agentName: string;
  onSave: () => void;
  onPublish: () => void;
  onRun: () => void;
  hasUnsavedChanges: boolean;
}

export function WorkflowTopNav({ 
  activeTab, 
  onTabChange, 
  agentName, 
  onSave, 
  onPublish,
  onRun,
  hasUnsavedChanges 
}: WorkflowTopNavProps) {
  return (
    <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left Side - Status badges only */}
      <div className="flex items-center gap-3 w-96">
        {hasUnsavedChanges && (
          <Badge variant="destructive" className="text-xs">
            Unsaved
          </Badge>
        )}
      </div>
      
      {/* Center/Right - Tabs */}
      <div className="flex-1 flex items-center">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as WorkflowTab)}>
          <TabsList className="h-10 bg-transparent border">
            <TabsTrigger 
              value="workflow" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Workflow
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Export
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="manager" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Manager
            </TabsTrigger>
            <TabsTrigger 
              value="marketing" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Marketing
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Right Side - Action Buttons */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRun}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          Run
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Share className="w-4 h-4" />
          Share
        </Button>
        
        <Button 
          size="sm"
          onClick={onPublish}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Rocket className="w-4 h-4" />
          Publish
        </Button>
        
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}