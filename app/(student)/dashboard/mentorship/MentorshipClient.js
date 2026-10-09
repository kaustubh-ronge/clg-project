"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_BADGE = {
  PENDING: { label: "Pending", cls: "badge-warning" },
  ACCEPTED: { label: "Accepted", cls: "badge-success" },
  DECLINED: { label: "Declined", cls: "badge-danger" },
};

function RequestCard({ request, role, onAction }) {
  const [loading, setLoading] = useState(null);

  const otherUser = role === "STUDENT" ? request.alumni : request.student;
  const otherProfile = role === "STUDENT" ? request.alumni.alumniProfile : request.student.studentProfile;
  const initials = otherUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const badge = STATUS_BADGE[request.status];

  async function handleAction(status) {
    setLoading(status);
    try {
      const res = await fetch(`/api/mentorship/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      onAction();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card" style={{ borderRadius: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
        <div className="avatar" style={{ flexShrink: 0, fontSize: "0.9rem" }}>
          {otherUser.avatarUrl ? (
            <img src={otherUser.avatarUrl} alt={otherUser.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{otherUser.name}</span>
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
          </div>

          {role === "STUDENT" && otherProfile?.jobTitle && (
            <p style={{ fontSize: "0.8rem", color: "var(--brand-light)", marginBottom: 2 }}>{otherProfile.jobTitle}</p>
          )}
          {role === "STUDENT" && otherProfile?.organization && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4 }}>🏢 {otherProfile.organization}</p>
          )}
          {role === "ALUMNI" && otherUser.department && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4 }}>📚 {otherUser.department}</p>
          )}

          {request.message && (
            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "0.625rem 0.75rem",
              border: "1px solid var(--border)", marginTop: 8,
            }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                &ldquo;{request.message}&rdquo;
              </p>
            </div>
          )}

          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
            {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
        {role === "ALUMNI" && request.status === "PENDING" && (
          <>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={!!loading}
              onClick={() => handleAction("ACCEPTED")}
            >
              {loading === "ACCEPTED" ? "Accepting..." : "✓ Accept"}
            </button>
            <button
              className="btn-danger"
              style={{ flex: 1 }}
              disabled={!!loading}
              onClick={() => handleAction("DECLINED")}
            >
              {loading === "DECLINED" ? "..." : "✗ Decline"}
            </button>
          </>
        )}
        {request.status === "ACCEPTED" && request.conversation && (
          <Link
            href={`/dashboard/messages?conversationId=${request.conversation.id}`}
            className="btn-primary"
            style={{ flex: 1, textDecoration: "none", justifyContent: "center" }}
          >
            💬 Open Chat
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MentorshipClient({ requests: initialRequests, role }) {
  const [requests, setRequests] = useState(initialRequests);
  const [activeTab, setActiveTab] = useState("PENDING");
  const router = useRouter();

  const tabs = ["PENDING", "ACCEPTED", "DECLINED"];
  const filtered = requests.filter((r) => r.status === activeTab);

  function refreshRequests() {
    router.refresh();
    // Optimistic: update from server on next render
    fetch("/api/mentorship")
      .then((r) => r.json())
      .then((data) => data.requests && setRequests(data.requests));
  }

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="section-title">
          {role === "STUDENT" ? "My Mentor Requests" : "Mentorship Requests"} 🤝
        </h1>
        <p className="section-subtitle">
          {role === "STUDENT"
            ? "Track your outgoing mentorship requests."
            : "Review and respond to student mentorship requests."}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        {tabs.map((tab) => {
          const count = requests.filter((r) => r.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: 10, cursor: "pointer",
                fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s ease",
                background: activeTab === tab ? "linear-gradient(135deg, #6366f1, #a855f7)" : "var(--bg-card)",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
                border: activeTab === tab ? "none" : "1px solid var(--border)",
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            No {activeTab.toLowerCase()} requests
          </h3>
          {role === "STUDENT" && activeTab === "PENDING" && (
            <p style={{ fontSize: "0.875rem" }}>
              <a href="/dashboard/mentors" style={{ color: "var(--brand-light)" }}>Find a mentor</a> to get started!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              role={role}
              onAction={refreshRequests}
            />
          ))}
        </div>
      )}
    </div>
  );
}
