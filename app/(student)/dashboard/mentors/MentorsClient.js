"use client";

import { useState, useMemo } from "react";
import MentorCard from "@/components/MentorCard";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export default function MentorsClient({
  mentors,
  recommendations,
  requestedAlumniIds,
  isStudent,
  departments,
  industries,
}) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [industry, setIndustry] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "recommended"
  const [requested, setRequested] = useState(new Set(requestedAlumniIds));

  const filtered = useMemo(() => {
    const source = activeTab === "recommended" ? recommendations : mentors;
    return source.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.alumniProfile?.organization?.toLowerCase().includes(search.toLowerCase()) ||
        m.alumniProfile?.expertiseAreas?.some((e) => e.toLowerCase().includes(search.toLowerCase()));
      const matchDept = !department || m.department === department;
      const matchIndustry = !industry || m.alumniProfile?.industry === industry;
      return matchSearch && matchDept && matchIndustry;
    });
  }, [search, department, industry, activeTab, mentors, recommendations]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="section-title">Find Mentors 🔍</h1>
        <p className="section-subtitle">Connect with verified alumni mentors from your institution.</p>
      </div>

      {/* Tabs */}
      {isStudent && recommendations.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {["all", "recommended"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s ease",
                background: activeTab === tab ? "linear-gradient(135deg, #6366f1, #a855f7)" : "var(--bg-card)",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
                border: activeTab === tab ? "none" : "1px solid var(--border)",
              }}
            >
              {tab === "all" ? `All Mentors (${mentors.length})` : `🤖 AI Recommended (${recommendations.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          className="input"
          placeholder="Search by name, company, skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <NativeSelect
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <NativeSelectOption value="">All Departments</NativeSelectOption>
          {departments.map((d) => (
            <NativeSelectOption key={d} value={d}>{d}</NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <NativeSelectOption value="">All Industries</NativeSelectOption>
          {industries.map((ind) => (
            <NativeSelectOption key={ind} value={ind}>{ind}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>No mentors found</h3>
          <p style={{ fontSize: "0.875rem" }}>Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>
            Showing {filtered.length} mentor{filtered.length !== 1 ? "s" : ""}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}>
            {filtered.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                hasRequested={requested.has(mentor.id)}
                onRequest={() => setRequested((prev) => new Set([...prev, mentor.id]))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
