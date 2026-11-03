"use client";

import { useState } from "react";

const TYPE_CONFIG = {
  seminar: { icon: "🎓", color: "#6366f1" },
  workshop: { icon: "🔧", color: "#a855f7" },
  placement_drive: { icon: "💼", color: "#22c55e" },
  meetup: { icon: "👥", color: "#f59e0b" },
};

function EventCard({ event, onRsvp }) {
  const [rsvped, setRsvped] = useState(event.isRsvped);
  const [count, setCount] = useState(event.attendeeCount);
  const [loading, setLoading] = useState(false);
  const config = TYPE_CONFIG[event.type] || { icon: "📅", color: "#6366f1" };
  const isPast = new Date(event.date) < new Date();

  async function handleRsvp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: "POST" });
      const data = await res.json();
      setRsvped(data.rsvped);
      setCount((c) => (data.rsvped ? c + 1 : c - 1));
    } catch {
      alert("Failed to RSVP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ borderRadius: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${config.color}20`, border: `1px solid ${config.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0,
        }}>
          {config.icon}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="badge" style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}>
            {event.type.replace("_", " ")}
          </span>
          {isPast && <span className="badge badge-danger">Past</span>}
        </div>
      </div>

      <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
        {event.title}
      </h3>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.875rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {event.description}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          📅 {new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          {" · "}{new Date(event.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
        {event.venue && <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>📍 {event.venue}</p>}
        {event.onlineLink && (
          <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--brand-light)" }}>
            🔗 Join Online
          </a>
        )}
        {event.department && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🏢 {event.department}</p>}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>👥 {count} attending</span>
        {!isPast && (
          <button
            onClick={handleRsvp}
            disabled={loading}
            className={rsvped ? "btn-danger" : "btn-primary"}
            style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
          >
            {loading ? "..." : rsvped ? "✓ Going · Cancel" : "RSVP →"}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "seminar", venue: "", onlineLink: "", department: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      onCreated();
      onClose();
    } catch {
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ borderRadius: 20, padding: "2rem", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "1.5rem", color: "var(--text-primary)" }}>Create Event</h2>
        <form onSubmit={handleSubmit}>
          {[
            { name: "title", label: "Title *", placeholder: "Event name" },
            { name: "venue", label: "Venue", placeholder: "Hall / Room / Address" },
            { name: "onlineLink", label: "Online Link", placeholder: "Zoom / Meet URL" },
          ].map((f) => (
            <div key={f.name} className="form-group">
              <label className="form-label">{f.label}</label>
              <input className="input" placeholder={f.placeholder} required={f.label.includes("*")} value={form[f.name]} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Date & Time *</label>
            <input type="datetime-local" className="input" required value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {["seminar", "workshop", "placement_drive", "meetup"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="input" rows={3} required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? "Creating..." : "📅 Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsClient({ events: initial, isAdmin }) {
  const [events, setEvents] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  async function refresh() {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (data.events) setEvents(data.events);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="section-title">Events & Workshops 📅</h1>
          <p className="section-subtitle">Stay updated with campus events, placement drives, and alumni meetups.</p>
        </div>
        {isAdmin && <button className="btn-primary" onClick={() => setShowModal(true)}>➕ Create Event</button>}
      </div>

      {upcoming.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Upcoming ({upcoming.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Past Events ({past.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", opacity: 0.7 }}>
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>No events yet</h3>
          <p style={{ fontSize: "0.875rem" }}>{isAdmin ? "Create the first event!" : "Check back soon."}</p>
        </div>
      )}

      {showModal && <CreateEventModal onClose={() => setShowModal(false)} onCreated={refresh} />}
    </div>
  );
}
