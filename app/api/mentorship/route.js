import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/mentorship — get mentorship requests for current user
export async function GET() {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const where =
      user.role === "STUDENT"
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

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("GET /api/mentorship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/mentorship — student sends a mentorship request
export async function POST(request) {
  try {
    const { user: student, error } = await requireActiveUser();
    if (error) return error;
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can send requests" }, { status: 403 });
    }

    const { alumniId, message } = await request.json();

    // Verify alumni exists and is verified
    const alumni = await db.user.findUnique({
      where: { id: alumniId },
      include: { alumniProfile: true },
    });

    if (!alumni || alumni.role !== "ALUMNI") {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    if (alumni.alumniProfile?.verificationStatus !== "VERIFIED") {
      return NextResponse.json({ error: "This mentor is not yet verified" }, { status: 400 });
    }

    const mentorshipRequest = await db.mentorshipRequest.create({
      data: {
        studentId: student.id,
        alumniId,
        message,
        status: "PENDING",
      },
    });

    // Create notification for alumni
    await db.notification.create({
      data: {
        userId: alumniId,
        type: "MENTORSHIP_REQUEST",
        title: "New Mentorship Request",
        message: `${student.name} has sent you a mentorship request.`,
        link: "/dashboard/mentorship",
      },
    });

    return NextResponse.json({ request: mentorshipRequest }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You already sent a request to this mentor" }, { status: 409 });
    }
    console.error("POST /api/mentorship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
