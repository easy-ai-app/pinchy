import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth — use vi.hoisted so the mock factory can reference it
const { mockSession } = vi.hoisted(() => ({
  mockSession: {
    user: { id: "user1", role: "admin", name: "Test User" },
    session: { id: "session1" },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Track DB operations
const insertedTenants: Array<Record<string, unknown>> = [];
const insertedMembers: Array<Record<string, unknown>> = [];
let existingSlugs: string[] = [];

vi.mock("@/db", () => {
  const mockInsert = vi.fn().mockImplementation((table: unknown) => ({
    values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      const tableName = (table as { _: { name: string } })?._?.name;
      if (tableName === "tenants") {
        insertedTenants.push(data);
        return {
          returning: vi.fn().mockResolvedValue([
            {
              id: "new-tenant-id",
              name: data.name,
              slug: data.slug,
              ownerId: data.ownerId,
              status: "provisioning",
              createdAt: new Date(),
            },
          ]),
        };
      }
      if (tableName === "tenant_members") {
        insertedMembers.push(data);
      }
      return { returning: vi.fn().mockResolvedValue([data]) };
    }),
  }));

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation(() => ({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
          where: vi.fn().mockImplementation(() => {
            return Promise.resolve(existingSlugs.map((s) => ({ slug: s })));
          }),
        })),
      }),
      insert: mockInsert,
      transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = { insert: mockInsert };
        return fn(tx);
      }),
    },
  };
});

vi.mock("@/db/schema", () => ({
  tenants: {
    _: { name: "tenants" },
    id: "id",
    slug: "slug",
    deletedAt: "deleted_at",
  },
  tenantMembers: {
    _: { name: "tenant_members" },
    tenantId: "tenant_id",
    userId: "user_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
  sql: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  appendAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tenant-container-manager", () => ({
  tenantContainerManager: {
    provision: vi.fn().mockResolvedValue(undefined),
  },
}));

import { GET, POST } from "../route";

describe("GET /api/tenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user tenants", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/tenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedTenants.length = 0;
    insertedMembers.length = 0;
    existingSlugs = [];
  });

  it("should create a tenant with provisioning status", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "Acme Corp" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.name).toBe("Acme Corp");
    expect(body.status).toBe("provisioning");
  });

  it("should return 400 when name is missing", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when name is empty", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when name exceeds max length", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "a".repeat(101) }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:7777/api/tenants", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
