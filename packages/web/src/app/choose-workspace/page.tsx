import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/db";
import { tenants, tenantMembers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { WorkspacePicker } from "@/components/workspace-picker";

export default async function ChooseWorkspacePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get("pinchy-tenant")?.value;

  // Fetch user's tenants
  const userTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      role: tenantMembers.role,
    })
    .from(tenants)
    .innerJoin(
      tenantMembers,
      and(eq(tenantMembers.tenantId, tenants.id), eq(tenantMembers.userId, userId))
    )
    .where(isNull(tenants.deletedAt));

  // If cookie points to a valid (non-deleted) tenant, go straight to app
  if (cookieTenantId && userTenants.some((t) => t.id === cookieTenantId)) {
    redirect("/");
  }

  // Single tenant — no need to pick, let the app layout resolve it
  if (userTenants.length <= 1) {
    if (userTenants.length === 1) {
      redirect("/");
    }
    redirect("/setup");
  }

  return <WorkspacePicker tenants={userTenants} />;
}
