"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  // Sign in form state
  const [signInData, setSignInData] = useState({
    identifier: "",
    password: "",
  })

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!signInData.identifier.trim() || !signInData.password.trim()) {
      setError("Please enter both username/email and password")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: signInData.identifier,
          password: signInData.password,
        }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`✅ [SIGNIN] Sign in successful for: ${result.user.username}`)
        login({
          ...result.user,
          token: result.access_token,
        })
        setSuccess("Sign in successful! Redirecting...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        setError(result.detail || "Invalid username/email or password. Please check your credentials and try again.")
      }
    } catch (error) {
      console.error("❌ [SIGNIN] Sign in error:", error)
      setError("An error occurred during sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (
      !signUpData.username.trim() ||
      !signUpData.email.trim() ||
      !signUpData.password.trim()
    ) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (signUpData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      setIsLoading(false)
      return
    }

    if (!signUpData.email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signUpData.username,
          email: signUpData.email,
          password: signUpData.password,
        }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess("Account created successfully! Signing you in...")
        // After signup, sign in to get token
        const signinResponse = await fetch("http://127.0.0.1:8000/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: signUpData.email,
            password: signUpData.password,
          }),
        })
        const signinResult = await signinResponse.json()
        if (signinResponse.ok && signinResult.success) {
          login({
            ...signinResult.user,
            token: signinResult.access_token,
          })
        } else {
          setError("Account created but sign in failed. Please sign in manually.")
          return
        }
        setTimeout(() => router.push("/dashboard"), 1500)
      } else {
        setError(result.detail || "Failed to create account")
      }
    } catch (error) {
      setError("An error occurred during sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Knaible</span>
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one to start building chatbots</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username or Email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your username or email"
                    value={signInData.identifier}
                    onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username (min 3 characters)"
                    value={signUpData.username}
                    onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
