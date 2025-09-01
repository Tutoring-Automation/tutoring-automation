// @ts-nocheck

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  console.log('Auth callback: Processing session update');
  
  // Create an empty response we can mutate cookies on
  const response = NextResponse.json({ ok: true });

  // Re-create the server client, wiring cookies to request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // Read the event + session from the client
    const { event, session } = await request.json();
    console.log('Auth callback: Event:', event, 'Session exists:', !!session);

    // Persist or clear the cookie on the server
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await supabase.auth.setSession(session);
      console.log('Auth callback: Session set on server');
    }
    if (event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
      await supabase.auth.signOut();                      // revoke on Supabase
      
      // *** actively wipe the cookies ***
      // If you renamed the cookie prefix, update "sb-" accordingly.
      ['sb-access-token', 'sb-refresh-token'].forEach((name) => {
        response.cookies.set({
          name,
          value: '',
          path: '/',              // MUST match original cookie path
          maxAge: 0,              // delete immediately
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      });
      
      console.log('Auth callback: Session cleared on server');
    }
  } catch (error) {
    console.error('Auth callback: Error processing session:', error);
    return NextResponse.json({ error: 'Failed to process session' }, { status: 500 });
  }

  return response;
}

// When Supabase redirects the browser to this URL after email verification or OAuth,
// handle GET by taking the user into the app where the client-side listener will
// immediately redirect them to the appropriate dashboard based on their role.
export async function GET(request: NextRequest) {
  // Prepare redirect response we can mutate cookies on
  const redirectUrl = new URL('/', request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Create server client wired to this request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const code = new URL(request.url).searchParams.get('code');
    if (code) {
      // Exchange the verification code (or magic link) for a session and persist cookies
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch (e) {
    console.error('Auth callback GET: exchangeCodeForSession failed:', e);
  }

  return response;
}