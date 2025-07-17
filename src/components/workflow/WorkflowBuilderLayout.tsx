import React, { useState } from 'react';
import { WorkflowTopNav } from './WorkflowTopNav';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowBottomStatus } from './WorkflowBottomStatus';
import { Node, Edge } from '@xyflow/react';

interface WorkflowBuilderLayoutProps {
  agentId: string;
  agentName: string;
  onComplete?: (workflowId: string) => void;
}

export type WorkflowTab = 'workflow' | 'export' | 'analytics' | 'manager';

export function WorkflowBuilderLayout({ agentId, agentName, onComplete }: WorkflowBuilderLayoutProps) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('workflow');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastPublished, setLastPublished] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = () => {
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };

  const handlePublish = () => {
    setLastPublished(new Date());
    setHasUnsavedChanges(false);
  };

  const handleChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div className="h-screen flex flex-col w-full bg-background">
      {/* Top Navigation */}
      <WorkflowTopNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        agentName={agentName}
        onSave={handleSave}
        onPublish={handlePublish}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Sidebar - Stack AI style (~400px) */}
        <WorkflowSidebar 
          activeTab={activeTab}
          onChange={handleChange}
        />
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <WorkflowCanvas 
            agentId={agentId}
            agentName={agentName}
            activeTab={activeTab}
            onComplete={onComplete}
            onChange={handleChange}
          />
          
          {/* Bottom Status Bar */}
          <WorkflowBottomStatus 
            lastSaved={lastSaved}
            lastPublished={lastPublished}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      </div>
    </div>
  );
}