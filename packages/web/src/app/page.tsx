import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { isSetupComplete, isProviderConfigured } from "@/lib/setup";
import { requireAuth } from "@/lib/require-auth";
import { getVisibleAgents } from "@/lib/visible-agents";
import { db } from "@/db";
import { tenantMembers, tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

const MOBILE_UA_PATTERN = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i;

export default async function Home() {
  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect("/setup");
  }

  const session = await requireAuth();

  const providerConfigured = await isProviderConfigured();
  if (!providerConfigured) {
    redirect("/setup/provider");
  }

  const userId = session.user.id;

  // Resolve tenantId from cookie or first membership
  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get("pinchy-tenant")?.value;

  let tenantId: string | null = cookieTenantId ?? null;
  if (!tenantId) {
    const [first] = await db
      .select({ tenantId: tenantMembers.tenantId })
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
      .where(and(eq(tenantMembers.userId, userId), isNull(tenants.deletedAt)))
      .limit(1);
    tenantId = first?.tenantId ?? null;
  }

  if (!tenantId) {
    redirect("/setup");
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "";
  const isMobile = MOBILE_UA_PATTERN.test(userAgent);

  if (!isMobile) {
    const userRole = session?.user?.role ?? "member";
    const visibleAgents = await getVisibleAgents(userId, userRole, tenantId);
    if (visibleAgents.length > 0) {
      redirect(`/chat/${visibleAgents[0].id}`);
    }
  }

  redirect("/agents");
}
