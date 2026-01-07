"use client"

import { createClient } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

const ACCESS_TOKEN_KEY = "rtms_access_token"
const REFRESH_TOKEN_KEY = "rtms_refresh_token"
const USER_KEY = "rtms_auth_user"

/**
 * Token Manager for Supabase Authentication
 * Handles token storage, retrieval, and management
 */
export class TokenManager {
  /**
   * Store authentication tokens and user data
   */
  static async storeTokens(accessToken: string, refreshToken: string, user: User): Promise<void> {
    try {
      if (typeof window === "undefined") return

      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error("Error storing tokens:", error)
      throw error
    }
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error("Error getting access token:", error)
      return null
    }
  }

  /**
   * Get stored refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error("Error getting refresh token:", error)
      return null
    }
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    if (typeof window === "undefined") return null
    try {
      const userStr = localStorage.getItem(USER_KEY)
      if (!userStr) return null
      return JSON.parse(userStr) as User
    } catch (error) {
      console.error("Error getting stored user:", error)
      return null
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  static clearTokens(): void {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error("Error clearing tokens:", error)
    }
  }

  /**
   * Check if user has valid tokens
   */
  static hasTokens(): boolean {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    return !!accessToken && !!refreshToken
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        console.warn("No refresh token available")
        return null
      }

      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error) {
        console.error("Error refreshing token:", error)
        this.clearTokens()
        return null
      }

      if (data.session && data.user) {
        await this.storeTokens(
          data.session.access_token,
          data.session.refresh_token,
          data.user,
        )
        return data.session.access_token
      }

      return null
    } catch (error) {
      console.error("Error refreshing access token:", error)
      this.clearTokens()
      return null
    }
  }

  /**
   * Get current session and update stored tokens
   */
  static async getCurrentSession(): Promise<{ accessToken: string; user: User } | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        // Try to refresh if we have a refresh token
        const refreshedToken = await this.refreshAccessToken()
        if (refreshedToken && data.user) {
          return {
            accessToken: refreshedToken,
            user: data.user,
          }
        }
        return null
      }

      // Store the session tokens
      if (data.session.access_token && data.session.refresh_token && data.user) {
        await this.storeTokens(
          data.session.access_token,
          data.session.refresh_token,
          data.user,
        )
      }

      return {
        accessToken: data.session.access_token,
        user: data.user,
      }
    } catch (error) {
      console.error("Error getting current session:", error)
      return null
    }
  }

  /**
   * Check if access token is expired (basic check)
   * Note: Supabase tokens contain expiration in JWT payload
   */
  static isTokenExpired(token: string | null): boolean {
    if (!token) return true

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]))
      const exp = payload.exp

      if (!exp) return true

      // Check if token is expired (with 5 minute buffer)
      const currentTime = Math.floor(Date.now() / 1000)
      return exp < currentTime - 300 // 5 minutes buffer
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return true
    }
  }

  /**
   * Validate and refresh token if needed
   */
  static async ensureValidToken(): Promise<string | null> {
    let accessToken = this.getAccessToken()

    // Check if token is expired or missing
    if (!accessToken || this.isTokenExpired(accessToken)) {
      console.log("Token expired or missing, refreshing...")
      accessToken = await this.refreshAccessToken()
    }

    return accessToken
  }
}
