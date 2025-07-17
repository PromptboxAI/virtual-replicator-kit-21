import React from 'react';
import { WorkflowBuilderLayout } from './workflow/WorkflowBuilderLayout';

interface WorkflowBuilderProps {
  agentId: string;
  agentName: string;
  onComplete?: (workflowId: string) => void;
}

export function WorkflowBuilder({ agentId, agentName, onComplete }: WorkflowBuilderProps) {
  return (
    <WorkflowBuilderLayout 
      agentId={agentId}
      agentName={agentName}
      onComplete={onComplete}
    />
  );
}