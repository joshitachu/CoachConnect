    // middleware.ts
    import { NextResponse } from "next/server"
    import type { NextRequest } from "next/server"
    import { verifySession } from "@/lib/auth"

    // Keep only pages that should be public when logged out
    const PUBLIC_PATHS = new Set<string>([
    // "/"  ← removed so root redirects to /login if unauthenticated
    "/login",
    "/signup",
    "/forgot-password",
    ])

    function isPublic(pathname: string) {
    if (PUBLIC_PATHS.has(pathname)) return true

    // Static assets & Next internals
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/assets")
    ) return true

    // Public API endpoints (allow login/logout and any explicitly public APIs)
    if (
        pathname.startsWith("/api/login") ||
        pathname.startsWith("/api/logout") ||
        pathname.startsWith("/api/public")
    ) return true

    // Any file with an extension: .css, .js, .png, .ico, .svg, .txt, etc.
    if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true

    return false
    }

    export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl

    // If it's not public, require a valid session
    if (!isPublic(pathname)) {
        const token = req.cookies.get("session")?.value
        if (!token) {
        const url = new URL("/login", req.url)
        url.searchParams.set("next", pathname + search)
        return NextResponse.redirect(url)
        }
        try {
        await verifySession(token)
        return NextResponse.next()
        } catch {
        const url = new URL("/login", req.url)
        url.searchParams.set("next", pathname + search)
        return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
    }

    // Apply to almost everything (excluding API/static/image helpers)
    export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    ],
    }
