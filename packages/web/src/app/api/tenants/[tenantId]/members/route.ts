import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tenantMembers, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireTenantMember } from "@/lib/tenant-context";
import { appendAuditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const userId = session.user.id!;

  // Require tenant membership
  const memberResult = await requireTenantMember(tenantId, userId);
  if (memberResult instanceof NextResponse) return memberResult;

  // List all members with user info
  const members = await db
    .select({
      userId: tenantMembers.userId,
      role: tenantMembers.role,
      joinedAt: tenantMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(tenantMembers)
    .innerJoin(users, eq(users.id, tenantMembers.userId))
    .where(eq(tenantMembers.tenantId, tenantId));

  return NextResponse.json(members);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const actorUserId = session.user.id!;

  // Require owner or admin role
  const memberResult = await requireTenantMember(tenantId, actorUserId);
  if (memberResult instanceof NextResponse) return memberResult;
  if (memberResult.role !== "owner" && memberResult.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body;

  // Validate input
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  // Check if user exists
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)));

  if (existing) {
    return NextResponse.json({ error: "User is already a member of this tenant" }, { status: 409 });
  }

  // Insert member
  await db.insert(tenantMembers).values({
    tenantId,
    userId,
    role,
  });

  // Query actual member count after insert
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
    tenantId,
    detail: {
      added: [{ id: userId, name: user.name }],
      removed: [],
      memberCount,
    },
  }).catch(() => {});

  return NextResponse.json({ userId, tenantId, role }, { status: 201 });
}
