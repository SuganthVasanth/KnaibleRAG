import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required", success: false, documents: [] }, { status: 400 })
    }

    console.log(`📄 [API] Fetching documents for user: ${userId}`)
    let documents = []

    try {
      documents = await db.documents.findByUserId(userId)
    } catch (error) {
      console.error("Error fetching documents:", error)
      documents = []
    }

    if (!Array.isArray(documents)) {
      console.warn("Documents is not an array, returning empty array")
      documents = []
    }

    return NextResponse.json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc.id || `unknown-${Date.now()}`,
        filename: doc.filename || "Unknown file",
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        status: doc.status || "error",
        chunks: doc.chunks?.length || 0,
      })),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching documents:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching documents",
        details: (error as Error).message,
        documents: [],
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required", success: false }, { status: 400 })
    }

    console.log(`🗑️ [API] Deleting document: ${documentId}`)
    let deleted = false

    try {
      deleted = await db.documents.deleteById(documentId)
    } catch (error) {
      console.error("Error deleting document:", error)
    }

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Document ${documentId} deleted successfully`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Error deleting document:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error deleting document",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
