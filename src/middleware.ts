import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Keeps the admin's login session fresh so server-side checks stay reliable.
 *
 * This runs on every request, so it must never be able to break the site. If
 * anything at all goes wrong (bad key, Supabase unreachable, misconfigured
 * URL) we quietly carry on - the visitor still gets their birthday page.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
    const url = rawUrl.replace(/\/+$/, '');

    // Nothing to refresh, or the URL is not usable.
    if (!url || !key || !/^https?:\/\//i.test(url)) return response;

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    /* Session refresh is a nice-to-have, never a reason to fail the request. */
  }

  return response;
}

export const config = {
  matcher: ['/', '/admin'],
};
