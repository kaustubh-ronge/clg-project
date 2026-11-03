"use client";

import { useState } from "react";

const TYPE_BADGE = {
  Remote: "badge-success",
  "On-site": "badge-brand",
  Hybrid: "badge-warning",
};

function InternshipCard({ internship }) {
  return (
    <div className="card" style={{ borderRadius: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 4 }}>
            {internship.title}
          </h3>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--brand-light)" }}>
            🏢 {internship.company}
          </p>
        </div>
        {internship.type && (
          <span className={`badge ${TYPE_BADGE[internship.type] || "badge-brand"}`}>{internship.type}</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {internship.location && <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>📍 {internship.location}</span>}
        {internship.duration && <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>⏱ {internship.duration}</span>}
        {internship.stipend && <span className="badge badge-success">💰 {internship.stipend}</span>}
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.875rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {internship.description}
      </p>

      {internship.skills?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.875rem" }}>
          {internship.skills.slice(0, 5).map((s) => <span key={s} className="tag-pill">{s}</span>)}
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Posted by {internship.postedBy.name} · {new Date(internship.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
        {(internship.applyLink || internship.applyEmail) && (
          <a
            href={internship.applyLink || `mailto:${internship.applyEmail}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "0.45rem 1rem", fontSize: "0.8rem" }}
          >
            Apply →
          </a>
        )}
      </div>
    </div>
  );
}

function PostInternshipModal({ onClose, onPosted }) {
  const [form, setForm] = useState({ title: "", company: "", description: "", location: "", type: "Remote", duration: "", stipend: "", applyLink: "", skills: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error("Failed to post");
      onPosted();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ borderRadius: 20, padding: "2rem", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "1.5rem", color: "var(--text-primary)" }}>Post an Internship / Job</h2>
        <form onSubmit={handleSubmit}>
          {[
            { name: "title", label: "Position Title *", placeholder: "e.g. Backend Developer Intern" },
            { name: "company", label: "Company *", placeholder: "Company name" },
            { name: "location", label: "Location", placeholder: "e.g. Pune, Maharashtra" },
            { name: "duration", label: "Duration", placeholder: "e.g. 3 months" },
            { name: "stipend", label: "Stipend / Salary", placeholder: "e.g. ₹15,000/month" },
            { name: "applyLink", label: "Apply Link", placeholder: "https://..." },
          ].map((f) => (
            <div key={f.name} className="form-group">
              <label className="form-label">{f.label}</label>
              <input className="input" placeholder={f.placeholder} required={f.label.includes("*")} value={form[f.name]} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))} />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {["Remote", "On-site", "Hybrid"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="input" placeholder="Describe the role, responsibilities..." rows={4} required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills (comma-separated)</label>
            <input className="input" placeholder="React, Node.js, SQL..." value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? "Posting..." : "📢 Post Internship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InternshipsClient({ internships: initial, isAlumni }) {
  const [internships, setInternships] = useState(initial);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = internships.filter((i) =>
    !search ||
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.company.toLowerCase().includes(search.toLowerCase()) ||
    i.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  async function refresh() {
    const res = await fetch("/api/internships");
    const data = await res.json();
    if (data.internships) setInternships(data.internships);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="section-title">Internships & Jobs 💼</h1>
          <p className="section-subtitle">Opportunities posted exclusively by EduBridge alumni.</p>
        </div>
        {isAlumni && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>➕ Post Opportunity</button>
        )}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input className="input" placeholder="Search by role, company, skills..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 420 }} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>No internships yet</h3>
          <p style={{ fontSize: "0.875rem" }}>Check back soon — alumni post new opportunities regularly.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((internship) => <InternshipCard key={internship.id} internship={internship} />)}
        </div>
      )}

      {showModal && <PostInternshipModal onClose={() => setShowModal(false)} onPosted={refresh} />}
    </div>
  );
}
