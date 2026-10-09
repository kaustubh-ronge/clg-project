# EduBridge — Project Context for AI Agent

> Source: derived from the review paper *"EduBridge: Smart Alumni Networking and Mentorship System Using Machine Learning"* (SVERI's College of Engineering, Pandharpur). This document translates the paper into an actionable build brief for an AI coding agent (Claude Code, Cursor, etc.). It is NOT the paper itself — it's a spec.

---

## 1. One-line summary

A web platform that connects verified college alumni with current students for AI-matched mentorship, real-time communication, internships/placements, and department-based networking — replacing informal/social-media-based alumni outreach with a secure, centralized, intelligent system.

## 2. Problem being solved

- Existing alumni systems are mostly **record-keeping databases**, not engagement/mentorship tools.
- Students rely on scattered social media / personal contacts to reach alumni — no verification, no privacy, inefficient.
- No system in the reviewed literature combines: AI mentor-matching + secure alumni verification + resume intelligence (OCR/NLP) + real-time communication + department-specific networking + event/internship management **in one platform**. Each competitor paper does 1–3 of these, not all.
- **EduBridge's differentiator is integration**, not any single novel algorithm.

## 3. Core objectives (from the paper)

1. Centralized, secure storage of student & alumni data.
2. Improve student career outcomes via internships, job leads, coaching.
3. Increase alumni engagement via networking, events, ongoing communication.
4. Give admins an intelligent monitoring/decision-support layer.
5. Real-time communication and collaboration (chat + video).
6. Professional profiles / networking surface (LinkedIn-style, but institution-scoped).
7. ML-based personalized mentor matching using student interests, skills, career goals + alumni expertise.

## 4. Target users / roles

| Role | Key capabilities |
|---|---|
| **Student** | Register, build profile, upload resume, browse/search alumni, filter mentors by dept/specialization/industry/org, request mentorship, chat/video call, view internships & events, get personalized mentor recommendations |
| **Alumni (Mentor)** | Register, get verified by admin, build professional profile (expertise, industry, org), accept/decline mentorship requests, chat/video with mentees, post internships/jobs, host group mentorship sessions, participate in events |
| **Admin** | Face-recognition-secured login, verify alumni registrations, manage users, manage events, monitor mentorship activity, generate institutional reports |

## 5. Proposed architecture (three-tier, as specified in the paper)

```
Frontend:  React.js
Backend:   Node.js + Express.js
Database:  MongoDB
Real-time: Socket.IO (chat) + WebRTC (video mentoring sessions)
```

### Cross-cutting technical components
- **Facial recognition** — for **administrator** login/authentication (not general user login).
- **OCR** — extract text from uploaded resumes (e.g., Tesseract.js, or a cloud OCR API).
- **NLP** — parse OCR output to extract skills, certifications, education, career interests (build feature vectors from this).
- **ML recommendation engine** — content-based / feature-matching model that scores alumni against a student's profile vector (skills, department, graduation year, career interests, alumni domain expertise). Paper cites content-based filtering / matching-learning approaches as the norm in this space (not deep learning necessarily — start simple, e.g., cosine similarity over feature vectors, TF-IDF on skills/interests, or a lightweight classifier).
- **Notifications** — automated alerts for mentorship activity, events, internships.

## 6. Functional modules to build

1. **Auth & Onboarding**
   - Student/Alumni registration with academic + professional details.
   - Alumni verification workflow (admin approves/rejects new alumni accounts).
   - Admin login secured via facial recognition.
2. **Profile management** — professional profile pages for both students and alumni (skills, dept, specialization, industry, organization, graduation year, bio).
3. **Resume pipeline** — upload → OCR extraction → NLP parsing → structured skill/interest data stored against the student profile.
4. **Mentor recommendation engine** — ranks/suggests alumni mentors per student; re-runs when profile/skills change ("dynamic" recommendation per paper).
5. **Mentor discovery / search & filter** — by department, specialization, industry, organization, area of expertise.
6. **Mentorship request workflow** — student requests → alumni accepts/declines → on acceptance, unlock chat + video.
7. **Real-time communication** — 1:1 chat (Socket.IO), virtual mentoring sessions (WebRTC). Consider group mentorship sessions too (paper mentions "group mentorship sessions" as a feature).
8. **Internships & job postings** — alumni can post; students can browse/apply.
9. **Event management** — admin/institution creates events (meetups, seminars, workshops, placement drives); alumni/students can view/RSVP.
10. **Notifications system** — mentorship activity, events, internship updates, reminders.
11. **Admin dashboard** — user management, alumni verification queue, mentorship activity monitoring, institutional reports/analytics.
12. **Department-specific communities** — networking scoped to a department, called out repeatedly as something competitors lack.

## 7. Data model (starting point — MongoDB collections)

- `users` (base: name, email, password/auth, role: student|alumni|admin, department, graduation year, verified flag)
- `studentProfiles` (skills[], interests[], careerGoals[], resumeUrl, extractedResumeData{})
- `alumniProfiles` (industry, organization, expertiseAreas[], bio, verificationStatus)
- `mentorshipRequests` (studentId, alumniId, status: pending|accepted|declined, createdAt)
- `messages` (conversationId, senderId, text, timestamp) — for chat history
- `events` (title, description, date, type, department, attendees[])
- `internships` (postedByAlumniId, title, company, description, applyLink/instructions, postedAt)
- `notifications` (userId, type, message, read, createdAt)

## 8. What makes this different from competitors (per the paper's comparative table) — keep these front and center

| Gap in existing systems | EduBridge must cover it |
|---|---|
| No facial recognition | Admin auth uses face recognition |
| No real-time chat / event mgmt (some systems) | Socket.IO chat + WebRTC + full event module |
| No secure alumni verification / dept networking | Admin verification queue + dept-scoped communities |
| No resume-based personalization | OCR + NLP resume pipeline feeding the recommender |
| No unified mentor + internship + event + comms platform | Everything in one app, not a point solution |

## 9. Non-functional requirements implied by the paper

- **Security**: verified registration, admin-only face-recognition login, presumably JWT/session auth for regular users, resume/data privacy.
- **Scalability**: paper explicitly calls for a "secure and expandable" / "scalable" system — design for institution-wide, potentially multi-department scale.
- **Real-time**: chat and video must be low-latency (Socket.IO + WebRTC are the specified choices).
- **Maintainability**: recommendation engine should re-score on profile updates ("dynamic... regularly updated" per paper) — don't hardcode a one-time batch job only.

## 10. Suggested build order (practical, for an agent to execute incrementally)

1. Scaffold MERN app (Express API + MongoDB + React client), auth (student/alumni/admin roles).
2. Profile CRUD for students & alumni.
3. Admin verification workflow (basic — face recognition can be phase 2; start with manual/photo-upload admin approval to unblock the rest of the app).
4. Mentor directory with filters (dept/specialization/industry/org).
5. Mentorship request flow (send/accept/decline).
6. Chat (Socket.IO) — gated behind an accepted mentorship request.
7. Resume upload + OCR + NLP extraction → store structured skills.
8. Recommendation engine v1 (simple similarity scoring over structured profile + resume-derived skills).
9. Internships/jobs module.
10. Events module.
11. Notifications.
12. Admin dashboard/analytics.
13. WebRTC video sessions.
14. Facial-recognition admin login (can be added once core flows are stable — treat as a hardening/security phase).

## 11. Explicitly out of scope / not detailed in the paper (agent should ask or make reasonable calls)

- Exact ML algorithm/model for the recommender (paper is intentionally vague — "recommendation engine," "content-based filtering" style; no specific library/model named).
- Specific OCR/NLP libraries.
- UI/UX design system.
- Deployment/hosting stack.
- Payment/monetization — none mentioned, likely N/A (academic/institutional project).

## 12. Reference framing (for context, not to be copied verbatim into code/comments)

The paper positions EduBridge against 12 cited works (mentor-matching platforms, career-guidance AI, knowledge-graph recommenders, etc.), all of which solve pieces of this problem but not the whole. EduBridge's contribution is the **integration** of: verified alumni onboarding + facial-recognition admin auth + AI mentor matching + OCR/NLP resume intelligence + real-time chat/video + internship & event management + department-scoped networking, in a single platform.

---

**Author/institution context (from paper header, for reference only):** Dr. Prajakta A. Satarakar, Mr. Suraj W. Koli, Dr. Vanita D. Jadhav, Sakshi B. Ronge, Shraddha G. Patil, Mansi B. Kshirsagar — Computer Science and Engineering Department, SVERI's College of Engineering, Pandharpur, India.