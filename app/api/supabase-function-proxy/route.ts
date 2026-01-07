import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: Request) {
  try {
    const { functionName, body } = await request.json()

    if (!functionName) {
      return NextResponse.json({ error: "Function name is required" }, { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: corsHeaders })
    }

    // Create Supabase client server-side
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Invoke the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
    })

    if (error) {
      console.error("Supabase function error:", error)
      return NextResponse.json(
        { error: error.message || "Function execution failed" },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch (error: any) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
