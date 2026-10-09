import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/registration — get current user's registration request + status
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        accountStatus: true,
        name: true,
        email: true,
        avatarUrl: true,
        registrationRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) return NextResponse.json({ user: null, request: null });

    const { registrationRequests, ...userMeta } = user;
    return NextResponse.json({
      user: userMeta,
      request: registrationRequests[0] ?? null,
    });
  } catch (error) {
    console.error("GET /api/registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { z } from "zod";

const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed"),
  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  gender: z.string().optional(),
  studentStatus: z.enum(["CURRENT_STUDENT", "ALUMNI", "PASSOUT"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  academicYear: z.string().trim().optional(),
  department: z.string().trim().optional(),
  division: z.string().trim().optional(),
  rollNumber: z
    .string()
    .trim()
    .max(20, "Roll number is too long")
    .regex(/^[a-zA-Z0-9-]*$/, "Only letters, numbers, and hyphens allowed")
    .optional(),
  prnNumber: z
    .string()
    .trim()
    .max(30, "PRN number is too long")
    .regex(/^[a-zA-Z0-9]*$/, "Only letters and numbers allowed")
    .optional(),
  academicBatch: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{4}$/.test(val),
      "Batch must be in YYYY-YYYY format (e.g., 2025-2026)"
    ),
  passingYear: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{4}$/.test(val),
      "Must be a valid 4-digit year"
    ),
});

// POST /api/registration — submit a new registration request
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    const body = await request.json();

    // Validate request body against Zod schema
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      // Map Zod errors to a friendlier field-level object
      const fieldErrors = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      return NextResponse.json(
        { error: "Validation failed", fieldErrors },
        { status: 400 }
      );
    }

    const {
      fullName, mobile, gender, studentStatus,
      academicYear, department, division, rollNumber,
      prnNumber, academicBatch, passingYear,
    } = parsed.data;

    const email = clerkUser.emailAddresses[0].emailAddress;

    // Upsert the base User record (no profile yet — pending approval)
    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: { name: fullName, avatarUrl: clerkUser.imageUrl, accountStatus: "PENDING_APPROVAL" },
      create: {
        clerkId: userId,
        email,
        name: fullName,
        avatarUrl: clerkUser.imageUrl,
        role: "UNASSIGNED",
        accountStatus: "PENDING_APPROVAL",
      },
    });

    // Check for existing PENDING request to prevent duplicates
    const existing = await db.registrationRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json({ error: "You already have a pending registration request." }, { status: 409 });
    }

    const regRequest = await db.registrationRequest.create({
      data: {
        userId: user.id,
        fullName,
        email,
        mobile,
        gender: gender || null,
        studentStatus,
        academicYear: academicYear || null,
        department: department || null,
        division: division || null,
        rollNumber: rollNumber || null,
        prnNumber: prnNumber || null,
        academicBatch: academicBatch || null,
        passingYear: passingYear ? parseInt(passingYear) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ request: regRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
