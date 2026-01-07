"use client"

import { useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { User } from "@/lib/types"
import { saveDailySummary } from "@/lib/report-storage"

interface DailySummaryPageProps {
  user?: User
  onLogout?: () => void
}

interface SheetEntry {
  no: string
  size: string
  think: string
  pcs: string
  soft: string
  gline: string
  panel: string
  remarks: string
}

interface ChemicalReport {
  ezinUf: string
  ezinPf: string
  urea: string
  ammonia: string
  hardener: string
  melamine: string
  sp: string
}

interface VeneerReport {
  fullFace: string
  allFace: string
  tippingPanel: string
  tapingPanel: string
}

interface SummaryInfo {
  date: string
  shift: "Day" | "Night"
  summary: string
}

interface Notes {
  faceLine: string
  cav: string
  company: string
}

const emptyEntry: SheetEntry = { no: "", size: "", think: "", pcs: "", soft: "", gline: "", panel: "", remarks: "" }

export default function DailySummaryPage({ user, onLogout }: DailySummaryPageProps) {
  const initialEntries = useMemo(
    () =>
      Array.from({ length: 1 }, (_, idx) => ({
        ...emptyEntry,
        no: String(idx + 1),
      })),
    [],
  )

  const [entries, setEntries] = useState<SheetEntry[]>(initialEntries)
  const [saving, setSaving] = useState(false)
  const [hotPress, setHotPress] = useState("HP-1")
  const [summaryInfo, setSummaryInfo] = useState<SummaryInfo>({
    date: new Date().toISOString().split("T")[0],
    shift: "Day",
    summary: "",
  })
  const [chemicalReport, setChemicalReport] = useState<ChemicalReport>({
    ezinUf: "",
    ezinPf: "",
    urea: "",
    ammonia: "",
    hardener: "",
    melamine: "",
    sp: "",
  })
  const [veneerReport, setVeneerReport] = useState<VeneerReport>({
    fullFace: "",
    allFace: "",
    tippingPanel: "",
    tapingPanel: "",
  })
  const [notes, setNotes] = useState<Notes>({
    faceLine: "",
    cav: "",
    company: "",
  })

  const handleEntryChange = (index: number, field: keyof SheetEntry, value: string) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    setEntries(updated)
  }

  const handleAddRow = () => {
    const nextNo = String(entries.length + 1)
    setEntries([...entries, { ...emptyEntry, no: nextNo }])
  }

  const isRowEmpty = (entry: SheetEntry) =>
    [entry.size, entry.think, entry.pcs, entry.soft, entry.gline, entry.panel, entry.remarks].every((v) => !v.trim())

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

  const handleSaveReport = () => {
    const nonEmptyEntries = entries.filter((entry) => !isRowEmpty(entry))
    const payload = {
      summaryInfo,
      entries: nonEmptyEntries,
      chemicalReport,
      veneerReport,
      notes,
      user,
    }

    const save = async () => {
      try {
        setSaving(true)
        const res = await fetch("/api/daily-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Failed to save summary")
        }

        // Save to localStorage for printing
        saveDailySummary({
          summaryInfo,
          entries: nonEmptyEntries,
          chemicalReport,
          veneerReport,
          notes,
          user,
          hotPress,
        })

        toast.success("Daily summary submitted successfully!", {
          description: "Summary submitted and saved.",
        })
      } catch (err) {
        console.error("[daily-summary] save error", err)
        toast.error("Could not save summary", {
          description: "Please try again.",
        })
      } finally {
        setSaving(false)
      }
    }

    void save()
  }

  const displayUser = user ?? { phone: "Guest", id: "guest", role: "operator" as const }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Summary</h1>
            <p className="text-text-secondary text-sm">Operator: {displayUser.phone}</p>
          </div>
          {onLogout ? (
            <Button onClick={onLogout} variant="outline">
              Logout
            </Button>
          ) : null}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border border-border rounded-lg p-4 shadow">
          <div className="space-y-2">
            <Label htmlFor="summary-date">Date</Label>
            <Input
              id="summary-date"
              type="date"
              value={summaryInfo.date}
              onChange={(e) => setSummaryInfo({ ...summaryInfo, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary-shift">Shift</Label>
            <Select
              value={summaryInfo.shift}
              onValueChange={(value: "Day" | "Night") => setSummaryInfo({ ...summaryInfo, shift: value })}
            >
              <SelectTrigger id="summary-shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="summary-text">Summary</Label>
            <Input
              id="summary-text"
              placeholder="e.g. 15/10"
              value={summaryInfo.summary}
              onChange={(e) => setSummaryInfo({ ...summaryInfo, summary: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-white text-sm">
                  <th className="border border-border px-3 py-2 text-left font-semibold">S. No.</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">SIZE</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">THINK</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">PCS</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">SOFT</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">GLINE</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">PANEL</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">REMARKS</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-accent/5"}>
                    <td className="border border-border px-3 py-2">
                      <Input
                        type="text"
                        value={entry.no}
                        onChange={(e) => handleEntryChange(index, "no", e.target.value)}
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.size}
                        onChange={(e) => handleEntryChange(index, "size", e.target.value)}
                        placeholder="e.g. 4x8"
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.think}
                        onChange={(e) => handleEntryChange(index, "think", e.target.value)}
                        placeholder="e.g. 12mm"
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        type="number"
                        value={entry.pcs}
                        onChange={(e) => handleEntryChange(index, "pcs", e.target.value)}
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.soft}
                        onChange={(e) => handleEntryChange(index, "soft", e.target.value)}
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.gline}
                        onChange={(e) => handleEntryChange(index, "gline", e.target.value)}
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.panel}
                        onChange={(e) => handleEntryChange(index, "panel", e.target.value)}
                        className="text-sm"
                        {...rowNavProps(index)}
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={entry.remarks}
                        onChange={(e) => handleEntryChange(index, "remarks", e.target.value)}
                        placeholder="Remarks"
                        className="text-sm"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow space-y-3">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">F. Lam Face</h3>
            <Textarea
              value={notes.faceLine}
              onChange={(e) => setNotes({ ...notes, faceLine: e.target.value })}
              placeholder="e.g. B/L Face Lam, B/L Cuff..."
              className="min-h-[120px]"
            />
            <div className="space-y-2">
              <Label htmlFor="cav">CAV (calculated)</Label>
              <Input
                id="cav"
                value={notes.cav}
                onChange={(e) => setNotes({ ...notes, cav: e.target.value })}
                placeholder="e.g. 23.78"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow space-y-3">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Company / Remarks</h3>
            <Textarea
              value={notes.company}
              onChange={(e) => setNotes({ ...notes, company: e.target.value })}
              placeholder="Enter notes like loading plan, warm-up plates etc."
              className="min-h-[160px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow space-y-3">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Chemical Report</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ezin UF</Label>
                <Input value={chemicalReport.ezinUf} onChange={(e) => setChemicalReport({ ...chemicalReport, ezinUf: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ezin PF</Label>
                <Input value={chemicalReport.ezinPf} onChange={(e) => setChemicalReport({ ...chemicalReport, ezinPf: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Urea</Label>
                <Input value={chemicalReport.urea} onChange={(e) => setChemicalReport({ ...chemicalReport, urea: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ammonia</Label>
                <Input value={chemicalReport.ammonia} onChange={(e) => setChemicalReport({ ...chemicalReport, ammonia: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Hardener</Label>
                <Input value={chemicalReport.hardener} onChange={(e) => setChemicalReport({ ...chemicalReport, hardener: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Melamine</Label>
                <Input value={chemicalReport.melamine} onChange={(e) => setChemicalReport({ ...chemicalReport, melamine: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>SP</Label>
                <Input value={chemicalReport.sp} onChange={(e) => setChemicalReport({ ...chemicalReport, sp: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow space-y-3">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Base Veneer Report</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Full Face</Label>
                <Input value={veneerReport.fullFace} onChange={(e) => setVeneerReport({ ...veneerReport, fullFace: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>All Face</Label>
                <Input value={veneerReport.allFace} onChange={(e) => setVeneerReport({ ...veneerReport, allFace: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tipping Panel</Label>
                <Input value={veneerReport.tippingPanel} onChange={(e) => setVeneerReport({ ...veneerReport, tippingPanel: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Taping Panel</Label>
                <Input value={veneerReport.tapingPanel} onChange={(e) => setVeneerReport({ ...veneerReport, tapingPanel: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={handleAddRow}>
            + Add Row
          </Button>
          <Button variant="outline">Print</Button>
          <Button onClick={handleSaveReport} disabled={saving} className="bg-primary text-white hover:bg-primary/90">
            {saving ? "Saving..." : "Save Summary"}
          </Button>
        </div>
      </main>
    </div>
  )
}

