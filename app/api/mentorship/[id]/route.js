import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// PATCH /api/mentorship/[id] — alumni accepts or declines a request
export async function PATCH(request, { params }) {
  try {
    const { user: alumni, error } = await requireActiveUser();
    if (error) return error;

    const { id } = await params;
    const { status } = await request.json(); // "ACCEPTED" | "DECLINED"

    const mentorshipRequest = await db.mentorshipRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!mentorshipRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (mentorshipRequest.alumniId !== alumni.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.mentorshipRequest.update({
      where: { id },
      data: { status },
    });

    // If accepted, create a conversation
    if (status === "ACCEPTED") {
      await db.conversation.upsert({
        where: { mentorshipRequestId: id },
        update: {},
        create: {
          studentId: mentorshipRequest.studentId,
          alumniId: mentorshipRequest.alumniId,
          mentorshipRequestId: id,
        },
      });
    }

    // Notify student
    await db.notification.create({
      data: {
        userId: mentorshipRequest.studentId,
        type: status === "ACCEPTED" ? "MENTORSHIP_ACCEPTED" : "MENTORSHIP_DECLINED",
        title: status === "ACCEPTED" ? "Mentorship Accepted! 🎉" : "Mentorship Request Declined",
        message:
          status === "ACCEPTED"
            ? `${alumni.name} accepted your mentorship request. You can now chat!`
            : `${alumni.name} has declined your mentorship request.`,
        link: "/dashboard/mentorship",
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("PATCH /api/mentorship/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/mentorship/[id] — student withdraws a pending request
export async function DELETE(request, { params }) {
  try {
    const { user: student, error } = await requireActiveUser();
    if (error) return error;

    const { id } = await params;

    const mentorshipRequest = await db.mentorshipRequest.findUnique({ where: { id } });
    if (!mentorshipRequest || mentorshipRequest.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.mentorshipRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/mentorship/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
