"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/lib/auth"
import { toast } from "sonner"

interface SignUpPageProps {
  onSignUp: (data: { firstName: string; lastName: string; email: string; password: string }) => void
  onBackToLogin: () => void
  role?: "operator" | "manager"
}

export default function SignUpPage({ onSignUp, onBackToLogin, role = "operator" }: SignUpPageProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  // Validate email format
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value.trim())
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear previous errors
    setPasswordError("")
    setConfirmPasswordError("")
    setEmailError("")

    // Validate all required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return false
    }

    // Validate email
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return false
    }

    // Validate password length
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return false
    }

    // Validate password match
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      return false
    }

    setIsLoading(true)

    const result = await signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password,
      role: role,
    })

    setIsLoading(false)

    if (result.success && result.user) {
      toast.success("Your registration has been successful. Please wait for the administrator to approve.")
      // Navigate back to sign-in page after showing toast
      setTimeout(() => {
        // Call the callback for cleanup
        onSignUp({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password,
        })
        // Navigate back to auth screen
        onBackToLogin()
      }, 1500) // Wait 1.5 seconds to show the toast message
    } else {
      toast.error(result.error || "Failed to create account. Please try again.")
    }
    return false
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordError("")
    
    // Clear confirm password error if passwords match
    if (value === confirmPassword) {
      setConfirmPasswordError("")
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    // Validate match in real-time
    if (value && value !== password) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Sign Up</h1>
          <p className="text-text-secondary text-center mb-8">Create your account</p>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </Label>
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
              <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </Label>
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
              {password && !passwordError && password.length >= 6 && (
                <p className="text-xs text-emerald-600 mt-1">✓ Password is valid</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                className={confirmPasswordError ? "border-destructive" : ""}
              />
              {confirmPasswordError && (
                <p className="text-sm text-destructive mt-1">{confirmPasswordError}</p>
              )}
              {confirmPassword && !confirmPasswordError && confirmPassword === password && (
                <p className="text-xs text-emerald-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBackToLogin}
                className="w-full font-medium py-2"
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

