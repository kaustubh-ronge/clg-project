import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = await db.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const includeUser = { user: { select: { id: true, email: true, avatarUrl: true } } };
  const orderByCreated = { orderBy: { createdAt: "asc" } };

  const [
    pendingRegistrations,
    approvedRegistrations,
    rejectedRegistrations,
    allUsers,
    pendingUpdateRequests,
    statParts,
  ] = await Promise.all([
    db.registrationRequest.findMany({
      where: { status: "PENDING" },
      include: includeUser,
      orderBy: { createdAt: "asc" },
    }),
    db.registrationRequest.findMany({
      where: { status: "VERIFIED" },
      include: includeUser,
      orderBy: { createdAt: "desc" },
    }),
    db.registrationRequest.findMany({
      where: { status: "REJECTED" },
      include: includeUser,
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      include: { alumniProfile: true, studentProfile: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.profileUpdateRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "asc" },
    }),
    Promise.all([
      db.user.count({ where: { role: "STUDENT", accountStatus: "ACTIVE" } }),
      db.user.count({ where: { role: "ALUMNI", accountStatus: "ACTIVE" } }),
      db.alumniProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      db.mentorshipRequest.count(),
      db.event.count(),
      db.internship.count(),
      db.registrationRequest.count({ where: { status: "PENDING" } }),
      db.profileUpdateRequest.count({ where: { status: "PENDING" } }),
    ]),
  ]);

  const [students, alumni, verified, mentorships, events, internships, pendingReg, pendingUpdates] = statParts;
  const stats = { students, alumni, verified, mentorships, events, internships, pendingReg, pendingUpdates };

  return (
    <AdminClient
      pendingRegistrations={pendingRegistrations}
      approvedRegistrations={approvedRegistrations}
      rejectedRegistrations={rejectedRegistrations}
      allUsers={allUsers}
      pendingUpdateRequests={pendingUpdateRequests}
      stats={stats}
    />
  );
}

