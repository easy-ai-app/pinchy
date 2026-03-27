// audit-exempt: provider removal is a settings change, audit logging planned for a future PR
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { requireAdmin } from "@/lib/api-auth";
import { getSetting, setSetting, deleteSetting } from "@/lib/settings";
import { PROVIDERS, type ProviderName } from "@/lib/providers";
import { writeOpenClawConfig } from "@/lib/openclaw-config";
import { resetCache } from "@/lib/provider-models";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant-context";

const VALID_PROVIDERS = Object.keys(PROVIDERS) as ProviderName[];

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const isAdmin = session.user.role === "admin";
  const defaultProvider = await getSetting("default_provider", tenantId);

  const providers: Record<string, { configured: boolean; hint?: string }> = {};
  for (const [name, config] of Object.entries(PROVIDERS)) {
    const value = await getSetting(config.settingsKey, tenantId);
    providers[name] = {
      configured: value !== null,
      ...(value && isAdmin ? { hint: value.slice(-4) } : {}),
    };
  }

  return NextResponse.json({ defaultProvider, providers });
}

export async function DELETE(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const tenantId = await getTenantId(request, sessionOrError.user.id!);
  if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

  const body = await request.json();
  const provider = body.provider as ProviderName;

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const config = PROVIDERS[provider];

  // Count configured providers
  const configuredProviders: { name: ProviderName; config: typeof config }[] = [];
  for (const [name, providerConfig] of Object.entries(PROVIDERS)) {
    const value = await getSetting(providerConfig.settingsKey, tenantId);
    if (value !== null) {
      configuredProviders.push({
        name: name as ProviderName,
        config: providerConfig,
      });
    }
  }

  if (configuredProviders.length <= 1) {
    return NextResponse.json(
      {
        error: "Cannot remove the last configured provider. Add another provider first.",
      },
      { status: 400 }
    );
  }

  await deleteSetting(config.settingsKey, tenantId);
  resetCache();

  const remaining = configuredProviders.find((p) => p.name !== provider);
  if (remaining) {
    // Migrate all agents using the removed provider to the remaining provider's default model
    const allAgents = await db.query.agents.findMany({
      where: eq(agents.tenantId, tenantId),
    });
    const providerPrefix = `${provider}/`;
    for (const agent of allAgents) {
      if (agent.model?.startsWith(providerPrefix)) {
        await db
          .update(agents)
          .set({ model: remaining.config.defaultModel })
          .where(and(eq(agents.id, agent.id), eq(agents.tenantId, tenantId)));
      }
    }

    // If this was the default provider, switch default and update OpenClaw config
    const currentDefault = await getSetting("default_provider", tenantId);
    if (currentDefault === provider) {
      await setSetting("default_provider", remaining.name, false, tenantId);

      const newApiKey = await getSetting(remaining.config.settingsKey, tenantId);
      if (newApiKey) {
        writeOpenClawConfig({
          provider: remaining.name,
          apiKey: newApiKey,
          model: remaining.config.defaultModel,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
