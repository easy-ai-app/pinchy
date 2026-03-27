import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB — use vi.hoisted so these are available in vi.mock factories
const { mockDbResults } = vi.hoisted(() => {
  const mockDbResults: Record<string, unknown[]> = {
    tenantMembers: [],
  };
  return { mockDbResults };
});

vi.mock("@/db", () => {
  // Helper: create a promise-like object that's also chainable (mimics drizzle query builder)
  function createThenable(resolveValue: () => unknown[]) {
    const obj: Record<string, unknown> = {
      then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(resolveValue()).then(resolve, reject),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockImplementation(() => {
          return Promise.resolve(resolveValue());
        }),
      }),
    };
    return obj;
  }

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: unknown) => {
          const tableName = (table as { _: { name: string } })?._?.name;
          const mockChain = {
            where: vi.fn().mockImplementation(() => {
              if (tableName === "tenant_members") {
                return Promise.resolve(mockDbResults.tenantMembers);
              }
              return Promise.resolve([]);
            }),
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => {
                return createThenable(() => mockDbResults.tenantMembers);
              }),
            }),
            limit: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDbResults.tenantMembers);
            }),
          };
          return mockChain;
        }),
      }),
    },
  };
});

vi.mock("@/db/schema", () => ({
  tenants: {
    _: { name: "tenants" },
    id: "id",
    deletedAt: "deleted_at",
  },
  tenantMembers: {
    _: { name: "tenant_members" },
    tenantId: "tenant_id",
    userId: "user_id",
    role: "role",
    joinedAt: "joined_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
}));

import { getTenantId, requireTenantMember } from "../tenant-context";

function createMockRequest(
  options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const url = "http://localhost:7777/api/test";
  const request = new NextRequest(url, {
    headers: new Headers(options.headers || {}),
  });

  // Mock cookies
  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      vi.spyOn(request.cookies, "get").mockImplementation((cookieName: string) => {
        if (cookieName === name) return { name, value };
        return undefined;
      });
    }
  }

  return request;
}

describe("getTenantId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResults.tenantMembers = [];
  });

  it("should resolve tenant from X-Tenant-Id header", async () => {
    // Simulate user is a member of the tenant (validateTenantMembership succeeds)
    mockDbResults.tenantMembers = [{ tenantId: "tenant-from-header" }];
    const request = createMockRequest({
      headers: { "X-Tenant-Id": "tenant-from-header" },
    });

    const result = await getTenantId(request, "user1");
    expect(result).toBe("tenant-from-header");
  });

  it("should resolve tenant from pinchy-tenant cookie", async () => {
    // Simulate user is a member of the tenant (validateTenantMembership succeeds)
    mockDbResults.tenantMembers = [{ tenantId: "tenant-from-cookie" }];
    const request = createMockRequest({
      cookies: { "pinchy-tenant": "tenant-from-cookie" },
    });

    const result = await getTenantId(request, "user1");
    expect(result).toBe("tenant-from-cookie");
  });

  it("should prefer header over cookie", async () => {
    // Simulate user is a member of the tenant (validateTenantMembership succeeds)
    mockDbResults.tenantMembers = [{ tenantId: "tenant-from-header" }];
    const request = createMockRequest({
      headers: { "X-Tenant-Id": "tenant-from-header" },
      cookies: { "pinchy-tenant": "tenant-from-cookie" },
    });

    const result = await getTenantId(request, "user1");
    expect(result).toBe("tenant-from-header");
  });

  it("should return null when no userId provided and no header/cookie", async () => {
    const request = createMockRequest();
    const result = await getTenantId(request);
    expect(result).toBeNull();
  });
});

describe("requireTenantMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 403 when user is not a member", async () => {
    const result = await requireTenantMember("t1", "non-member");

    // Result should be a NextResponse (403)
    expect("status" in result).toBe(true);
    if ("status" in result) {
      expect(result.status).toBe(403);
    }
  });
});
