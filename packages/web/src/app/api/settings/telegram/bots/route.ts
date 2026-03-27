import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const userId = session.user.id;
  const allAgents = await db.query.agents.findMany({
    where: eq(agents.tenantId, tenantId),
  });

  // Filter agents the user can access
  const accessibleAgents = allAgents.filter((agent) => {
    if (!agent.isPersonal) return true;
    return agent.ownerId === userId;
  });

  // Find agents with configured Telegram bots
  const bots: { agentId: string; agentName: string; botUsername: string }[] = [];
  for (const agent of accessibleAgents) {
    const botUsername = await getSetting(`telegram_bot_username:${agent.id}`, tenantId);
    if (botUsername) {
      bots.push({
        agentId: agent.id,
        agentName: agent.name,
        botUsername,
      });
    }
  }

  return NextResponse.json({ bots });
}
