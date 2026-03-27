import { test, expect, type Page } from "@playwright/test";

const TEST_DB_URL = "postgresql://pinchy:pinchy_dev@localhost:5433/pinchy_test";
const ADMIN = { name: "Admin One", email: "admin@test.local", password: "test-password-123" };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test("multi-tenancy: full lifecycle — create, list, switch, members, isolate, delete", async ({
  page,
  request,
}) => {
  // ── Step 1: Login and verify default tenant ──────────────────────────
  await test.step("admin logs in and sees default tenant", async () => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/chat\//, { timeout: 15000 });
    await expect(page.getByRole("link", { name: /smithers/i })).toBeVisible();
  });

  // ── Step 2: Create new tenants ───────────────────────────────────────
  let acmeTenantId: string;

  await test.step("create 'Acme Corp' tenant via API", async () => {
    const res = await request.post("/api/tenants", { data: { name: "Acme Corp" } });
    expect(res.status()).toBe(201);
    const tenant = await res.json();
    expect(tenant.name).toBe("Acme Corp");
    expect(tenant.slug).toBe("acme-corp");
    expect(tenant.status).toBe("provisioning");
    acmeTenantId = tenant.id;
  });

  await test.step("create duplicate name tenant — slug gets deduplicated", async () => {
    const res = await request.post("/api/tenants", { data: { name: "Acme Corp" } });
    expect(res.status()).toBe(201);
    const tenant = await res.json();
    expect(tenant.slug).not.toBe("acme-corp");
    expect(tenant.slug).toMatch(/^acme-corp-/);
  });

  // ── Step 3: List and verify tenants ──────────────────────────────────
  await test.step("list tenants shows default + 2 new", async () => {
    const res = await request.get("/api/tenants");
    expect(res.ok()).toBe(true);
    const tenants = await res.json();
    expect(tenants.length).toBeGreaterThanOrEqual(3);
    expect(tenants.some((t: { slug: string }) => t.slug === "default")).toBe(true);
    expect(tenants.some((t: { slug: string }) => t.slug === "acme-corp")).toBe(true);
  });

  // ── Step 4: Switch tenant ────────────────────────────────────────────
  await test.step("switch to Acme Corp sets cookie", async () => {
    const res = await request.post(`/api/tenants/${acmeTenantId}/switch`);
    expect(res.ok()).toBe(true);
    const headers = res.headers();
    expect(headers["set-cookie"]).toContain("pinchy-tenant=");
  });

  // ── Step 5: Check tenant status ──────────────────────────────────────
  await test.step("status endpoint returns tenant state", async () => {
    const res = await request.get(`/api/tenants/${acmeTenantId}/status`);
    expect(res.ok()).toBe(true);
    const status = await res.json();
    expect(["provisioning", "running", "error"]).toContain(status.status);
  });

  // ── Step 6: Add members ──────────────────────────────────────────────
  let userAId: string;

  await test.step("seed test user and add as tenant member", async () => {
    const { default: postgres } = await import("postgres");
    const sql = postgres(TEST_DB_URL);

    // Create user Alice
    const [existing] = await sql`SELECT id FROM "user" WHERE email = 'alice@test.local'`;
    if (existing) {
      userAId = existing.id;
    } else {
      const [newUser] = await sql`
        INSERT INTO "user" (id, name, email, email_verified, role)
        VALUES (gen_random_uuid(), 'Alice', 'alice@test.local', false, 'member')
        RETURNING id
      `;
      userAId = newUser.id;
    }
    await sql.end();

    // Add Alice to Acme tenant
    const addRes = await request.post(`/api/tenants/${acmeTenantId}/members`, {
      data: { userId: userAId, role: "member" },
    });
    expect(addRes.ok()).toBe(true);
  });

  await test.step("members list includes Alice", async () => {
    const res = await request.get(`/api/tenants/${acmeTenantId}/members`);
    expect(res.ok()).toBe(true);
    const members = await res.json();
    expect(members.length).toBeGreaterThanOrEqual(2);
    expect(members.some((m: { email?: string }) => m.email === "alice@test.local")).toBe(true);
  });

  // ── Step 7: Data isolation ───────────────────────────────────────────
  await test.step("agents are scoped to their tenant", async () => {
    const { default: postgres } = await import("postgres");
    const sql = postgres(TEST_DB_URL);

    const [defaultAgents] = await sql`
      SELECT COUNT(*)::int as count FROM agents WHERE tenant_id = 'default' AND deleted_at IS NULL
    `;
    const [acmeAgents] = await sql`
      SELECT COUNT(*)::int as count FROM agents WHERE tenant_id = ${acmeTenantId} AND deleted_at IS NULL
    `;
    await sql.end();

    expect(defaultAgents.count).toBeGreaterThanOrEqual(1); // Smithers
    expect(acmeAgents.count).toBe(0); // Fresh tenant, no agents
  });

  // ── Step 8: Delete tenant ────────────────────────────────────────────
  await test.step("delete duplicate tenant (soft delete)", async () => {
    const listRes = await request.get("/api/tenants");
    const tenants = await listRes.json();
    const duplicate = tenants.find(
      (t: { slug: string }) =>
        t.slug !== "acme-corp" && t.slug !== "default" && t.slug.startsWith("acme-corp")
    );

    if (duplicate) {
      const deleteRes = await request.delete(`/api/tenants/${duplicate.id}`);
      expect(deleteRes.ok()).toBe(true);

      // Verify gone from list
      const afterRes = await request.get("/api/tenants");
      const after = await afterRes.json();
      expect(after.some((t: { id: string }) => t.id === duplicate.id)).toBe(false);
    }
  });

  // ── Step 9: Switch back to default ───────────────────────────────────
  await test.step("switch back to default tenant", async () => {
    const res = await request.post("/api/tenants/default/switch");
    expect(res.ok()).toBe(true);
  });
});
