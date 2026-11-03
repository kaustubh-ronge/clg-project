import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authChecks";

export async function PATCH(req) {
  try {
    const { user: adminUser, error } = await requireAdmin();
    if (error) return error;

    const { requestId, action, reason } = await req.json();

    const request = await db.profileUpdateRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Request is already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // 1. Update the User record with the requested changes
      await db.user.update({
        where: { id: request.userId },
        data: request.requestedChanges,
      });

      // 2. Mark request as VERIFIED
      const updatedReq = await db.profileUpdateRequest.update({
        where: { id: requestId },
        data: {
          status: "VERIFIED",
          reviewedAt: new Date(),
          reviewedById: adminUser.id,
        },
        include: { user: true },
      });

      return NextResponse.json({ success: true, request: updatedReq });

    } else if (action === "REJECT") {
      // Mark request as REJECTED
      const updatedReq = await db.profileUpdateRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "No reason provided",
          reviewedAt: new Date(),
          reviewedById: adminUser.id,
        },
        include: { user: true },
      });

      return NextResponse.json({ success: true, request: updatedReq });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Admin profile request PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
