import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/internships — list internships (with optional department filter)
export async function GET(request) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    const internships = await db.internship.findMany({
      where: {
        ...(department && { department }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        postedBy: { select: { id: true, name: true, avatarUrl: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ internships });
  } catch (error) {
    console.error("GET /api/internships error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/internships — alumni posts an internship
export async function POST(request) {
  try {
    const { user: alumni, error } = await requireActiveUser();
    if (error) return error;
    if (!alumni || alumni.role !== "ALUMNI") {
      return NextResponse.json({ error: "Only alumni can post internships" }, { status: 403 });
    }

    const body = await request.json();
    const { title, company, description, location, type, duration, stipend, applyLink, applyEmail, skills, department, deadline } = body;

    const internship = await db.internship.create({
      data: {
        postedById: alumni.id,
        title, company, description,
        location: location || null,
        type: type || null,
        duration: duration || null,
        stipend: stipend || null,
        applyLink: applyLink || null,
        applyEmail: applyEmail || null,
        skills: skills || [],
        department: department || null,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: { postedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ internship }, { status: 201 });
  } catch (error) {
    console.error("POST /api/internships error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
