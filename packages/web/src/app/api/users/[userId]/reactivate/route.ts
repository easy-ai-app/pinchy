import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { appendAuditLog } from "@/lib/audit";
import { getTenantId } from "@/lib/tenant-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  const { userId } = await params;

  const [reactivated] = await db
    .update(users)
    .set({ banned: false, banReason: null, banExpires: null })
    .where(and(eq(users.id, userId), eq(users.banned, true)))
    .returning();

  if (!reactivated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  appendAuditLog({
    actorType: "user",
    actorId: session.user.id!,
    eventType: "user.updated",
    resource: `user:${userId}`,
    detail: { changes: { status: { from: "deactivated", to: "active" } } },
    tenantId,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
