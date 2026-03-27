// audit-exempt: User self-service action (linking own Telegram account), not an admin operation
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { resolvePairingCode } from "@/lib/telegram-pairing";
import { regenerateOpenClawConfig } from "@/lib/openclaw-config";
import { addToAllowStore, removeFromAllowStore } from "@/lib/telegram-allow-store";
import { db } from "@/db";
import { channelLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const link = await db.query.channelLinks.findFirst({
    where: and(
      eq(channelLinks.userId, session.user.id),
      eq(channelLinks.channel, "telegram"),
      eq(channelLinks.tenantId, tenantId)
    ),
  });

  return NextResponse.json({
    linked: !!link,
    channelUserId: link?.channelUserId ?? null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Pairing code is required" }, { status: 400 });
  }

  // Resolve pairing code to Telegram user ID by reading OpenClaw's pairing file
  const pairing = resolvePairingCode(code);
  if (!pairing.found) {
    return NextResponse.json(
      { error: "Invalid or expired pairing code. Send a new message to the bot and try again." },
      { status: 400 }
    );
  }

  const { telegramUserId } = pairing;

  // DB first (source of truth)
  await db.insert(channelLinks).values({
    userId: session.user.id,
    channel: "telegram",
    channelUserId: telegramUserId,
    tenantId,
  });

  // Add to OpenClaw's native allow-from store (no config change, no channel restart)
  addToAllowStore(telegramUserId);

  // Regenerate config for identityLinks (session unification) — does NOT trigger channel restart
  await regenerateOpenClawConfig();

  return NextResponse.json({ linked: true, telegramUserId });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  // Find the user's telegram ID before deleting
  const existingLink = await db.query.channelLinks.findFirst({
    where: and(
      eq(channelLinks.userId, session.user.id),
      eq(channelLinks.channel, "telegram"),
      eq(channelLinks.tenantId, tenantId)
    ),
  });

  await db
    .delete(channelLinks)
    .where(
      and(
        eq(channelLinks.userId, session.user.id),
        eq(channelLinks.channel, "telegram"),
        eq(channelLinks.tenantId, tenantId)
      )
    );

  // Remove from OpenClaw's native allow-from store (no config change, no channel restart)
  if (existingLink) {
    removeFromAllowStore(existingLink.channelUserId);
  }

  // Regenerate config to remove identityLinks
  await regenerateOpenClawConfig();

  return NextResponse.json({ linked: false });
}
