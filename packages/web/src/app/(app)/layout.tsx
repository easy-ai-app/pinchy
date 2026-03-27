import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq, and, isNull, count } from "drizzle-orm";
import { requireAuth } from "@/lib/require-auth";
import { isSetupComplete, isProviderConfigured } from "@/lib/setup";
import { getVisibleAgents } from "@/lib/visible-agents";
import { db } from "@/db";
import { tenants, tenantMembers } from "@/db/schema";
import { AppSidebar } from "@/components/sidebar";
import { AppShell } from "@/components/app-shell";
import { AgentsProvider } from "@/components/agents-provider";
import { TenantProvider, type Tenant } from "@/components/tenant-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { EnterpriseBanner } from "@/components/enterprise-banner";
import { DevToolbar } from "@/components/dev-toolbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const setupComplete = await isSetupComplete();
  if (!setupComplete) redirect("/setup");

  const session = await requireAuth();

  const providerConfigured = await isProviderConfigured();
  if (!providerConfigured) redirect("/setup/provider");

  const userId = session.user.id;
  const userRole = session.user.role ?? "member";

  // Fetch user's tenants with member counts
  const memberCountSq = db
    .select({
      tenantId: tenantMembers.tenantId,
      memberCount: count().as("member_count"),
    })
    .from(tenantMembers)
    .groupBy(tenantMembers.tenantId)
    .as("mc");

  const userTenants: Tenant[] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      errorMessage: tenants.errorMessage,
      createdAt: tenants.createdAt,
      role: tenantMembers.role,
      memberCount: memberCountSq.memberCount,
    })
    .from(tenants)
    .innerJoin(
      tenantMembers,
      and(eq(tenantMembers.tenantId, tenants.id), eq(tenantMembers.userId, userId))
    )
    .leftJoin(memberCountSq, eq(memberCountSq.tenantId, tenants.id))
    .where(isNull(tenants.deletedAt))
    .then((rows) =>
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        memberCount: Number(r.memberCount ?? 0),
      }))
    );

  // Resolve tenant ID from cookie or membership
  const cookieTenantId = cookieStore.get("pinchy-tenant")?.value;
  const tenantFromCookie = cookieTenantId ? userTenants.find((t) => t.id === cookieTenantId) : null;

  let tenantId: string;
  if (tenantFromCookie) {
    tenantId = tenantFromCookie.id;
  } else if (userTenants.length > 1) {
    redirect("/choose-workspace");
  } else if (userTenants.length === 1) {
    tenantId = userTenants[0].id;
  } else {
    redirect("/setup");
  }

  const visibleAgents = await getVisibleAgents(userId, userRole, tenantId);
  const isAdmin = userRole === "admin";

  return (
    <TenantProvider initialTenantId={tenantId} initialTenants={userTenants}>
      <AgentsProvider initialAgents={visibleAgents}>
        <SidebarProvider>
          <AppSidebar isAdmin={isAdmin} />
          <SidebarInset className="h-dvh overflow-hidden">
            <EnterpriseBanner isAdmin={isAdmin} />
            <AppShell isAdmin={isAdmin}>{children}</AppShell>
          </SidebarInset>
        </SidebarProvider>
        {process.env.NODE_ENV === "development" && <DevToolbar />}
      </AgentsProvider>
    </TenantProvider>
  );
}
