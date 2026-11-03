"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MentorCard({ mentor, onRequest, hasRequested }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const profile = mentor.alumniProfile;
  const initials = mentor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSendRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId: mentor.id, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowModal(false);
      onRequest?.();
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="card" style={{ borderRadius: 16, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
          <div className="avatar avatar-lg" style={{ flexShrink: 0 }}>
            {mentor.avatarUrl ? (
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 2 }}>
              {mentor.name}
            </h3>
            {profile?.jobTitle && (
              <p style={{ fontSize: "0.8rem", color: "var(--brand-light)", marginBottom: 2 }}>
                {profile.jobTitle}
              </p>
            )}
            {profile?.organization && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                🏢 {profile.organization}
              </p>
            )}
          </div>
          <span className="badge badge-success" style={{ flexShrink: 0 }}>✓ Verified</span>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.875rem" }}>
          {mentor.department && (
            <span className="badge badge-brand">{mentor.department.split(" ")[0]}</span>
          )}
          {profile?.industry && (
            <span className="badge badge-purple">{profile.industry}</span>
          )}
          {profile?.yearsOfExperience && (
            <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              {profile.yearsOfExperience}y exp
            </span>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p style={{
            fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6,
            marginBottom: "0.875rem",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {profile.bio}
          </p>
        )}

        {/* Expertise */}
        {profile?.expertiseAreas?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
            {profile.expertiseAreas.slice(0, 4).map((area) => (
              <span key={area} className="tag-pill">{area}</span>
            ))}
            {profile.expertiseAreas.length > 4 && (
              <span className="tag-pill" style={{ opacity: 0.7 }}>+{profile.expertiseAreas.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: "auto" }}>
          {hasRequested ? (
            <button disabled className="btn-secondary" style={{ width: "100%", justifyContent: "center", opacity: 0.6 }}>
              ✓ Request Sent
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowModal(true)}
            >
              🤝 Request Mentorship
            </button>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="glass" style={{ borderRadius: 20, padding: "2rem", maxWidth: 480, width: "100%" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
              Request mentorship from {mentor.name}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              Write a brief message about your goals and why you&apos;d like this mentor.
            </p>
            <textarea
              className="input"
              placeholder="Hi, I'm a 3rd year CSE student interested in backend development. I'd love your guidance on..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={{ marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendRequest}
                disabled={loading}
                style={{ flex: 2, justifyContent: "center" }}
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
