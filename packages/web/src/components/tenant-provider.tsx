"use client";
import { createContext, useContext, type ReactNode } from "react";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  role: string;
  memberCount: number;
}

interface TenantContextValue {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({
  currentTenant: null,
  tenants: [],
  switchTenant: async () => {},
});

export function useTenant() {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  children: ReactNode;
  initialTenantId: string | null;
  initialTenants: Tenant[];
}

export function TenantProvider({ children, initialTenantId, initialTenants }: TenantProviderProps) {
  const currentTenant =
    initialTenants.find((t) => t.id === initialTenantId) ?? initialTenants[0] ?? null;

  const switchTenant = async (tenantId: string) => {
    const res = await fetch(`/api/tenants/${tenantId}/switch`, { method: "POST" });
    if (res.ok) {
      window.location.href = "/";
    }
  };

  return (
    <TenantContext.Provider value={{ currentTenant, tenants: initialTenants, switchTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
