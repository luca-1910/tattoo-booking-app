import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google/auth";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/admin/settings?error=google`);
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(`${siteUrl}/admin/settings?connected=true`);
  } catch (err) {
    console.error("[google/callback] token exchange failed:", err);
    return NextResponse.redirect(`${siteUrl}/admin/settings?error=google`);
  }
}
