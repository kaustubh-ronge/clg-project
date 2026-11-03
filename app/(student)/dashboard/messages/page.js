import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/onboarding");

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ studentId: user.id }, { alumniId: user.id }],
    },
    include: {
      student: true,
      alumni: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <MessagesClient conversations={conversations} currentUserId={user.id} />;
}
