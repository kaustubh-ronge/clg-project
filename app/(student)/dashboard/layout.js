import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    // Fallback: If user bypassed the Clerk redirect, send them to sync
    redirect("/auth/sync");
  }

  // ── ADMIN: always straight to dashboard, skip every student gate ──
  if (user.role === "ADMIN") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Sidebar role="ADMIN" userName={user.name} avatarUrl={user.avatarUrl} />
        <main style={{ flex: 1, minWidth: 0, padding: "2rem", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    );
  }

  // ── STUDENT/ALUMNI: gate on accountStatus ──
  if (user.accountStatus !== "ACTIVE") {
    // Send to registration / pending / rejected screens
    redirect("/onboarding");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar role={user.role} userName={user.name} avatarUrl={user.avatarUrl} />
      <main style={{ flex: 1, minWidth: 0, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
