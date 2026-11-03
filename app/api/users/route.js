import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// POST /api/users — create or update user after onboarding
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    const body = await request.json();
    const { role, department, graduationYear, name } = body;

    // Upsert user
    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: { role, department, graduationYear: graduationYear ? parseInt(graduationYear) : null },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: name || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        avatarUrl: clerkUser.imageUrl,
        role,
        department,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
      },
    });

    // Create role-specific profile if it doesn't exist
    if (role === "STUDENT") {
      await db.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    } else if (role === "ALUMNI") {
      await db.alumniProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/users — get current logged-in user
export async function GET() {
  try {
    const { user: activeUser, error } = await requireActiveUser();
    if (error) return error;

    const user = await db.user.findUnique({
      where: { id: activeUser.id },
      include: { studentProfile: true, alumniProfile: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
