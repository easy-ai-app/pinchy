import { type NextRequest, NextResponse } from "next/server";
import { restartState } from "@/server/restart-state";
import { tenantContainerManager } from "@/lib/tenant-container-manager";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");

  // Per-tenant health check via Docker container inspection
  if (tenantId) {
    try {
      const health = await tenantContainerManager.healthCheck(tenantId);
      return NextResponse.json({
        status: health.running ? "healthy" : "unhealthy",
        tenantId,
      });
    } catch {
      return NextResponse.json({ status: "unhealthy", tenantId });
    }
  }

  // Global fallback (backward compatibility)
  if (restartState.isRestarting) {
    return NextResponse.json({ status: "restarting", since: restartState.triggeredAt });
  }
  return NextResponse.json({ status: "ok" });
}
