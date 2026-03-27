import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TenantsPageContent } from "@/components/tenants-page-content";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const { create } = await searchParams;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <TenantsPageContent openCreateDialog={create === "true"} currentUserId={session.user.id!} />
    </div>
  );
}
