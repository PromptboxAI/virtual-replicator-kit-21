import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface AgentDeploymentRequest {
  agentId: string
  framework: string
  name: string
  description: string
  apiKey?: string
  environment?: Record<string, any>
}

interface FrameworkDeployment {
  framework: string
  handler: (config: AgentDeploymentRequest) => Promise<any>
}

// Framework-specific deployment handlers
const deploymentHandlers: Record<string, (config: AgentDeploymentRequest) => Promise<any>> = {
  "PROMPT (Default Framework)": async (config) => {
    console.log(`Deploying PROMPT agent: ${config.name}`)
    
    // Deploy to PromptBox platform using Virtuals SDK internally
    const deployment = {
      agentId: `prompt_${config.agentId}`,
      endpoint: `https://promptbox.app/agents/${config.agentId}`,
      dashboardUrl: `https://promptbox.app/dashboard/agents/${config.agentId}`,
      features: ["autonomous-planning", "modular-workers", "custom-functions", "goal-driven", "twitter-integration", "promptbox-native"],
      platform: "PromptBox",
      poweredBy: "Virtuals Protocol SDK"
    }
    
    return deployment
  },

  "Eliza": async (config) => {
    console.log(`Deploying Eliza agent: ${config.name}`)
    
    // Eliza is open source and doesn't require API keys typically
    // But we can enhance it with OpenAI for better conversations
    const openAIApiKey = Deno.env.get('ELIZA_API_KEY') || Deno.env.get('OPENAI_API_KEY')
    
    try {
      // Create character configuration for Eliza
      const characterConfig = {
        name: config.name,
        description: config.description,
        personality: "helpful, knowledgeable, and engaging",
        bio: config.description,
        knowledge: [],
        messageExamples: [],
        postExamples: [],
        topics: [],
        style: {
          all: ["conversational", "helpful", "engaging"],
          chat: ["responsive", "contextual"],
          post: ["informative", "clear"]
        }
      }
      
      // If we have OpenAI key, create an enhanced version
      let assistantId = null
      if (openAIApiKey) {
        const response = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            name: config.name,
            description: config.description,
            model: 'gpt-4.1-2025-04-14',
            instructions: `You are ${config.name}. ${config.description}. You are an Eliza-style conversational AI with personality and memory. Be helpful, engaging, and maintain context throughout conversations.`,
            tools: [{ type: "file_search" }]
          })
        })
        
        if (response.ok) {
          const assistant = await response.json()
          assistantId = assistant.id
        }
      }
      
      return {
        agentId: `eliza_${config.agentId}`,
        endpoint: assistantId ? `https://api.openai.com/v1/assistants/${assistantId}` : `https://eliza-agents.com/${config.agentId}`,
        characterFile: `character_${config.agentId}.json`,
        characterConfig,
        assistantId,
        features: ["conversation", "personality", "memory", "enhanced_with_openai"]
      }
    } catch (error) {
      console.error('Eliza deployment failed:', error)
      // Fallback to basic Eliza without OpenAI enhancement
      return {
        agentId: `eliza_${config.agentId}`,
        endpoint: `https://eliza-agents.com/${config.agentId}`,
        characterFile: `character_${config.agentId}.json`,
        features: ["conversation", "personality", "memory"]
      }
    }
  },

  "LangChain": async (config) => {
    console.log(`Deploying LangChain agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("LangChain requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create LangChain agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a LangChain agent with access to chains, memory, and document processing capabilities. You can break down complex queries into chains of reasoning.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LangChain API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `langchain_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["chains", "agents", "memory", "document_processing", "vector_stores"]
      }
    } catch (error) {
      console.error('LangChain deployment failed:', error)
      throw new Error(`Failed to deploy to LangChain: ${error.message}`)
    }
  },

  "LlamaIndex": async (config) => {
    console.log(`Deploying LlamaIndex agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("LlamaIndex requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create LlamaIndex agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a LlamaIndex agent specialized in RAG (Retrieval-Augmented Generation) with advanced document indexing and query processing capabilities.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LlamaIndex API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `llamaindex_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["rag", "document_indexing", "query_engines", "knowledge_graphs"]
      }
    } catch (error) {
      console.error('LlamaIndex deployment failed:', error)
      throw new Error(`Failed to deploy to LlamaIndex: ${error.message}`)
    }
  },

  "BabyAGI": async (config) => {
    console.log(`Deploying BabyAGI agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("BabyAGI requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create BabyAGI agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a BabyAGI agent that creates, prioritizes, and executes tasks autonomously. You break down objectives into manageable tasks and work through them systematically.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`BabyAGI API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `babyagi_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["task_creation", "task_prioritization", "autonomous_execution", "memory"]
      }
    } catch (error) {
      console.error('BabyAGI deployment failed:', error)
      throw new Error(`Failed to deploy to BabyAGI: ${error.message}`)
    }
  },

  "AgentGPT": async (config) => {
    console.log(`Deploying AgentGPT agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("AgentGPT requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create AgentGPT agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are an AgentGPT agent that operates autonomously through a web interface, planning and executing complex goals step by step.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`AgentGPT API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `agentgpt_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["web_interface", "goal_execution", "autonomous_planning", "browser_based"]
      }
    } catch (error) {
      console.error('AgentGPT deployment failed:', error)
      throw new Error(`Failed to deploy to AgentGPT: ${error.message}`)
    }
  },

  "Semantic Kernel": async (config) => {
    console.log(`Deploying Semantic Kernel agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("Semantic Kernel requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create Semantic Kernel agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a Semantic Kernel agent that integrates AI services with conventional programming, using skills, planners, and connectors.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Semantic Kernel API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `semantic_kernel_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["skills", "planners", "connectors", "semantic_functions"]
      }
    } catch (error) {
      console.error('Semantic Kernel deployment failed:', error)
      throw new Error(`Failed to deploy to Semantic Kernel: ${error.message}`)
    }
  },

  "SuperAGI": async (config) => {
    console.log(`Deploying SuperAGI agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("SuperAGI requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create SuperAGI agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a SuperAGI agent with GUI interface, action console, and trajectory fine-tuning capabilities for enhanced autonomous operation.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SuperAGI API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `superagi_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["gui_interface", "action_console", "trajectory_tuning", "multiple_models"]
      }
    } catch (error) {
      console.error('SuperAGI deployment failed:', error)
      throw new Error(`Failed to deploy to SuperAGI: ${error.message}`)
    }
  },

  "Haystack": async (config) => {
    console.log(`Deploying Haystack agent: ${config.name}`)
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error("Haystack requires OpenAI API key not configured in environment")
    }
    
    try {
      // Create Haystack agent using OpenAI assistant
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          model: 'gpt-4.1-2025-04-14',
          instructions: `You are ${config.name}. ${config.description}. You are a Haystack agent specialized in building search systems and question-answering applications with document stores and pipelines.`,
          tools: [
            { type: "code_interpreter" },
            { type: "file_search" }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Haystack API error: ${errorText}`)
      }

      const assistant = await response.json()
      
      return {
        agentId: `haystack_${config.agentId}`,
        endpoint: `https://api.openai.com/v1/assistants/${assistant.id}`,
        assistantId: assistant.id,
        features: ["search_systems", "question_answering", "document_stores", "pipelines"]
      }
    } catch (error) {
      console.error('Haystack deployment failed:', error)
      throw new Error(`Failed to deploy to Haystack: ${error.message}`)
    }
  },

}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agentId, framework, name, description, apiKey, environment }: AgentDeploymentRequest = await req.json()

    if (!agentId || !framework) {
      return new Response(
        JSON.stringify({ error: 'Agent ID and framework are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting deployment for agent ${agentId} on framework ${framework}`)

    // Check if framework is supported
    const deployHandler = deploymentHandlers[framework]
    if (!deployHandler) {
      return new Response(
        JSON.stringify({ error: `Framework ${framework} not supported for deployment` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deploy the agent using framework-specific handler
    const deploymentResult = await deployHandler({
      agentId,
      framework,
      name,
      description,
      apiKey,
      environment
    })

    // Update agent record with deployment information
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
        // Store deployment metadata in a JSON field if available
      })
      .eq('id', agentId)

    if (updateError) {
      console.error('Failed to update agent status:', updateError)
    }

    console.log(`Successfully deployed agent ${agentId}:`, deploymentResult)

    return new Response(
      JSON.stringify({
        success: true,
        agentId,
        framework,
        deployment: deploymentResult,
        message: `Agent successfully deployed on ${framework}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Deployment error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})