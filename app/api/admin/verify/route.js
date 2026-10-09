import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authChecks";

// GET /api/admin/verify — list all pending alumni
export async function GET() {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const pendingAlumni = await db.user.findMany({
      where: {
        role: "ALUMNI",
        alumniProfile: { verificationStatus: "PENDING" },
      },
      include: { alumniProfile: true },
      orderBy: { createdAt: "asc" },
    });

    const allAlumni = await db.user.findMany({
      where: { role: "ALUMNI" },
      include: { alumniProfile: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pendingAlumni, allAlumni });
  } catch (error) {
    console.error("GET /api/admin/verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/verify — verify or reject an alumni
export async function PATCH(request) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { alumniId, status } = await request.json(); // "VERIFIED" | "REJECTED"

    const alumniProfile = await db.alumniProfile.update({
      where: { userId: alumniId },
      data: { verificationStatus: status },
    });

    // Notify alumni
    await db.notification.create({
      data: {
        userId: alumniId,
        type: "ADMIN_VERIFIED",
        title: status === "VERIFIED" ? "Account Verified ✅" : "Verification Rejected",
        message:
          status === "VERIFIED"
            ? "Your alumni account has been verified. You can now mentor students!"
            : "Your alumni verification was rejected. Please contact the admin for more details.",
        link: "/dashboard",
      },
    });

    return NextResponse.json({ alumniProfile });
  } catch (error) {
    console.error("PATCH /api/admin/verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
