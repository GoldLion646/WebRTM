export interface User {
  id: string
  phone: string
  role: "operator" | "manager"
  status?: "pending" | "approved" | "blocked"
  firstName?: string
  lastName?: string
  birthDate?: string
}

export interface Metric {
  id: string
  line: string
  widget: string
  output: number
  quality: number
  efficiency: number
  timestamp: Date
  operator?: string
}
