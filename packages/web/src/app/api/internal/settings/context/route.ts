// audit-exempt: internal endpoint called by OpenClaw plugin (Smithers), not a user-facing action
import { NextRequest, NextResponse } from "next/server";
import { validateGatewayToken } from "@/lib/gateway-auth";
import { setSetting } from "@/lib/settings";
import { syncOrgContextToWorkspaces } from "@/lib/context-sync";
import { resolveTenantByGatewayToken } from "@/lib/tenant-context";

export async function PUT(request: NextRequest) {
  if (!validateGatewayToken(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();

  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  const bearerToken = request.headers.get("Authorization")?.slice(7) ?? "";
  const tenantId = (await resolveTenantByGatewayToken(bearerToken)) ?? "default";

  await setSetting("org_context", content, false, tenantId);
  await syncOrgContextToWorkspaces();

  return NextResponse.json({ success: true, onboardingComplete: true });
}
