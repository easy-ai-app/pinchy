"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

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
  refreshTenants: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;

const TenantContext = createContext<TenantContextValue>({
  currentTenant: null,
  tenants: [],
  switchTenant: async () => {},
  refreshTenants: async () => {},
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
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);

  // Sync with SSR prop changes (e.g. after router.refresh())
  const [prevInitial, setPrevInitial] = useState(initialTenants);
  if (initialTenants !== prevInitial) {
    setPrevInitial(initialTenants);
    setTenants(initialTenants);
  }

  const currentTenant = tenants.find((t) => t.id === initialTenantId) ?? tenants[0] ?? null;

  const refreshTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data: Tenant[] = await res.json();
        setTenants(data);
      }
    } catch {
      // Keep current tenants on network error
    }
  }, []);

  // Poll every 30s + on window focus
  useEffect(() => {
    const interval = setInterval(refreshTenants, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshTenants);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshTenants);
    };
  }, [refreshTenants]);

  const switchTenant = async (tenantId: string) => {
    const res = await fetch(`/api/tenants/${tenantId}/switch`, { method: "POST" });
    if (res.ok) {
      window.location.href = "/";
    }
  };

  return (
    <TenantContext.Provider value={{ currentTenant, tenants, switchTenant, refreshTenants }}>
      {children}
    </TenantContext.Provider>
  );
}
