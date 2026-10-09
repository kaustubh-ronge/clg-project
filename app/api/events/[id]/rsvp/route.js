import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// POST /api/events/[id]/rsvp — toggle RSVP for an event
export async function POST(request, { params }) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const { id } = await params;

    const existing = await db.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: user.id } },
    });

    if (existing) {
      await db.eventAttendee.delete({ where: { id: existing.id } });
      return NextResponse.json({ rsvped: false });
    } else {
      await db.eventAttendee.create({ data: { eventId: id, userId: user.id } });
      return NextResponse.json({ rsvped: true });
    }
  } catch (error) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
