import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, inviteGroups, groups } from "@/db/schema";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  // Filter invites by tenant
  const allInvites = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      type: invites.type,
      createdAt: invites.createdAt,
      expiresAt: invites.expiresAt,
      claimedAt: invites.claimedAt,
    })
    .from(invites)
    .where(eq(invites.tenantId, tenantId));

  const allInviteGroups = await db
    .select({
      inviteId: inviteGroups.inviteId,
      groupId: inviteGroups.groupId,
      groupName: groups.name,
    })
    .from(inviteGroups)
    .innerJoin(groups, eq(inviteGroups.groupId, groups.id));

  const invitesWithGroups = allInvites.map((invite) => ({
    ...invite,
    groups: allInviteGroups
      .filter((ig) => ig.inviteId === invite.id)
      .map((ig) => ({ id: ig.groupId, name: ig.groupName })),
  }));

  return NextResponse.json({ invites: invitesWithGroups });
}
