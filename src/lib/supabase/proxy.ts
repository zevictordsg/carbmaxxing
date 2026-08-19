import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and applies
 * optimistic route protection (redirect logic based on cookie-only
 * checks). Called from proxy.ts.
 *
 * This is an OPTIMISTIC check only. Any Server Action or Route Handler
 * that reads/writes protected data must independently verify the user
 * via supabase.auth.getUser() -- see src/lib/supabase/server.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run any logic between createServerClient and
  // getUser(). A simple mistake here can make it very hard to debug
  // random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const authRoutes = ["/login", "/cadastro"];
  const protectedRoutes = ["/comunidade"];

  if (!user && protectedRoutes.some((route) => path.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && authRoutes.some((route) => path.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/comunidade";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
