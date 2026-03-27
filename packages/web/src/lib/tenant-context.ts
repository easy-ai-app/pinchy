import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenantMembers, tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Resolve the tenantId from the request.
 * Resolution order:
 *   1. X-Tenant-Id header (validated against membership if userId available)
 *   2. pinchy-tenant cookie (validated against membership if userId available)
 *   3. First tenantMembers row for the session user (deterministic order)
 * Returns null if no tenant found.
 */
export async function getTenantId(request: NextRequest, userId?: string): Promise<string | null> {
  // 1. X-Tenant-Id header
  const headerTenantId = request.headers.get("X-Tenant-Id");
  if (headerTenantId) {
    if (userId) {
      const valid = await validateTenantMembership(headerTenantId, userId);
      if (valid) return headerTenantId;
    } else {
      const exists = await validateTenantExists(headerTenantId);
      if (exists) return headerTenantId;
    }
  }

  // 2. pinchy-tenant cookie
  const cookieTenantId = request.cookies.get("pinchy-tenant")?.value;
  if (cookieTenantId) {
    if (userId) {
      const valid = await validateTenantMembership(cookieTenantId, userId);
      if (valid) return cookieTenantId;
    } else {
      const exists = await validateTenantExists(cookieTenantId);
      if (exists) return cookieTenantId;
    }
  }

  if (!userId) return null;

  // 3. First membership (deterministic order)
  const [membership] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
    .where(and(eq(tenantMembers.userId, userId), isNull(tenants.deletedAt)))
    .orderBy(tenantMembers.joinedAt)
    .limit(1);

  return membership?.tenantId ?? null;
}

async function validateTenantExists(tenantId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)));
  return !!row;
}

// Internal: check user is member AND tenant is not deleted
async function validateTenantMembership(tenantId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
    .where(
      and(
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.userId, userId),
        isNull(tenants.deletedAt)
      )
    );
  return !!row;
}

/**
 * Resolve tenantId from a raw cookie/header value + userId, without needing NextRequest.
 * Useful for WebSocket upgrade handlers where NextRequest is not available.
 * Resolution: validate hint against membership, else fall back to first membership.
 */
export async function resolveTenantId(
  tenantIdHint: string | undefined,
  userId: string
): Promise<string | null> {
  // 1. Validate hint against membership
  if (tenantIdHint) {
    const valid = await validateTenantMembership(tenantIdHint, userId);
    if (valid) return tenantIdHint;
  }

  // 2. Fall back to first membership
  const [membership] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
    .where(and(eq(tenantMembers.userId, userId), isNull(tenants.deletedAt)))
    .orderBy(tenantMembers.joinedAt)
    .limit(1);

  return membership?.tenantId ?? null;
}

/**
 * Require that a user is a member of the given tenant.
 * Returns the membership role or a 403 NextResponse.
 */
export async function requireTenantMember(
  tenantId: string,
  userId: string
): Promise<{ role: string } | NextResponse> {
  const [membership] = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
    .where(
      and(
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.userId, userId),
        isNull(tenants.deletedAt)
      )
    );

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this tenant" }, { status: 403 });
  }

  return { role: membership.role };
}
