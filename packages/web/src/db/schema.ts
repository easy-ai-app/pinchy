import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  serial,
  integer,
  numeric,
  pgEnum,
  pgView,
  primaryKey,
} from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";

// ── Better Auth tables ──────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("member"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  context: text("context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Tenant tables ─────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("provisioning"),
  containerName: text("container_name"),
  gatewayToken: text("gateway_token"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const tenantMembers = pgTable(
  "tenant_members",
  {
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.userId] })]
);

// ── Application tables ─────────────────────────────────────────────────

export const agents = pgTable(
  "agents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().default("Smithers"),
    model: text("model").notNull(),
    templateId: text("template_id"),
    pluginConfig: jsonb("plugin_config"),
    allowedTools: jsonb("allowed_tools").$type<string[]>().notNull().default([]),
    ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    isPersonal: boolean("is_personal").notNull().default(false),
    visibility: text("visibility").notNull().default("restricted"),
    greetingMessage: text("greeting_message"),
    tagline: text("tagline"),
    avatarSeed: text("avatar_seed"),
    personalityPresetId: text("personality_preset_id"),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("agents_owner_id_idx").on(table.ownerId),
    index("agents_tenant_id_idx").on(table.tenantId),
  ]
);

export const groups = pgTable(
  "groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("groups_tenant_id_idx").on(table.tenantId)]
);

export const userGroups = pgTable(
  "user_groups",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.groupId] })]
);

export const agentGroups = pgTable(
  "agent_groups",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.groupId] })]
);

export const invites = pgTable(
  "invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenHash: text("token_hash").notNull().unique(),
    email: text("email"),
    role: text("role").notNull().default("member"),
    type: text("type").notNull().default("invite"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    claimedAt: timestamp("claimed_at"),
    claimedByUserId: text("claimed_by_user_id").references(() => users.id),
  },
  (table) => [index("invites_tenant_id_idx").on(table.tenantId)]
);

export const inviteGroups = pgTable(
  "invite_groups",
  {
    inviteId: text("invite_id")
      .notNull()
      .references(() => invites.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.inviteId, table.groupId] })]
);

export const channelLinks = pgTable(
  "channel_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    channelUserId: text("channel_user_id").notNull(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    linkedAt: timestamp("linked_at").notNull().defaultNow(),
  },
  (table) => [
    index("channel_links_user_id_idx").on(table.userId),
    index("channel_links_channel_user_idx").on(table.channel, table.channelUserId),
    index("channel_links_tenant_id_idx").on(table.tenantId),
  ]
);

export const settings = pgTable(
  "settings",
  {
    key: text("key").notNull(),
    value: text("value").notNull(),
    encrypted: boolean("encrypted").default(false),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.key] }),
    index("settings_tenant_id_idx").on(table.tenantId),
  ]
);

// ── Audit Trail ──────────────────────────────────────────────────────

export const actorTypeEnum = pgEnum("actor_type", ["user", "agent", "system"]);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorId: text("actor_id").notNull(),
    eventType: text("event_type").notNull(),
    resource: text("resource"),
    detail: jsonb("detail"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    rowHmac: text("row_hmac").notNull(),
  },
  (table) => [
    index("idx_audit_timestamp").on(table.timestamp),
    index("idx_audit_actor").on(table.actorId),
    index("idx_audit_event").on(table.eventType),
    index("idx_audit_tenant").on(table.tenantId),
  ]
);

// ── Usage Tracking ───────────────────────────────────────────────────

export const usageRecords = pgTable(
  "usage_records",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id").notNull(),
    agentId: text("agent_id").notNull(),
    agentName: text("agent_name").notNull(),
    sessionKey: text("session_key").notNull(),
    model: text("model"),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 10,
      scale: 6,
    }),
  },
  (table) => [
    index("idx_usage_timestamp").on(table.timestamp),
    index("idx_usage_user").on(table.userId),
    index("idx_usage_agent").on(table.agentId),
    index("idx_usage_session_key").on(table.sessionKey),
    index("idx_usage_tenant").on(table.tenantId),
  ]
);

// ── Skills ───────────────────────────────────────────────────────────

export const skills = pgTable(
  "skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    prompt: text("prompt").notNull(),
    icon: text("icon"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    isShared: boolean("is_shared").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("skills_user_id_idx").on(table.userId),
    index("skills_tenant_id_idx").on(table.tenantId),
  ]
);

// ── Views ────────────────────────────────────────────────────────────

export const activeAgents = pgView("active_agents").as((qb) =>
  qb.select().from(agents).where(isNull(agents.deletedAt))
);
