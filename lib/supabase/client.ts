import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * createClient (Browser)
 * 
 * This function should be used in React Client Components (files with 'use client').
 * It creates a Supabase client that safely accesses the session via browser cookies.
 */
export function createClient() {
  // Using the exclamation mark (!) asserts that these environment variables 
  // will be present at build/runtime. We will define them in a .env.local file.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}