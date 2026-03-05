// Proxy session and route guard logic for Supabase Auth
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  FEATURE_COOKIE_NAME,
  getFallbackRoute,
  parseFeatureFlags,
} from '@/lib/config/feature-flags'
import { MODULE_COOKIE_NAME, parseModuleState } from '@/lib/config/modules'
import { deployment } from '@/lib/config/deployment'
import { getDemoUserId, isDemoSupabaseEnabled } from './demo-client'

const isLocalReaderRoute = (pathname: string) =>
  pathname === "/" ||
  pathname.startsWith("/book/") ||
  pathname.startsWith("/read/") ||
  pathname.startsWith("/authors") ||
  pathname.startsWith("/series");

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const demoMode = isDemoSupabaseEnabled()
  let user: { id: string } | null = demoMode ? { id: getDemoUserId() } : null
  let appRole = "member"

  if (!demoMode) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser ? { id: authUser.id } : null

    if (deployment.isSelfHosted && user) {
      const roleResult = await supabase.rpc("bootstrap_user_role", {
        p_user_id: user.id,
      });
      if (!roleResult.error && typeof roleResult.data === "string") {
        appRole = roleResult.data;
      }
    }
  } else if (deployment.isSelfHosted) {
    appRole = "admin"
  }

  const cookieValue = request.cookies.get(FEATURE_COOKIE_NAME)?.value || null;
  const featureFlags = parseFeatureFlags(cookieValue);
  const moduleCookieValue = request.cookies.get(MODULE_COOKIE_NAME)?.value || null;
  const moduleState = parseModuleState(moduleCookieValue);
  const pathname = request.nextUrl.pathname;

  const redirectToFallback = () => {
    const fallbackPath = getFallbackRoute(featureFlags);
    if (pathname === fallbackPath) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = fallbackPath;
    return NextResponse.redirect(url);
  };

  if (pathname === "/" && !featureFlags.enableLocalReader) {
    return redirectToFallback();
  }

  if (isLocalReaderRoute(pathname) && !featureFlags.enableLocalReader) {
    return redirectToFallback();
  }

  if (pathname.startsWith("/tracker") && !featureFlags.enableProgressTracker) {
    return redirectToFallback();
  }

  if (pathname.startsWith("/discover") && !featureFlags.enableOpdsDiscover) {
    return redirectToFallback();
  }

  if (pathname.startsWith("/modules")) {
    if (!deployment.isSelfHosted) {
      return redirectToFallback();
    }
    if (!user || appRole !== "admin") {
      return redirectToFallback();
    }
  }

  if (pathname.startsWith("/account") && !moduleState.enabled.account_center) {
    const url = request.nextUrl.clone();
    url.pathname = "/settings";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/aliases")) {
    if (!featureFlags.enableLocalReader) {
      return redirectToFallback();
    }
    if (!moduleState.enabled.alias_resolution) {
      const url = request.nextUrl.clone();
      url.pathname = "/settings";
      return NextResponse.redirect(url);
    }
    if (!moduleState.enabled.community_alias_review) {
      const url = request.nextUrl.clone();
      url.pathname = "/settings";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse
}
