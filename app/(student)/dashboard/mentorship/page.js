import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import MentorshipClient from "./MentorshipClient";

export default async function MentorshipPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/onboarding");

  const where = user.role === "STUDENT"
    ? { studentId: user.id }
    : { alumniId: user.id };

  const requests = await db.mentorshipRequest.findMany({
    where,
    include: {
      student: { include: { studentProfile: true } },
      alumni: { include: { alumniProfile: true } },
      conversation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MentorshipClient requests={requests} role={user.role} userId={user.id} />
  );
}
