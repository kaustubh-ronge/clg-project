import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * Cosine similarity between two string arrays (treated as term sets).
 * Returns a score between 0 and 1.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA.length || !vecB.length) return 0;
  const setA = new Set(vecA.map((s) => s.toLowerCase().trim()));
  const setB = new Set(vecB.map((s) => s.toLowerCase().trim()));
  const allTerms = new Set([...setA, ...setB]);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const term of allTerms) {
    const a = setA.has(term) ? 1 : 0;
    const b = setB.has(term) ? 1 : 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function scoreMentor(studentProfile, mentor) {
  const alumniProfile = mentor.alumniProfile;
  if (!alumniProfile) return 0;

  const studentSkills = [
    ...(studentProfile.skills || []),
    ...(studentProfile.extractedSkills || []),
  ];
  const studentInterests = studentProfile.interests || [];

  const alumniExpertise = alumniProfile.expertiseAreas || [];

  // Skill/expertise similarity (weight: 50%)
  const skillScore = cosineSimilarity(studentSkills, alumniExpertise);

  // Interest/industry alignment (weight: 30%)
  const industryTerms = alumniProfile.industry ? [alumniProfile.industry] : [];
  const interestScore = cosineSimilarity(studentInterests, [...alumniExpertise, ...industryTerms]);

  // Department match bonus (weight: 20%)
  const deptScore = mentor.department && studentProfile.user?.department === mentor.department ? 1 : 0;

  return 0.5 * skillScore + 0.3 * interestScore + 0.2 * deptScore;
}
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/mentors/recommendations — AI-ranked mentor recommendations for current student
export async function GET() {
  try {
    const { user: student, error } = await requireActiveUser();
    if (error) return error;

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can get recommendations" }, { status: 403 });
    }

    // We need to re-fetch with studentProfile to get the skills, since requireActiveUser only gets base user
    const studentWithProfile = await db.user.findUnique({
      where: { id: student.id },
      include: { studentProfile: true },
    });

    const studentProfile = studentWithProfile?.studentProfile;
    if (!studentProfile) {
      return NextResponse.json({ recommendations: [] });
    }

    // Get all verified alumni mentors
    const mentors = await db.user.findMany({
      where: {
        role: "ALUMNI",
        alumniProfile: { verificationStatus: "VERIFIED" },
      },
      include: { alumniProfile: true },
    });

    // Score and rank
    const profileWithUser = { ...studentProfile, user: student };
    const scored = mentors
      .map((mentor) => ({
        ...mentor,
        score: scoreMentor(profileWithUser, mentor),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10

    return NextResponse.json({ recommendations: scored });
  } catch (error) {
    console.error("GET /api/mentors/recommendations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
