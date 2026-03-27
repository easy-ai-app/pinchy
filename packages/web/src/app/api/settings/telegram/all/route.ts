import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { regenerateOpenClawConfig } from "@/lib/openclaw-config";
import { clearAllowStore } from "@/lib/telegram-allow-store";
import { appendAuditLog } from "@/lib/audit";
import { deleteSetting } from "@/lib/settings";
import { db } from "@/db";
import { channelLinks, settings } from "@/db/schema";
import { eq, like, and } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const tenantId = await getTenantId(request, admin.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  // Find all telegram bot token settings to know which agents to clean up
  const botTokenSettings = await db
    .select()
    .from(settings)
    .where(and(like(settings.key, "telegram_bot_token:%"), eq(settings.tenantId, tenantId)));

  // Delete all user channel links for telegram in this tenant
  await db
    .delete(channelLinks)
    .where(and(eq(channelLinks.channel, "telegram"), eq(channelLinks.tenantId, tenantId)));

  // Delete bot token and username settings for each agent
  for (const setting of botTokenSettings) {
    const agentId = setting.key.replace("telegram_bot_token:", "");
    await deleteSetting(`telegram_bot_token:${agentId}`, tenantId);
    await deleteSetting(`telegram_bot_username:${agentId}`, tenantId);
  }

  // Clear the allow-from store and regenerate config
  clearAllowStore();
  await regenerateOpenClawConfig();

  await appendAuditLog({
    actorType: "user",
    actorId: admin.user.id,
    eventType: "channel.deleted",
    resource: "settings:telegram",
    detail: {
      name: "telegram",
      channel: "telegram",
      scope: "all",
      botsRemoved: botTokenSettings.length,
    },
    tenantId,
  });

  return NextResponse.json({ removed: true });
}
