import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { validateTelegramBotToken } from "@/lib/telegram";
import { getSetting, setSetting, deleteSetting } from "@/lib/settings";
import { appendAuditLog } from "@/lib/audit";
import { regenerateOpenClawConfig } from "@/lib/openclaw-config";
import { clearAllowStore } from "@/lib/telegram-allow-store";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const tenantId = await getTenantId(req, admin.user.id!);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const { agentId } = await params;

  // Verify agent belongs to tenant
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)),
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const botToken = await getSetting(`telegram_bot_token:${agentId}`, tenantId);
  if (!botToken) {
    return NextResponse.json({ configured: false });
  }

  const hint = botToken.slice(-4);
  return NextResponse.json({ configured: true, hint });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const tenantId = await getTenantId(req, admin.user.id!);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const { agentId } = await params;
  const { botToken } = await req.json();

  if (!botToken || typeof botToken !== "string") {
    return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
  }

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)),
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Validate token via Telegram API
  const validation = await validateTelegramBotToken(botToken);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // DB first (source of truth)
  await setSetting(`telegram_bot_token:${agentId}`, botToken, true, tenantId);
  await setSetting(`telegram_bot_username:${agentId}`, validation.botUsername!, false, tenantId);

  // Regenerate config file — OpenClaw detects the change and hot-reloads
  await regenerateOpenClawConfig();

  await appendAuditLog({
    actorType: "user",
    actorId: admin.user.id,
    eventType: "channel.created",
    resource: `agent:${agentId}`,
    detail: {
      agent: { id: agentId, name: agent.name },
      channel: "telegram",
      botUsername: validation.botUsername,
    },
    tenantId,
  });

  return NextResponse.json({
    botUsername: validation.botUsername,
    botId: validation.botId,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const tenantId = await getTenantId(req, admin.user.id!);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const { agentId } = await params;

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)),
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await deleteSetting(`telegram_bot_token:${agentId}`, tenantId);
  await deleteSetting(`telegram_bot_username:${agentId}`, tenantId);

  // Clear allow-from store and regenerate config (removes channel entirely)
  clearAllowStore();
  await regenerateOpenClawConfig();

  await appendAuditLog({
    actorType: "user",
    actorId: admin.user.id,
    eventType: "channel.deleted",
    resource: `agent:${agentId}`,
    detail: {
      name: `telegram:${agent.name}`,
      agent: { id: agentId, name: agent.name },
      channel: "telegram",
    },
    tenantId,
  });

  return NextResponse.json({ success: true });
}
