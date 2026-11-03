import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/mentors — list verified alumni mentors with filters
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const industry = searchParams.get("industry");
    const organization = searchParams.get("organization");
    const search = searchParams.get("search");

    const mentors = await db.user.findMany({
      where: {
        role: "ALUMNI",
        alumniProfile: {
          verificationStatus: "VERIFIED",
          ...(industry && { industry }),
          ...(organization && { organization: { contains: organization, mode: "insensitive" } }),
        },
        ...(department && { department }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { alumniProfile: { organization: { contains: search, mode: "insensitive" } } },
            { alumniProfile: { industry: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        alumniProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error("GET /api/mentors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
