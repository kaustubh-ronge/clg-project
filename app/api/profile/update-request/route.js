import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { requireActiveUser } from "@/lib/authChecks";

const updateRequestSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits").optional(),
  gender: z.string().optional(),
  studentStatus: z.enum(["CURRENT_STUDENT", "ALUMNI", "PASSOUT"]).optional(),
  academicYear: z.enum(["FY", "SY", "TY", "LY", "FIRST_YEAR", "SECOND_YEAR"]).optional(),
  department: z.string().optional(),
  division: z.string().optional(),
  rollNumber: z.string().optional(),
  prnNumber: z.string().optional(),
  academicBatch: z.string().regex(/^\d{4}-\d{4}$/, "Batch must be YYYY-YYYY").optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
});

export async function POST(req) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    // Check if there's already a pending request
    const existingPending = await db.profileUpdateRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });

    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending update request. Please wait for an admin to review it." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateRequestSchema.parse(body);

    // Filter out undefined values and empty strings if needed, or fields that didn't actually change
    const requestedChanges = {};
    for (const key of Object.keys(parsed)) {
      if (parsed[key] !== undefined && parsed[key] !== user[key]) {
        requestedChanges[key] = parsed[key];
      }
    }

    if (Object.keys(requestedChanges).length === 0) {
      return NextResponse.json({ error: "No changes detected." }, { status: 400 });
    }

    const newRequest = await db.profileUpdateRequest.create({
      data: {
        userId: user.id,
        requestedChanges: requestedChanges,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error("Profile update request error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
