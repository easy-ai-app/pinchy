// audit-exempt: invite revocation is a cleanup action, the invite creation is already audited
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  const { inviteId } = await params;

  // Only delete invites belonging to the current tenant
  const deleted = await db
    .delete(invites)
    .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
