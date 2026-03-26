import { requireAuth } from "@/lib/require-auth";
import { SkillsPageContent } from "./skills-page-content";

export default async function SkillsPage() {
  await requireAuth();
  return <SkillsPageContent />;
}
