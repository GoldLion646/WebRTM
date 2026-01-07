"use client"

import StockSummaryPage from "@/components/stock-summary-page"

export default function StockSummary() {
  const demoUser = { id: "demo", phone: "User", role: "manager" as const }
  return <StockSummaryPage user={demoUser} />
}

