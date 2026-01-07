"use client"

import { useState, useEffect } from "react"
import AuthScreen from "@/components/auth-screen"
import SignUpPage from "@/components/sign-up-page"
import OperatorDashboard from "@/components/operator-dashboard"
import ManagerDashboard from "@/components/manager-dashboard"
import DailyReportPage from "@/components/daily-report-page"
import DailySummaryPage from "@/components/daily-summary-page"
import StockSummaryPage from "@/components/stock-summary-page"
import { Button } from "@/components/ui/button"
import type { User, Metric } from "@/lib/types"
import { saveUser, getUserById, getAllUsers } from "@/lib/user-storage"
import { logout as authLogout, login as authLogin } from "@/lib/auth"
import { TokenManager } from "@/lib/token-manager"
import { toast } from "sonner"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [view, setView] = useState<"metric" | "report" | "summary" | "stock">("metric")
  const [showSignUp, setShowSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"operator" | "manager">("operator")

  useEffect(() => {
    const savedUser = localStorage.getItem("rtmsUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      const hydratedUser: User = {
        ...parsedUser,
        status: parsedUser.status || (parsedUser.role === "manager" ? "approved" : "pending"),
      }
      setUser(hydratedUser)
      // Sync with user storage
      const storedUser = getUserById(parsedUser.id)
      if (storedUser) {
        setUser(storedUser)
      } else {
        saveUser(hydratedUser)
      }
    }

    // Restore saved view state
    const savedView = localStorage.getItem("rtmsCurrentView")
    if (savedView && (savedView === "metric" || savedView === "report" || savedView === "summary" || savedView === "stock")) {
      setView(savedView as "metric" | "report" | "summary" | "stock")
    }
  }, [])

  // Save view state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("rtmsCurrentView", view)
    }
  }, [view, user])

  const handleLogin = async (email: string, password: string, role: "operator" | "manager"): Promise<void> => {
    try {
      // Use Supabase authentication with email
      const result = await authLogin({
        email,
        password,
      })
      
      if (result.success && result.user) {
        // Managers bypass status check and can log in directly
        if (result.user.role === "manager") {
          saveUser(result.user)
          setUser(result.user)
          localStorage.setItem("rtmsUser", JSON.stringify(result.user))
          toast.success("Login successful!")
        } else if (result.user.role === "operator") {
          // Operators need to be approved
          if (result.user.status === "approved") {
            saveUser(result.user)
            setUser(result.user)
            localStorage.setItem("rtmsUser", JSON.stringify(result.user))
            setView("metric")
            toast.success("Login successful!")
          } else {
            toast.error("Account not approved yet. Please wait for administrator approval.")
          }
        }
    } else {
        // Login failed
        toast.error(result.error || "Login failed. Please check your credentials.")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("An error occurred during login. Please try again.")
    }
  }

  const handleSignUp = (data: { firstName: string; lastName: string; email: string; password: string }) => {
    // Don't automatically log in the user - they need to wait for administrator approval
    // The user is already created in Supabase via the signUp function
    // Just close the sign-up page and return to auth screen
    setShowSignUp(false)
  }

  const handleLogout = async () => {
    // Clear Supabase session and tokens
    await authLogout()
    // Clear local user data and view state
    setUser(null)
    localStorage.removeItem("rtmsUser")
    localStorage.removeItem("rtmsCurrentView")
    localStorage.removeItem("rtmsManagerTab")
  }

  const handleMetricSubmit = (metric: Metric) => {
    setMetrics([...metrics, { ...metric, id: Math.random().toString(), timestamp: new Date() }])
  }

  return (
    <main className="min-h-screen bg-background">
      {!user ? (
        showSignUp ? (
          <SignUpPage onSignUp={handleSignUp} onBackToLogin={() => setShowSignUp(false)} role={selectedRole} />
        ) : (
          <AuthScreen onLogin={handleLogin} onShowSignUp={(role) => { setSelectedRole(role); setShowSignUp(true) }} />
        )
      ) : user.role === "operator" ? (
        <>
          <div className="flex gap-2 p-4 bg-card border-b border-border">
            <Button
              variant={view === "metric" ? "default" : "outline"}
              onClick={() => setView("metric")}
              className="text-sm"
            >
              Quick Entry
            </Button>
            <Button
              variant={view === "report" ? "default" : "outline"}
              onClick={() => setView("report")}
              className="text-sm"
            >
              Daily Report Sheet
            </Button>
            <Button
              variant={view === "summary" ? "default" : "outline"}
              onClick={() => setView("summary")}
              className="text-sm"
            >
              Daily Summary
            </Button>
            <Button
              variant={view === "stock" ? "default" : "outline"}
              onClick={() => setView("stock")}
              className="text-sm"
            >
              Stock Summary
            </Button>
          </div>
          {view === "metric" ? (
            <OperatorDashboard user={user} onLogout={handleLogout} onSubmitMetric={handleMetricSubmit} />
          ) : view === "report" ? (
            <DailyReportPage user={user} onLogout={handleLogout} />
          ) : view === "summary" ? (
            <DailySummaryPage user={user} onLogout={handleLogout} />
          ) : (
            <StockSummaryPage user={user} onLogout={handleLogout} />
          )}
        </>
      ) : (
        <ManagerDashboard 
          user={user} 
          onLogout={handleLogout} 
          metrics={metrics}
          onUserUpdate={() => {
            // Refresh current user from storage if their role was changed
            if (user) {
              const updatedUser = getUserById(user.id)
              if (updatedUser && updatedUser.role !== user.role) {
                setUser(updatedUser)
                localStorage.setItem("rtmsUser", JSON.stringify(updatedUser))
              }
            }
          }}
        />
      )}
    </main>
  )
}
