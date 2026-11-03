import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser, requireAdmin } from "@/lib/authChecks";

// GET /api/events
export async function GET(request) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const events = await db.event.findMany({
      where: {
        ...(department && {
          OR: [{ department }, { department: null }],
        }),
      },
      include: {
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { date: "asc" },
    });

    const eventsWithRsvp = events.map((event) => ({
      ...event,
      isRsvped: user ? event.attendees.some((a) => a.userId === user.id) : false,
      attendeeCount: event.attendees.length,
    }));

    return NextResponse.json({ events: eventsWithRsvp });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/events — admin creates an event
export async function POST(request) {
  try {
    const { user: adminUser, error } = await requireAdmin();
    if (error) return error;
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create events" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, endDate, type, department, venue, onlineLink } = body;

    const event = await db.event.create({
      data: {
        title, description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        type, venue: venue || null,
        onlineLink: onlineLink || null,
        department: department || null,
        createdById: adminUser.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
