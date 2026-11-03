import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import InternshipsClient from "./InternshipsClient";

export default async function InternshipsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/onboarding");

  const internships = await db.internship.findMany({
    include: { postedBy: { select: { id: true, name: true, avatarUrl: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <InternshipsClient internships={internships} isAlumni={user.role === "ALUMNI"} />;
}
