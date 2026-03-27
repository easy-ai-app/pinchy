import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock("@/lib/api-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/tenant-context", () => ({
  getTenantId: vi.fn().mockResolvedValue("default"),
}));

const mockOrderBy = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelectDistinct = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("@/db", () => ({
  db: { selectDistinct: mockSelectDistinct },
}));

vi.mock("@/db/schema", () => ({
  auditLog: { eventType: "event_type", tenantId: "tenant_id" },
}));

vi.mock("drizzle-orm", () => ({
  asc: vi.fn((col) => col),
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { requireAdmin } from "@/lib/api-auth";

describe("GET /api/audit/event-types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
      expires: "",
    } as any);
  });

  it("should return 403 for non-admin users", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      NextResponse.json({ error: "Forbidden" }, { status: 403 })
    );

    const { GET } = await import("@/app/api/audit/event-types/route");
    const request = new NextRequest("http://localhost/api/audit/event-types");
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("should return distinct event types from the database", async () => {
    mockOrderBy.mockResolvedValue([
      { eventType: "agent.created" },
      { eventType: "auth.login" },
      { eventType: "tool.bash" },
    ]);

    const { GET } = await import("@/app/api/audit/event-types/route");
    const request = new NextRequest("http://localhost/api/audit/event-types");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.eventTypes).toEqual(["agent.created", "auth.login", "tool.bash"]);
  });

  it("should return empty array when no audit entries exist", async () => {
    mockOrderBy.mockResolvedValue([]);

    const { GET } = await import("@/app/api/audit/event-types/route");
    const request = new NextRequest("http://localhost/api/audit/event-types");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.eventTypes).toEqual([]);
  });

  it("should query with selectDistinct on eventType column", async () => {
    mockOrderBy.mockResolvedValue([]);

    const { GET } = await import("@/app/api/audit/event-types/route");
    const request = new NextRequest("http://localhost/api/audit/event-types");
    await GET(request);

    expect(mockSelectDistinct).toHaveBeenCalledWith({ eventType: "event_type" });
    expect(mockFrom).toHaveBeenCalledWith(expect.anything());
  });
});
