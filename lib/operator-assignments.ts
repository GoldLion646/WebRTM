export interface OperatorAssignment {
  id: string
  operatorId: string
  operatorPhone: string
  operatorName?: string
  hotPress: string
  shift: "Day" | "Night"
  date: string
  notes?: string
  assignedBy?: string
  createdAt: string
}

const ASSIGNMENT_STORAGE_KEY = "rtmsOperatorAssignments"

function safeParse<T>(value: string | null): T[] {
  if (!value) return []
  try {
    return JSON.parse(value) as T[]
  } catch {
    return []
  }
}

export function getAssignments(): OperatorAssignment[] {
  if (typeof window === "undefined") return []
  return safeParse<OperatorAssignment>(localStorage.getItem(ASSIGNMENT_STORAGE_KEY))
}

export function saveAssignment(data: Omit<OperatorAssignment, "id" | "createdAt">): OperatorAssignment {
  if (typeof window === "undefined") {
    return { ...data, id: "", createdAt: "" }
  }
  const assignments = getAssignments()
  const assignment: OperatorAssignment = {
    ...data,
    id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  assignments.push(assignment)
  localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments))
  return assignment
}

export function deleteAssignment(id: string) {
  if (typeof window === "undefined") return
  const assignments = getAssignments().filter((a) => a.id !== id)
  localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments))
}

export function getAssignmentsForOperator(operatorId: string, date?: string): OperatorAssignment[] {
  const list = getAssignments().filter((a) => a.operatorId === operatorId)
  if (date) {
    return list.filter((a) => a.date === date)
  }
  return list
}

