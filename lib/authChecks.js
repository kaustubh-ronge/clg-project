import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * Ensures the user is logged in and has an ACTIVE account status.
 * Use this for all student/alumni protected API routes.
 */
export async function requireActiveUser() {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 }) };
  }

  if (user.role === "ADMIN") {
    return { user };
  }

  if (user.accountStatus !== "ACTIVE") {
    return { error: NextResponse.json({ error: "ACCOUNT_REVOKED" }, { status: 403 }) };
  }

  return { user };
}

/**
 * Ensures the user is logged in and has the ADMIN role.
 * Use this for all admin protected API routes.
 */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 }) };
  }

  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  return { user };
}
