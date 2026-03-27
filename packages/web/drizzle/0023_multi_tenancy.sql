-- Multi-tenancy Phase 1: New tables and tenantId columns

CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"status" text DEFAULT 'provisioning' NOT NULL,
	"container_name" text,
	"gateway_token" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "tenant_members" (
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_members_tenant_id_user_id_pk" PRIMARY KEY("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_tenant_id_idx" ON "agents" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "groups_tenant_id_idx" ON "groups" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invites_tenant_id_idx" ON "invites" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "channel_links" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "channel_links" ADD CONSTRAINT "channel_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channel_links_tenant_id_idx" ON "channel_links" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settings_tenant_id_idx" ON "settings" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_tenant" ON "audit_log" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_usage_tenant" ON "usage_records" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "tenant_id" text;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skills_tenant_id_idx" ON "skills" USING btree ("tenant_id");--> statement-breakpoint
DROP VIEW IF EXISTS "active_agents";--> statement-breakpoint
CREATE VIEW "active_agents" AS SELECT * FROM "agents" WHERE "deleted_at" IS NULL;