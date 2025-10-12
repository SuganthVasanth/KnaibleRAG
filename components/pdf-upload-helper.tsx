"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Copy, Check } from "lucide-react"

interface PDFUploadHelperProps {
  onTextExtracted: (text: string) => void
}

export function PDFUploadHelper({ onTextExtracted }: PDFUploadHelperProps) {
  const [extractedText, setExtractedText] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("extract")

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseText = () => {
    if (extractedText) {
      onTextExtracted(extractedText)
    }
  }

  const handleManualTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedText(e.target.value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          PDF Helper
        </CardTitle>
        <CardDescription>Extract text from PDFs or manually enter content for better results</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract">Extract from PDF</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> If your PDF contains scanned text or complex formatting, the extraction might not
                be perfect. You can manually edit the extracted text before using it.
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Extracted text will appear here..."
                className="min-h-[200px] font-mono text-sm"
                value={extractedText}
                onChange={handleManualTextChange}
              />

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCopyText} className="flex items-center">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Text"}
                </Button>
                <Button onClick={handleUseText} disabled={!extractedText}>
                  Use This Text
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Tip:</strong> Copy-paste text directly from your PDF viewer for best results. This ensures the
                AI can properly analyze your document content.
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Paste or type your document content here..."
                className="min-h-[200px]"
                value={extractedText}
                onChange={handleManualTextChange}
              />

              <Button onClick={handleUseText} disabled={!extractedText}>
                Use This Text
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
