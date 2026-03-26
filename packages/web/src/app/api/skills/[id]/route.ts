import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { skills } from "@/db/schema";

// audit-exempt: skills are personal user data, not admin actions

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, id), eq(skills.userId, session.user.id!)));

  if (!existing) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  if (body.prompt !== undefined) {
    if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
    }
    data.prompt = body.prompt.trim();
  }
  if (body.icon !== undefined) {
    data.icon = body.icon?.trim() || null;
  }
  if (body.sortOrder !== undefined) {
    data.sortOrder = body.sortOrder;
  }

  const [updated] = await db
    .update(skills)
    .set(data)
    .where(and(eq(skills.id, id), eq(skills.userId, session.user.id!)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, id), eq(skills.userId, session.user.id!)));

  if (!existing) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await db
    .delete(skills)
    .where(and(eq(skills.id, id), eq(skills.userId, session.user.id!)));

  return NextResponse.json({ success: true });
}
