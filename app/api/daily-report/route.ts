import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, entries, user } = body || {}

    if (!date || !Array.isArray(entries)) {
      return NextResponse.json({ error: "date and entries are required" }, { status: 400 })
    }

    const cleanedEntries = entries
      .filter((entry: any) => entry && Object.values(entry).some((v) => String(v ?? "").trim() !== ""))
      .map((entry: any, idx: number) => ({
        no: String(entry.no ?? idx + 1),
        size: String(entry.size ?? ""),
        thickness: String(entry.thickness ?? ""),
        pcs: String(entry.pcs ?? ""),
        temp: String(entry.temp ?? ""),
        pressure: String(entry.pressure ?? ""),
        load: String(entry.load ?? ""),
        unload: String(entry.unload ?? ""),
        ph: String(entry.ph ?? ""),
        remarks: String(entry.remarks ?? ""),
      }))

    // Supabase integration removed; return a success response without persistence.
    return NextResponse.json({
      ok: true,
      id: "no-db",
      message: "Supabase disabled; data not persisted.",
      echo: { date, entries: cleanedEntries, user: user ? { id: user.id, phone: user.phone, role: user.role } : null },
    })
  } catch (error) {
    console.error("[api/daily-report] error", error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}

