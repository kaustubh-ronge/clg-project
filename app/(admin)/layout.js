import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user || user.role !== "ADMIN") {
    // Non-admins shouldn't access this
    redirect("/dashboard");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar role="ADMIN" userName={user.name} avatarUrl={user.avatarUrl} />
      <main style={{ flex: 1, minWidth: 0, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
