"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function TagInput({ label, value, onChange, placeholder }) {
  const [input, setInput] = useState("");

  function addTag(e) {
    if (e && e.preventDefault) e.preventDefault();
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        {value.map((tag) => (
          <span key={tag} className="tag-pill" style={{ cursor: "pointer" }} onClick={() => removeTag(tag)}>
            {tag} <span style={{ opacity: 0.6 }}>✕</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input 
          className="input" 
          placeholder={placeholder} 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <button type="button" onClick={addTag} className="btn-secondary" style={{ flexShrink: 0, padding: "0.625rem 1rem" }}>Add</button>
      </div>
    </div>
  );
}

export default function ProfileClient({ user, pendingRequest }) {
  const router = useRouter();
  
  // Non-Critical Save State
  const [savingNC, setSavingNC] = useState(false);
  const [savedNC, setSavedNC] = useState(false);

  // Critical Save State
  const [savingCrit, setSavingCrit] = useState(false);
  const [savedCrit, setSavedCrit] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(!!pendingRequest);

  // CRITICAL FIELDS
  const [name, setName] = useState(user.name || "");
  const [mobile, setMobile] = useState(user.mobile || "");
  const [gender, setGender] = useState(user.gender || "");
  const [studentStatus, setStudentStatus] = useState(user.studentStatus || "");
  const [department, setDepartment] = useState(user.department || "");
  const [academicYear, setAcademicYear] = useState(user.academicYear || "");
  const [division, setDivision] = useState(user.division || "");
  const [rollNumber, setRollNumber] = useState(user.rollNumber || "");
  const [prnNumber, setPrnNumber] = useState(user.prnNumber || "");
  const [academicBatch, setAcademicBatch] = useState(user.academicBatch || "");
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || "");

  // NON-CRITICAL FIELDS
  // Student
  const [skills, setSkills] = useState(user.studentProfile?.skills || []);
  const [interests, setInterests] = useState(user.studentProfile?.interests || []);
  const [careerGoals, setCareerGoals] = useState(user.studentProfile?.careerGoals || "");
  const [studentBio, setStudentBio] = useState(user.studentProfile?.bio || "");
  const [linkedinStudent, setLinkedinStudent] = useState(user.studentProfile?.linkedinUrl || "");
  const [github, setGithub] = useState(user.studentProfile?.githubUrl || "");

  // Alumni
  const [industry, setIndustry] = useState(user.alumniProfile?.industry || "");
  const [organization, setOrganization] = useState(user.alumniProfile?.organization || "");
  const [jobTitle, setJobTitle] = useState(user.alumniProfile?.jobTitle || "");
  const [expertise, setExpertise] = useState(user.alumniProfile?.expertiseAreas || []);
  const [alumniBio, setAlumniBio] = useState(user.alumniProfile?.bio || "");
  const [linkedinAlumni, setLinkedinAlumni] = useState(user.alumniProfile?.linkedinUrl || "");
  const [yearsExp, setYearsExp] = useState(user.alumniProfile?.yearsOfExperience || "");

  const isStudent = user.role === "STUDENT";
  const isAlumni = user.role === "ALUMNI";
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleSaveNonCritical(e) {
    e.preventDefault();
    setSavingNC(true);
    try {
      const body = {
        ...(isStudent && {
          studentProfile: { skills, interests, careerGoals, bio: studentBio, linkedinUrl: linkedinStudent, githubUrl: github },
        }),
        ...(isAlumni && {
          alumniProfile: { industry, organization, jobTitle, expertiseAreas: expertise, bio: alumniBio, linkedinUrl: linkedinAlumni, yearsOfExperience: yearsExp },
        }),
      };

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");
      setSavedNC(true);
      setTimeout(() => setSavedNC(false), 3000);
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNC(false);
    }
  }

  async function handleSaveCritical(e) {
    e.preventDefault();
    setSavingCrit(true);
    try {
      const body = {
        name, mobile, gender, studentStatus, department, academicYear, division, rollNumber, prnNumber, academicBatch, graduationYear
      };

      const res = await fetch(`/api/profile/update-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedCrit(true);
      setHasPendingRequest(true);
      setTimeout(() => setSavedCrit(false), 3000);
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCrit(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="avatar avatar-xl">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : initials}
        </div>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{user.name}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="badge badge-brand" style={{ textTransform: "capitalize" }}>{user.role.toLowerCase()}</span>
            {isAlumni && (
              <span className={`badge ${user.alumniProfile?.verificationStatus === "VERIFIED" ? "badge-success" : "badge-warning"}`}>
                {user.alumniProfile?.verificationStatus || "Pending"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NON-CRITICAL SECTION */}
      <form onSubmit={handleSaveNonCritical} style={{ marginBottom: "3rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Profile Details</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Updates to these fields apply immediately.</p>
        </div>

        {/* Student non-critical */}
        {isStudent && (
          <div className="card" style={{ borderRadius: 14, marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input" rows={3} value={studentBio} onChange={(e) => setStudentBio(e.target.value)} placeholder="A short introduction about yourself..." />
            </div>

            <div className="form-group">
              <label className="form-label">Career Goals</label>
              <textarea className="input" rows={2} value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} placeholder="What do you want to achieve in your career?" />
            </div>

            <TagInput label="Skills" value={skills} onChange={setSkills} placeholder="e.g. React, Python, SQL" />
            <TagInput label="Interests" value={interests} onChange={setInterests} placeholder="e.g. Machine Learning, Web Dev" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">LinkedIn URL</label>
                <input className="input" value={linkedinStudent} onChange={(e) => setLinkedinStudent(e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">GitHub URL</label>
                <input className="input" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
              </div>
            </div>
          </div>
        )}

        {/* Alumni non-critical */}
        {isAlumni && (
          <div className="card" style={{ borderRadius: 14, marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">Bio / Mentor Statement</label>
              <textarea className="input" rows={3} value={alumniBio} onChange={(e) => setAlumniBio(e.target.value)} placeholder="Describe your experience and what you can offer as a mentor..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "0.875rem" }}>
              {[
                { label: "Job Title", value: jobTitle, set: setJobTitle, placeholder: "Software Engineer" },
                { label: "Organization", value: organization, set: setOrganization, placeholder: "Google, TCS, etc." },
                { label: "Industry", value: industry, set: setIndustry, placeholder: "Technology, Finance..." },
                { label: "Years of Experience", value: yearsExp, set: setYearsExp, placeholder: "5", type: "number" },
              ].map((f) => (
                <div key={f.label} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input className="input" type={f.type || "text"} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}
            </div>

            <TagInput label="Areas of Expertise" value={expertise} onChange={setExpertise} placeholder="e.g. System Design, Algorithms" />

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">LinkedIn URL</label>
              <input className="input" value={linkedinAlumni} onChange={(e) => setLinkedinAlumni(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={savingNC} style={{ padding: "0.75rem 1.5rem" }}>
          {savingNC ? "Saving..." : savedNC ? "✓ Saved!" : "💾 Save Profile Details"}
        </button>
      </form>


      {/* CRITICAL SECTION */}
      <form onSubmit={handleSaveCritical}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-danger, #ef4444)" }}>Critical Information</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Updates to these fields require Administrator verification and approval.</p>
        </div>
        
        {hasPendingRequest && (
          <div style={{ padding: "1rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, marginBottom: "1rem", color: "#f59e0b" }}>
            <strong style={{ display: "block", marginBottom: 4 }}>Pending Approval</strong>
            You have a pending request to update your critical information. You cannot make further critical changes until an administrator reviews your request.
          </div>
        )}

        <div className="card" style={{ borderRadius: 14, marginBottom: "1.25rem", opacity: hasPendingRequest ? 0.6 : 1, pointerEvents: hasPendingRequest ? "none" : "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={hasPendingRequest} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile</label>
              <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={hasPendingRequest} placeholder="10-digit number" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department</label>
              <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={hasPendingRequest} placeholder="e.g. Computer Science" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Graduation / Passing Year</label>
              <input className="input" type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} disabled={hasPendingRequest} placeholder="2025" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Student Status</label>
              <select className="input" value={studentStatus} onChange={(e) => setStudentStatus(e.target.value)} disabled={hasPendingRequest}>
                <option value="">Select Status</option>
                <option value="CURRENT_STUDENT">Current Student</option>
                <option value="ALUMNI">Alumni</option>
                <option value="PASSOUT">Passout</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gender</label>
              <select className="input" value={gender} onChange={(e) => setGender(e.target.value)} disabled={hasPendingRequest}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {isStudent && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Academic Year</label>
                  <select className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} disabled={hasPendingRequest}>
                    <option value="">Select Year</option>
                    <option value="FIRST_YEAR">First Year (FY)</option>
                    <option value="SECOND_YEAR">Second Year (SY)</option>
                    <option value="TY">Third Year (TY)</option>
                    <option value="LY">Final Year (LY)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Division</label>
                  <input className="input" value={division} onChange={(e) => setDivision(e.target.value)} disabled={hasPendingRequest} placeholder="e.g. A" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Roll Number</label>
                  <input className="input" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} disabled={hasPendingRequest} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PRN Number</label>
                  <input className="input" value={prnNumber} onChange={(e) => setPrnNumber(e.target.value)} disabled={hasPendingRequest} />
                </div>
              </>
            )}
            
            <div className="form-group" style={{ marginBottom: 0, gridColumn: "span 2" }}>
              <label className="form-label">Academic Batch (YYYY-YYYY)</label>
              <input className="input" value={academicBatch} onChange={(e) => setAcademicBatch(e.target.value)} disabled={hasPendingRequest} placeholder="2021-2025" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-secondary" disabled={savingCrit || hasPendingRequest} style={{ padding: "0.75rem 1.5rem" }}>
          {savingCrit ? "Submitting Request..." : savedCrit ? "✓ Requested!" : "Submit Critical Change Request"}
        </button>
      </form>
    </div>
  );
}

