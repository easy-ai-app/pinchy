import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tenants, tenantMembers } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { appendAuditLog } from "@/lib/audit";
import { tenantContainerManager } from "@/lib/tenant-container-manager";

const TENANT_NAME_MAX_LENGTH = 100;

/**
 * Generate a URL-safe slug from a tenant name.
 * Deduplicates by appending -2, -3, etc. if the slug already exists.
 */
async function generateSlug(name: string): Promise<string> {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!base) {
    base = `tenant-${crypto.randomUUID().slice(0, 8)}`;
  }

  // Check if base slug exists
  const [existing] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.slug, base));

  if (!existing) return base;

  // Deduplicate with -2, -3, etc.
  let suffix = 2;
  while (true) {
    const candidate = `${base}-${suffix}`;
    const [dup] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, candidate));

    if (!dup) return candidate;
    suffix++;
  }
}

export async function GET() {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id!;

  // Join tenants with tenantMembers where userId matches
  // Filter out soft-deleted tenants
  const results = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      errorMessage: tenants.errorMessage,
      createdAt: tenants.createdAt,
      role: tenantMembers.role,
      memberCount: sql<number>`(
        SELECT COUNT(*)::int FROM tenant_members tm
        WHERE tm.tenant_id = ${tenants.id}
      )`,
    })
    .from(tenants)
    .innerJoin(
      tenantMembers,
      and(eq(tenantMembers.tenantId, tenants.id), eq(tenantMembers.userId, userId))
    )
    .where(isNull(tenants.deletedAt));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (name.length > TENANT_NAME_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Name must be ${TENANT_NAME_MAX_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  const userId = session.user.id!;
  const slug = await generateSlug(name.trim());

  // Insert tenant (with slug collision retry)
  let tenant;
  try {
    [tenant] = await db
      .insert(tenants)
      .values({ name: name.trim(), slug, ownerId: userId, status: "provisioning" })
      .returning();
  } catch (error: unknown) {
    // Handle slug collision (concurrent request got same slug)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      const retrySlug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
      [tenant] = await db
        .insert(tenants)
        .values({ name: name.trim(), slug: retrySlug, ownerId: userId, status: "provisioning" })
        .returning();
    } else {
      throw error;
    }
  }

  // Insert tenant member with owner role
  await db.insert(tenantMembers).values({
    tenantId: tenant.id,
    userId,
    role: "owner",
  });

  // Audit log
  appendAuditLog({
    actorType: "user",
    actorId: userId,
    eventType: "tenant.created",
    resource: `tenant:${tenant.id}`,
    detail: { id: tenant.id, name: tenant.name, slug: tenant.slug },
  }).catch(() => {});

  // Kick off async provisioning (fire-and-forget)
  tenantContainerManager.provision({ id: tenant.id, slug: tenant.slug }).catch((error) => {
    console.error(
      `[tenants] Provisioning failed for ${tenant.slug}:`,
      error instanceof Error ? error.message : error
    );
  });

  return NextResponse.json(tenant, { status: 201 });
}
