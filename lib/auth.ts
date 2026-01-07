import { createClient } from "@/lib/supabase-client"
import type { User } from "./types"
import { TokenManager } from "./token-manager"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
  role?: "operator" | "manager"
}

export interface SignUpResult {
  success: boolean
  user?: User
  error?: string
}

export interface LoginData {
  email?: string
  phone?: string
  password: string
}

export interface LoginResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * Login user with email/phone and password
 */
export async function login(data2: LoginData): Promise<LoginResult> {
  try {
    // Validate input
    if (!data2.password) {
      return {
        success: false,
        error: "Password is required.",
      }
    }

    if (!data2.email) {
      return {
        success: false,
        error: "Email is required.",
      }
    }

    const supabase = createClient()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data2.email.trim())) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      }
    }

    // Use email for login
    const email = data2.email.trim()

    // Login with email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: data2.password,
    })


    if (authError) {
      return {
        success: false,
        error: authError.message || "Invalid credentials. Please try again.",
      }
    }

    if (!authData.user || !authData.session) {
      return {
        success: false,
        error: "Login failed. No session data returned.",
      }
    }

    // Store tokens
    await TokenManager.storeTokens(
      authData.session.access_token,
      authData.session.refresh_token,
      authData.user,
    )

    // // Convert to our User type
    // const userMetadata = authData.user.user_metadata || {}
    // const user: User = {
    //   id: authData.user.id,
    //   phone: userMetadata.phone || data2.phone || "",
    //   role: (userMetadata.role as "operator" | "manager") || "operator",
    //   status: (userMetadata.status as "pending" | "approved" | "blocked") || "pending",
    //   firstName: userMetadata.first_name || undefined,
    //   lastName: userMetadata.last_name || undefined,
    //   birthDate: userMetadata.birth_date || undefined,
    // }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: profileError.message || "Error fetching profile.",
      }
    }


    if (profile.role === "manager") {
      console.log("Manager logged in");
      return {
        success: true,
        user: profile,
      }
    }else{
      switch (profile.status) {
        case "pending":
          console.log("Account not approved yet.");
          return {
            success: false,
            error: "Account not approved yet.",
          }
        case "approved":
          return {
            success: true,
            user: profile,
          }
        case "blocked":
          return {
            success: false,
            error: "Account blocked.",
          }
        default:
          return {
            success: false,
            error: "Invalid account status.",
          }
          break;
      }
    }

    


  } catch (error: any) {
    console.error("Login error:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred during login.",
    }
  }
}

/**
 * Logout user and clear tokens
 */
