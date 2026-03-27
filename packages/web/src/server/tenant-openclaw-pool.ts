import { OpenClawClient } from "openclaw-node";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

const DEVICE_IDENTITY_PATH =
  process.env.DEVICE_IDENTITY_PATH || "/app/secrets/device-identity.json";

interface PoolEntry {
  client: OpenClawClient;
  lastUsed: number;
}

export class TenantOpenClawPool {
  private pool = new Map<string, PoolEntry>();
  private connecting = new Map<string, Promise<OpenClawClient | null>>();

  async getClient(tenantId: string): Promise<OpenClawClient | null> {
    // Check existing connected client
    const existing = this.pool.get(tenantId);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    // Deduplicate concurrent connection attempts
    const pending = this.connecting.get(tenantId);
    if (pending) return pending;

    const promise = this.connectToTenant(tenantId);
    this.connecting.set(tenantId, promise);
    try {
      return await promise;
    } finally {
      this.connecting.delete(tenantId);
    }
  }

  private async connectToTenant(tenantId: string): Promise<OpenClawClient | null> {
    // Look up tenant container info from DB
    const [tenant] = await db
      .select({
        id: tenants.id,
        slug: tenants.slug,
        status: tenants.status,
        gatewayToken: tenants.gatewayToken,
        containerName: tenants.containerName,
      })
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)));

    if (!tenant || tenant.status !== "running" || !tenant.gatewayToken) {
      return null;
    }

    const containerName = tenant.containerName || `pinchy-openclaw-${tenant.slug}`;
    const wsUrl = `ws://${containerName}:18789/ws`;
    const token = decrypt(tenant.gatewayToken);

    const client = new OpenClawClient({
      url: wsUrl,
      token,
      clientId: `pinchy-tenant-${tenantId}`,
      clientVersion: "0.1.0",
      scopes: ["operator.admin"],
      deviceIdentityPath: DEVICE_IDENTITY_PATH,
      autoReconnect: true,
      reconnectIntervalMs: 2000,
      maxReconnectAttempts: 10,
    });

    try {
      await client.connect();
      this.pool.set(tenantId, { client, lastUsed: Date.now() });
      console.log(`[openclaw-pool] Connected to tenant ${tenant.slug} at ${wsUrl}`);

      client.on("disconnected", () => {
        console.log(`[openclaw-pool] Disconnected from tenant ${tenant.slug}`);
        this.pool.delete(tenantId);
      });

      client.on("error", (err) => {
        console.error(`[openclaw-pool] Error for tenant ${tenant.slug}:`, err.message);
      });

      return client;
    } catch (err) {
      console.error(
        `[openclaw-pool] Failed to connect to tenant ${tenant.slug}:`,
        err instanceof Error ? err.message : err
      );
      return null;
    }
  }

  removeClient(tenantId: string): void {
    const entry = this.pool.get(tenantId);
    if (entry) {
      try {
        entry.client.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup
      }
      this.pool.delete(tenantId);
    }
  }

  getConnectedCount(): number {
    return this.pool.size;
  }
}

export const tenantOpenClawPool = new TenantOpenClawPool();
