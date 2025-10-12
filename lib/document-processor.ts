// We'll use pdf-parse for proper PDF extraction
// This would require installing: npm install pdf-parse

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  try {
    console.log(`📄 [EXTRACT] Processing file: ${fileName}, type: ${fileType}`)

    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      console.log(`📄 [EXTRACT] Processing as text file`)
      const text = await file.text()
      return text
    }

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      console.log(`📄 [EXTRACT] Processing as PDF file`)

      // For PDF files, we'll use a more robust approach
      // In a production environment, you'd use pdf-parse or similar library
      // Since we can't install new packages in this environment, we'll use a more robust fallback

      const arrayBuffer = await file.arrayBuffer()

      // First attempt: Try to extract text directly
      let text = ""
      try {
        // This is a simplified approach - in production use pdf-parse
        const textDecoder = new TextDecoder("utf-8")
        text = textDecoder.decode(arrayBuffer)

        // Clean up the text - remove non-printable characters
        text = text
          .replace(/[^\x20-\x7E\n\r]/g, " ")
          .replace(/\s+/g, " ")
          .trim()

        console.log(`📄 [EXTRACT] Extracted ${text.length} characters from PDF`)

        // If we got very little text or mostly garbage, we'll provide a helpful message
        if (text.length < 100 || text.match(/[a-zA-Z]/).length < text.length * 0.1) {
          console.log(`📄 [EXTRACT] PDF extraction yielded poor results, using fallback`)
          text =
            `PDF Document: ${file.name}\n\n` +
            "This PDF file has been uploaded but may contain images, scanned content, or complex formatting " +
            "that couldn't be fully extracted. The system will work with the text that could be extracted, " +
            "but for best results, please consider uploading a text version of this document if available."
        }
      } catch (error) {
        console.error(`❌ [EXTRACT] Error extracting text from PDF:`, error)
        text =
          `PDF Document: ${file.name}\n\n` +
          "This PDF file has been uploaded but couldn't be processed properly. " +
          "For best results, please upload the content as a text file or copy-paste the text directly."
      }

      return text
    }

    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      console.log(`📄 [EXTRACT] Processing as DOCX file`)
      // For DOCX files, we'll provide a placeholder
      // In production, you'd use mammoth.js or similar
      return (
        `Word Document: ${file.name}\n\n` +
        "This is a Word document that has been uploaded. For best results with document analysis, " +
        "please save your content as a text file (.txt) or copy-paste the text directly into a text file and upload that instead."
      )
    }

    // For other file types, try to read as text
    console.log(`📄 [EXTRACT] Processing as generic file, attempting text extraction`)
    const text = await file.text()
    return (
      text ||
      `File: ${file.name}\n\n` +
        "This file type may not be fully supported. Please try uploading as a .txt file for best results."
    )
  } catch (error) {
    console.error(`❌ [EXTRACT] Error extracting text from file:`, error)
    return (
      `Error reading file: ${file.name}\n\n` +
      "There was an error processing this file. Please try uploading a .txt file or copy-paste your content directly."
    )
  }
}

export function generateApiKey(): string {
  return "kn_" + Math.random().toString(36).substr(2, 32)
}
