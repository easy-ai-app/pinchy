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

// Track tenant membership checks
let mockMemberRole: string | null = "owner";
let mockTenantMemberCount = 2;
let mockExistingTenant: Record<string, unknown> | null = {
  id: "t1",
  name: "Acme Corp",
  slug: "acme-corp",
  status: "running",
};

vi.mock("@/lib/tenant-context", () => ({
  requireTenantMember: vi.fn().mockImplementation(async () => {
    if (mockMemberRole === null) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: "Not a member of this tenant" }, { status: 403 });
    }
    return { role: mockMemberRole };
  }),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          if (mockExistingTenant) {
            return Promise.resolve([mockExistingTenant]);
          }
          return Promise.resolve([]);
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            return Promise.resolve([{ ...mockExistingTenant, name: "Updated Name" }]);
          }),
        }),
      }),
    }),
  },
}));

// Mock count for member count check in DELETE
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
  count: vi.fn().mockReturnValue("count"),
}));

vi.mock("@/db/schema", () => ({
  tenants: {
    _: { name: "tenants" },
    id: "id",
  },
  tenantMembers: {
    _: { name: "tenant_members" },
    userId: "user_id",
  },
}));

vi.mock("@/lib/audit", () => ({
  appendAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tenant-container-manager", () => ({
  tenantContainerManager: {
    deprovision: vi.fn().mockResolvedValue(undefined),
  },
}));

import { PATCH, DELETE } from "../route";
import { db } from "@/db";

const params = Promise.resolve({ tenantId: "t1" });

describe("PATCH /api/tenants/[tenantId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberRole = "owner";
    mockExistingTenant = {
      id: "t1",
      name: "Acme Corp",
      slug: "acme-corp",
      status: "running",
    };
  });

  it("should update tenant name", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants/t1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params });
    expect(response.status).toBe(200);
  });

  it("should return 403 for member role", async () => {
    mockMemberRole = "member";

    const request = new NextRequest("http://localhost:7777/api/tenants/t1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params });
    expect(response.status).toBe(403);
  });

  it("should return 403 for non-members", async () => {
    mockMemberRole = null;

    const request = new NextRequest("http://localhost:7777/api/tenants/t1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params });
    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/tenants/[tenantId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberRole = "owner";
    mockTenantMemberCount = 2;
    mockExistingTenant = {
      id: "t1",
      name: "Acme Corp",
      slug: "acme-corp",
      status: "running",
    };

    // Override DB select for memberCount check
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          return Promise.resolve([{ count: mockTenantMemberCount }, mockExistingTenant]);
        }),
      }),
    } as ReturnType<typeof db.select>);
  });

  it("should soft-delete a tenant", async () => {
    const request = new NextRequest("http://localhost:7777/api/tenants/t1", { method: "DELETE" });

    const response = await DELETE(request, { params });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("should return 403 for non-owner", async () => {
    mockMemberRole = "admin";

    const request = new NextRequest("http://localhost:7777/api/tenants/t1", { method: "DELETE" });

    const response = await DELETE(request, { params });
    expect(response.status).toBe(403);
  });

  it("should return 403 for non-member", async () => {
    mockMemberRole = null;

    const request = new NextRequest("http://localhost:7777/api/tenants/t1", { method: "DELETE" });

    const response = await DELETE(request, { params });
    expect(response.status).toBe(403);
  });

  it("should prevent deleting last tenant", async () => {
    mockTenantMemberCount = 1;

    // Override DB select for this specific case
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      }),
    } as ReturnType<typeof db.select>);

    const request = new NextRequest("http://localhost:7777/api/tenants/t1", { method: "DELETE" });

    const response = await DELETE(request, { params });
    expect(response.status).toBe(400);
  });
});
