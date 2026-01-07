# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details and wait for it to be created

## 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

For server-side operations (optional, for API routes):
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** Never commit `.env.local` to version control. It should already be in `.gitignore`.

## 4. Usage Examples

### Client-side (React Components)

```typescript
import { createClient } from "@/lib/supabase-client"

const supabase = createClient()

// Example: Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')
```

### Server-side (API Routes / Server Components)

```typescript
import { supabase } from "@/lib/supabase"

// Example: Insert data
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
```

## 5. Create Database Tables

You'll need to create tables in Supabase. Go to **SQL Editor** in your Supabase dashboard and run SQL commands to create your tables.

### Users Table (Required for Sign Up)

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'manager')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked')),
  first_name TEXT,
  last_name TEXT,
  birth_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for now (adjust based on your needs)
CREATE POLICY "Allow all operations" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**Note:** The sign-up page will automatically insert new users into this table when users click "Sign Up".

## 6. Test the Connection

Restart your development server after adding environment variables:

```bash
npm run dev
```

Check the browser console - you should not see Supabase warning messages if everything is configured correctly.
