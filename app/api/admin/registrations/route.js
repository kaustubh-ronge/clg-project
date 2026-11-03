import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authChecks";

// GET /api/admin/registrations — list all registration requests
export async function GET(request) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const requests = await db.registrationRequest.findMany({
      where: status === "ALL" ? {} : { status },
      include: { user: { select: { id: true, clerkId: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("GET /api/admin/registrations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/registrations — approve, reject, revoke, or reconsider a registration
export async function PATCH(request) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { requestId, action, rejectionReason, revocationReason } = await request.json();
    // action: "APPROVE" | "REJECT" | "REVOKE" | "RECONSIDER"

    const regRequest = await db.registrationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!regRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "APPROVE" || action === "RECONSIDER") {
      await db.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: "VERIFIED",
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });

      const isAlumni =
        regRequest.studentStatus === "ALUMNI" ||
        regRequest.studentStatus === "PASSOUT";

      await db.user.update({
        where: { id: regRequest.userId },
        data: {
          accountStatus: "ACTIVE",
          name: regRequest.fullName,
          department: regRequest.department || undefined,
          graduationYear: regRequest.passingYear || undefined,
          role: isAlumni ? "ALUMNI" : "STUDENT",
        },
      });

      if (isAlumni) {
        await db.alumniProfile.upsert({
          where: { userId: regRequest.userId },
          update: {},
          create: { userId: regRequest.userId, verificationStatus: "VERIFIED" },
        });
      } else {
        await db.studentProfile.upsert({
          where: { userId: regRequest.userId },
          update: {},
          create: { userId: regRequest.userId },
        });
      }

      await db.notification.create({
        data: {
          userId: regRequest.userId,
          type: "ADMIN_VERIFIED",
          title: "Registration Approved! 🎉",
          message: "Your EduBridge registration has been approved. Welcome aboard!",
          link: "/dashboard",
        },
      });

    } else if (action === "REJECT") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
      }

      await db.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });

      await db.user.update({
        where: { id: regRequest.userId },
        data: { accountStatus: "REJECTED" },
      });

      await db.notification.create({
        data: {
          userId: regRequest.userId,
          type: "ADMIN_VERIFIED",
          title: "Registration Rejected",
          message: rejectionReason
            ? `Your registration was rejected: ${rejectionReason}. You may contact the admin or resubmit.`
            : "Your registration was rejected. Please contact the admin or resubmit.",
          link: "/onboarding",
        },
      });

    } else if (action === "REVOKE") {
      if (!revocationReason || !revocationReason.trim()) {
        return NextResponse.json({ error: "A revocation reason is required." }, { status: 400 });
      }

      await db.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: "REVOKED",
          revocationReason: revocationReason.trim(),
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });

      await db.user.update({
        where: { id: regRequest.userId },
        data: {
          accountStatus: "REVOKED",
          revocationReason: revocationReason.trim(),
          role: "UNASSIGNED",
          department: null,
          graduationYear: null,
        },
      });

      // Clean up their profile
      await db.studentProfile.deleteMany({ where: { userId: regRequest.userId } });
      await db.alumniProfile.deleteMany({ where: { userId: regRequest.userId } });

      await db.notification.create({
        data: {
          userId: regRequest.userId,
          type: "ADMIN_VERIFIED",
          title: "Approval Revoked",
          message:
            "Your EduBridge access has been revoked by an administrator. Please contact admin for more information.",
          link: "/",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/registrations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

