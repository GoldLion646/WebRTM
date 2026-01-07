import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { summaryInfo, entries, chemicalReport, veneerReport, notes, user } = body || {}

    if (!summaryInfo?.date || !Array.isArray(entries)) {
      return NextResponse.json({ error: "summaryInfo.date and entries are required" }, { status: 400 })
    }

    const cleanedEntries = entries
      .filter((entry: any) => entry && Object.values(entry).some((v) => String(v ?? "").trim() !== ""))
      .map((entry: any, idx: number) => ({
        no: String(entry.no ?? idx + 1),
        size: String(entry.size ?? ""),
        think: String(entry.think ?? ""),
        pcs: String(entry.pcs ?? ""),
        soft: String(entry.soft ?? ""),
        gline: String(entry.gline ?? ""),
        panel: String(entry.panel ?? ""),
        remarks: String(entry.remarks ?? ""),
      }))

    // Supabase integration removed; return a success response without persistence.
    return NextResponse.json({
      ok: true,
      id: "no-db",
      message: "Supabase disabled; data not persisted.",
      echo: {
        summaryInfo,
        entries: cleanedEntries,
        chemicalReport: chemicalReport ?? {},
        veneerReport: veneerReport ?? {},
        notes: notes ?? {},
        user: user ? { id: user.id, phone: user.phone, role: user.role } : null,
      },
    })
  } catch (error) {
    console.error("[api/daily-summary] error", error)
    return NextResponse.json({ error: "Failed to save summary" }, { status: 500 })
  }
}

