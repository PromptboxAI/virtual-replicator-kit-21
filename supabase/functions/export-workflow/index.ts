import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface WorkflowExportRequest {
  agentId: string;
  agentName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    description?: string;
    version?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body: WorkflowExportRequest = await req.json();
    const { agentId, agentName, nodes, edges, metadata } = body;

    if (!agentId || !agentName || !nodes || !edges) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agentId, agentName, nodes, edges' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate the .tsx file content
    const timestamp = new Date().toISOString();
    const fileName = `${agentName.replace(/[^a-zA-Z0-9]/g, '_')}_${agentId}`;
    
    const workflowData = {
      metadata: {
        agentId,
        agentName,
        description: metadata?.description || '',
        version: metadata?.version || '1.0.0',
        timestamp,
        exportedAt: timestamp,
      },
      workflow: {
        nodes,
        edges,
      }
    };

    const tsxContent = `// Generated Workflow Export
// Agent: ${agentName}
// ID: ${agentId}
// Exported: ${timestamp}

import React from 'react';

/**
 * Workflow Configuration for ${agentName}
 * 
 * This file contains the complete workflow definition including:
 * - Node configurations and positions
 * - Edge connections and data flow
 * - Metadata and versioning information
 * 
 * Generated automatically from the Workflow Builder.
 * This file is intended for debugging, auditing, and potential code generation.
 */

export const workflowConfig = ${JSON.stringify(workflowData, null, 2)};

export const WorkflowMetadata = {
  agentId: "${agentId}",
  agentName: "${agentName}",
  description: "${metadata?.description || ''}",
  version: "${metadata?.version || '1.0.0'}",
  timestamp: "${timestamp}",
  nodeCount: ${nodes.length},
  edgeCount: ${edges.length},
};

export const WorkflowNodes = workflowConfig.workflow.nodes;
export const WorkflowEdges = workflowConfig.workflow.edges;

// Workflow Summary
export const WorkflowSummary = {
  totalNodes: ${nodes.length},
  totalEdges: ${edges.length},
  nodeTypes: [${[...new Set(nodes.map(n => `"${n.type}"`))].join(', ')}],
  hasInputNodes: ${nodes.some(n => n.type === 'input')},
  hasOutputNodes: ${nodes.some(n => n.type === 'output')},
  hasLLMNodes: ${nodes.some(n => n.data?.type === 'llm')},
  hasAPINodes: ${nodes.some(n => n.data?.type === 'api')},
};

/**
 * Debugging Helper Functions
 */
export const getNodeById = (id: string) => WorkflowNodes.find(node => node.id === id);
export const getEdgesByNode = (nodeId: string) => WorkflowEdges.filter(edge => 
  edge.source === nodeId || edge.target === nodeId
);
export const getConnectedNodes = (nodeId: string) => {
  const edges = getEdgesByNode(nodeId);
  const connectedIds = [
    ...edges.filter(e => e.source === nodeId).map(e => e.target),
    ...edges.filter(e => e.target === nodeId).map(e => e.source),
  ];
  return connectedIds.map(id => getNodeById(id)).filter(Boolean);
};

// Export for potential future component generation
export default function ${fileName}Workflow() {
  return (
    <div className="workflow-export">
      <h2>Workflow: {WorkflowMetadata.agentName}</h2>
      <p>Exported: {WorkflowMetadata.timestamp}</p>
      <p>Nodes: {WorkflowSummary.totalNodes}, Edges: {WorkflowSummary.totalEdges}</p>
      <pre>{JSON.stringify(workflowConfig, null, 2)}</pre>
    </div>
  );
}
`;

    console.log(`Exporting workflow for agent: ${agentName} (${agentId})`);
    console.log(`Generated file: ${fileName}.tsx`);
    console.log(`Workflow summary: ${nodes.length} nodes, ${edges.length} edges`);

    return new Response(
      JSON.stringify({
        success: true,
        fileName: `${fileName}.tsx`,
        filePath: `/src/generated-workflows/${fileName}.tsx`,
        content: tsxContent,
        metadata: workflowData.metadata,
        summary: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          nodeTypes: [...new Set(nodes.map(n => n.type))],
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error exporting workflow:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to export workflow', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});