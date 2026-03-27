import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, userGroups, groups, tenantMembers } from "@/db/schema";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const tenantId = await getTenantId(request, session.user.id);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  // Return only users who are members of the current tenant
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      banned: users.banned,
      tenantRole: tenantMembers.role,
    })
    .from(users)
    .innerJoin(
      tenantMembers,
      and(eq(tenantMembers.userId, users.id), eq(tenantMembers.tenantId, tenantId))
    );

  const allUserGroups = await db
    .select({
      userId: userGroups.userId,
      groupId: userGroups.groupId,
      groupName: groups.name,
    })
    .from(userGroups)
    .innerJoin(groups, eq(userGroups.groupId, groups.id));

  const usersWithGroups = allUsers.map((user) => ({
    ...user,
    groups: allUserGroups
      .filter((ug) => ug.userId === user.id)
      .map((ug) => ({ id: ug.groupId, name: ug.groupName })),
  }));

  return NextResponse.json({ users: usersWithGroups });
}
