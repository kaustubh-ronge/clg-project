import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

export default async function SyncUserPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
    const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || email.split("@")[0] || "User";

    // 1. Check if user exists by clerkId or email
    let user = await db.user.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true, role: true, accountStatus: true, clerkId: true },
    });

    // 2. If user doesn't exist, create them
    if (!user) {
      user = await db.user.create({
        data: {
          clerkId: userId,
          email,
          name,
          avatarUrl: clerkUser?.imageUrl ?? null,
          role: "UNASSIGNED",
          accountStatus: "PENDING_REGISTRATION",
        },
        select: { id: true, role: true, accountStatus: true, clerkId: true },
      });
    } else if (user.clerkId !== userId) {
      // Re-link clerkId if user re-registered or session changed
      user = await db.user.update({
        where: { id: user.id },
        data: {
          clerkId: userId,
          avatarUrl: clerkUser?.imageUrl ?? null,
          ...(name ? { name } : {}),
        },
        select: { id: true, role: true, accountStatus: true, clerkId: true },
      });
    }

    // 3. Route based on role and status
    if (user.role === "ADMIN") {
      redirect("/admin");
    } else if (user.accountStatus === "ACTIVE") {
      redirect("/dashboard");
    } else {
      redirect("/");
    }
  } catch (error) {
    // Re-throw Next.js redirect errors (Next.js redirect works by throwing)
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Auth sync error:", error);
    redirect("/");
  }
}
