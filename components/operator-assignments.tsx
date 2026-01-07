"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, UserCheck, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"
import {
  deleteAssignment,
  getAssignments,
  saveAssignment,
  type OperatorAssignment,
} from "@/lib/operator-assignments"
import type { User } from "@/lib/types"

export default function OperatorAssignments({ currentUser }: { currentUser: User }) {
  const [operators, setOperators] = useState<User[]>([])
  const [assignments, setAssignments] = useState<OperatorAssignment[]>([])

  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")
  const [hotPress, setHotPress] = useState("HP-1")
  const [shift, setShift] = useState<"Day" | "Night">("Day")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  
  // Loading states
  const [isLoadingOperators, setIsLoadingOperators] = useState(false)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isAddingAssignment, setIsAddingAssignment] = useState(false)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)

  useEffect(() => {
    loadOperators()
    loadAssignments()
  }, [])

  const loadOperators = async () => {
    setIsLoadingOperators(true)
    try {
      const supabase = createClient()
      
      // Fetch operators from assignoperators table where status_assign is empty (null or empty string)
      const { data: assignOperators, error: assignError } = await supabase
        .from("assignoperators")
        .select("profile_id, status_assign, profiles(*)")
        .or("status_assign.is.null,status_assign.eq.")

      if (assignError) {
        console.error("Error fetching assignoperators:", assignError)
        toast.error("Failed to load operators. Please try again.")
        return
      }

      // Map the data to User type and filter out null values
      const mappedOperators: User[] = (assignOperators || [])
        .filter((item: any) => {
          // Filter out items where status_assign is not empty (client-side filter as backup)
          const statusAssign = item.status_assign
          if (statusAssign !== null && statusAssign !== "" && statusAssign !== undefined) {
            return false
          }
          return item.profiles !== null && item.profiles !== undefined
        })
        .map((item: any) => {
          const profile = item.profiles
          if (!profile) return null

          return {
            id: profile.id,
            phone: profile.phone || "",
            role: profile.role || "operator",
            status: profile.status || "pending",
            firstName: profile.first_name || profile.firstName || undefined,
            lastName: profile.last_name || profile.lastName || undefined,
            birthDate: profile.birth_date || profile.birthDate || undefined,
          }
        })
        .filter((op): op is User => op !== null)

      setOperators(mappedOperators)
      if (mappedOperators.length > 0) {
        setSelectedOperatorId(mappedOperators[0].id)
      }
    } catch (error) {
      console.error("Error loading operators:", error)
      toast.error("Failed to load operators. Please try again.")
    } finally {
      setIsLoadingOperators(false)
    }
  }

  const loadAssignments = async () => {
    setIsLoadingAssignments(true)
    try {
      const supabase = createClient()
      
      // Fetch assignments from assignoperators table where status_assign == "assigned"
      const { data: assignedOperators, error: assignError } = await supabase
        .from("assignoperators")
        .select("profile_id, status_assign, work_type, work_place, note, date, profiles(*)")
        .eq("status_assign", "assigned")

      if (assignError) {
        console.error("Error fetching assignments:", assignError)
        toast.error("Failed to load assignments. Please try again.")
        return
      }

      // Map the data to OperatorAssignment type
      const mappedAssignments: OperatorAssignment[] = (assignedOperators || [])
        .filter((item: any) => item.profiles !== null && item.profiles !== undefined)
        .map((item: any) => {
          const profile = item.profiles
          const workPlace = item.work_place
          const hotPress = workPlace === "1" ? "HP-1" : workPlace === "2" ? "HP-2" : workPlace === "3" ? "HP-3" : "HP-4"
          const shift = item.work_type === "day" ? "Day" : "Night"
          const firstName = profile.first_name || profile.firstName || ""
          const lastName = profile.last_name || profile.lastName || ""
          const operatorName = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined
          
          return {
            id: item.profile_id, // Using profile_id as the id for now
            operatorId: item.profile_id,
            operatorPhone: profile.phone || "",
            operatorName: operatorName,
            hotPress: hotPress,
            shift: shift as "Day" | "Night",
            date: item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            notes: item.note || undefined,
            assignedBy: undefined, // Not stored in table
            createdAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          }
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      setAssignments(mappedAssignments)
    } catch (error) {
      console.error("Error loading assignments:", error)
      toast.error("Failed to load assignments. Please try again.")
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const selectedOperator = useMemo(
    () => operators.find((op) => op.id === selectedOperatorId),
    [operators, selectedOperatorId],
  )

  // Calculate assignment status based on shift and current time
  const getAssignmentStatus = (assignment: OperatorAssignment): "Done" | "Working" => {
    const now = new Date()
    const assignmentDate = new Date(assignment.date)
    
    if (assignment.shift === "Night") {
      // Night shift ends at 8 AM the next day
      const endTime = new Date(assignmentDate)
      endTime.setDate(endTime.getDate() + 1)
      endTime.setHours(8, 0, 0, 0)
      
      return now > endTime ? "Done" : "Working"
    } else {
      
      // Day shift ends at 8 PM the same day 
      const endTime = new Date(assignmentDate);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(20, 0, 0, 0) // 8 PM
      console.log(endTime);
      console.log(now);
      return now > endTime ? "Done" : "Working"
    }
  }

  const handleAdd = async () => {
    if (!selectedOperator) {
      toast.error("Please select an operator.")
      return
    }

    setIsAddingAssignment(true)
    try {
      // Save to localStorage (for backward compatibility)

      // Update assignoperators table in Supabase
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("assignoperators")
        .update({ 
          status_assign: "assigned",
          work_type: shift == "Day" ? "day" : "night",
          work_place: hotPress == "HP-1" ? "HP1" : hotPress == "HP-2" ? "HP2" : hotPress == "HP-3" ? "HP3" : "HP4",
          note: notes.trim() || "",
          date: new Date(date).toISOString(),
         })
        .eq("profile_id", selectedOperator.id)

      if (updateError) {
        console.error("Error updating assignoperators:", updateError)
        toast.error("Failed to update operator assignment. Please try again.")
        return
      }

      // Reload operators list to remove the assigned operator
      await loadOperators()
      // Reload assignments list to show the new assignment
      await loadAssignments()

      toast.success("Operator assigned successfully.")
      
      // Reset form
      setNotes("")
    } catch (error) {
      console.error("Error adding assignment:", error)
      toast.error("Failed to assign operator. Please try again.")
    } finally {
      setIsAddingAssignment(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingAssignmentId(id)
    try {
      const supabase = createClient()
      
      // Update assignoperators table to clear status_assign (set to empty string)
      const { error: updateError } = await supabase
        .from("assignoperators")
        .update({ 
          status_assign: "",
          work_type: null,
          work_place: null,
          note: null,
          date: null,
        })
        .eq("profile_id", id)

      if (updateError) {
        console.error("Error removing assignment:", updateError)
        toast.error("Failed to remove assignment. Please try again.")
        return
      }

      // Reload assignments list
      await loadAssignments()
      // Reload operators list to add the operator back to available list
      await loadOperators()

      toast.success("Assignment removed.")
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast.error("Failed to remove assignment. Please try again.")
    } finally {
      setDeletingAssignmentId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assign Operators</h2>
        <p className="text-text-secondary text-sm mt-1">Allot operators to hot presses per shift.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="op-select">Operator</Label>
              <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId} disabled={isLoadingOperators || isAddingAssignment}>
                <SelectTrigger id="op-select">
                  <SelectValue placeholder={isLoadingOperators ? "Loading operators..." : "Select operator"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingOperators ? (
                    <SelectItem value="loading" disabled>
                      Loading operators...
                    </SelectItem>
                  ) : operators.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No operators found
                    </SelectItem>
                  ) : (
                    operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {(op.firstName || op.lastName) ? `${op.firstName ?? ""} ${op.lastName ?? ""}`.trim() : op.phone}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hot-press">Hot Press</Label>
              <Select value={hotPress} onValueChange={setHotPress} disabled={isLoadingOperators || isAddingAssignment}>
                <SelectTrigger id="hot-press">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HP-1">HP-1</SelectItem>
                  <SelectItem value="HP-2">HP-2</SelectItem>
                  <SelectItem value="HP-3">HP-3</SelectItem>
                  <SelectItem value="HP-4">HP-4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={shift} onValueChange={(value: "Day" | "Night") => setShift(value)} disabled={isLoadingOperators || isAddingAssignment}>
                <SelectTrigger id="shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-date">Date</Label>
              <Input id="assign-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoadingOperators || isAddingAssignment} />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., stand-by, priority line"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoadingOperators || isAddingAssignment}
            />
          </div>

          <div className="mt-4">
            <Button onClick={handleAdd} className="bg-primary text-white" disabled={isLoadingOperators || isAddingAssignment}>
              {isAddingAssignment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Operator"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Assignments</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAssignments}
              disabled={isLoadingAssignments}
              className="h-8"
            >
              {isLoadingAssignments ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
              <span className="ml-2 text-text-secondary">Loading assignments...</span>
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-text-secondary text-sm">No assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Hot Press</th>
                    <th className="px-3 py-2 text-left">Shift</th>
                    <th className="px-3 py-2 text-left">Operator</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment)
                    return (
                      <tr key={assignment.id} className="border-t border-border">
                        <td className="px-3 py-2">{assignment.date}</td>
                        <td className="px-3 py-2">{assignment.hotPress}</td>
                        <td className="px-3 py-2">{assignment.shift}</td>
                        <td className="px-3 py-2">
                          {assignment.operatorName || assignment.operatorPhone}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              status === "Done"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{assignment.notes || "—"}</td>
                        <td className="px-3 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={deletingAssignmentId === assignment.id || isAddingAssignment}
                        >
                          {deletingAssignmentId === assignment.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

