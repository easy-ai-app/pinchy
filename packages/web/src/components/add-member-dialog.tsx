"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  existingMemberIds: string[];
  onAdded: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  tenantId,
  existingMemberIds,
  onAdded,
}: AddMemberDialogProps) {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [role, setRole] = useState<string>("member");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedUser(null);
      setRole("member");
      setError(null);
      return;
    }

    setLoadingUsers(true);
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const list: PlatformUser[] = (data.users || []).map(
          (u: { id: string; name: string; email: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          })
        );
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const existingSet = useMemo(() => new Set(existingMemberIds), [existingMemberIds]);

  const available = useMemo(() => {
    return users.filter((u) => !existingSet.has(u.id));
  }, [users, existingSet]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [available, search]);

  async function handleAdd() {
    if (!selectedUser) {
      setError("Select a user first");
      return;
    }

    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role }),
      });
      if (res.ok) {
        toast.success(`${selectedUser.name || "User"} added`);
        onAdded();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add member");
      }
    } catch {
      setError("Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search for a platform user to add to this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-search">Search</Label>
            <Input
              id="member-search"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto rounded-md border">
            {loadingUsers ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 rounded-md" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                {available.length === 0
                  ? "All platform users are already members."
                  : "No matching users found."}
              </p>
            ) : (
              filtered.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Role selection */}
          {selectedUser && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUser || adding}>
            {adding ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
