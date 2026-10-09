import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

export default async function SyncUserPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // 1. Check if user already exists
  let user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, accountStatus: true }
  });

  // 2. If not, create them immediately with UNASSIGNED role
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
    const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() || email.split("@")[0];

    user = await db.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        avatarUrl: clerkUser?.imageUrl ?? null,
        role: "UNASSIGNED",
        accountStatus: "PENDING_REGISTRATION",
      },
    });
  }

  // 3. Route based on role and status
  if (user.role === "ADMIN") {
    redirect("/admin");
  } else if (user.accountStatus === "ACTIVE") {
    redirect("/dashboard");
  } else {
    // Unassigned or Pending/Rejected -> Homepage (where they will see "Complete your profile")
    redirect("/");
  }
}
