import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tenants, tenantMembers } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { requireTenantMember } from "@/lib/tenant-context";
import { appendAuditLog } from "@/lib/audit";
import { tenantContainerManager } from "@/lib/tenant-container-manager";

const TENANT_NAME_MAX_LENGTH = 100;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const userId = session.user.id!;

  // Require tenant membership with owner or admin role
  const memberResult = await requireTenantMember(tenantId, userId);
  if (memberResult instanceof NextResponse) return memberResult;
  if (memberResult.role !== "owner" && memberResult.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
    }
    if (name.length > TENANT_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${TENANT_NAME_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }
  }

  // Get existing tenant for audit diff
  const [existing] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

  if (!existing) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Build update
  const updates: { name?: string } = {};
  if (name !== undefined) updates.name = name.trim();

  const [updated] = await db
    .update(tenants)
    .set(updates)
    .where(eq(tenants.id, tenantId))
    .returning({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      createdAt: tenants.createdAt,
    });

  // Audit log
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (name !== undefined && name.trim() !== existing.name) {
    changes.name = { from: existing.name, to: name.trim() };
  }

  if (Object.keys(changes).length > 0) {
    appendAuditLog({
      actorType: "user",
      actorId: userId,
      eventType: "tenant.updated",
      resource: `tenant:${tenantId}`,
      detail: { changes },
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId } = await params;
  const userId = session.user.id!;

  // Require owner role
  const memberResult = await requireTenantMember(tenantId, userId);
  if (memberResult instanceof NextResponse) return memberResult;
  if (memberResult.role !== "owner") {
    return NextResponse.json(
      { error: "Only the tenant owner can delete a tenant" },
      { status: 403 }
    );
  }

  // Check that this is not the user's only tenant
  const [memberCount] = await db
    .select({ count: count() })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, userId));

  if (memberCount.count <= 1) {
    return NextResponse.json({ error: "Cannot delete your only tenant" }, { status: 400 });
  }

  // Get tenant for audit log
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Soft-delete: set deletedAt and status
  await db
    .update(tenants)
    .set({
      deletedAt: new Date(),
      status: "deleting",
    })
    .where(eq(tenants.id, tenantId));

  // Audit log
  appendAuditLog({
    actorType: "user",
    actorId: userId,
    eventType: "tenant.deleted",
    resource: `tenant:${tenantId}`,
    detail: { name: tenant.name },
  }).catch(() => {});

  // Kick off async deprovision (fire-and-forget)
  tenantContainerManager.deprovision(tenantId).catch((error) => {
    console.error(
      `[tenants] Deprovision failed for ${tenant.slug}:`,
      error instanceof Error ? error.message : error
    );
  });

  return NextResponse.json({ success: true });
}
