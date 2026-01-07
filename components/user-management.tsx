"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Trash2, Edit, User as UserIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@/lib/types"
import { createClient } from "@/lib/supabase-client"

interface UserManagementProps {
  currentUser: User
  onUserUpdate?: () => void
}

export default function UserManagement({ currentUser, onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<"operator" | "manager">("operator")
  const [editStatus, setEditStatus] = useState<"pending" | "approved" | "blocked">("pending")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "blocked">("all")
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const supabase = createClient()
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching profiles:", error)
        toast.error("Failed to load users. Please try again.")
        return
      }

      // Map profiles (snake_case) to User type (camelCase)
      const mappedUsers: User[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        phone: profile.phone || "",
        role: profile.role || "operator",
        status: profile.status || (profile.role === "manager" ? "approved" : "pending"),
        firstName: profile.first_name || profile.firstName || undefined,
        lastName: profile.last_name || profile.lastName || undefined,
        birthDate: profile.birth_date || profile.birthDate || undefined,
      }))

      setUsers(mappedUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users. Please try again.")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setEditStatus(user.status || "pending")
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsUpdatingUser(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          role: editRole,
          status: editStatus,
        })
        .eq("id", selectedUser.id)

      if (error) {
        console.error("Error updating user:", error)
        toast.error("Failed to update user. Please try again.")
        return
      }

      // Reload users from Supabase
      await loadUsers()

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      onUserUpdate?.()

      toast.success("User details updated successfully!")
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user. Please try again.")
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    if (selectedUser.id === currentUser.id) {
      toast.error("You cannot delete your own account.")
      setIsDeleteDialogOpen(false)
      return
    }

    setIsDeletingUser(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id)

      if (error) {
        console.error("Error deleting user:", error)
        toast.error("Failed to delete user. Please try again.")
        return
      }

      // Reload users from Supabase
      await loadUsers()

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      onUserUpdate?.()

      toast.success("User deleted successfully!")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user. Please try again.")
    } finally {
      setIsDeletingUser(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const statusBadgeClass = (status: "pending" | "approved" | "blocked") => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700"
      case "blocked":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-amber-100 text-amber-700"
    }
  }

  const filteredUsers =
    statusFilter === "all"
      ? users
      : users.filter((u) => (u.status || "pending") === statusFilter)

  const sortedUsers = filteredUsers.slice().sort((a, b) => {
    if (a.role === b.role) return 0
    return a.role === "manager" ? -1 : 1
  })

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  const pendingOperators = users.filter(
    (u) => u.role === "operator" && (u.status || "pending") === "pending",
  ).length
  const approvedOperators = users.filter(
    (u) => u.role === "operator" && (u.status || "pending") === "approved",
  ).length
  const blockedOperators = users.filter(
    (u) => u.role === "operator" && (u.status || "pending") === "blocked",
  ).length

  const handleStatusSwitch = async (user: User, checked: boolean) => {
    if (user.role === "manager") return
    const newStatus: "approved" | "blocked" = checked ? "approved" : "blocked"

    setUpdatingStatusUserId(user.id)
    try {
      
    const supabase = createClient()
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", user.id)
    console.log("newStatus=>", newStatus);
    if (newStatus == "approved") {
      const { error } = await supabase.from("assignoperators").insert({
        profile_id: user.id,
        status_assign: "",
        end_time: ""
      });
      if (error) {
        console.error("Error assigning operator:", error)
        toast.error("Failed to assign operator. Please try again.")
        return
      }
    }

    if (error) {
      console.error("Error updating user status:", error)
      toast.error("Failed to update user status. Please try again.")
      return
    }

    // Reload users from Supabase
    await loadUsers()
    onUserUpdate?.()
    toast.success(`User ${newStatus === "approved" ? "approved" : "blocked"}.`)
  } catch (error) {
    console.error("Error updating user status:", error)
    toast.error("Failed to update user status. Please try again.")
  } finally {
    setUpdatingStatusUserId(null)
  }
}

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-text-secondary text-sm mt-1">Manage user permissions and accounts</p>
      </div>
      <div className="text-sm text-text-secondary">
        Total Users: <span className="font-semibold text-foreground">{users.length}</span>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1">
        <div
          className={`rounded-lg border p-4 transition-colors ${statusFilter === "pending" ? "border-amber-400 shadow-sm" : "border-amber-200"
            } bg-amber-50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-800">Pending</p>
              <p className="text-2xl font-semibold text-amber-900">{pendingOperators}</p>
              <p className="text-xs text-amber-700">Registered operators awaiting approval</p>
            </div>
            <Checkbox
              aria-label="Show pending operators"
              checked={statusFilter === "pending"}
              onCheckedChange={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
            />
          </div>
        </div>
        <div
          className={`rounded-lg border p-4 transition-colors ${statusFilter === "approved" ? "border-emerald-400 shadow-sm" : "border-emerald-200"
            } bg-emerald-50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-800">Approved</p>
              <p className="text-2xl font-semibold text-emerald-900">{approvedOperators}</p>
              <p className="text-xs text-emerald-700">Operators approved by manager</p>
            </div>
            <Checkbox
              aria-label="Show approved operators"
              checked={statusFilter === "approved"}
              onCheckedChange={() => setStatusFilter(statusFilter === "approved" ? "all" : "approved")}
            />
          </div>
        </div>
        <div
          className={`rounded-lg border p-4 transition-colors ${statusFilter === "blocked" ? "border-rose-400 shadow-sm" : "border-rose-200"
            } bg-rose-50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-800">Blocked</p>
              <p className="text-2xl font-semibold text-rose-900">{blockedOperators}</p>
              <p className="text-xs text-rose-700">Operators blocked by manager</p>
            </div>
            <Checkbox
              aria-label="Show blocked operators"
              checked={statusFilter === "blocked"}
              onCheckedChange={() => setStatusFilter(statusFilter === "blocked" ? "all" : "blocked")}
            />
          </div>
        </div>
      </div>
    </div>

    {isLoadingUsers && users.length === 0 ? (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Loader2 className="mx-auto h-12 w-12 text-text-secondary mb-4 animate-spin" />
        <p className="text-text-secondary">Loading users...</p>
      </div>
    ) : users.length === 0 ? (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <UserIcon className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <p className="text-text-secondary">No users found. Users will appear here after they sign up.</p>
      </div>
    ) : (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-32">Status Switch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user, idx) => (
                <TableRow
                  key={user.id}
                  className={user.role === "manager" ? "bg-primary/5" : undefined}
                >
                  <TableCell className="text-center text-sm text-text-secondary">
                    {startIndex + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {(() => {
                      const firstName = (user as any).firstName || (user as any).first_name || ""
                      const lastName = (user as any).lastName || (user as any).last_name || ""
                      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
                      return fullName || "N/A"
                    })()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${user.role === "manager"
                          ? "bg-primary/20 text-primary"
                          : "bg-accent/20 text-accent"
                        }`}
                    >
                      {user.role === "manager" ? "Manager" : "Operator"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        aria-label={`Toggle status for ${(() => {
                          const firstName = (user as any).firstName || (user as any).first_name || ""
                          const lastName = (user as any).lastName || (user as any).last_name || ""
                          return [firstName, lastName].filter(Boolean).join(" ").trim() || "user"
                        })()}`}
                        checked={(user.status || "pending") === "approved"}
                        disabled={user.role === "manager" || updatingStatusUserId === user.id}
                        onCheckedChange={(checked) => handleStatusSwitch(user, checked)}
                      />
                      {updatingStatusUserId === user.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "manager" ? (
                      <span className="text-xs text-text-secondary">-</span>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeClass(
                          user.status || "pending",
                        )}`}
                      >
                        {(user.status || "pending").replace(/^\w/, (c) => c.toUpperCase())}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                        className="h-8"
                        disabled={isLoadingUsers || updatingStatusUserId === user.id}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="h-8 text-destructive hover:text-destructive"
                        disabled={isLoadingUsers || updatingStatusUserId === user.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredUsers.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filteredUsers.length)}
              </span>{" "}
              of <span className="font-medium text-foreground">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || filteredUsers.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Edit Role & Status Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
          <DialogDescription>
            Change the role for {(() => {
              const firstName = (selectedUser as any)?.firstName || (selectedUser as any)?.first_name || ""
              const lastName = (selectedUser as any)?.lastName || (selectedUser as any)?.last_name || ""
              const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
              return fullName || "this user"
            })()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="text-sm text-text-secondary">
              {selectedUser?.role === "manager" ? "Manager" : "Operator"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-select">New Role</Label>
            <Select
              value={editRole}
              onValueChange={(value: "operator" | "manager") => setEditRole(value)}
              disabled={isUpdatingUser}
            >
              <SelectTrigger id="role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-select">Status</Label>
            <Select
              value={editStatus}
              onValueChange={(value: "pending" | "approved" | "blocked") => setEditStatus(value)}
              disabled={isUpdatingUser}
            >
              <SelectTrigger id="status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending (awaiting approval)</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(false)}
            disabled={isUpdatingUser}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateUser} disabled={isUpdatingUser}>
            {isUpdatingUser ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            {(() => {
              const firstName = (selectedUser as any)?.firstName || (selectedUser as any)?.first_name || ""
              const lastName = (selectedUser as any)?.lastName || (selectedUser as any)?.last_name || ""
              const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
              return fullName || "this user"
            })()}
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeletingUser}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingUser}>
            {isDeletingUser ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
)
}

