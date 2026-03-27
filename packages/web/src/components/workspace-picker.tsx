"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface WorkspaceTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: string;
}

function StatusIndicator({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <span className="inline-block h-2 w-2 rounded-full bg-green-500" />;
    case "provisioning":
      return <Loader2 className="h-3 w-3 animate-spin text-amber-500" />;
    case "error":
      return <span className="inline-block h-2 w-2 rounded-full bg-red-500" />;
    default:
      return <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />;
  }
}

function WorkspaceCard({
  tenant,
  switching,
  onSwitch,
}: {
  tenant: WorkspaceTenant;
  switching: boolean;
  onSwitch: (id: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => !switching && onSwitch(tenant.id)}
    >
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIndicator status={tenant.status} />
          <div>
            <p className="font-medium">{tenant.name}</p>
            <p className="text-muted-foreground text-sm">{tenant.slug}</p>
          </div>
        </div>
        <Badge variant="secondary">{tenant.role}</Badge>
      </CardContent>
    </Card>
  );
}

export function WorkspacePicker({ tenants }: { tenants: WorkspaceTenant[] }) {
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSwitch = async (tenantId: string) => {
    setSwitchingId(tenantId);
    const res = await fetch(`/api/tenants/${tenantId}/switch`, { method: "POST" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setSwitchingId(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Choose your workspace</h1>
          <p className="text-muted-foreground mt-2">Select a workspace to continue</p>
        </div>
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <WorkspaceCard
              key={tenant.id}
              tenant={tenant}
              switching={switchingId === tenant.id}
              onSwitch={handleSwitch}
            />
          ))}
        </div>
        {switchingId && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Switching workspace...
          </div>
        )}
      </div>
    </div>
  );
}
