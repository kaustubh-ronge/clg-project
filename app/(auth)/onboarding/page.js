"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const DEPARTMENTS = ["CSE", "Mechanical", "Civil", "ENTC", "MBA", "MCA"];
const PG_PROGRAMS = ["MBA", "MCA"];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const STATUS_OPTIONS = [
  { value: "CURRENT_STUDENT", label: "Current Student", icon: "📚" },
  { value: "ALUMNI", label: "Alumni", icon: "🏆" },
  { value: "PASSOUT", label: "Passout (Recent Graduate)", icon: "🎓" },
];

const ACADEMIC_YEAR_OPTIONS = [
  { value: "FY", label: "FY — First Year" },
  { value: "SY", label: "SY — Second Year" },
  { value: "TY", label: "TY — Third Year" },
  { value: "LY", label: "LY — Final Year" },
];

const PG_YEAR_OPTIONS = [
  { value: "FIRST_YEAR", label: "First Year" },
  { value: "SECOND_YEAR", label: "Second Year" },
];

function FormField({ label, required, hint, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{" "}
        {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: "0.75rem", color: "#f87171", marginTop: 4, fontWeight: 500 }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** Styled wrapper for NativeSelect that fills full width */
function AppSelect({ value, onChange, children, placeholder }) {
  return (
    <NativeSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%" }}
      className="w-full"
    >
      {placeholder && (
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
      )}
      {children}
    </NativeSelect>
  );
}

export default function RegistrationPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const fieldRefs = useRef({});
  const [existingRequest, setExistingRequest] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  function focusField(fieldName) {
    if (fieldRefs.current[fieldName]) {
      fieldRefs.current[fieldName].focus();
    }
  }

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    gender: "",
    studentStatus: "",
    academicYear: "",
    department: "",
    division: "",
    rollNumber: "",
    prnNumber: "",
    academicBatch: "",
    passingYear: "",
  });

  // Pre-fill name from Clerk
  useEffect(() => {
    if (clerkUser) {
      setForm((p) => ({
        ...p,
        fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      }));
    }
  }, [clerkUser]);

  // Check current registration state
  useEffect(() => {
    let timeoutId;
    async function checkStatus() {
      try {
        const res = await fetch("/api/registration");
        const data = await res.json();

        // Admin → skip all student flows
        if (data.user?.role === "ADMIN") {
          router.replace("/dashboard");
          return;
        }

        // Already active → go to dashboard
        if (data.user?.accountStatus === "ACTIVE") {
          router.replace("/dashboard");
          return;
        }

        if (data.request) {
          setExistingRequest(data.request);
          
          // Poll every 10 seconds if still pending
          if (data.request.status === "PENDING") {
            timeoutId = setTimeout(checkStatus, 10000);
          }
        }
      } catch {
        // Network error — still show the form
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);

  const isPgProgram = PG_PROGRAMS.includes(form.department);
  const isFY = form.academicYear === "FY";
  const isAlumniOrPassout =
    form.studentStatus === "ALUMNI" || form.studentStatus === "PASSOUT";
  const isCurrentStudent = form.studentStatus === "CURRENT_STUDENT";
  const yearOptions = isPgProgram ? PG_YEAR_OPTIONS : ACADEMIC_YEAR_OPTIONS;

  function set(key, val) {
    setForm((p) => {
      const next = { ...p, [key]: val };
      if (key === "department" && !PG_PROGRAMS.includes(val)) {
        if (
          p.academicYear.startsWith("FIRST") ||
          p.academicYear.startsWith("SECOND")
        )
          next.academicYear = "";
      }
      if (key === "department" && PG_PROGRAMS.includes(val)) {
        if (!["FIRST_YEAR", "SECOND_YEAR"].includes(p.academicYear))
          next.academicYear = "";
      }
      if (key === "academicYear" && val === "FY") next.department = "";
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  }

  function resetStatusFields() {
    setForm((p) => ({
      ...p,
      academicYear: "",
      department: "",
      passingYear: "",
    }));
  }

  function validateStep(s) {
    const newErrors = {};
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.trim().length < 3) {
        newErrors.fullName = "Full name must be at least 3 characters.";
      } else if (!/^[a-zA-Z\s]+$/.test(form.fullName)) {
        newErrors.fullName = "Only letters and spaces are allowed.";
      }

      if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.replace(/\s/g, ""))) {
        newErrors.mobile = "Enter a valid 10-digit mobile number.";
      }

      if (!form.studentStatus) {
        newErrors.studentStatus = "Please select your status.";
      }
    }
    if (s === 2) {
      if (isCurrentStudent) {
        if (!form.academicYear) newErrors.academicYear = "Please select your academic year.";
        if (!isFY && !form.department) newErrors.department = "Please select your department.";
        if (!form.rollNumber.trim()) {
          newErrors.rollNumber = "Roll number is required.";
        } else if (!/^[a-zA-Z0-9-]*$/.test(form.rollNumber)) {
          newErrors.rollNumber = "Only letters, numbers, and hyphens allowed.";
        }
      }
      if (isAlumniOrPassout && !form.passingYear) {
        newErrors.passingYear = "Passing year is required.";
      }
      if (form.prnNumber && !/^[a-zA-Z0-9]*$/.test(form.prnNumber)) {
        newErrors.prnNumber = "Only letters and numbers allowed.";
      }
      if (form.academicBatch && !/^\d{4}-\d{4}$/.test(form.academicBatch)) {
        newErrors.academicBatch = "Batch must be in YYYY-YYYY format (e.g., 2025-2026).";
      }
    }

    setErrors(newErrors);
    const firstError = Object.keys(newErrors)[0];
    if (firstError) {
      focusField(firstError);
      return false;
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setError("");
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          setError("Please fix the highlighted fields.");
          if (data.fieldErrors.fullName || data.fieldErrors.mobile || data.fieldErrors.studentStatus) {
            setStep(1);
          } else {
            setStep(2);
          }
          return;
        }
        throw new Error(data.error || "Submission failed");
      }
      setExistingRequest(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleResubmit() {
    setExistingRequest(null);
    setStep(1);
    setError("");
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!isLoaded || checkingStatus) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          className="loading-spinner"
          style={{ width: 36, height: 36, borderWidth: 3 }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading your account…
        </p>
      </div>
    );
  }

  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  // ── PENDING APPROVAL ─────────────────────────────────────────────────────
  if (existingRequest && existingRequest.status === "PENDING") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="orb orb-brand"
          style={{ width: 500, height: 500, top: -200, left: "50%", transform: "translateX(-50%)" }}
        />
        <div
          className="glass"
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: 20,
            padding: "2.5rem",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏳</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Waiting for Approval
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
            }}
          >
            Your registration has been submitted and is being reviewed by the
            admin / TPO. You&apos;ll be notified once it&apos;s approved.
          </p>

          <div
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Submitted Details
            </p>
            {[
              { label: "Name", val: existingRequest.fullName },
              {
                label: "Status",
                val: existingRequest.studentStatus?.replace(/_/g, " "),
              },
              { label: "Department", val: existingRequest.department },
              { label: "Roll No", val: existingRequest.rollNumber },
              {
                label: "Submitted",
                val: new Date(existingRequest.createdAt).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "long", year: "numeric" }
                ),
              },
            ]
              .filter((i) => i.val)
              .map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.25rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.val}
                  </span>
                </div>
              ))}
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            This page will refresh automatically once the admin reviews your
            request.
          </p>
        </div>
      </div>
    );
  }

  // ── REJECTED ─────────────────────────────────────────────────────────────
  if (existingRequest && existingRequest.status === "REJECTED") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="orb orb-accent"
          style={{ width: 400, height: 400, top: -100, right: -100 }}
        />
        <div
          className="glass"
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: 20,
            padding: "2.5rem",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>❌</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Registration Rejected
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Reviewed on {existingRequest.reviewedAt ? new Date(existingRequest.reviewedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
          </p>
          {existingRequest.rejectionReason && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12,
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#f87171",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{existingRequest.rejectionReason}&rdquo;
              </p>
            </div>
          )}
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
            }}
          >
            Please review the feedback above, make the necessary corrections, and resubmit your registration.
          </p>
          <button
            className="btn-primary"
            onClick={handleResubmit}
            style={{ justifyContent: "center", width: "100%" }}
          >
            ✏️ Edit &amp; Resubmit
          </button>
        </div>
      </div>
    );
  }

  // ── REVOKED ──────────────────────────────────────────────────────────────
  if (existingRequest && existingRequest.status === "REVOKED") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="orb orb-accent"
          style={{ width: 400, height: 400, top: -100, right: -100, background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 70%)" }}
        />
        <div
          className="glass"
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: 20,
            padding: "2.5rem",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Access Revoked
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Reviewed on {existingRequest.reviewedAt ? new Date(existingRequest.reviewedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
          </p>
          {existingRequest.revocationReason && (
            <div
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 12,
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#f59e0b",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{existingRequest.revocationReason}&rdquo;
              </p>
            </div>
          )}
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
            }}
          >
            Your previously approved access has been revoked by an administrator. Please review the reason above and either contact support or submit a new registration.
          </p>
          <button
            className="btn-primary"
            onClick={handleResubmit}
            style={{ justifyContent: "center", width: "100%", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}
          >
            ✏️ Submit New Registration
          </button>
        </div>
      </div>
    );
  }

  // ── REGISTRATION FORM ────────────────────────────────────────────────────
  const stepLabels = ["Personal Info", "Academic Details", "Review & Submit"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 1.5rem 4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="orb orb-brand"
        style={{ width: 600, height: 600, top: -200, left: -100 }}
      />
      <div
        className="orb orb-accent"
        style={{ width: 400, height: 400, bottom: -100, right: -100 }}
      />

      <div
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 620 }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
              }}
            >
              🎓
            </div>
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              EduBridge
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Student Registration
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Complete the form — an admin will review and approve your account.
          </p>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isDone = step > s;
            const isActive = step === s;
            return (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", flex: 1 }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      background: isDone
                        ? "#22c55e"
                        : isActive
                        ? "linear-gradient(135deg, #6366f1, #a855f7)"
                        : "rgba(255,255,255,0.07)",
                      color:
                        isDone || isActive ? "white" : "var(--text-muted)",
                      border:
                        isDone || isActive ? "none" : "1px solid var(--border)",
                      transition: "all 0.3s",
                    }}
                  >
                    {isDone ? "✓" : s}
                  </div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: isActive
                        ? "var(--brand-light)"
                        : "var(--text-muted)",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: step > s ? "#22c55e" : "var(--border)",
                      margin: "0 4px",
                      marginBottom: 18,
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="glass" style={{ borderRadius: 20, padding: "2rem" }}>
          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  marginBottom: "1.5rem",
                }}
              >
                Personal Information
              </h2>

              <FormField label="Full Name" required error={errors.fullName}>
                <input
                  ref={(el) => (fieldRefs.current.fullName = el)}
                  className="input"
                  value={form.fullName}
                  onChange={(e) => {
                    // Prevent digits in name
                    if (/\d/.test(e.target.value)) return;
                    set("fullName", e.target.value);
                  }}
                  onBlur={() => validateStep(1)}
                  placeholder="e.g. Sakshi Ronge"
                />
              </FormField>

              <FormField
                label="Email Address"
                hint="From your Clerk account — cannot be changed."
              >
                <input
                  className="input"
                  value={email || ""}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </FormField>

              <FormField label="Mobile Number" required error={errors.mobile}>
                <input
                  ref={(el) => (fieldRefs.current.mobile = el)}
                  className="input"
                  value={form.mobile}
                  onChange={(e) => {
                    // Block non-numeric characters entirely
                    if (/[^0-9]/.test(e.target.value)) return;
                    set("mobile", e.target.value);
                  }}
                  onBlur={() => validateStep(1)}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </FormField>

              <FormField label="Gender">
                <AppSelect
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  placeholder="Prefer not to say"
                >
                  <NativeSelectOption value="Male">Male</NativeSelectOption>
                  <NativeSelectOption value="Female">Female</NativeSelectOption>
                  <NativeSelectOption value="Other">Other</NativeSelectOption>
                </AppSelect>
              </FormField>

              <FormField label="Status" required error={errors.studentStatus}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        set("studentStatus", opt.value);
                        resetStatusFields();
                      }}
                      style={{
                        padding: "1rem 0.5rem",
                        borderRadius: 12,
                        cursor: "pointer",
                        textAlign: "center",
                        border:
                          form.studentStatus === opt.value
                            ? "2px solid var(--brand)"
                            : "2px solid var(--border)",
                        background:
                          form.studentStatus === opt.value
                            ? "rgba(99,102,241,0.12)"
                            : "rgba(255,255,255,0.03)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>
                        {opt.icon}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color:
                            form.studentStatus === opt.value
                              ? "var(--brand-light)"
                              : "var(--text-secondary)",
                        }}
                      >
                        {opt.label}
                      </div>
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* ── STEP 2: Academic Details ── */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  marginBottom: "1.5rem",
                }}
              >
                Academic Details
              </h2>

              {isCurrentStudent && (
                <>
                  <FormField label="Department" required error={errors.department}>
                    <AppSelect
                      value={form.department}
                      onChange={(v) => {
                        set("department", v);
                        set("academicYear", "");
                      }}
                      placeholder="Select department"
                    >
                      {DEPARTMENTS.map((d) => (
                        <NativeSelectOption key={d} value={d}>
                          {d}
                        </NativeSelectOption>
                      ))}
                    </AppSelect>
                  </FormField>

                  {form.department && (
                    <FormField
                      label="Academic Year"
                      required
                      error={errors.academicYear}
                      hint={
                        !isPgProgram
                          ? "Note: If FY, department allocation happens later."
                          : undefined
                      }
                    >
                      <AppSelect
                        value={form.academicYear}
                        onChange={(v) => set("academicYear", v)}
                        placeholder="Select year"
                      >
                        {yearOptions.map((y) => (
                          <NativeSelectOption key={y.value} value={y.value}>
                            {y.label}
                          </NativeSelectOption>
                        ))}
                      </AppSelect>
                    </FormField>
                  )}

                  {isFY && !isPgProgram && (
                    <div
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: 10,
                        padding: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <p style={{ fontSize: "0.82rem", color: "#fbbf24" }}>
                        ℹ️ First-year students have no department yet — it will
                        be assigned by the institute after allocation.
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.875rem",
                    }}
                  >
                    <FormField label="Division" error={errors.division}>
                      <input
                        ref={(el) => (fieldRefs.current.division = el)}
                        className="input"
                        value={form.division}
                        onChange={(e) => set("division", e.target.value)}
                        onBlur={() => validateStep(2)}
                        placeholder="A, B, C…"
                      />
                    </FormField>
                    <FormField label="Roll Number" required error={errors.rollNumber}>
                      <input
                        ref={(el) => (fieldRefs.current.rollNumber = el)}
                        className="input"
                        value={form.rollNumber}
                        onChange={(e) => set("rollNumber", e.target.value)}
                        onBlur={() => validateStep(2)}
                        placeholder="e.g. 42"
                        inputMode="numeric"
                      />
                    </FormField>
                    <FormField label="PRN / Enrollment No." error={errors.prnNumber}>
                      <input
                        ref={(el) => (fieldRefs.current.prnNumber = el)}
                        className="input"
                        value={form.prnNumber}
                        onChange={(e) => set("prnNumber", e.target.value)}
                        onBlur={() => validateStep(2)}
                        placeholder="e.g. 72020…"
                      />
                    </FormField>
                    <FormField label="Academic Batch" error={errors.academicBatch}>
                      <input
                        ref={(el) => (fieldRefs.current.academicBatch = el)}
                        className="input"
                        value={form.academicBatch}
                        onChange={(e) => set("academicBatch", e.target.value)}
                        onBlur={() => validateStep(2)}
                        placeholder="e.g. 2022-2026"
                      />
                    </FormField>
                  </div>
                </>
              )}

              {isAlumniOrPassout && (
                <>
                  <FormField label="Department" error={errors.department}>
                    <AppSelect
                      value={form.department}
                      onChange={(v) => set("department", v)}
                      placeholder="Select department"
                    >
                      {DEPARTMENTS.map((d) => (
                        <NativeSelectOption key={d} value={d}>
                          {d}
                        </NativeSelectOption>
                      ))}
                    </AppSelect>
                  </FormField>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.875rem",
                    }}
                  >
                    <FormField label="Passing Year" required error={errors.passingYear}>
                      <AppSelect
                        value={form.passingYear}
                        onChange={(v) => set("passingYear", v)}
                        placeholder="Select year"
                      >
                        {YEARS.map((y) => (
                          <NativeSelectOption key={y} value={String(y)}>
                            {y}
                          </NativeSelectOption>
                        ))}
                      </AppSelect>
                    </FormField>
                    <FormField label="PRN / Enrollment No." error={errors.prnNumber}>
                      <input
                        ref={(el) => (fieldRefs.current.prnNumber = el)}
                        className="input"
                        value={form.prnNumber}
                        onChange={(e) => set("prnNumber", e.target.value)}
                        onBlur={() => validateStep(2)}
                        placeholder="e.g. 72020…"
                      />
                    </FormField>
                  </div>
                  <FormField label="Roll Number" error={errors.rollNumber}>
                    <input
                      ref={(el) => (fieldRefs.current.rollNumber = el)}
                      className="input"
                      value={form.rollNumber}
                      onChange={(e) => set("rollNumber", e.target.value)}
                      onBlur={() => validateStep(2)}
                      placeholder="e.g. 42"
                      inputMode="numeric"
                    />
                  </FormField>
                </>
              )}
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  marginBottom: "1.5rem",
                }}
              >
                Review Your Details
              </h2>

              {[
                { label: "Full Name", val: form.fullName },
                { label: "Email", val: email },
                { label: "Mobile", val: form.mobile },
                { label: "Gender", val: form.gender || "—" },
                {
                  label: "Status",
                  val: form.studentStatus?.replace(/_/g, " "),
                },
                { label: "Academic Year", val: form.academicYear || "—" },
                { label: "Department", val: form.department || "—" },
                { label: "Division", val: form.division || "—" },
                { label: "Roll No.", val: form.rollNumber || "—" },
                { label: "PRN", val: form.prnNumber || "—" },
                { label: "Batch", val: form.academicBatch || "—" },
                { label: "Passing Year", val: form.passingYear || "—" },
              ]
                .filter((item) => item.val && item.val !== "—")
                .map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {item.val}
                    </span>
                  </div>
                ))}

              <div
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 10,
                  padding: "0.875rem",
                  marginTop: "1.25rem",
                }}
              >
                <p
                  style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}
                >
                  ℹ️ By submitting, you confirm all information is accurate.
                  The TPO / Admin will review your request and notify you once
                  reviewed.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10,
                padding: "0.75rem",
                marginTop: "1rem",
                color: "#f87171",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1.5rem",
            }}
          >
            {step > 1 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStep((s) => s - 1);
                  setError("");
                }}
                style={{ flex: 1, justifyContent: "center" }}
              >
                ← Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                className="btn-primary"
                onClick={nextStep}
                style={{ flex: step > 1 ? 2 : 1, justifyContent: "center" }}
              >
                Continue →
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 2, justifyContent: "center" }}
              >
                {loading ? (
                  <>
                    <span
                      className="loading-spinner"
                      style={{ width: 16, height: 16 }}
                    />
                    Submitting…
                  </>
                ) : (
                  "🚀 Submit Registration"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
