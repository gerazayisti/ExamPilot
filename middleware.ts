import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const pathname = request.nextUrl.pathname;

    // 1. Protect Dashboard Routes
    if (pathname.startsWith("/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Verify session validity
        const payload = await decrypt(session);
        if (!payload || !payload.expires || new Date(payload.expires) < new Date()) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // 2. Redirect authenticated users away from auth pages
    if (pathname === "/login" || pathname === "/register") {
        if (session) {
            const payload = await decrypt(session);
            if (payload) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register"],
};
