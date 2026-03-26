import { create } from "zustand";

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  icon: string | null;
  userId: string;
  isShared: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SkillsStore {
  skills: Skill[];
  isLoaded: boolean;
  fetchSkills: () => Promise<void>;
  createSkill: (data: {
    name: string;
    description?: string;
    prompt: string;
    icon?: string;
  }) => Promise<Skill>;
  updateSkill: (
    id: string,
    data: Partial<Pick<Skill, "name" | "description" | "prompt" | "icon" | "sortOrder">>
  ) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  skills: [],
  isLoaded: false,

  fetchSkills: async () => {
    const res = await fetch("/api/skills");
    if (res.ok) {
      const skills = await res.json();
      set({ skills, isLoaded: true });
    }
  },

  createSkill: async (data) => {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create skill");
    }
    const skill = await res.json();
    set((s) => ({ skills: [skill, ...s.skills] }));
    return skill;
  },

  updateSkill: async (id, data) => {
    const res = await fetch(`/api/skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update skill");
    }
    const updated = await res.json();
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? updated : sk)),
    }));
  },

  deleteSkill: async (id) => {
    const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete skill");
    }
    set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) }));
  },
}));
