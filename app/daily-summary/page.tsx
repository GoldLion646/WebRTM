"use client"

import DailySummaryPage from "@/components/daily-summary-page"

// Simple standalone page to view/edit the Daily Summary sheet.
// If you want to wire to auth, pass the logged-in user and logout handler down.
export default function DailySummary() {
  const demoUser = { id: "demo", phone: "Operator", role: "operator" as const }
  return <DailySummaryPage user={demoUser} />
}

