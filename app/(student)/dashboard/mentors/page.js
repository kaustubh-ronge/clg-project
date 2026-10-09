import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import MentorsClient from "./MentorsClient";

export default async function MentorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/onboarding");

  // Get all verified mentors
  const mentors = await db.user.findMany({
    where: {
      role: "ALUMNI",
      alumniProfile: { verificationStatus: "VERIFIED" },
    },
    include: { alumniProfile: true },
    orderBy: { createdAt: "desc" },
  });

  // Get existing requests by this student
  const existingRequests =
    user.role === "STUDENT"
      ? await db.mentorshipRequest.findMany({
          where: { studentId: user.id },
          select: { alumniId: true },
        })
      : [];

  const requestedAlumniIds = new Set(existingRequests.map((r) => r.alumniId));

  // Get recommendations if student
  let recommendations = [];
  if (user.role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
    if (studentProfile) {
      const { recommendations: recs } = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mentors/recommendations`,
        { headers: { Cookie: "" }, cache: "no-store" }
      )
        .then((r) => r.json())
        .catch(() => ({ recommendations: [] }));
      recommendations = recs;
    }
  }

  const uniqueDepartments = [...new Set(mentors.map((m) => m.department).filter(Boolean))];
  const uniqueIndustries = [...new Set(mentors.map((m) => m.alumniProfile?.industry).filter(Boolean))];

  return (
    <MentorsClient
      mentors={mentors}
      recommendations={recommendations}
      requestedAlumniIds={[...requestedAlumniIds]}
      isStudent={user.role === "STUDENT"}
      departments={uniqueDepartments}
      industries={uniqueIndustries}
    />
  );
}
