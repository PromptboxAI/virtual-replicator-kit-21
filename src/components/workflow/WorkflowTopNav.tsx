import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Share, Rocket, Save, MoreHorizontal, History } from 'lucide-react';
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
  const [versionsOpen, setVersionsOpen] = useState(false);

  return (
    <>
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
            <TabsTrigger 
              value="settings" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="px-4 data-[state=active]:bg-transparent data-[state=active]:border-foreground data-[state=active]:border-b-2 data-[state=active]:rounded-none rounded-none border-b-2 border-transparent"
            >
              Logs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Right Side - Action Buttons */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setVersionsOpen(true)}
          className="gap-2"
          title="Version History"
        >
          <History className="w-4 h-4" />
        </Button>
        
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

    {/* Versions Dialog */}
    <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            View and restore previous versions of your workflow.
          </p>
          <div className="space-y-2">
            {/* Placeholder versions - would be populated from database */}
            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Current Version</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto-saved</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
              <Button variant="outline" size="sm">Restore</Button>
            </div>
            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Published v1.0</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
              <Button variant="outline" size="sm">Restore</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}