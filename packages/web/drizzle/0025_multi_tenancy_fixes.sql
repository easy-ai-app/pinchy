-- Multi-tenancy fixes: composite settings PK, tenants FK onDelete

-- 1. Replace settings single-column PK with composite PK (tenant_id, key)
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_key_pk" PRIMARY KEY ("tenant_id", "key");--> statement-breakpoint

-- 2. Replace tenants owner_id FK with ON DELETE RESTRICT
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_owner_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
