"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut } from "lucide-react"
import UserManagement from "@/components/user-management"
import PrintReports from "@/components/print-reports"
import OperatorAssignments from "@/components/operator-assignments"
import DailyProductionSummary from "@/components/daily-production-summary"
import MonthlyReport from "@/components/monthly-report"
import type { User, Metric } from "@/lib/types"

interface ManagerDashboardProps {
  user: User
  onLogout: () => void
  metrics: Metric[]
  onUserUpdate?: () => void
}

export default function ManagerDashboard({ user, onLogout, metrics, onUserUpdate }: ManagerDashboardProps) {
  const [selectedLine, setSelectedLine] = useState("all")
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [stats, setStats] = useState({
    totalMetrics: 0,
    avgQuality: 0,
    avgEfficiency: 0,
    totalOutput: 0,
  })

  // Restore active tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("rtmsManagerTab")
    if (savedTab) {
      setActiveTab(savedTab)
    }
  }, [])

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("rtmsManagerTab", activeTab)
  }, [activeTab])

  // Calculate statistics
  useEffect(() => {
    const filtered = selectedLine === "all" ? metrics : metrics.filter((m) => m.line === selectedLine)

    if (filtered.length > 0) {
      const avgQuality = (filtered.reduce((sum, m) => sum + m.quality, 0) / filtered.length).toFixed(1)
      const avgEfficiency = (filtered.reduce((sum, m) => sum + m.efficiency, 0) / filtered.length).toFixed(1)
      const totalOutput = filtered.reduce((sum, m) => sum + m.output, 0)

      setStats({
        totalMetrics: filtered.length,
        avgQuality: Number.parseFloat(avgQuality),
        avgEfficiency: Number.parseFloat(avgEfficiency),
        totalOutput,
      })
    }
  }, [metrics, selectedLine])

  const lines = ["all", ...new Set(metrics.map((m) => m.line))]
  const recentMetrics = metrics.slice(-10).reverse()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-text-secondary text-sm">Real-time monitoring - {user.phone}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2 px-4 py-2 border-destructive/60 text-destructive hover:text-destructive hover:border-destructive shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/80 rounded-xl p-1 flex flex-wrap gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Production Overview
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Operator Assignments
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Print Reports
            </TabsTrigger>
            <TabsTrigger
              value="daily-summary"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Daily Summary
            </TabsTrigger>
            <TabsTrigger
              value="monthly-report"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Monthly Report
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Line Filter */}
            <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
              {lines.map((line) => (
                <button
                  key={line}
                  onClick={() => setSelectedLine(line)}
                  className={`px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ${
                    selectedLine === line
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-text-secondary hover:border-primary"
                  }`}
                >
                  {line === "all" ? "All Lines" : line}
                </button>
              ))}
            </div>

            {/* KPI Cards */}
            {metrics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard label="Total Entries" value={stats.totalMetrics} unit="" color="primary" />
                <KPICard
                  label="Avg Quality"
                  value={stats.avgQuality}
                  unit="%"
                  color={stats.avgQuality >= 90 ? "accent" : "accent-alt"}
                />
                <KPICard
                  label="Avg Efficiency"
                  value={stats.avgEfficiency}
                  unit="%"
                  color={stats.avgEfficiency >= 85 ? "accent" : "accent-alt"}
                />
                <KPICard label="Total Output" value={stats.totalOutput} unit="units" color="primary" />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center mb-8">
                <p className="text-text-secondary">No data entries yet. Operators can submit metrics to see live data.</p>
              </div>
            )}

            {/* Recent Metrics Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Recent Metrics</h2>
              </div>

              {recentMetrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Time</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Line</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Widget</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Output</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Quality</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Efficiency</th>
                        <th className="px-6 py-3 text-left text-text-secondary font-medium">Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMetrics.map((metric) => (
                        <tr key={metric.id} className="border-b border-border hover:bg-background transition-colors">
                          <td className="px-6 py-3 text-foreground">{metric.timestamp.toLocaleTimeString()}</td>
                          <td className="px-6 py-3 text-foreground">{metric.line}</td>
                          <td className="px-6 py-3 text-foreground">{metric.widget}</td>
                          <td className="px-6 py-3 text-foreground">{metric.output}</td>
                          <td className="px-6 py-3">
                            <span className={metric.quality >= 90 ? "text-accent" : "text-accent-alt"}>
                              {metric.quality}%
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={metric.efficiency >= 85 ? "text-accent" : "text-accent-alt"}>
                              {metric.efficiency}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-text-secondary">{metric.operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-text-secondary">No entries to display</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <PrintReports />
          </TabsContent>

          <TabsContent value="daily-summary" className="space-y-6">
            <DailyProductionSummary />
          </TabsContent>

          <TabsContent value="monthly-report" className="space-y-6">
            <MonthlyReport />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <OperatorAssignments currentUser={user} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement currentUser={user} onUserUpdate={onUserUpdate} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function KPICard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: "primary" | "accent" | "accent-alt"
}) {
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    "accent-alt": "text-accent-alt",
  }

  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <p className="text-text-secondary text-sm mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
        <span className="text-lg">{unit}</span>
      </p>
    </div>
  )
}
