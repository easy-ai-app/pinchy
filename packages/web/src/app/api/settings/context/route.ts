// audit-exempt: org context editing is a content change, not a security-sensitive admin action
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { syncOrgContextToWorkspaces } from "@/lib/context-sync";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const content = await getSetting("org_context", tenantId);
  return NextResponse.json({ content: content ?? "" });
}

export async function PUT(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const { content } = await request.json();

  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  await setSetting("org_context", content, false, tenantId);

  await syncOrgContextToWorkspaces();

  return NextResponse.json({ success: true });
}
