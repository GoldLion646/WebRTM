"use client"
import { useState } from "react"
import type { KeyboardEvent } from "react"
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
import { toast } from "sonner"
import type { User } from "@/lib/types"

interface DailyReportPageProps {
  user: User
  onLogout: () => void
}

interface SheetEntry {
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
}

export default function DailyReportPage({ user, onLogout }: DailyReportPageProps) {
  const [entries, setEntries] = useState<SheetEntry[]>(
    Array(1)
      .fill(null)
      .map((_, idx) => ({
        no: String(idx + 1),
        size: "",
        thickness: "",
        pcs: "",
        temp: "",
        pressure: "",
        load: "",
        unload: "",
        ph: "",
        remarks: "",
      })),
  )
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [hotPress, setHotPress] = useState("HP-1")
  const [shift, setShift] = useState<"Day" | "Night">("Day")
  const [saving, setSaving] = useState(false)

  const handleEntryChange = (index: number, field: keyof SheetEntry, value: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setEntries(newEntries)
  }

  const isRowEmpty = (entry: SheetEntry) =>
    [entry.size, entry.thickness, entry.pcs, entry.temp, entry.pressure, entry.load, entry.unload, entry.ph, entry.remarks].every(
      (v) => !v.trim(),
    )

  const handleRowKeyDown = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (event.key !== "ArrowDown") return
    const isLastRow = rowIndex === entries.length - 1
    const hasTrailingEmpty = entries.length > 0 && isRowEmpty(entries[entries.length - 1])
    if (isLastRow && !hasTrailingEmpty) {
      handleAddRow()
    }
  }

  const rowNavProps = (index: number) => ({
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => handleRowKeyDown(e, index),
  })

  const handleAddRow = () => {
    const nextNo = String(entries.length + 1)
    setEntries([
      ...entries,
      { no: nextNo, size: "", thickness: "", pcs: "", temp: "", pressure: "", load: "", unload: "", ph: "", remarks: "" },
    ])
  }

  const handleDeleteRow = (index: number) => {
    if (entries.length <= 1) return
    setEntries(
      entries
        .filter((_, idx) => idx !== index)
        .map((entry, idx) => ({
          ...entry,
          no: String(idx + 1),
        })),
    )
  }

  const handleSaveReport = async () => {
    const nonEmptyEntries = entries.filter((entry) => !isRowEmpty(entry))
    const payload = { date, entries: nonEmptyEntries, user }

    try {
      setSaving(true)
      const res = await fetch("/api/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save report")
      }

      toast.success("Daily report submitted successfully!", {
        description: "Report submitted and saved.",
      })
    } catch (err) {
      console.error("[daily-report] save error", err)
      toast.error("Could not save report", {
        description: "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Production Report</h1>
            <p className="text-text-secondary text-sm">Operator: {user.phone}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date and Filters Selection */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-date">Report Date</Label>
            <Input id="report-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hot-press">Hot Press</Label>
            <Select value={hotPress} onValueChange={setHotPress}>
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
            <Select value={shift} onValueChange={(value: "Day" | "Night") => setShift(value)}>
              <SelectTrigger id="shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Production Sheet Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">No.</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">SIZE</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">TCKNES</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">PCS</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Value</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">PRSRE</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">LOAD</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">UNLD</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">PH</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">REMARKS</th>
                  <th className="border border-border px-3 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-accent/5"}>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.no}
                        onChange={(e) => handleEntryChange(index, "no", e.target.value)}
                        placeholder={String(index + 1)}
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="text"
                        value={entry.size}
                        onChange={(e) => handleEntryChange(index, "size", e.target.value)}
                        placeholder="Size"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="text"
                        value={entry.thickness}
                        onChange={(e) => handleEntryChange(index, "thickness", e.target.value)}
                        placeholder="Thickness"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.pcs}
                        onChange={(e) => handleEntryChange(index, "pcs", e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.temp}
                        onChange={(e) => handleEntryChange(index, "temp", e.target.value)}
                        placeholder="°C"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.pressure}
                        onChange={(e) => handleEntryChange(index, "pressure", e.target.value)}
                        placeholder="PSI"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.load}
                        onChange={(e) => handleEntryChange(index, "load", e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="number"
                        value={entry.unload}
                        onChange={(e) => handleEntryChange(index, "unload", e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="text"
                        value={entry.ph}
                        onChange={(e) => handleEntryChange(index, "ph", e.target.value)}
                        placeholder="PH"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <input
                        type="text"
                        value={entry.remarks}
                        onChange={(e) => handleEntryChange(index, "remarks", e.target.value)}
                        placeholder="Remarks"
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:border-primary focus:outline-none"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRow(index)}
                        disabled={entries.length <= 1}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={handleAddRow}>
            + Add Row
          </Button>
          <Button variant="outline">Print Report</Button>
          <Button onClick={handleSaveReport} disabled={saving} className="bg-primary hover:bg-primary-dark text-white">
            {saving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </main>
    </div>
  )
}
