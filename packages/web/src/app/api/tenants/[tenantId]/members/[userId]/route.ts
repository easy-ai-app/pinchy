import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tenantMembers, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireTenantMember } from "@/lib/tenant-context";
import { appendAuditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ tenantId: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, userId: targetUserId } = await params;
  const actorUserId = session.user.id!;

  // Require owner or admin role
  const memberResult = await requireTenantMember(tenantId, actorUserId);
  if (memberResult instanceof NextResponse) return memberResult;
  if (memberResult.role !== "owner" && memberResult.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cannot remove yourself
  if (targetUserId === actorUserId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Check the target is actually a member
  const [targetMembership] = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, targetUserId)));

  if (!targetMembership) {
    return NextResponse.json({ error: "User is not a member of this tenant" }, { status: 404 });
  }

  // Cannot remove the owner
  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the tenant owner" }, { status: 400 });
  }

  // Get user name for audit log
  const [targetUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId));

  // Delete from tenantMembers
  await db
    .delete(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, targetUserId)));

  // Get updated member count
  const [{ count: memberCount }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(tenantMembers)
    .where(eq(tenantMembers.tenantId, tenantId));

  // Audit log
  appendAuditLog({
    actorType: "user",
    actorId: actorUserId,
    eventType: "tenant.members_updated",
    resource: `tenant:${tenantId}`,
    detail: {
      added: [],
      removed: [{ id: targetUserId, name: targetUser?.name ?? "unknown" }],
      memberCount,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, userId: targetUserId } = await params;
  const actorUserId = session.user.id!;

  // Require owner role only
  const memberResult = await requireTenantMember(tenantId, actorUserId);
  if (memberResult instanceof NextResponse) return memberResult;
  if (memberResult.role !== "owner") {
    return NextResponse.json(
      { error: "Only the tenant owner can change member roles" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { role } = body;

  // Validate role
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  // Cannot change own role
  if (targetUserId === actorUserId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Check the target is actually a member
  const [targetMembership] = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, targetUserId)));

  if (!targetMembership) {
    return NextResponse.json({ error: "User is not a member of this tenant" }, { status: 404 });
  }

  // Cannot change owner's role
  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
  }

  // No-op if role is the same
  if (targetMembership.role === role) {
    return NextResponse.json({ userId: targetUserId, tenantId, role });
  }

  // Update role
  await db
    .update(tenantMembers)
    .set({ role })
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, targetUserId)));

  // Get user name for audit log
  const [targetUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId));

  // Audit log
  appendAuditLog({
    actorType: "user",
    actorId: actorUserId,
    eventType: "tenant.members_updated",
    resource: `tenant:${tenantId}`,
    detail: {
      added: [],
      removed: [],
      memberCount: 0, // Not changing membership, just role
      roleChange: {
        user: { id: targetUserId, name: targetUser?.name ?? "unknown" },
        from: targetMembership.role,
        to: role,
      },
    },
  }).catch(() => {});

  return NextResponse.json({ userId: targetUserId, tenantId, role });
}
