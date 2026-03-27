import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/encryption";

export async function getSetting(key: string, tenantId = "default"): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: and(eq(settings.key, key), eq(settings.tenantId, tenantId)),
  });
  if (!row) return null;

  return row.encrypted ? decrypt(row.value) : row.value;
}

export async function setSetting(
  key: string,
  value: string,
  encrypted = false,
  tenantId = "default"
) {
  const storedValue = encrypted ? encrypt(value) : value;
  await db
    .insert(settings)
    .values({
      key,
      value: storedValue,
      encrypted,
      tenantId,
    })
    .onConflictDoUpdate({
      target: [settings.tenantId, settings.key],
      set: { value: storedValue, encrypted },
    });
}

export async function deleteSetting(key: string, tenantId = "default"): Promise<void> {
  await db.delete(settings).where(and(eq(settings.key, key), eq(settings.tenantId, tenantId)));
}

export async function getAllSettings(tenantId = "default") {
  return db.select().from(settings).where(eq(settings.tenantId, tenantId));
}
