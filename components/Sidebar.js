"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const studentItems = [
  { href: "/dashboard", label: "Home", icon: "🏠", exact: true },
  { href: "/dashboard/mentors", label: "Find Mentors", icon: "🔍" },
  { href: "/dashboard/mentorship", label: "Mentorship", icon: "🤝" },
  { href: "/dashboard/messages", label: "Messages", icon: "💬" },
  { href: "/dashboard/internships", label: "Internships", icon: "💼" },
  { href: "/dashboard/events", label: "Events", icon: "📅" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
];

const alumniItems = [
  { href: "/dashboard", label: "Home", icon: "🏠", exact: true },
  { href: "/dashboard/mentorship", label: "Mentorship", icon: "🤝" },
  { href: "/dashboard/messages", label: "Messages", icon: "💬" },
  { href: "/dashboard/internships", label: "Post Internships", icon: "💼" },
  { href: "/dashboard/events", label: "Events", icon: "📅" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
];

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: "🛡️", exact: true },
  { href: "/dashboard/events", label: "Events", icon: "📅" },
  { href: "/dashboard/internships", label: "Internships", icon: "💼" },
];

function NavLink({ item, pathname }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={`sidebar-link${isActive ? " active" : ""}`}
      style={{ marginBottom: 2 }}
    >
      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ role, userName, avatarUrl }) {
  const pathname = usePathname();

  const isAdmin = role === "ADMIN";
  const isAlumni = role === "ALUMNI";
  const navItems = isAdmin ? adminItems : isAlumni ? alumniItems : studentItems;

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 1rem",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            flexShrink: 0,
          }}
        >
          🎓
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "var(--text-primary)",
          }}
        >
          EduBridge
        </span>
      </Link>

      {/* Role badge */}
      <div style={{ marginBottom: "1rem", paddingLeft: "0.25rem" }}>
        <span
          className={`badge ${
            isAdmin
              ? "badge-danger"
              : isAlumni
              ? "badge-brand"
              : "badge-success"
          }`}
        >
          {isAdmin ? "⚡ Admin" : isAlumni ? "🏆 Alumni" : "📚 Student"}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
            padding: "0 0.875rem",
          }}
        >
          {isAdmin ? "Admin" : "Navigation"}
        </p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="divider" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.5rem 0.375rem",
        }}
      >
        <UserButton afterSignOutUrl="/" />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName || "User"}
          </p>
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              textTransform: "capitalize",
            }}
          >
            {role?.toLowerCase() || "member"}
          </p>
        </div>
      </div>
    </aside>
  );
}