export async function logout(): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
    TokenManager.clearTokens()
  } catch (error) {
    console.error("Logout error:", error)
    // Clear tokens even if signOut fails
    TokenManager.clearTokens()
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await TokenManager.getCurrentSession()
    if (!session) return null

    const userMetadata = session.user.user_metadata || {}
    return {
      id: session.user.id,
      phone: userMetadata.phone || "",
      role: (userMetadata.role as "operator" | "manager") || "operator",
      status: (userMetadata.status as "pending" | "approved" | "blocked") || "pending",
      firstName: userMetadata.first_name || undefined,
      lastName: userMetadata.last_name || undefined,
      birthDate: userMetadata.birth_date || undefined,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Sign up a new user in Supabase
 * @param data User signup data
 * @returns SignUpResult with success status, user data, or error message
 */
export async function signUp(data: SignUpData): Promise<SignUpResult> {
  try {
    // Validate input data
    if (!data.firstName?.trim()) {
      return {
        success: false,
        error: "First name is required.",
      }
    }

    if (!data.lastName?.trim()) {
      return {
        success: false,
        error: "Last name is required.",
      }
    }

    if (!data.email?.trim()) {
      return {
        success: false,
        error: "Email is required.",
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      }
    }

    // Create Supabase client
    let supabase
    try {
      supabase = createClient()
    } catch (clientError: any) {
      // Handle Supabase configuration errors
      if (clientError?.message?.includes("Missing Supabase")) {
        return {
          success: false,
          error: "Supabase is not configured. Please set up your environment variables.",
        }
      }
      throw clientError // Re-throw unexpected client creation errors
    }
    // Validate password
    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
      }
    }

    // Create user in Supabase Authentication
    const email = data.email.trim()
    const password = data.password

    console.log("Signing up user with email:", email)

    // Try signup with full metadata first
    let authData: any = null
    let authError: any = null

    const { data: initialData, error: initialError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          role: data.role || "operator",
          status: "pending",
        },
      },
    })

    authData = initialData
    authError = initialError

    // If database error, try with minimal metadata
    if (authError && (authError.message?.includes("Database error") || authError.message?.includes("unexpected_failure") || authError.message?.includes("saving new user"))) {
      console.log("Database error detected, retrying with minimal metadata...")

      const { data: retryData, error: retryError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {},
        },
      })

      if (!retryError && retryData) {
        authData = retryData
        authError = null
        console.log("Signup successful with minimal metadata")
      } else {
        authError = retryError
        console.error("Retry signup also failed:", retryError)
      }
    }

    if (authError) {
      console.error("Supabase auth signup error:", {
        code: authError.status,
        message: authError.message,
        name: authError.name,
      })

      // Handle specific error codes
      if (authError.status === 422 || authError.message?.includes("already registered") || authError.message?.includes("already exists") || authError.message?.includes("User already registered")) {
        return {
          success: false,
          error: "Phone number already registered. Please login instead.",
        }
      }

      if (authError.message?.includes("Invalid email") || authError.message?.includes("email")) {
        return {
          success: false,
          error: "Invalid phone number format. Please check and try again.",
        }
      }

      // Network or connection errors
      if (authError.message?.includes("fetch") || authError.message?.includes("network")) {
        return {
          success: false,
          error: "Network error. Please check your connection and try again.",
        }
      }

      // Generic auth error
      return {
        success: false,
        error: authError.message || "Failed to create account. Please try again.",
      }
    }

    // Validate auth data
    if (!authData.user) {
      return {
        success: false,
        error: "Account creation failed. No user data returned.",
      }
    }

    // Store tokens if session is available
    if (authData.session && authData.user) {
      try {
        await TokenManager.storeTokens(
          authData.session.access_token,
          authData.session.refresh_token,
          authData.user,
        )
      } catch (tokenError) {
        console.error("Error storing tokens:", tokenError)
        // Continue even if token storage fails
      }
    }

    // Convert Supabase Auth user to our User type
    const userMetadata = authData.user.user_metadata || {}
    const user: User = {
      id: authData.user.id,
      phone: userMetadata.phone || "",
      role: (userMetadata.role as "operator" | "manager") || "operator",
      status: (userMetadata.status as "pending" | "approved" | "blocked") || "pending",
      firstName: userMetadata.first_name || data.firstName.trim(),
      lastName: userMetadata.last_name || data.lastName.trim(),
      birthDate: userMetadata.birth_date || undefined,
    }

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    // Handle unexpected errors
    console.error("Sign up unexpected error:", error)

    // Type errors
    if (error instanceof TypeError) {
      return {
        success: false,
        error: "An error occurred while processing your request. Please try again.",
      }
    }

    // Configuration errors
    if (error?.message?.includes("Missing Supabase") || error?.message?.includes("environment")) {
      return {
        success: false,
        error: "Supabase is not configured. Please set up your environment variables.",
      }
    }

    // Network errors
    if (error?.message?.includes("fetch") || error?.message?.includes("network") || error?.name === "NetworkError") {
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      }
    }

    // Timeout errors
    if (error?.message?.includes("timeout") || error?.name === "TimeoutError") {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      }
    }

    // Generic error fallback
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again later.",
    }
  }
}
