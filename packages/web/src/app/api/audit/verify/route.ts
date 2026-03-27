import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { verifyIntegrity } from "@/lib/audit";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const tenantId = await getTenantId(request, sessionOrError.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const url = new URL(request.url);
  const fromId = url.searchParams.get("fromId");
  const toId = url.searchParams.get("toId");

  const result = await verifyIntegrity(
    fromId ? parseInt(fromId) : undefined,
    toId ? parseInt(toId) : undefined,
    tenantId
  );

  return NextResponse.json(result);
}
