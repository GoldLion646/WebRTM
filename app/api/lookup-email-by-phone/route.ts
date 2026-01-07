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
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: corsHeaders })
    }

    // Use service role client to query auth.users (requires admin privileges)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Query auth.users to find email by phone number in user_metadata
    // Note: This requires admin access via service role key
    // Using pagination to get all users (default page size is 50, max 1000)
    let allUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000, // Maximum per page
      })

      if (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Failed to lookup email" }, { status: 500, headers: corsHeaders })
      }

      if (data?.users && data.users.length > 0) {
        allUsers = [...allUsers, ...data.users]
        // Check if there are more pages
        hasMore = data.users.length === 1000
        page++
      } else {
        hasMore = false
      }
    }

    // Normalize phone number for comparison (remove all non-digits)
    const normalizedPhone = phone.trim().replace(/\D/g, "")

    // Find user with matching phone in metadata
    const user = allUsers.find((u) => {
      const metadataPhone = u.user_metadata?.phone
      if (!metadataPhone) return false
      const normalizedMetadataPhone = metadataPhone.toString().trim().replace(/\D/g, "")
      return normalizedMetadataPhone === normalizedPhone
    })

    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found with this phone number" }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({ email: user.email }, { headers: corsHeaders })
  } catch (error: any) {
    console.error("Lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders })
  }
}
