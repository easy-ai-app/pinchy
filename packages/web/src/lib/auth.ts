import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { verifyPassword as verifyScrypt } from "better-auth/crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { appendAuditLog } from "@/lib/audit";

/**
 * After-hook middleware for audit trail logging.
 *
 * Logs auth.login, auth.failed, and auth.logout events.
 * Exported separately so tests can verify the hook logic
 * without instantiating the full Better Auth server.
 */
export const auditAfterHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-in/email") {
    const email = (ctx.body as { email?: string })?.email ?? "unknown";
    const newSession = ctx.context.newSession;

    if (newSession) {
      // Successful login
      try {
        await appendAuditLog({
          actorType: "user",
          actorId: newSession.user.id,
          eventType: "auth.login",
          detail: { email },
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    } else {
      // Failed login attempt
      try {
        await appendAuditLog({
          actorType: "system",
          actorId: "system",
          eventType: "auth.failed",
          detail: { email, reason: "invalid_credentials" },
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    }
  }

  if (ctx.path === "/sign-out") {
    const session = ctx.context.session;
    if (session?.user?.id) {
      try {
        await appendAuditLog({
          actorType: "user",
          actorId: session.user.id,
          eventType: "auth.logout",
          detail: {},
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    }
  }
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      // Accept legacy bcrypt hashes from pre-migration users
      verify: async ({ password, hash }) => {
        if (hash.startsWith("$2")) {
          return bcrypt.compare(password, hash);
        }
        // Fall through to Better Auth's default scrypt verifier
        return verifyScrypt({ password, hash });
      },
    },
  },
  user: {
    additionalFields: {
      context: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-join the "default" tenant for new users (safety net).
          // The setup flow and invite claim route handle their own tenant
          // membership, so this is a fallback for open registration or
          // any future sign-up path that doesn't explicitly assign a tenant.
          try {
            const [defaultTenant] = await db
              .select({ id: schema.tenants.id })
              .from(schema.tenants)
              .where(eq(schema.tenants.id, "default"));

            if (!defaultTenant) return; // No default tenant yet (pre-setup)

            // Check if already a member (setup flow may have already added)
            const [existing] = await db
              .select({ tenantId: schema.tenantMembers.tenantId })
              .from(schema.tenantMembers)
              .where(eq(schema.tenantMembers.userId, user.id));

            if (!existing) {
              await db.insert(schema.tenantMembers).values({
                tenantId: "default",
                userId: user.id,
                role: "member",
              });
            }
          } catch {
            // Don't break user creation if tenant assignment fails
          }
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "member",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after 1 day
  },
  hooks: {
    after: auditAfterHook,
  },
});

// Better Auth v1.5.3 doesn't infer admin plugin fields in $Infer.Session.
// Manually extend the session type to include them.
type InferredSession = typeof auth.$Infer.Session;
export type Session = {
  session: InferredSession["session"];
  user: InferredSession["user"] & {
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
  };
};

/**
 * Typed wrapper around auth.api.getSession that includes admin plugin fields.
 */
export async function getSession(opts: { headers: Headers }): Promise<Session | null> {
  const session = await auth.api.getSession(opts);
  return session as Session | null;
}
