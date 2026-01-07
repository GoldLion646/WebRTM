import type { User } from "./types"

const USERS_STORAGE_KEY = "rtmsUsers"

const withDefaultStatus = (user: User): User => {
  if (user.status) return user
  return {
    ...user,
    status: user.role === "manager" ? "approved" : "pending",
  }
}

export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(USERS_STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed: User[] = JSON.parse(stored)
    return parsed.map((user) => withDefaultStatus(user))
  } catch {
    return []
  }
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return
  const userWithStatus = withDefaultStatus(user)
  const users = getAllUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)
  if (existingIndex >= 0) {
    users[existingIndex] = userWithStatus
  } else {
    users.push(userWithStatus)
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function deleteUser(userId: string): void {
  if (typeof window === "undefined") return
  const users = getAllUsers().filter((u) => u.id !== userId)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function getUserById(userId: string): User | null {
  const users = getAllUsers()
  return users.find((u) => u.id === userId) || null
}

export function updateUserRole(userId: string, role: "operator" | "manager"): void {
  const user = getUserById(userId)
  if (user) {
    user.role = role
    if (!user.status) {
      user.status = role === "manager" ? "approved" : "pending"
    }
    saveUser(user)
  }
}

export function updateUserStatus(userId: string, status: "pending" | "approved" | "blocked"): void {
  const user = getUserById(userId)
  if (user) {
    user.status = status
    saveUser(user)
  }
}

