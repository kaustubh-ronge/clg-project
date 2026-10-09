import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { studentProfile: true, alumniProfile: true },
  });

  if (!user) redirect("/onboarding");

  const pendingRequest = await db.profileUpdateRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });

  return <ProfileClient user={user} pendingRequest={pendingRequest} />;
}
