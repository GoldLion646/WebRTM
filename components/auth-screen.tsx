"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuthScreenProps {
  onLogin: (email: string, password: string, role: "operator" | "manager") => Promise<void>
  onShowSignUp: (role: "operator" | "manager") => void
}

export default function AuthScreen({ onLogin, onShowSignUp }: AuthScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"operator" | "manager">("operator")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Validate email format
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value.trim())
  }

  // Validate password
  const validatePassword = (value: string): boolean => {
    return value.length >= 6
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    // Validate email
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    // Validate password
    if (value && !validatePassword(value)) {
      setPasswordError("Password must be at least 6 characters long")
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear previous errors
    setEmailError("")
    setPasswordError("")
    
    let isValid = true
    
    // Validate email is provided and format
    if (!email.trim()) {
      setEmailError("Email is required")
      isValid = false
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    }
    
    // Validate password is provided and format
    if (!password.trim()) {
      setPasswordError("Password is required")
      isValid = false
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters long")
      isValid = false
    }
    
    if (!isValid) {
      return false
    }
    
    // Set loading state and login
    setIsLoading(true)
    try {
      await onLogin(email.trim(), password, role)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
    return false
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Web RTMS</h1>
          <p className="text-text-secondary text-center mb-8">Production Metrics System</p>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={handleEmailChange}
                required
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
              {email && !emailError && validateEmail(email) && (
                <p className="text-xs text-emerald-600 mt-1">✓ Valid email address</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                required
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1">{passwordError}</p>
              )}
              {password && !passwordError && validatePassword(password) && (
                <p className="text-xs text-emerald-600 mt-1">✓ Password is valid</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("operator")}
                  className={`py-2 px-4 rounded font-medium transition-colors ${
                    role === "operator"
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-text-secondary hover:border-primary"
                  }`}
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRole("manager")}
                  className={`py-2 px-4 rounded font-medium transition-colors ${
                    role === "manager"
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-text-secondary hover:border-primary"
                  }`}
                >
                  Manager
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Enter System"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onShowSignUp(role)}
                className="w-full font-medium py-2"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
