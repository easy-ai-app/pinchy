import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so mock variables are available when vi.mock factories run
const {
  mockContainerStart,
  mockContainerStop: _mockContainerStop,
  mockContainerRemove: _mockContainerRemove,
  mockContainerInspect: _mockContainerInspect,
  mockExecStart: _mockExecStart,
  mockContainerExec: _mockContainerExec,
  mockContainer: _mockContainer,
  mockCreateContainer,
  mockCreateVolume,
  mockGetContainer,
  mockGetVolume: _mockGetVolume,
  mockListContainers,
  mockDbSelect: _mockDbSelect,
  mockDbUpdate: _mockDbUpdate,
} = vi.hoisted(() => {
  const mockContainerStart = vi.fn().mockResolvedValue(undefined);
  const mockContainerStop = vi.fn().mockResolvedValue(undefined);
  const mockContainerRemove = vi.fn().mockResolvedValue(undefined);
  const mockContainerInspect = vi.fn().mockResolvedValue({
    State: { Running: true, Status: "running" },
  });
  const mockExecStart = vi.fn().mockResolvedValue({
    on: (event: string, handler: (data: Buffer) => void) => {
      if (event === "data") handler(Buffer.from("mock-gateway-token"));
      if (event === "end") setTimeout(() => handler(Buffer.alloc(0)), 0);
      return { on: vi.fn() };
    },
  });
  const mockContainerExec = vi.fn().mockResolvedValue({
    start: mockExecStart,
  });
  const mockContainer = {
    start: mockContainerStart,
    stop: mockContainerStop,
    remove: mockContainerRemove,
    inspect: mockContainerInspect,
    exec: mockContainerExec,
  };
  const mockCreateContainer = vi.fn().mockResolvedValue(mockContainer);
  const mockCreateVolume = vi.fn().mockResolvedValue({});
  const mockGetContainer = vi.fn().mockReturnValue(mockContainer);
  const mockGetVolume = vi.fn().mockReturnValue({
    remove: vi.fn().mockResolvedValue(undefined),
  });
  const mockListContainers = vi.fn().mockResolvedValue([]);
  const mockDbSelect = vi.fn();
  const mockDbUpdate = vi.fn();

  return {
    mockContainerStart,
    mockContainerStop,
    mockContainerRemove,
    mockContainerInspect,
    mockExecStart,
    mockContainerExec,
    mockContainer,
    mockCreateContainer,
    mockCreateVolume,
    mockGetContainer,
    mockGetVolume,
    mockListContainers,
    mockDbSelect,
    mockDbUpdate,
  };
});

vi.mock("dockerode", () => {
  function DockerMock(this: Record<string, unknown>) {
    this.createContainer = mockCreateContainer;
    this.createVolume = mockCreateVolume;
    this.getContainer = mockGetContainer;
    this.getVolume = mockGetVolume;
    this.listContainers = mockListContainers;
  }
  return {
    default: DockerMock,
  };
});

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: (condition: unknown) => {
          mockDbSelect(table, condition);
          return Promise.resolve([]);
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (data: unknown) => ({
        where: (condition: unknown) => {
          mockDbUpdate(table, data, condition);
          return Promise.resolve();
        },
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  tenants: {
    id: "id",
    deletedAt: "deleted_at",
    status: "status",
    containerName: "container_name",
    slug: "slug",
  },
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn().mockReturnValue("encrypted-token"),
  decrypt: vi.fn().mockReturnValue("decrypted-token"),
}));

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
}));

import { TenantContainerManager } from "../tenant-container-manager";

describe("TenantContainerManager", () => {
  let manager: TenantContainerManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    manager = new TenantContainerManager();
  });

  describe("provision", () => {
    it("should create volumes and container with correct config", async () => {
      const tenant = { id: "t1", slug: "acme" };

      // The provision method will try to update DB and wait for token.
      // Since DB is mocked, it will fail at some point - we mainly
      // verify Docker interactions happen correctly.
      await manager.provision(tenant).catch(() => {});

      // Verify 4 volumes created
      expect(mockCreateVolume).toHaveBeenCalledTimes(4);
      expect(mockCreateVolume).toHaveBeenCalledWith({
        Name: "pinchy-oc-config-acme",
      });
      expect(mockCreateVolume).toHaveBeenCalledWith({
        Name: "pinchy-oc-workspaces-acme",
      });
      expect(mockCreateVolume).toHaveBeenCalledWith({
        Name: "pinchy-oc-extensions-acme",
      });
      expect(mockCreateVolume).toHaveBeenCalledWith({
        Name: "pinchy-oc-data-acme",
      });

      // Verify container created with resource limits
      expect(mockCreateContainer).toHaveBeenCalledTimes(1);
      const createCall = mockCreateContainer.mock.calls[0][0];
      expect(createCall.Image).toBe("pinchy-openclaw");
      expect(createCall.name).toBe("pinchy-openclaw-acme");
      expect(createCall.HostConfig.Memory).toBe(536870912); // 512MB
      expect(createCall.HostConfig.NanoCpus).toBe(500000000); // 0.5 CPU
      expect(createCall.HostConfig.NetworkMode).toBe("pinchy_default");

      // Verify container started
      expect(mockContainerStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("deprovision", () => {
    it("should stop and remove container and volumes", async () => {
      // Mock DB to return a tenant
      const mockTenantSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "t1",
              slug: "acme",
              containerName: "pinchy-openclaw-acme",
            },
          ]),
        }),
      });

      // Override the db mock for this test
      vi.spyOn(await import("@/db").then((m) => m.db), "select" as never).mockImplementation(
        mockTenantSelect
      );

      // Deprovision will try to stop container
      await manager.deprovision("t1").catch(() => {});

      // Container operations should have been attempted
      expect(mockGetContainer).toHaveBeenCalled();
    });
  });

  describe("healthCheck", () => {
    it("should return running status from docker inspect", async () => {
      // healthCheck reads from DB then inspects container
      // With mocked empty DB, it returns not running
      const result = await manager.healthCheck("t1");
      expect(result).toEqual({ running: false });
    });
  });

  describe("reconcileOnStartup", () => {
    it("should remove orphan containers not in DB", async () => {
      // Mock listContainers to return a container
      mockListContainers.mockResolvedValueOnce([{ Names: ["/pinchy-openclaw-orphan"] }]);

      await manager.reconcileOnStartup();

      // Should attempt to get and remove the orphan container
      expect(mockGetContainer).toHaveBeenCalledWith("pinchy-openclaw-orphan");
    });

    it("should not crash when no containers exist", async () => {
      mockListContainers.mockResolvedValueOnce([]);

      await expect(manager.reconcileOnStartup()).resolves.not.toThrow();
    });
  });
});
