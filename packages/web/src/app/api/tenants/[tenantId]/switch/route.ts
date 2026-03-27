// audit-exempt: tenant switching is a preference change, not a state mutation
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { requireTenantMember } from "@/lib/tenant-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const userId = session.user.id!;

  // Verify the user is a member of this tenant
  const memberResult = await requireTenantMember(tenantId, userId);
  if (memberResult instanceof NextResponse) return memberResult;

  // Build response with Set-Cookie header
  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true, tenantId });
  response.cookies.set("pinchy-tenant", tenantId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
