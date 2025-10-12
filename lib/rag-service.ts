import { searchSimilarChunks } from "./vector-db"

// Try to import Groq, but handle gracefully if not available
let groqModel: any = null
let generateText: any = null
let groqAvailable = false

try {
  if (process.env.GROQ_API_KEY) {
    const aiModule = require("ai")
    const groqModule = require("@ai-sdk/groq")
    generateText = aiModule.generateText
    groqModel = groqModule.groq
    groqAvailable = true
    console.log("✅ [RAG] Groq AI initialized successfully")
  } else {
    console.log("⚠️ [RAG] Groq API key missing, using fallback responses")
  }
} catch (error) {
  console.warn("❌ [RAG] Error initializing AI SDK:", error)
}

export async function generateRAGResponse(userId: string, query: string, model = "llama3-8b-8192"): Promise<string> {
  try {
    console.log(`🔍 [RAG] Generating response for user ${userId}, query: "${query}"`)

    // Retrieve relevant chunks
    const relevantChunks = await searchSimilarChunks(userId, query, 5)
    console.log(`📊 [RAG] Found ${relevantChunks.length} relevant chunks`)

    if (relevantChunks.length === 0) {
      return "I don't have any documents uploaded that contain information to answer this question. Please upload relevant documents first, then ask me questions about their content."
    }

    // Prepare context from retrieved chunks
    const context = relevantChunks.map((chunk, index) => `Document ${index + 1}:\n${chunk.content}`).join("\n\n---\n\n")

    console.log(`📄 [RAG] Context length: ${context.length} characters`)
    console.log(`📄 [RAG] Context preview: ${context.substring(0, 200)}...`)

    if (groqAvailable && generateText && groqModel) {
      console.log(`🚀 [RAG] Using Groq AI model: ${model}`)

      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided document context. 

IMPORTANT INSTRUCTIONS:
- Answer questions directly and comprehensively using ONLY the information from the provided documents
- If the documents contain specific details about the topic, include them in your response
- Provide detailed, informative answers rather than brief generic statements
- If asked about a company, organization, or entity, provide all available details from the documents
- If asked "what do they do" or "main purpose", explain the activities, services, or functions described in the documents
- Do not make up information that isn't in the documents
- If the documents don't contain enough information to fully answer the question, say so

Format your responses clearly and include relevant details from the context.`

      const userPrompt = `Based on the following document context, please answer this question: "${query}"

DOCUMENT CONTEXT:
${context}

Please provide a comprehensive answer based on the information in the documents above.`

      try {
        const { text } = await generateText({
          model: groqModel(model),
          system: systemPrompt,
          prompt: userPrompt,
          maxTokens: 500,
          temperature: 0.3, // Lower temperature for more focused responses
        })

        console.log(`✅ [RAG] Generated response: ${text.substring(0, 100)}...`)
        return text
      } catch (aiError) {
        console.error("❌ [RAG] Groq AI error:", aiError)
        // Fall back to manual processing if AI fails
        return generateFallbackResponse(query, relevantChunks)
      }
    } else {
      console.log("⚠️ [RAG] Groq not available, using fallback response generation")
      return generateFallbackResponse(query, relevantChunks)
    }
  } catch (error) {
    console.error("❌ [RAG] Error generating RAG response:", error)
    return "I'm sorry, I encountered an error while processing your question. Please try again or check if your documents are properly uploaded."
  }
}

// Enhanced fallback response generation
function generateFallbackResponse(query: string, chunks: any[]): string {
  const queryLower = query.toLowerCase()
  const allContent = chunks.map((chunk) => chunk.content).join(" ")

  // More sophisticated content analysis
  if (queryLower.includes("what") && (queryLower.includes("do") || queryLower.includes("does"))) {
    // Extract activities, services, or functions
    const sentences = allContent.split(/[.!?]+/).filter((s) => s.trim().length > 10)
    const relevantSentences = sentences.filter((sentence) => {
      const s = sentence.toLowerCase()
      return (
        s.includes("provide") ||
        s.includes("offer") ||
        s.includes("specialize") ||
        s.includes("develop") ||
        s.includes("create") ||
        s.includes("service") ||
        s.includes("business") ||
        s.includes("company") ||
        s.includes("work")
      )
    })

    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 3).join(". ") + "."
    }
  }

  if (queryLower.includes("purpose") || queryLower.includes("mission")) {
    const sentences = allContent.split(/[.!?]+/).filter((s) => s.trim().length > 10)
    const relevantSentences = sentences.filter((sentence) => {
      const s = sentence.toLowerCase()
      return (
        s.includes("mission") ||
        s.includes("purpose") ||
        s.includes("goal") ||
        s.includes("aim") ||
        s.includes("objective") ||
        s.includes("focus")
      )
    })

    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join(". ") + "."
    }
  }

  // Default: return the most relevant chunks
  const topChunks = chunks.slice(0, 2)
  if (topChunks.length > 0) {
    return topChunks.map((chunk) => chunk.content).join("\n\n")
  }

  return "I found some relevant information in your documents, but I need a more specific question to provide a detailed answer."
}
