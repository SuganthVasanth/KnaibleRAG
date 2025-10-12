import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, FileText, Zap, Shield, Code, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Knaible</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Create Custom RAG Chatbots
          <br />
          <span className="text-blue-600">From Your Documents</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Upload your documents, choose your AI model, and create intelligent chatbots that understand your content.
          Perfect for customer support, knowledge bases, and internal documentation.
        </p>
        <div className="space-x-4">
          <Link href="/auth/signin">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Building
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3">
            View Demo
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Knaible?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Multi-Format Support</CardTitle>
              <CardDescription>
                Upload PDF, DOCX, and TXT files. Our advanced parsing extracts and processes your content intelligently.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Free AI Models</CardTitle>
              <CardDescription>
                Choose from Llama 3, Mixtral, and Gemma models - all completely free with lightning-fast inference by
                Groq.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your documents are encrypted and isolated. Each user gets their own secure knowledge base.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Get a unique API key to integrate your chatbot into any application or website.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Smart Retrieval</CardTitle>
              <CardDescription>
                Advanced vector search finds the most relevant information from your documents for each query.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-teal-600 mb-4" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription>
                Intuitive interface makes it simple to upload documents, configure settings, and start chatting.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already building amazing chatbots with Knaible.
          </p>
          <Link href="/auth/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Create Your First Chatbot
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6" />
            <span className="text-xl font-bold">Knaible</span>
          </div>
          <p className="text-gray-400">© 2024 Knaible. All rights reserved. Built with Next.js and AI.</p>
        </div>
      </footer>
    </div>
  )
}
