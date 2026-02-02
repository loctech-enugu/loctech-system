// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROUTE_CONFIG = {
    protected: ["/dashboard/*", "/dashboard", "/api/*"],
    auth: [
        "/auth/login",
        "/auth/forgot-password",
        "/auth/register",
        "/api/auth/*",
    ],
    bypass: [
        "/_next",
        "/favicon.ico",
        "/images",
        "/assets",
        "/api/auth",
    ],
};

// Utility to match paths
function matchesPath(pathname: string, routes: string[]): boolean {
    return routes.some((route) => {
        if (route.endsWith("*")) {
            return pathname.startsWith(route.slice(0, -1));
        }
        return pathname === route;
    });
}

// Returns true if token is expired
function isTokenExpired(token: { [key: string]: unknown }): boolean {
    return typeof token.exp === "number" && Date.now() / 1000 > token.exp;
}

export async function proxy(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Skip static/bypass
    if (
        ROUTE_CONFIG.bypass.some((path) => pathname.startsWith(path)) ||
        pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)
    ) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = token && !isTokenExpired(token);

    // ✅ Protect API routes separately
    if (pathname.startsWith("/api")) {
        // Allow auth routes without authentication
        if (pathname.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        if (!isAuthenticated) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }


        return NextResponse.next();
    }

    // ✅ Protect app routes (/dashboard, etc.)
    if (matchesPath(pathname, ROUTE_CONFIG.protected)) {
        const redirectUrl = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

        const loginRedirect = NextResponse.redirect(
            new URL("/auth/login", req.url)
        );
        loginRedirect.cookies.set("redirect", redirectUrl);

        if (!isAuthenticated) return loginRedirect;

        if (pathname === "/") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

    }

    // ✅ Auth routes
    if (matchesPath(pathname, ROUTE_CONFIG.auth)) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
