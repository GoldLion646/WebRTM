"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import {
  getAllDailyReports,
  getAllDailySummaries,
  getReportsByFilters,
  getSummariesByFilters,
  getTotalDayReports,
  type DailyReport,
  type DailySummary,
} from "@/lib/report-storage"

export default function PrintReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedHotPress, setSelectedHotPress] = useState<string>("all")
  const [selectedShift, setSelectedShift] = useState<"Day" | "Night" | "all">("all")
  const [reportType, setReportType] = useState<"production" | "summary" | "total">("production")
  const [availableHotPresses, setAvailableHotPresses] = useState<string[]>([])

  useEffect(() => {
    // Get unique hot presses from reports and summaries
    const reports = getAllDailyReports()
    const summaries = getAllDailySummaries()
    const hotPresses = new Set<string>()
    
    reports.forEach((r) => {
      if (r.hotPress) hotPresses.add(r.hotPress)
    })
    summaries.forEach((s) => {
      if (s.hotPress) hotPresses.add(s.hotPress)
    })
    
    setAvailableHotPresses(Array.from(hotPresses).sort())
  }, [])

  const handlePrintProduction = () => {
    const filters: { date?: string; hotPress?: string; shift?: "Day" | "Night" } = {
      date: selectedDate,
    }
    if (selectedHotPress !== "all") filters.hotPress = selectedHotPress
    if (selectedShift !== "all") filters.shift = selectedShift

    const reports = getReportsByFilters(filters)
    if (reports.length === 0) {
      toast.error("No reports found", {
        description: "No production reports match the selected filters.",
      })
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = generateProductionReportHTML(reports, filters)
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handlePrintSummary = () => {
    const filters: { date?: string; hotPress?: string; shift?: "Day" | "Night" } = {
      date: selectedDate,
    }
    if (selectedHotPress !== "all") filters.hotPress = selectedHotPress
    if (selectedShift !== "all") filters.shift = selectedShift

    const summaries = getSummariesByFilters(filters)
    if (summaries.length === 0) {
      toast.error("No summaries found", {
        description: "No summary reports match the selected filters.",
      })
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = generateSummaryReportHTML(summaries, filters)
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handlePrintTotalDay = () => {
    const { reports, summaries } = getTotalDayReports(selectedDate)
    if (reports.length === 0 && summaries.length === 0) {
      toast.error("No reports found", {
        description: `No reports found for ${selectedDate}.`,
      })
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = generateTotalDayReportHTML(reports, summaries, selectedDate)
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handlePrint = () => {
    if (reportType === "production") {
      handlePrintProduction()
    } else if (reportType === "summary") {
      handlePrintSummary()
    } else {
      handlePrintTotalDay()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Print Reports</h2>
          <p className="text-text-secondary text-sm mt-1">Generate and print production reports</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={(value: "production" | "summary" | "total") => setReportType(value)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production Report</SelectItem>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="total">Total Day Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-date">Date</Label>
            <Input
              id="report-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {reportType !== "total" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="hot-press">Hot Press</Label>
                <Select value={selectedHotPress} onValueChange={setSelectedHotPress}>
                  <SelectTrigger id="hot-press">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hot Presses</SelectItem>
                    {availableHotPresses.map((hp) => (
                      <SelectItem key={hp} value={hp}>
                        {hp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select value={selectedShift} onValueChange={(value: "Day" | "Night" | "all") => setSelectedShift(value)}>
                  <SelectTrigger id="shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="Day">Day Shift</SelectItem>
                    <SelectItem value="Night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handlePrint} className="bg-primary text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>
    </div>
  )
}

function generateProductionReportHTML(reports: DailyReport[], filters: any): string {
  const title = `Production Report - ${filters.date || "All Dates"}`
  const subtitle = [
    filters.hotPress && filters.hotPress !== "all" ? `Hot Press: ${filters.hotPress}` : null,
    filters.shift && filters.shift !== "all" ? `Shift: ${filters.shift}` : null,
  ]
    .filter(Boolean)
    .join(" | ")

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>SIZE</th>
            <th>THICKNESS</th>
            <th>PCS</th>
            <th>TEMP</th>
            <th>PRESSURE</th>
            <th>LOAD</th>
            <th>UNLOAD</th>
            <th>PH</th>
            <th>REMARKS</th>
          </tr>
        </thead>
        <tbody>
  `

  reports.forEach((report) => {
    report.entries.forEach((entry) => {
      html += `
        <tr>
          <td>${entry.no}</td>
          <td>${entry.size}</td>
          <td>${entry.thickness}</td>
          <td>${entry.pcs}</td>
          <td>${entry.temp}</td>
          <td>${entry.pressure}</td>
          <td>${entry.load}</td>
          <td>${entry.unload}</td>
          <td>${entry.ph}</td>
          <td>${entry.remarks}</td>
        </tr>
      `
    })
  })

  html += `
        </tbody>
      </table>
      <div class="footer">
        <p>Total Reports: ${reports.length} | Total Entries: ${reports.reduce((sum, r) => sum + r.entries.length, 0)}</p>
      </div>
    </body>
    </html>
  `

  return html
}

function generateSummaryReportHTML(summaries: DailySummary[], filters: any): string {
  const title = `Summary Report - ${filters.date || "All Dates"}`
  const subtitle = [
    filters.hotPress && filters.hotPress !== "all" ? `Hot Press: ${filters.hotPress}` : null,
    filters.shift && filters.shift !== "all" ? `Shift: ${filters.shift}` : null,
  ]
    .filter(Boolean)
    .join(" | ")

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .section { margin-top: 30px; }
        .section h2 { font-size: 18px; margin-bottom: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
  `

  summaries.forEach((summary, idx) => {
    html += `
      <div class="section">
        <h2>Summary ${idx + 1} - ${summary.summaryInfo.date} (${summary.summaryInfo.shift})</h2>
        <table>
          <thead>
            <tr>
              <th>S. No.</th>
              <th>SIZE</th>
              <th>THINK</th>
              <th>PCS</th>
              <th>SOFT</th>
              <th>GLINE</th>
              <th>PANEL</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
    `
    summary.entries.forEach((entry) => {
      html += `
        <tr>
          <td>${entry.no}</td>
          <td>${entry.size}</td>
          <td>${entry.think}</td>
          <td>${entry.pcs}</td>
          <td>${entry.soft}</td>
          <td>${entry.gline}</td>
          <td>${entry.panel}</td>
          <td>${entry.remarks}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
      </div>
    `
  })

  html += `
      <div class="footer">
        <p>Total Summaries: ${summaries.length}</p>
      </div>
    </body>
    </html>
  `

  return html
}

function generateTotalDayReportHTML(reports: DailyReport[], summaries: DailySummary[], date: string): string {
  const title = `Total Day Report - ${date}`

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .section { margin-top: 30px; }
        .section h2 { font-size: 18px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .summary-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px; }
        .stat-box { border: 1px solid #000; padding: 15px; }
        .stat-box h3 { margin-top: 0; font-size: 16px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="summary-stats">
        <div class="stat-box">
          <h3>Production Reports</h3>
          <p>Total Reports: ${reports.length}</p>
          <p>Total Entries: ${reports.reduce((sum, r) => sum + r.entries.length, 0)}</p>
        </div>
        <div class="stat-box">
          <h3>Summary Reports</h3>
          <p>Total Summaries: ${summaries.length}</p>
        </div>
      </div>
  `

  if (reports.length > 0) {
    html += `
      <div class="section">
        <h2>Production Reports</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hot Press</th>
              <th>Shift</th>
              <th>Entries</th>
              <th>Operator</th>
            </tr>
          </thead>
          <tbody>
    `
    reports.forEach((report) => {
      html += `
        <tr>
          <td>${report.date}</td>
          <td>${report.hotPress || "N/A"}</td>
          <td>${report.shift || "N/A"}</td>
          <td>${report.entries.length}</td>
          <td>${report.user?.phone || "N/A"}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
      </div>
    `
  }

  if (summaries.length > 0) {
    html += `
      <div class="section">
        <h2>Summary Reports</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hot Press</th>
              <th>Shift</th>
              <th>Summary</th>
              <th>Operator</th>
            </tr>
          </thead>
          <tbody>
    `
    summaries.forEach((summary) => {
      html += `
        <tr>
          <td>${summary.summaryInfo.date}</td>
          <td>${summary.hotPress || "N/A"}</td>
          <td>${summary.summaryInfo.shift}</td>
          <td>${summary.summaryInfo.summary || "N/A"}</td>
          <td>${summary.user?.phone || "N/A"}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
      </div>
    `
  }

  html += `
      <div class="footer">
        <p>Report Date: ${date}</p>
      </div>
    </body>
    </html>
  `

  return html
}

