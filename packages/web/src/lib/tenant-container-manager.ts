import Docker from "dockerode";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";

const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || "pinchy-openclaw";
const DOCKER_NETWORK = process.env.DOCKER_NETWORK || "pinchy_default";
const MEMORY_LIMIT = parseInt(process.env.TENANT_MEMORY_LIMIT || "536870912", 10); // 512MB
const CPU_LIMIT = parseFloat(process.env.TENANT_CPU_LIMIT || "0.5");
const GATEWAY_TOKEN_POLL_INTERVAL_MS = 1000;
const GATEWAY_TOKEN_MAX_WAIT_MS = 60000;

export class TenantContainerManager {
  private docker: Docker;

  constructor(docker?: Docker) {
    this.docker = docker ?? new Docker({ socketPath: "/var/run/docker.sock" });
  }

  /**
   * Provision a new OpenClaw container for the given tenant.
   * Creates Docker volumes, starts the container, waits for the gateway token,
   * encrypts it, and updates the tenant row.
   * Containers communicate via Docker network using the fixed internal port.
   */
  async provision(tenant: { id: string; slug: string }): Promise<void> {
    const containerName = `pinchy-openclaw-${tenant.slug}`;
    const volumePrefix = `pinchy-oc`;

    const volumeNames = {
      config: `${volumePrefix}-config-${tenant.slug}`,
      workspaces: `${volumePrefix}-workspaces-${tenant.slug}`,
      extensions: `${volumePrefix}-extensions-${tenant.slug}`,
      data: `${volumePrefix}-data-${tenant.slug}`,
    };

    try {
      // Create volumes
      for (const name of Object.values(volumeNames)) {
        await this.docker.createVolume({ Name: name });
      }

      // Create container (uses fixed internal port, no host port mapping needed)
      const container = await this.docker.createContainer({
        Image: OPENCLAW_IMAGE,
        name: containerName,
        HostConfig: {
          Memory: MEMORY_LIMIT,
          NanoCpus: Math.floor(CPU_LIMIT * 1e9),
          Binds: [
            `${volumeNames.config}:/root/.openclaw`,
            `${volumeNames.workspaces}:/root/.openclaw/workspaces`,
            `${volumeNames.extensions}:/root/.openclaw/extensions`,
            `${volumeNames.data}:/data`,
          ],
          RestartPolicy: { Name: "unless-stopped" },
          NetworkMode: DOCKER_NETWORK,
        },
      });

      // Start container
      await container.start();

      // Update tenant row with container info (status still provisioning)
      await db
        .update(tenants)
        .set({
          containerName,
          status: "provisioning",
        })
        .where(eq(tenants.id, tenant.id));

      // Wait for gateway token file to appear
      const token = await this.waitForGatewayToken(container);

      // Encrypt token and update tenant to running
      const encryptedToken = encrypt(token);
      await db
        .update(tenants)
        .set({
          gatewayToken: encryptedToken,
          status: "running",
          errorMessage: null,
        })
        .where(eq(tenants.id, tenant.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provisioning error";
      await db
        .update(tenants)
        .set({
          status: "error",
          errorMessage: message,
          containerName,
        })
        .where(eq(tenants.id, tenant.id));
    }
  }

  /**
   * Wait for the gateway token file inside the container.
   * Polls via docker exec until the file appears or timeout.
   */
  private async waitForGatewayToken(container: Docker.Container): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < GATEWAY_TOKEN_MAX_WAIT_MS) {
      try {
        const exec = await container.exec({
          Cmd: ["cat", "/root/.openclaw/gateway-token"],
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
        });

        const stream = await exec.start({ Detach: false, Tty: true });
        const output = await this.streamToString(stream);
        const token = output.trim();
        if (token) {
          return token;
        }
      } catch {
        // File not ready yet, continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, GATEWAY_TOKEN_POLL_INTERVAL_MS));
    }

    throw new Error(
      "Timed out waiting for gateway token after " + GATEWAY_TOKEN_MAX_WAIT_MS / 1000 + "s"
    );
  }

  /**
   * Read a Docker exec stream to a string.
   */
  private streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
    });
  }

  /**
   * Deprovision a tenant: stop container, remove container, remove volumes.
   */
  async deprovision(tenantId: string): Promise<void> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    if (!tenant) return;

    const containerName = tenant.containerName || `pinchy-openclaw-${tenant.slug}`;

    try {
      // Stop and remove container
      try {
        const container = this.docker.getContainer(containerName);
        await container.stop({ t: 5 }).catch(() => {});
        await container.remove({ force: true });
      } catch {
        // Container may already be gone
      }

      // Remove volumes
      const volumePrefix = `pinchy-oc`;
      const volumeSuffixes = ["config", "workspaces", "extensions", "data"];
      for (const suffix of volumeSuffixes) {
        try {
          const volume = this.docker.getVolume(`${volumePrefix}-${suffix}-${tenant.slug}`);
          await volume.remove({ force: true });
        } catch {
          // Volume may already be gone
        }
      }

      // Update tenant status
      await db
        .update(tenants)
        .set({
          status: "stopped",
          containerName: null,
          gatewayToken: null,
        })
        .where(eq(tenants.id, tenantId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown deprovision error";
      await db
        .update(tenants)
        .set({
          status: "error",
          errorMessage: message,
        })
        .where(eq(tenants.id, tenantId));
    }
  }

  /**
   * Check if a tenant's container is running.
   */
  async healthCheck(tenantId: string): Promise<{ running: boolean; status?: string }> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    if (!tenant?.containerName) {
      return { running: false };
    }

    try {
      const container = this.docker.getContainer(tenant.containerName);
      const info = await container.inspect();
      return {
        running: info.State.Running,
        status: info.State.Status,
      };
    } catch {
      return { running: false };
    }
  }

  /**
   * Reconcile Docker state with DB state on startup.
   * - Remove orphan containers (in Docker but not in DB)
   * - Mark DB tenants whose containers are missing as status="error"
   */
  async reconcileOnStartup(): Promise<void> {
    console.log("[tenants] Starting reconciliation...");

    // Get all running containers matching our naming pattern
    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: ["pinchy-openclaw-"] },
    });

    const containerNames = new Set(
      containers.flatMap((c) => c.Names.map((n) => n.replace(/^\//, "")))
    );

    // Get all DB tenants that should have running containers
    const dbTenants = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.status, "running"), isNull(tenants.deletedAt)));

    const dbContainerNames = new Set(
      dbTenants.map((t) => t.containerName).filter((n): n is string => n !== null)
    );

    // Remove orphan containers (exist in Docker but not in DB)
    for (const name of containerNames) {
      if (!dbContainerNames.has(name)) {
        console.warn(`[tenants] Removing orphan container: ${name}`);
        try {
          const container = this.docker.getContainer(name);
          await container.stop({ t: 5 }).catch(() => {});
          await container.remove({ force: true });
        } catch (error) {
          console.error(`[tenants] Failed to remove orphan container ${name}:`, error);
        }
      }
    }

    // Mark DB tenants whose containers are missing as error
    for (const tenant of dbTenants) {
      if (tenant.containerName && !containerNames.has(tenant.containerName)) {
        console.warn(
          `[tenants] Container missing for tenant ${tenant.slug}: ${tenant.containerName}`
        );
        await db
          .update(tenants)
          .set({
            status: "error",
            errorMessage: "Container not found during startup reconciliation",
          })
          .where(eq(tenants.id, tenant.id));
      }
    }

    console.log("[tenants] Reconciliation complete.");
  }
}

// Singleton instance
export const tenantContainerManager = new TenantContainerManager();
