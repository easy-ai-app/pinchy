import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require platform admin
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email || email.trim().length === 0) {
    return NextResponse.json({ error: "email query parameter is required" }, { status: 400 });
  }

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(ilike(users.email, `%${email.trim()}%`))
    .limit(10);

  return NextResponse.json(results);
}
