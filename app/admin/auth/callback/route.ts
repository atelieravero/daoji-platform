import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // We can pass a "next" parameter to know where to send them after validating
  const next = searchParams.get('next') ?? '/admin/setup-password';

  if (code) {
    const supabase = await createClient();
    // This exchanges the secure code for an actual session and sets the cookies!
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the code is invalid or expired, send them to login with an error
  return NextResponse.redirect(`${origin}/admin/login?error=Invalid_or_expired_link`);
}