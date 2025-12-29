import React, { useState, useRef } from 'react';
import { WorkflowTopNav } from './WorkflowTopNav';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowCanvas, WorkflowCanvasRef } from './WorkflowCanvas';
import { WorkflowBottomStatus } from './WorkflowBottomStatus';
import { AgentMarketingManager } from '../AgentMarketingManager';
import { Node, Edge } from '@xyflow/react';

interface WorkflowBuilderLayoutProps {
  agentId: string;
  agentName: string;
  onComplete?: (workflowId: string) => void;
}

export type WorkflowTab = 'workflow' | 'export' | 'analytics' | 'manager' | 'marketing' | 'settings' | 'logs';

export function WorkflowBuilderLayout({ agentId, agentName, onComplete }: WorkflowBuilderLayoutProps) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('workflow');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastPublished, setLastPublished] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const canvasRef = useRef<WorkflowCanvasRef>(null);

  const handleAddNode = (nodeData: any) => {
    if (canvasRef.current) {
      canvasRef.current.addNode(nodeData);
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = () => {
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };

  const handlePublish = async () => {
    try {
      if (canvasRef.current) {
        await canvasRef.current.exportWorkflow();
        setLastPublished(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to publish workflow:", error);
    }
  };

  const handleRun = () => {
    // Get canvas component to trigger workflow execution
    const canvasComponent = document.querySelector('[data-testid="rf__wrapper"]');
    if (canvasComponent) {
      // Dispatch custom event to trigger workflow execution
      const event = new CustomEvent('executeWorkflow');
      canvasComponent.dispatchEvent(event);
    }
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
        onRun={handleRun}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      {/* Marketing tab uses full width */}
      {activeTab === 'marketing' ? (
        <div className="flex-1 overflow-auto">
          <AgentMarketingManager 
            agentId={agentId} 
            agentName={agentName}
          />
        </div>
      ) : (
        /* Main Content Area for other tabs */
        <div className="flex flex-1 overflow-hidden">
          {/* Enhanced Sidebar - Stack AI style (~400px) */}
          <WorkflowSidebar 
            activeTab={activeTab}
            onChange={handleChange}
            onAddNode={handleAddNode}
            agentId={agentId}
            agentName={agentName}
          />
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            <WorkflowCanvas 
              ref={canvasRef}
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
      )}
    </div>
  );
}