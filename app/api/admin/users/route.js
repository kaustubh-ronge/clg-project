import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authChecks";

export async function DELETE(request) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
    }

    // Find the user to get their clerkId
    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Delete from Prisma (Cascades to profiles, requests, etc. if schema is set up)
    await db.user.delete({ where: { id: targetUserId } });

    // 2. Delete from Clerk so they can't just log back in with the same account silently
    try {
      const client = await clerkClient();
      await client.users.deleteUser(targetUser.clerkId);
    } catch (clerkErr) {
      console.error("Failed to delete user from Clerk:", clerkErr);
      // Even if Clerk deletion fails, we've deleted them from our DB.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
