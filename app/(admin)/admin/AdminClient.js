"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Avatar({ req }) {
  const initials = (req.fullName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (req.user?.avatarUrl) {
    return (
      <img
        src={req.user.avatarUrl}
        alt={req.fullName}
        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#6366f1,#a855f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "white",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: { cls: "badge-warning", label: "Pending" },
    VERIFIED: { cls: "badge-success", label: "Approved" },
    REJECTED: { cls: "badge-danger", label: "Rejected" },
  };
  const { cls, label } = map[status] || { cls: "badge-brand", label: status };
  return <span className={`badge ${cls}`} style={{ fontSize: "0.65rem" }}>{label}</span>;
}

function TypeBadge({ studentStatus }) {
  const map = {
    CURRENT_STUDENT: { cls: "badge-brand", label: "Student" },
    ALUMNI: { cls: "badge-success", label: "Alumni" },
    PASSOUT: { cls: "badge-purple", label: "Passout" },
  };
  const { cls, label } = map[studentStatus] || { cls: "badge-brand", label: studentStatus };
  return <span className={`badge ${cls}`} style={{ fontSize: "0.65rem" }}>{label}</span>;
}

function StatCard({ icon, label, value, color, highlight }) {
  return (
    <div
      className="card"
      style={{
        borderRadius: 14,
        textAlign: "center",
        ...(highlight && {
          border: "1px solid rgba(245,158,11,0.4)",
          background: "rgba(245,158,11,0.06)",
        }),
      }}
    >
      <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: color || "var(--brand-light)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// View Details Dialog
// ─────────────────────────────────────────────────────────

function DetailsDialog({ req, onClose }) {
  if (!req) return null;

  const personalFields = [
    { label: "Full Name", val: req.fullName },
    { label: "Email", val: req.email },
    { label: "Mobile", val: req.mobile },
    { label: "Gender", val: req.gender },
    { label: "Type", val: req.studentStatus?.replace(/_/g, " ") },
    { label: "Submitted", val: fmtDate(req.createdAt) },
  ];

  const academicFields = [
    { label: "Department", val: req.department },
    { label: "Academic Year", val: req.academicYear?.replace(/_/g, " ") },
    { label: "Division", val: req.division },
    { label: "Roll Number", val: req.rollNumber },
    { label: "PRN / Enrollment", val: req.prnNumber },
    { label: "Academic Batch", val: req.academicBatch },
    { label: "Passing Year", val: req.passingYear },
  ].filter((f) => f.val);

  const reviewFields = [
    { label: "Decision Status", val: req.status },
    { label: "Reviewed At", val: fmtDate(req.reviewedAt) },
    { label: "Rejection Reason", val: req.rejectionReason },
    { label: "Revocation Reason", val: req.revocationReason },
  ].filter((f) => f.val);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: "100%", maxWidth: 560, maxHeight: "90vh",
          overflowY: "auto", borderRadius: 20, padding: "1.75rem",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <Avatar req={req} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{req.fullName}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{req.email}</p>
          </div>
          <StatusBadge status={req.status} />
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "0.25rem 0.6rem", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Personal Info */}
        <Section title="👤 Personal Information" fields={personalFields} />

        {/* Academic Info */}
        {academicFields.length > 0 && (
          <Section title="🎓 Academic Information" fields={academicFields} />
        )}

        {/* Review Info */}
        {reviewFields.length > 0 && (
          <Section title="📋 Review Information" fields={reviewFields} />
        )}
      </div>
    </div>
  );
}

function Section({ title, fields }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
        {title}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {fields.map((f) => (
          <div key={f.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{f.label}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500, wordBreak: "break-word" }}>{f.val || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Action Reason Modal (For Reject / Revoke)
// ─────────────────────────────────────────────────────────

function ActionReasonModal({ req, actionType, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  
  const isReject = actionType === "REJECT";
  const title = isReject ? "Reject Registration" : "Revoke Approval";
  const desc = isReject
    ? `Rejecting ${req.fullName}. Provide a mandatory reason for the student.`
    : `Revoking access for ${req.fullName}. Provide a mandatory reason.`;
  const btnClass = isReject ? "btn-danger" : "btn-warning";
  const btnText = isReject ? "Confirm Reject" : "Confirm Revoke";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1001,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{ width: "100%", maxWidth: 440, borderRadius: 18, padding: "1.5rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{title}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
          {desc}
        </p>
        <textarea
          className="input"
          rows={3}
          placeholder="Required reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ marginBottom: "1rem", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
            Cancel
          </button>
          <button
            className={btnClass}
            disabled={loading || !reason.trim()}
            onClick={() => onConfirm(reason)}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {loading ? "Processing…" : btnText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Registration Table
// ─────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function RegistrationTable({ rows, tab, onAction }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [detailsReq, setDetailsReq] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  const filtered = rows.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function doAction(req, action, reason = "") {
    setLoadingId(req.id + action);
    const payload = { requestId: req.id, action };
    if (action === "REJECT") payload.rejectionReason = reason;
    if (action === "REVOKE") payload.revocationReason = reason;

    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      onAction(req.id, action, req);
      if (action === "REJECT" || action === "REVOKE") {
        setActionTarget(null);
      }
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (rows.length === 0) {
    const emptyMap = {
      pending: { icon: "✅", title: "All clear!", msg: "No pending registration requests." },
      approved: { icon: "📋", title: "No approvals yet", msg: "Approved registrations will appear here." },
      rejected: { icon: "📋", title: "No rejections", msg: "Rejected registrations will appear here." },
    };
    const e = emptyMap[tab] || emptyMap.pending;
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{e.icon}</div>
        <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>{e.title}</h3>
        <p style={{ fontSize: "0.875rem" }}>{e.msg}</p>
      </div>
    );
  }

  return (
    <>
      {detailsReq && <DetailsDialog req={detailsReq} onClose={() => setDetailsReq(null)} />}
      {actionTarget && (
        <ActionReasonModal
          req={actionTarget.req}
          actionType={actionTarget.type}
          loading={!!loadingId}
          onConfirm={(reason) => doAction(actionTarget.req, actionTarget.type, reason)}
          onClose={() => setActionTarget(null)}
        />
      )}

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          className="input"
          placeholder="🔍 Search by name, email or department…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 340, flex: "1 1 200px" }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Applicant", "Type", "Department", "Roll / Year", "Submitted", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No results match your search.
                </td>
              </tr>
            ) : (
              pageRows.map((req, i) => {
                const isLast = i === pageRows.length - 1;
                const busy = loadingId && loadingId.startsWith(req.id);
                return (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Applicant */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Avatar req={req} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                            {req.fullName}
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                            {req.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <TypeBadge studentStatus={req.studentStatus} />
                    </td>

                    {/* Dept */}
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {req.department || "—"}
                    </td>

                    {/* Roll / Year */}
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {req.rollNumber || req.academicYear?.replace(/_/g, " ") || req.passingYear || "—"}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(req.createdAt)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", alignItems: "center" }}>
                        {/* View Details — always visible */}
                        <button
                          onClick={() => setDetailsReq(req)}
                          disabled={busy}
                          style={{
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.72rem",
                            borderRadius: 7,
                            cursor: "pointer",
                            fontWeight: 600,
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s",
                          }}
                        >
                          👁 Details
                        </button>

                        {/* Pending: Approve + Reject */}
                        {tab === "pending" && (
                          <>
                            <button
                              onClick={() => doAction(req, "APPROVE")}
                              disabled={busy}
                              style={{
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.72rem",
                                borderRadius: 7,
                                cursor: busy ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                background: "rgba(34,197,94,0.12)",
                                border: "1px solid rgba(34,197,94,0.3)",
                                color: "#22c55e",
                                whiteSpace: "nowrap",
                                opacity: busy ? 0.6 : 1,
                                transition: "all 0.15s",
                              }}
                            >
                              {loadingId === req.id + "APPROVE" ? "…" : "✅ Approve"}
                            </button>
                            <button
                              onClick={() => setActionTarget({ req, type: "REJECT" })}
                              disabled={busy}
                              style={{
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.72rem",
                                borderRadius: 7,
                                cursor: busy ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#f87171",
                                whiteSpace: "nowrap",
                                opacity: busy ? 0.6 : 1,
                                transition: "all 0.15s",
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {/* Approved: Revoke */}
                        {tab === "approved" && (
                          <button
                            onClick={() => setActionTarget({ req, type: "REVOKE" })}
                            disabled={busy}
                            style={{
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.72rem",
                              borderRadius: 7,
                              cursor: busy ? "not-allowed" : "pointer",
                              fontWeight: 600,
                              background: "rgba(245,158,11,0.1)",
                              border: "1px solid rgba(245,158,11,0.3)",
                              color: "#f59e0b",
                              whiteSpace: "nowrap",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {loadingId === req.id + "REVOKE" ? "…" : "⚠️ Revoke"}
                          </button>
                        )}

                        {/* Rejected: Reconsider */}
                        {tab === "rejected" && (
                          <button
                            onClick={() => doAction(req, "RECONSIDER")}
                            disabled={busy}
                            style={{
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.72rem",
                              borderRadius: 7,
                              cursor: busy ? "not-allowed" : "pointer",
                              fontWeight: 600,
                              background: "rgba(99,102,241,0.12)",
                              border: "1px solid rgba(99,102,241,0.3)",
                              color: "var(--brand-light)",
                              whiteSpace: "nowrap",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {loadingId === req.id + "RECONSIDER" ? "…" : "🔄 Reconsider"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Page {safePage} of {totalPages} · {filtered.length} total
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-secondary"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - safePage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "0.3rem 0.6rem",
                    fontSize: "0.8rem",
                    borderRadius: 7,
                    cursor: "pointer",
                    fontWeight: p === safePage ? 700 : 400,
                    background: p === safePage ? "linear-gradient(135deg,#6366f1,#a855f7)" : "var(--bg-card)",
                    color: p === safePage ? "white" : "var(--text-secondary)",
                    border: p === safePage ? "none" : "1px solid var(--border)",
                  }}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn-secondary"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Users Table
// ─────────────────────────────────────────────────────────

function UsersTable({ users, onDeleteUser }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          className="input"
          placeholder="🔍 Search by name, email or department…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 340, flex: "1 1 200px" }}
        />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{filtered.length} users</span>
      </div>
      <div className="glass" style={{ borderRadius: 14, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Email", "Role", "Dept", "Account Status", "Joined", "Actions"].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No users match your search.
                </td>
              </tr>
            ) : (
              pageRows.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < pageRows.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</td>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{u.email}</td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span className={`badge ${u.role === "ADMIN" ? "badge-danger" : u.role === "ALUMNI" ? "badge-brand" : "badge-success"}`}>
                      {u.role.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{u.department || "—"}</td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <span className={`badge ${u.accountStatus === "ACTIVE" ? "badge-success" : u.accountStatus === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                      {u.accountStatus?.replace(/_/g, " ") || "active"}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 1rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="btn-danger"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", borderRadius: 6 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Page {safePage} of {totalPages}</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-secondary" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>← Prev</button>
            <button className="btn-secondary" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>Next →</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Updates Table
// ─────────────────────────────────────────────────────────

function UpdatesTable({ requests, onAction }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleAction(reqId, action) {
    if (action === "REJECT" && !rejecting) {
      setRejecting(reqId);
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/profile-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, action, reason }),
      });
      if (!res.ok) throw new Error("Failed");
      onAction(reqId, action);
      setRejecting(null);
      setReason("");
    } catch {
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 14 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>User</th>
              <th style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Requested Changes</th>
              <th style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No pending update requests.</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar req={{ fullName: req.user?.name, user: req.user }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{req.user?.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{req.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {Object.entries(req.requestedChanges || {}).map(([key, val]) => (
                        <div key={key} style={{ fontSize: "0.8rem", background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: 4 }}>
                          <span style={{ color: "var(--text-muted)", marginRight: 8 }}>{key}:</span>
                          <span style={{ color: "var(--text-danger)", textDecoration: "line-through", marginRight: 8 }}>{req.user[key] || "—"}</span>
                          <span style={{ color: "var(--text-success)" }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {rejecting === req.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <textarea
                          className="input"
                          style={{ width: 200, fontSize: "0.75rem", padding: "0.4rem" }}
                          rows={2}
                          placeholder="Rejection reason..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button disabled={processing} onClick={() => setRejecting(null)} className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>Cancel</button>
                          <button disabled={processing} onClick={() => handleAction(req.id, "REJECT")} className="btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>Confirm</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button disabled={processing} onClick={() => handleAction(req.id, "APPROVE")} className="btn-success" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>Approve</button>
                        <button disabled={processing} onClick={() => handleAction(req.id, "REJECT")} className="btn-danger" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Admin Client
// ─────────────────────────────────────────────────────────

export default function AdminClient({
  pendingRegistrations: initialPending,
  approvedRegistrations: initialApproved,
  rejectedRegistrations: initialRejected,
  allUsers: initialUsers,
  pendingUpdateRequests: initialUpdates = [],
  stats,
}) {
  const [localPending, setLocalPending] = useState(initialPending);
  const [localApproved, setLocalApproved] = useState(initialApproved);
  const [localRejected, setLocalRejected] = useState(initialRejected);
  const [localUsers, setLocalUsers] = useState(initialUsers);
  const [localUpdates, setLocalUpdates] = useState(initialUpdates);
  const [activeTab, setActiveTab] = useState("pending");

  function handleUpdateAction(reqId, action) {
    setLocalUpdates((prev) => prev.filter((r) => r.id !== reqId));
  }

  // Called after any action succeeds — moves item between lists immediately
  function handleRegAction(reqId, action, reqData) {
    if (action === "APPROVE" || action === "RECONSIDER") {
      const item = { ...reqData, status: "VERIFIED" };
      setLocalPending((prev) => prev.filter((r) => r.id !== reqId));
      setLocalRejected((prev) => prev.filter((r) => r.id !== reqId));
      setLocalApproved((prev) => [item, ...prev.filter((r) => r.id !== reqId)]);
    } else if (action === "REJECT") {
      const item = { ...reqData, status: "REJECTED" };
      setLocalPending((prev) => prev.filter((r) => r.id !== reqId));
      setLocalApproved((prev) => prev.filter((r) => r.id !== reqId));
      setLocalRejected((prev) => [item, ...prev.filter((r) => r.id !== reqId)]);
    } else if (action === "REVOKE") {
      const item = { ...reqData, status: "PENDING" };
      setLocalApproved((prev) => prev.filter((r) => r.id !== reqId));
      setLocalPending((prev) => [...prev, item]);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Failed to delete user.");
    }
  }

  const tabs = [
    { key: "pending", label: "📋 Pending", count: localPending.length, highlight: localPending.length > 0 },
    { key: "updates", label: "🔄 Updates", count: localUpdates.length, highlight: localUpdates.length > 0 },
    { key: "approved", label: "✅ Approved", count: localApproved.length },
    { key: "rejected", label: "❌ Rejected", count: localRejected.length },
    { key: "users", label: "👥 Users", count: localUsers.length },
  ];

  const tableData = {
    pending: localPending,
    approved: localApproved,
    rejected: localRejected,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="section-title">Admin Panel 🛡️</h1>
        <p className="section-subtitle">Review registrations, manage users, and monitor platform activity.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.875rem", marginBottom: "2rem" }}>
        <StatCard icon="⏳" label="Pending Regs" value={localPending.length} color="#f59e0b" highlight={localPending.length > 0} />
        <StatCard icon="📚" label="Students" value={stats.students} color="#818cf8" />
        <StatCard icon="🏆" label="Alumni" value={stats.alumni} color="#a855f7" />
        <StatCard icon="✅" label="Verified Alumni" value={stats.verified} color="#22c55e" />
        <StatCard icon="🤝" label="Mentorships" value={stats.mentorships} color="#f59e0b" />
        <StatCard icon="📅" label="Events" value={stats.events} color="#14b8a6" />
        <StatCard icon="💼" label="Internships" value={stats.internships} color="#ec4899" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              transition: "all 0.2s ease",
              background: activeTab === tab.key ? "linear-gradient(135deg, #6366f1, #a855f7)" : "var(--bg-card)",
              color: activeTab === tab.key ? "white" : "var(--text-secondary)",
              border: activeTab === tab.key ? "none" : tab.highlight ? "1px solid rgba(245,158,11,0.5)" : "1px solid var(--border)",
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{ marginLeft: 6, fontSize: "0.7rem", background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)", borderRadius: 999, padding: "1px 7px" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Registration Tables */}
      {(activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") && (
        <RegistrationTable
          key={activeTab}
          rows={tableData[activeTab]}
          tab={activeTab}
          onAction={handleRegAction}
        />
      )}

      {/* Updates Table */}
      {activeTab === "updates" && (
        <UpdatesTable requests={localUpdates} onAction={handleUpdateAction} />
      )}

      {/* Users Table */}
      {activeTab === "users" && (
        <UsersTable users={localUsers} onDeleteUser={handleDeleteUser} />
      )}
    </div>
  );
}


