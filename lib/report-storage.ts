export interface DailyReport {
  id: string
  date: string
  entries: Array<{
    no: string
    size: string
    thickness: string
    pcs: string
    temp: string
    pressure: string
    load: string
    unload: string
    ph: string
    remarks: string
  }>
  user?: {
    id: string
    phone: string
    role: string
  }
  hotPress?: string // Line/Hot Press identifier
  shift?: "Day" | "Night"
  createdAt: string
}

export interface DailySummary {
  id: string
  summaryInfo: {
    date: string
    shift: "Day" | "Night"
    summary: string
  }
  entries: Array<{
    no: string
    size: string
    think: string
    pcs: string
    soft: string
    gline: string
    panel: string
    remarks: string
  }>
  chemicalReport: {
    ezinUf: string
    ezinPf: string
    urea: string
    ammonia: string
    hardener: string
    melamine: string
    sp: string
  }
  veneerReport: {
    fullFace: string
    allFace: string
    tippingPanel: string
    tapingPanel: string
  }
  notes: {
    faceLine: string
    cav: string
    company: string
  }
  user?: {
    id: string
    phone: string
    role: string
  }
  hotPress?: string
  createdAt: string
}

const REPORTS_STORAGE_KEY = "rtmsReports"
const SUMMARIES_STORAGE_KEY = "rtmsSummaries"

export function saveDailyReport(report: Omit<DailyReport, "id" | "createdAt">): string {
  if (typeof window === "undefined") return ""
  const reports = getAllDailyReports()
  const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newReport: DailyReport = {
    ...report,
    id,
    createdAt: new Date().toISOString(),
  }
  reports.push(newReport)
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
  return id
}

export function saveDailySummary(summary: Omit<DailySummary, "id" | "createdAt">): string {
  if (typeof window === "undefined") return ""
  const summaries = getAllDailySummaries()
  const id = `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newSummary: DailySummary = {
    ...summary,
    id,
    createdAt: new Date().toISOString(),
  }
  summaries.push(newSummary)
  localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(summaries))
  return id
}

export function getAllDailyReports(): DailyReport[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(REPORTS_STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getAllDailySummaries(): DailySummary[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(SUMMARIES_STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getReportsByFilters(filters: {
  date?: string
  hotPress?: string
  shift?: "Day" | "Night"
}): DailyReport[] {
  const reports = getAllDailyReports()
  return reports.filter((report) => {
    if (filters.date && report.date !== filters.date) return false
    if (filters.hotPress && report.hotPress !== filters.hotPress) return false
    if (filters.shift && report.shift !== filters.shift) return false
    return true
  })
}

export function getSummariesByFilters(filters: {
  date?: string
  hotPress?: string
  shift?: "Day" | "Night"
}): DailySummary[] {
  const summaries = getAllDailySummaries()
  return summaries.filter((summary) => {
    if (filters.date && summary.summaryInfo.date !== filters.date) return false
    if (filters.hotPress && summary.hotPress !== filters.hotPress) return false
    if (filters.shift && summary.summaryInfo.shift !== filters.shift) return false
    return true
  })
}

export function getTotalDayReports(date: string): {
  reports: DailyReport[]
  summaries: DailySummary[]
} {
  return {
    reports: getReportsByFilters({ date }),
    summaries: getSummariesByFilters({ date }),
  }
}

