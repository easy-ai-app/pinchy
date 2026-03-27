"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantStatusDot } from "@/components/tenant-status-dot";
import { CreateTenantDialog } from "@/components/create-tenant-dialog";
import { TenantMembersSheet } from "@/components/tenant-members-sheet";
import { toast } from "sonner";
import { Users, Pencil, Trash2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
  role: string;
  memberCount: number;
}

interface TenantsPageContentProps {
  openCreateDialog: boolean;
  currentUserId: string;
}

export function TenantsPageContent({ openCreateDialog, currentUserId }: TenantsPageContentProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(openCreateDialog);
  const [membersSheet, setMembersSheet] = useState<Tenant | null>(null);
  const [renameTenant, setRenameTenant] = useState<Tenant | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data: Tenant[] = await res.json();
        setTenants(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Poll every 3s if any tenant is provisioning or deleting
  useEffect(() => {
    const needsPoll = tenants.some((t) => t.status === "provisioning" || t.status === "deleting");

    if (needsPoll) {
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchTenants, 3000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tenants, fetchTenants]);

  async function handleSwitchTenant(tenant: Tenant) {
    if (tenant.status !== "running") return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/switch`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to switch tenant");
      }
    } catch {
      toast.error("Failed to switch tenant");
    }
  }

  async function handleRename() {
    if (!renameTenant) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Name is required");
      return;
    }
    if (trimmed.length > 100) {
      setRenameError("Name must be 100 characters or less");
      return;
    }

    setRenameError(null);
    setRenaming(true);
    try {
      const res = await fetch(`/api/tenants/${renameTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        toast.success("Tenant renamed");
        setRenameTenant(null);
        fetchTenants();
      } else {
        const data = await res.json();
        setRenameError(data.error || "Failed to rename tenant");
      }
    } catch {
      setRenameError("Failed to rename tenant");
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!deleteTenant) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${deleteTenant.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Tenant deleted");
        setDeleteTenant(null);
        setDeleteConfirmSlug("");
        fetchTenants();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete tenant");
      }
    } catch {
      toast.error("Failed to delete tenant");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Button onClick={() => setCreateOpen(true)}>Create Workspace</Button>
      </div>

      {/* Tenant grid */}
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No workspaces yet. Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                tenant.status !== "running" ? "opacity-70 cursor-default" : ""
              }`}
              onClick={() => handleSwitchTenant(tenant)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{tenant.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono mt-1 truncate">
                      {tenant.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <TenantStatusDot status={tenant.status} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {tenant.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{tenant.role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {tenant.memberCount} {tenant.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                {tenant.status === "error" && tenant.errorMessage && (
                  <p className="text-sm text-destructive mt-2 line-clamp-2">
                    {tenant.errorMessage}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMembersSheet(tenant);
                    }}
                  >
                    <Users className="size-4" />
                    Members
                  </Button>

                  {(tenant.role === "owner" || tenant.role === "admin") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameValue(tenant.name);
                        setRenameError(null);
                        setRenameTenant(tenant);
                      }}
                    >
                      <Pencil className="size-4" />
                      Rename
                    </Button>
                  )}

                  {tenant.role === "owner" && tenants.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmSlug("");
                        setDeleteTenant(tenant);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          fetchTenants();
        }}
      />

      {/* Members sheet */}
      {membersSheet && (
        <TenantMembersSheet
          tenant={membersSheet}
          currentUserId={currentUserId}
          open={!!membersSheet}
          onOpenChange={(open) => !open && setMembersSheet(null)}
          onChanged={fetchTenants}
        />
      )}

      {/* Rename dialog */}
      <Dialog
        open={!!renameTenant}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTenant(null);
            setRenameError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
            <DialogDescription>Enter a new name for this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !renaming) handleRename();
              }}
            />
            {renameError && <p className="text-sm text-destructive">{renameError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameTenant(null);
                setRenameError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renaming}>
              {renaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTenant}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTenant(null);
            setDeleteConfirmSlug("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data in this workspace will be permanently deleted.
              Type <span className="font-mono font-semibold">{deleteTenant?.slug}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Type workspace slug to confirm"
            value={deleteConfirmSlug}
            onChange={(e) => setDeleteConfirmSlug(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteTenant(null);
                setDeleteConfirmSlug("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteConfirmSlug !== deleteTenant?.slug || deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete Workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
