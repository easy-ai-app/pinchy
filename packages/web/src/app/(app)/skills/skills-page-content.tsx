"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useSkillsStore, type Skill } from "@/hooks/use-skills";

export function SkillsPageContent() {
  const { skills, isLoaded, fetchSkills, createSkill, updateSkill, deleteSkill } =
    useSkillsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isLoaded) {
      fetchSkills();
    }
  }, [isLoaded, fetchSkills]);

  function openCreateDialog() {
    setEditingSkill(null);
    setFormName("");
    setFormDescription("");
    setFormPrompt("");
    setFormIcon("");
    setFormError("");
    setDialogOpen(true);
  }

  function openEditDialog(skill: Skill) {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormDescription(skill.description ?? "");
    setFormPrompt(skill.prompt);
    setFormIcon(skill.icon ?? "");
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!formPrompt.trim()) {
      setFormError("Prompt is required");
      return;
    }

    setSaving(true);
    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
          prompt: formPrompt.trim(),
          icon: formIcon.trim() || null,
        });
        toast.success("Skill updated");
      } else {
        await createSkill({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          prompt: formPrompt.trim(),
          icon: formIcon.trim() || undefined,
        });
        toast.success("Skill created");
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSkill(deleteId);
      toast.success("Skill deleted");
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeleteId(null);
    }
  }

  const personalSkills = skills.filter((s) => !s.isShared);
  const sharedSkills = skills.filter((s) => s.isShared);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Saved prompt templates you can quickly invoke in chat.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-2" />
          New Skill
        </Button>
      </div>

      {!isLoaded ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No skills yet. Create your first skill to use it in chat.
            </p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="size-4 mr-2" />
              Create Skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {personalSkills.length > 0 && (
            <div className="space-y-3">
              {sharedSkills.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  My Skills
                </h2>
              )}
              {personalSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={() => openEditDialog(skill)}
                  onDelete={() => setDeleteId(skill.id)}
                />
              ))}
            </div>
          )}

          {sharedSkills.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Shared Skills
              </h2>
              {sharedSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={() => openEditDialog(skill)}
                  onDelete={() => setDeleteId(skill.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Edit Skill" : "New Skill"}</DialogTitle>
            <DialogDescription>
              {editingSkill
                ? "Update your skill's details."
                : "Create a reusable prompt template."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g. Summarize"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-description">Description (optional)</Label>
              <Input
                id="skill-description"
                placeholder="e.g. Summarize the selected text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-icon">Icon (optional)</Label>
              <Input
                id="skill-icon"
                placeholder="e.g. an emoji like ✨ or 📝"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-prompt">Prompt</Label>
              <Textarea
                id="skill-prompt"
                placeholder="e.g. Summarize the following text in 3 bullet points:"
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={4}
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingSkill ? "Save Changes" : "Create Skill"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SkillCard({
  skill,
  onEdit,
  onDelete,
}: {
  skill: Skill;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex-shrink-0 text-2xl w-8 text-center">
          {skill.icon || <Zap className="size-5 text-muted-foreground mt-0.5 mx-auto" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{skill.name}</h3>
            {skill.isShared && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Shared
              </span>
            )}
          </div>
          {skill.description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{skill.description}</p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 font-mono">
            {skill.prompt}
          </p>
        </div>
        {!skill.isShared && (
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit} title="Edit skill">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Delete skill">
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
