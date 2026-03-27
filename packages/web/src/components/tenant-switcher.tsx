"use client";

import Link from "next/link";
import { ChevronDown, Plus, Settings2, Users } from "lucide-react";
import { useTenant } from "@/components/tenant-provider";
import { TenantStatusDot } from "@/components/tenant-status-dot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export function TenantSwitcher() {
  const { currentTenant, tenants, switchTenant } = useTenant();
  const [open, setOpen] = useState(false);

  if (!currentTenant) return null;

  const hasManyTenants = tenants.length > 1;
  const isAdmin = currentTenant.role === "owner" || currentTenant.role === "admin";

  // Single tenant: show name + role, no dropdown
  if (!hasManyTenants) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <TenantStatusDot status={currentTenant.status} />
        <span className="truncate text-sm font-medium">{currentTenant.name}</span>
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
          {currentTenant.role}
        </Badge>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          aria-label="Switch tenant"
        >
          <TenantStatusDot status={currentTenant.status} />
          <span className="truncate font-medium">{currentTenant.name}</span>
          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
            {currentTenant.role}
          </Badge>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="w-64 p-0">
        {/* Tenant list */}
        <div className="max-h-60 overflow-y-auto p-1">
          {tenants.map((tenant) => {
            const isCurrent = tenant.id === currentTenant.id;
            return (
              <button
                key={tenant.id}
                onClick={() => {
                  if (!isCurrent) {
                    switchTenant(tenant.id);
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                }`}
              >
                <TenantStatusDot status={tenant.status} />
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="truncate font-medium w-full text-left">{tenant.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {tenant.memberCount}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  {tenant.role}
                </Badge>
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-1">
          <Link
            href="/tenants"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings2 className="size-4 text-muted-foreground" />
            Manage Tenants
          </Link>

          {isAdmin && (
            <Link
              href="/tenants?create=true"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Plus className="size-4 text-muted-foreground" />
              Create Tenant
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
