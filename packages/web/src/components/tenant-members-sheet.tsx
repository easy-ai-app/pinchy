"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";

interface TenantForSheet {
  id: string;
  name: string;
  role: string;
}

interface Member {
  userId: string;
  role: string;
  joinedAt: string;
  userName: string;
  userEmail: string;
}

interface TenantMembersSheetProps {
  tenant: TenantForSheet;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function TenantMembersSheet({
  tenant,
  currentUserId,
  open,
  onOpenChange,
  onChanged,
}: TenantMembersSheetProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  const isOwner = tenant.role === "owner";

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/members`);
      if (res.ok) {
        const data: Member[] = await res.json();
        setMembers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchMembers();
    }
  }, [open, fetchMembers]);

  async function handleRemove() {
    if (!removeMember) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/members/${removeMember.userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${removeMember.userName || "Member"} removed`);
        setRemoveMember(null);
        fetchMembers();
        onChanged();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoving(false);
    }
  }

  async function handleRoleChange(member: Member, newRole: string) {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/members/${member.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`Role updated to ${newRole}`);
        fetchMembers();
        onChanged();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    }
  }

  const canManageMembers = tenant.role === "owner" || tenant.role === "admin";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Members - {tenant.name}</SheetTitle>
            <SheetDescription>Manage who has access to this workspace.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {canManageMembers && (
              <div className="mb-4">
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  Add Member
                </Button>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelf = member.userId === currentUserId;
                  const isMemberOwner = member.role === "owner";
                  const canChangeRole = isOwner && !isMemberOwner && !isSelf;
                  const canRemove = canManageMembers && !isMemberOwner && !isSelf;

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {member.userName || "Unnamed"}
                          {isSelf && <span className="text-muted-foreground ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canChangeRole ? (
                          <Select
                            value={member.role}
                            onValueChange={(val) => handleRoleChange(member, val)}
                          >
                            <SelectTrigger size="sm" className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">admin</SelectItem>
                              <SelectItem value="member">member</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{member.role}</Badge>
                        )}

                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setRemoveMember(member)}
                            title={`Remove ${member.userName}`}
                          >
                            <UserMinus className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Remove confirmation */}
      <AlertDialog
        open={!!removeMember}
        onOpenChange={(open) => {
          if (!open) setRemoveMember(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{removeMember?.userName || "this member"}</span> from
              this workspace? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveMember(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
            >
              {removing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add member dialog */}
      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tenantId={tenant.id}
        existingMemberIds={members.map((m) => m.userId)}
        onAdded={() => {
          setAddOpen(false);
          fetchMembers();
          onChanged();
        }}
      />
    </>
  );
}
