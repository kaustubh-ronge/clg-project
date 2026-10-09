import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  let dbUser = null;
  if (userId) {
    dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  }

  // Determine CTA text and link for authenticated users
  let actionLink = "/dashboard";
  let actionText = "Go to Dashboard →";
  let navActionText = "Dashboard";

  if (dbUser) {
    if (dbUser.role === "ADMIN") {
      actionLink = "/admin";
    } else if (dbUser.accountStatus !== "ACTIVE") {
      actionLink = "/onboarding";
      
      const request = await db.registrationRequest.findFirst({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
      });
      
      if (request) {
        if (request.status === "PENDING") {
          actionText = "Check Approval Status →";
          navActionText = "Check Status";
        } else if (request.status === "REJECTED") {
          actionText = "Resubmit Profile →";
          navActionText = "Resubmit Profile";
        } else if (request.status === "REVOKED") {
          actionText = "Check Revoked Status →";
          navActionText = "Revoked Status";
        } else {
          actionText = "Complete your profile →";
          navActionText = "Complete profile";
        }
      } else {
        actionText = "Complete your profile →";
        navActionText = "Complete profile";
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,10,15,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
          }}>🎓</div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
            EduBridge
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {!userId ? (
            <>
              <Link href="/sign-in" style={{
                color: "var(--text-secondary)", textDecoration: "none",
                fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s",
              }}>
                Sign In
              </Link>
              <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none" }}>
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link href={actionLink} className="btn-primary" style={{ textDecoration: "none" }}>
                {navActionText}
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: "10rem", paddingBottom: "6rem", textAlign: "center", padding: "10rem 1.5rem 6rem" }}>
        {/* Background orbs */}
        <div className="orb orb-brand" style={{ width: 600, height: 600, top: -200, left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-accent" style={{ width: 400, height: 400, top: 100, right: -100 }} />
        <div className="orb orb-brand" style={{ width: 300, height: 300, bottom: 0, left: -50 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }} className="animate-fade-in-up">
          <div className="badge badge-brand" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
            ✨ AI-Powered Mentorship Matching
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900,
            lineHeight: 1.1, marginBottom: "1.5rem",
            color: "var(--text-primary)", letterSpacing: "-0.02em",
          }}>
            Bridge the gap between{" "}
            <span className="gradient-text">students & alumni</span>
          </h1>

          <p style={{
            fontSize: "1.15rem", color: "var(--text-secondary)", maxWidth: 600,
            margin: "0 auto 2.5rem", lineHeight: 1.7,
          }}>
            EduBridge connects you with verified alumni from your institution for
            AI-matched mentorship, real-time chat, internship discovery, and
            department-specific networking — all in one platform.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {!userId ? (
              <>
                <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "0.875rem 2rem" }}>
                  🚀 Start for Free
                </Link>
                <Link href="/sign-in" className="btn-secondary" style={{ textDecoration: "none", fontSize: "1rem", padding: "0.875rem 2rem" }}>
                  Sign In
                </Link>
              </>
            ) : (
              <Link href={actionLink} className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "0.875rem 2rem" }}>
                {actionText}
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          position: "relative", zIndex: 1, display: "flex", justifyContent: "center",
          gap: "3rem", marginTop: "5rem", flexWrap: "wrap",
        }}>
          {[
            { value: "500+", label: "Alumni Mentors" },
            { value: "2000+", label: "Students Connected" },
            { value: "95%", label: "Match Satisfaction" },
            { value: "300+", label: "Internships Posted" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-light)" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 1.5rem 6rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Everything you need, in one place
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
            No more scattered social media outreach. EduBridge is your institution's
            intelligent networking hub.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}>
          {[
            {
              icon: "🤖",
              title: "AI Mentor Matching",
              desc: "Smart cosine-similarity scoring matches you with alumni whose expertise aligns with your skills, interests, and career goals.",
              color: "#6366f1",
            },
            {
              icon: "✅",
              title: "Verified Alumni Network",
              desc: "Every alumni is verified by admins before joining the mentor pool, ensuring authentic connections.",
              color: "#a855f7",
            },
            {
              icon: "💬",
              title: "Real-time Chat",
              desc: "Secure 1:1 messaging unlocked after an accepted mentorship request — no spam, no cold outreach.",
              color: "#ec4899",
            },
            {
              icon: "💼",
              title: "Internship Discovery",
              desc: "Alumni post internship and job opportunities exclusively for students from your institution.",
              color: "#f59e0b",
            },
            {
              icon: "📅",
              title: "Events & Workshops",
              desc: "Placement drives, seminars, and alumni meetups all managed in one calendar.",
              color: "#22c55e",
            },
            {
              icon: "🏢",
              title: "Department Communities",
              desc: "Filter mentors, events, and internships by department for hyper-relevant networking.",
              color: "#14b8a6",
            },
          ].map((feature) => (
            <div key={feature.title} className="card" style={{ borderRadius: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${feature.color}20`, border: `1px solid ${feature.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", marginBottom: "1rem",
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                {feature.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: "4rem 1.5rem 6rem",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            How EduBridge works
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem" }}>
            From sign-up to mentorship in minutes
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
            {[
              { step: "01", title: "Create your profile", desc: "Sign up, choose your role, and fill in your skills, interests, and career goals." },
              { step: "02", title: "Get matched", desc: "Our AI engine ranks the best-fit alumni mentors based on your profile." },
              { step: "03", title: "Send a request", desc: "Reach out to a mentor with a personalized message explaining your goals." },
              { step: "04", title: "Start mentoring", desc: "Once accepted, unlock chat and schedule virtual mentoring sessions." },
            ].map((item) => (
              <div key={item.step} style={{ position: "relative" }}>
                <div style={{
                  fontSize: "3rem", fontWeight: 900, color: "rgba(99,102,241,0.2)",
                  lineHeight: 1, marginBottom: "0.5rem",
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Ready to bridge your future?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1rem" }}>
            Join thousands of students and alumni already using EduBridge.
          </p>
          {!userId ? (
            <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "1rem 2.5rem" }}>
              🎓 Join EduBridge Free
            </Link>
          ) : (
            <Link href={actionLink} className="btn-primary" style={{ textDecoration: "none", fontSize: "1rem", padding: "1rem 2.5rem" }}>
              {actionText}
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "2rem 1.5rem",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.875rem",
      }}>
        <p>© 2026 EduBridge — SVERI&apos;s College of Engineering, Pandharpur</p>
      </footer>
    </div>
  );
}
