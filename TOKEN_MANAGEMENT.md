# Token Management Guide

## Overview

The token management system handles Supabase authentication tokens, including storage, retrieval, refresh, and cleanup.

## Token Manager API

### Store Tokens

```typescript
import { TokenManager } from "@/lib/token-manager"

// Store tokens after successful authentication
await TokenManager.storeTokens(accessToken, refreshToken, user)
```

### Get Tokens

```typescript
// Get access token
const accessToken = TokenManager.getAccessToken()

// Get refresh token
const refreshToken = TokenManager.getRefreshToken()

// Get stored user data
const user = TokenManager.getStoredUser()
```

### Clear Tokens

```typescript
// Clear all tokens (used on logout)
TokenManager.clearTokens()
```

### Refresh Token

```typescript
// Refresh expired access token
const newAccessToken = await TokenManager.refreshAccessToken()
```

### Get Current Session

```typescript
// Get current session and auto-refresh if needed
const session = await TokenManager.getCurrentSession()
if (session) {
  const { accessToken, user } = session
  // Use tokens...
}
```

### Ensure Valid Token

```typescript
// Get valid token, refreshing if expired
const token = await TokenManager.ensureValidToken()
```

## Auth Functions

### Sign Up

```typescript
import { signUp } from "@/lib/auth"

const result = await signUp({
  firstName: "John",
  lastName: "Doe",
  birthDate: "1990-01-01",
  phone: "+1234567890"
})

if (result.success) {
  // Tokens are automatically stored
  console.log("User created:", result.user)
}
```

### Login

```typescript
import { login } from "@/lib/auth"

const result = await login({
  email: "user@example.com", // or phone
  password: "password"
})

if (result.success) {
  // Tokens are automatically stored
  console.log("Logged in:", result.user)
}
```

### Logout

```typescript
import { logout } from "@/lib/auth"

// Clears Supabase session and all stored tokens
await logout()
```

### Get Current User

```typescript
import { getCurrentUser } from "@/lib/auth"

const user = await getCurrentUser()
if (user) {
  console.log("Current user:", user)
}
```

## Storage

Tokens are stored in localStorage with the following keys:
- `rtms_access_token` - Access token
- `rtms_refresh_token` - Refresh token  
- `rtms_auth_user` - User data (JSON stringified)

## Automatic Features

- **Auto-refresh**: Tokens are automatically refreshed when expired
- **Token validation**: Checks token expiration before use
- **Secure storage**: Tokens stored in browser localStorage
- **Cleanup**: All tokens cleared on logout

## Integration

The token manager is automatically integrated with:
- Sign up flow (`signUp` function)
- Login flow (`login` function)
- Logout flow (`logout` function)
- Session management (`getCurrentSession`)

You don't need to manually call token management functions in most cases - they're handled automatically by the auth functions.
