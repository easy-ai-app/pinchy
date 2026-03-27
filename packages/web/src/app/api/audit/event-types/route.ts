import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const tenantId = await getTenantId(request, sessionOrError.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const rows = await db
    .selectDistinct({ eventType: auditLog.eventType })
    .from(auditLog)
    .where(eq(auditLog.tenantId, tenantId))
    .orderBy(asc(auditLog.eventType));

  return NextResponse.json({ eventTypes: rows.map((r) => r.eventType) });
}
