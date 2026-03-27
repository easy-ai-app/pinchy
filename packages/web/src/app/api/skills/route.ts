import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, asc, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { getTenantId } from "@/lib/tenant-context";

// audit-exempt: skills are personal user data, not admin actions

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const userSkills = await db
    .select()
    .from(skills)
    .where(
      and(
        eq(skills.tenantId, tenantId),
        or(eq(skills.userId, session.user.id!), eq(skills.isShared, true))
      )
    )
    .orderBy(asc(skills.isShared), asc(skills.sortOrder), desc(skills.createdAt));

  return NextResponse.json(userSkills);
}

export async function POST(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await getTenantId(request, session.user.id!);
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const body = await request.json();
  const { name, description, prompt, icon } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const [skill] = await db
    .insert(skills)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      prompt: prompt.trim(),
      icon: icon?.trim() || null,
      userId: session.user.id!,
      tenantId,
    })
    .returning();

  return NextResponse.json(skill, { status: 201 });
}
