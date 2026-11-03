import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      studentProfile: true,
      alumniProfile: true,
      notifications: {
        where: { read: false },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/onboarding");

  // Admin always goes to their own dashboard page
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const isStudent = user.role === "STUDENT";
  const isAlumni = user.role === "ALUMNI";

  // Stats
  let stats = [];
  if (isStudent) {
    const [mentorshipCount, conversationCount, internshipCount] = await Promise.all([
      db.mentorshipRequest.count({ where: { studentId: user.id } }),
      db.conversation.count({ where: { studentId: user.id } }),
      db.internship.count(),
    ]);
    stats = [
      { label: "Mentor Requests", value: mentorshipCount, icon: "🤝", href: "/dashboard/mentorship" },
      { label: "Active Chats", value: conversationCount, icon: "💬", href: "/dashboard/messages" },
      { label: "Internships", value: internshipCount, icon: "💼", href: "/dashboard/internships" },
    ];
  } else if (isAlumni) {
    const [requestCount, conversationCount, internshipCount] = await Promise.all([
      db.mentorshipRequest.count({ where: { alumniId: user.id, status: "PENDING" } }),
      db.conversation.count({ where: { alumniId: user.id } }),
      db.internship.count({ where: { postedById: user.id } }),
    ]);
    stats = [
      { label: "Pending Requests", value: requestCount, icon: "📩", href: "/dashboard/mentorship" },
      { label: "Active Mentees", value: conversationCount, icon: "🎓", href: "/dashboard/messages" },
      { label: "Jobs Posted", value: internshipCount, icon: "💼", href: "/dashboard/internships" },
    ];
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Welcome back, {firstName}! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {isStudent && "Discover mentors and opportunities tailored for you."}
          {isAlumni && (
            user.alumniProfile?.verificationStatus === "VERIFIED"
              ? "You're a verified mentor. Students are waiting to connect!"
              : user.alumniProfile?.verificationStatus === "PENDING"
                ? "Your account is pending admin verification."
                : "Your verification was rejected. Contact the admin."
          )}
        </p>

        {isAlumni && user.alumniProfile?.verificationStatus === "PENDING" && (
          <div className="badge badge-warning" style={{ marginTop: "0.75rem", display: "inline-flex" }}>
            ⏳ Verification Pending — Admin will review your account soon
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ borderRadius: 14 }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-light)", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Notifications */}
        <div className="card" style={{ borderRadius: 14 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
            🔔 Recent Notifications
          </h2>
          {user.notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <p style={{ fontSize: "0.875rem" }}>No new notifications</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {user.notifications.map((notif) => (
                <div key={notif.id} style={{
                  padding: "0.75rem", borderRadius: 10,
                  background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
                }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                    {notif.title}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card" style={{ borderRadius: 14 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
            ⚡ Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isStudent && (
              <>
                <Link href="/dashboard/mentors" className="btn-primary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  🔍 Find a Mentor
                </Link>
                <Link href="/dashboard/internships" className="btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  💼 Browse Internships
                </Link>
                <Link href="/dashboard/events" className="btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  📅 Upcoming Events
                </Link>
              </>
            )}
            {isAlumni && (
              <>
                <Link href="/dashboard/mentorship" className="btn-primary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  📩 View Requests
                </Link>
                <Link href="/dashboard/internships" className="btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  ➕ Post Internship
                </Link>
                <Link href="/dashboard/profile" className="btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }}>
                  ✏️ Update Profile
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
