// Simple in-memory storage as fallback
const documentChunks: Record<string, { content: string; embedding: number[]; userId: string; documentId: string }[]> =
  {}

// Initialize Upstash Vector only if environment variables are available
let index: any = null
let useUpstash = false

// Only initialize on server side
if (typeof window === "undefined") {
  try {
    if (process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN) {
      const { Index } = require("@upstash/vector")
      index = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN,
      })
      useUpstash = true
      console.log("✅ Upstash Vector initialized successfully")
    } else {
      console.log("⚠️ Upstash Vector credentials missing, using fallback storage")
    }
  } catch (error) {
    console.warn("❌ Error initializing Upstash Vector, using fallback storage:", error)
    useUpstash = false
  }
}

export async function chunkText(text: string, chunkSize = 500): Promise<string[]> {
  // Split text into sentences first
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ""

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = trimmedSentence
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // If no sentences found, split by words
  if (chunks.length === 0) {
    const words = text.split(/\s+/)
    for (let i = 0; i < words.length; i += 100) {
      chunks.push(words.slice(i, i + 100).join(" "))
    }
  }

  return chunks.filter((chunk) => chunk.length > 10) // Filter out very short chunks
}

// Create embeddings using a simple but effective method
function createEmbedding(text: string): number[] {
  const dimension = 1536 // Standard embedding dimension
  const embedding = new Array(dimension).fill(0)

  // Normalize text
  const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, " ")
  const words = normalizedText.split(/\s+/).filter((w) => w.length > 2)

  // Create embedding based on word positions and frequencies
  const wordFreq: Record<string, number> = {}
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Generate embedding vector
  words.forEach((word, index) => {
    const wordHash = hashString(word)
    const freq = wordFreq[word]

    for (let i = 0; i < word.length && i < 10; i++) {
      const charCode = word.charCodeAt(i)
      const pos = (wordHash + i) % dimension
      embedding[pos] += charCode * freq * (1 + index * 0.01)
    }
  })

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export async function storeDocumentChunks(userId: string, documentId: string, chunks: string[]) {
  try {
    console.log(`📄 [STORE] Starting storage for user ${userId}, document ${documentId}`)
    console.log(`📄 [STORE] Number of chunks: ${chunks.length}`)
    console.log(`📄 [STORE] Using Upstash: ${useUpstash}`)

    if (useUpstash && index) {
      console.log("🚀 [STORE] Using Upstash Vector for storage")
      // Use Upstash Vector
      const vectors = chunks.map((chunk, chunkIndex) => {
        const embedding = createEmbedding(chunk)
        return {
          id: `${userId}-${documentId}-${chunkIndex}`,
          vector: embedding,
          metadata: {
            userId,
            documentId,
            chunkIndex,
            content: chunk,
            preview: chunk.substring(0, 100) + "...",
          },
        }
      })

      // Store in batches to avoid rate limits
      const batchSize = 10
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize)
        await index.upsert(batch)
        console.log(
          `✅ [STORE] Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} for user ${userId}`,
        )
      }
      console.log(
        `🎉 [STORE] Successfully stored all chunks for user ${userId}, document ${documentId} in Upstash Vector`,
      )
    } else {
      console.log("💾 [STORE] Using fallback storage")

      // Initialize user storage if it doesn't exist
      if (!documentChunks[userId]) {
        documentChunks[userId] = []
        console.log(`📁 [STORE] Created new storage for user ${userId}`)
      }

      // Store each chunk
      chunks.forEach((chunk, chunkIndex) => {
        const chunkData = {
          content: chunk,
          embedding: createEmbedding(chunk),
          userId,
          documentId,
        }
        documentChunks[userId].push(chunkData)
        console.log(`📝 [STORE] Stored chunk ${chunkIndex}: "${chunk.substring(0, 50)}..."`)
      })

      console.log(
        `✅ [STORE] Stored ${chunks.length} chunks in fallback storage for user ${userId}, document ${documentId}`,
      )
      console.log(`📊 [STORE] Total chunks for user ${userId}: ${documentChunks[userId]?.length || 0}`)

      // Debug: Log current storage state
      console.log(`🔍 [STORE] Current storage keys:`, Object.keys(documentChunks))
      Object.keys(documentChunks).forEach((key) => {
        console.log(`🔍 [STORE] User ${key} has ${documentChunks[key].length} chunks`)
      })
    }

    return true
  } catch (error) {
    console.error("❌ [STORE] Error storing document chunks:", error)
    return false
  }
}

// Simple cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

export async function searchSimilarChunks(userId: string, query: string, topK = 5) {
  try {
    console.log(`🔍 [SEARCH] Starting search for user ${userId}`)
    console.log(`🔍 [SEARCH] Query: "${query}"`)

    // Get user token from auth context or localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("knaible_user") : null
    if (!token) {
      console.error("❌ [SEARCH] No auth token found")
      return []
    }
    const user = JSON.parse(token)
    const authToken = user.token

    const response = await fetch(`http://127.0.0.1:8000/documents/search?query=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
    })

    if (!response.ok) {
      console.error(`❌ [SEARCH] Search API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const results = data.chunks.slice(0, topK)
    console.log(`✅ [SEARCH] Returning ${results.length} relevant chunks`)
    return results
  } catch (error) {
    console.error("❌ [SEARCH] Error searching similar chunks:", error)
    return []
  }
}

// Add a function to get all chunks for debugging
export async function getAllChunksForUser(userId: string) {
  try {
    console.log(`🔍 [DEBUG] Getting all chunks for user ${userId}`)

    if (useUpstash && index) {
      console.log("🚀 [DEBUG] Using Upstash Vector")
      // For Upstash, we'll do a broad search
      const results = await index.query({
        vector: new Array(1536).fill(0.1), // Dummy vector
        topK: 100,
        includeMetadata: true,
      })

      const userResults = results
        .filter((result: any) => result.metadata?.userId === userId)
        .map((result: any) => ({
          content: result.metadata?.content,
          documentId: result.metadata?.documentId,
          preview: result.metadata?.preview,
        }))

      console.log(`✅ [DEBUG] Found ${userResults.length} chunks in Upstash for user ${userId}`)
      return userResults
    } else {
      console.log("💾 [DEBUG] Using fallback storage")
      console.log(`🔍 [DEBUG] Available storage keys:`, Object.keys(documentChunks))

      if (!documentChunks[userId]) {
        console.log(`❌ [DEBUG] No chunks found for user ${userId}`)
        return []
      }

      const results = documentChunks[userId].map((chunk) => ({
        content: chunk.content,
        documentId: chunk.documentId,
        preview: chunk.content.substring(0, 100) + "...",
      }))

      console.log(`✅ [DEBUG] Found ${results.length} chunks in fallback storage for user ${userId}`)
      return results
    }
  } catch (error) {
    console.error("❌ [DEBUG] Error getting all chunks:", error)
    return []
  }
}
