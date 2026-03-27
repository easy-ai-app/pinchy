import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { requireAuth } from "@/lib/require-auth";
import { getVisibleAgents } from "@/lib/visible-agents";
import { db } from "@/db";
import { tenantMembers, tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { AgentsPageContent } from "./agents-page-content";

const MOBILE_UA_PATTERN = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i;

export default async function AgentsPage() {
  const session = await requireAuth();
  const userId = session.user.id;
  const userRole = session?.user?.role ?? "member";

  // Resolve tenantId from cookie or first membership
  const cookieStore = await cookies();
  let tenantId = cookieStore.get("pinchy-tenant")?.value ?? null;
  if (!tenantId) {
    const [first] = await db
      .select({ tenantId: tenantMembers.tenantId })
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
      .where(and(eq(tenantMembers.userId, userId), isNull(tenants.deletedAt)))
      .limit(1);
    tenantId = first?.tenantId ?? "default";
  }

  const visibleAgents = await getVisibleAgents(userId, userRole, tenantId);

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "";
  const isMobile = MOBILE_UA_PATTERN.test(userAgent);

  if (!isMobile && visibleAgents.length > 0) {
    redirect(`/chat/${visibleAgents[0].id}`);
  }

  return <AgentsPageContent agents={visibleAgents} />;
}
