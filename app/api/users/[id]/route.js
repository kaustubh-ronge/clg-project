import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/users/[id] — get a specific user's public profile
export async function GET(request, { params }) {
  try {
    const { user: requestingUser, error } = await requireActiveUser();
    if (error) return error;

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        alumniProfile: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/users/[id] — update own profile
export async function PATCH(request, { params }) {
  try {
    const { user: currentUser, error } = await requireActiveUser();
    if (error) return error;

    const { id } = await params;

    // Ensure user can only update their own profile
    if (currentUser.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, department, graduationYear, studentProfile, alumniProfile } = body;

    // Update base user (removed)
    // Critical fields like name, department, graduationYear are no longer updated here.
    // They must go through the ProfileUpdateRequest flow.

    // Update role profile
    if (studentProfile && currentUser.role === "STUDENT") {
      await db.studentProfile.update({
        where: { userId: id },
        data: {
          ...(studentProfile.skills && { skills: studentProfile.skills }),
          ...(studentProfile.interests && { interests: studentProfile.interests }),
          ...(studentProfile.careerGoals !== undefined && { careerGoals: studentProfile.careerGoals }),
          ...(studentProfile.bio !== undefined && { bio: studentProfile.bio }),
          ...(studentProfile.linkedinUrl !== undefined && { linkedinUrl: studentProfile.linkedinUrl }),
          ...(studentProfile.githubUrl !== undefined && { githubUrl: studentProfile.githubUrl }),
        },
      });
    }

    if (alumniProfile && currentUser.role === "ALUMNI") {
      await db.alumniProfile.update({
        where: { userId: id },
        data: {
          ...(alumniProfile.industry !== undefined && { industry: alumniProfile.industry }),
          ...(alumniProfile.organization !== undefined && { organization: alumniProfile.organization }),
          ...(alumniProfile.jobTitle !== undefined && { jobTitle: alumniProfile.jobTitle }),
          ...(alumniProfile.expertiseAreas && { expertiseAreas: alumniProfile.expertiseAreas }),
          ...(alumniProfile.bio !== undefined && { bio: alumniProfile.bio }),
          ...(alumniProfile.linkedinUrl !== undefined && { linkedinUrl: alumniProfile.linkedinUrl }),
          ...(alumniProfile.yearsOfExperience !== undefined && { yearsOfExperience: parseInt(alumniProfile.yearsOfExperience) }),
        },
      });
    }

    const user = await db.user.findUnique({
      where: { id },
      include: { studentProfile: true, alumniProfile: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
