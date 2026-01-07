# Application Routes & URLs

## Quick Reference - All Page URLs

### Main Application Pages

| URL | Page Name | Access | Description |
|-----|-----------|--------|-------------|
| `http://localhost:3000/` | **Login/Sign In** | Public | Email and password login page with role selection (Operator/Manager) |
| `http://localhost:3000/` | **Sign Up** | Public | User registration page (shown when clicking "Sign Up" button) |
| `http://localhost:3000/` | **Operator Dashboard - Quick Entry** | Protected (Operator) | Production metrics entry form (default view for operators) |
| `http://localhost:3000/` | **Operator Dashboard - Daily Report Sheet** | Protected (Operator) | Daily production report form (accessed via tab navigation) |
| `http://localhost:3000/` | **Operator Dashboard - Daily Summary** | Protected (Operator) | Daily summary sheet (accessed via tab navigation) |
| `http://localhost:3000/` | **Manager Dashboard** | Protected (Manager) | Manager dashboard with tabs: Production Overview, User Management, Production Metrics, Daily Reports, Daily Summary |
| `http://localhost:3000/daily-summary` | **Standalone Daily Summary** | Public (Demo) | Standalone Daily Summary page (uses demo user, not connected to auth) |

### API Endpoints

| URL | Method | Purpose |
|-----|--------|---------|
| `http://localhost:3000/api/daily-report` | POST | Handle daily report submissions |
| `http://localhost:3000/api/daily-summary` | POST | Handle daily summary submissions |
| `http://localhost:3000/api/lookup-email-by-phone` | POST | Look up user email by phone number (internal use) |
| `http://localhost:3000/api/supabase-function-proxy` | POST | Proxy for Supabase Edge Functions (internal use) |

---

## Detailed Route Information

### `/` (Root Route)
**File:** `app/page.tsx`

This is the main application route that renders different pages based on user authentication state:

#### When User is NOT Logged In:
- **URL:** `http://localhost:3000/`
- **Shows:** Auth Screen (Login page)
- **Components:** `AuthScreen`
- **Features:** 
  - Email and password login
  - Role selection (Operator/Manager)
  - Link to Sign Up page

#### Sign Up View (when `showSignUp` is true):
- **URL:** `http://localhost:3000/` (same route, different state)
- **Shows:** Sign Up Page
- **Components:** `SignUpPage`
- **Features:**
  - User registration form
  - First name, last name, email, password input
  - Role selection (Operator/Manager)
  - Redirects to Auth Screen after successful registration

#### When User is Logged In as OPERATOR:
- **URL:** `http://localhost:3000/` (same route, different state)
- **Shows:** Operator Dashboard with tab navigation
- **Components:** Tabs for different views:
  1. **Quick Entry** (default view)
     - Component: `OperatorDashboard`
     - Features: Production metrics entry form
  2. **Daily Report Sheet**
     - Component: `DailyReportPage`
     - Features: Daily production report form
  3. **Daily Summary**
     - Component: `DailySummaryPage`
     - Features: Daily summary sheet

#### When User is Logged In as MANAGER:
- **URL:** `http://localhost:3000/` (same route, different state)
- **Shows:** Manager Dashboard
- **Components:** `ManagerDashboard`
- **Tabs:**
  - Production Overview
  - User Management
  - Production Metrics
  - Daily Reports
  - Daily Summary
  - Operator Assignments

### `/daily-summary`
**File:** `app/daily-summary/page.tsx`

- **URL:** `http://localhost:3000/daily-summary`
- **Shows:** Standalone Daily Summary page
- **Components:** `DailySummaryPage`
- **Note:** This is a standalone route, uses demo user (not connected to auth)

---

## Summary

**Public Routes:**
- `/` - Auth Screen / Sign Up (when not logged in)

**Protected Routes (require authentication):**
- `/` - Operator Dashboard views (Quick Entry, Daily Report, Daily Summary)
- `/` - Manager Dashboard

**Standalone Routes:**
- `/daily-summary` - Standalone Daily Summary page (demo user)

**API Endpoints:**
- `/api/daily-report` (POST)
- `/api/daily-summary` (POST)
- `/api/lookup-email-by-phone` (POST)
- `/api/supabase-function-proxy` (POST)

---

## Note

The application uses **state-based routing** rather than URL-based routing for most views. The main route (`/`) conditionally renders different components based on:
1. User authentication status
2. User role (operator/manager)
3. Selected view/tab (for operators)

This means most navigation happens through React state changes rather than URL changes, except for the standalone `/daily-summary` route.
