# EduBridge — Implementation Plan

## Overview

Build **EduBridge**, a full-stack web platform connecting college alumni with students for AI-matched mentorship, real-time communication, internship/placement discovery, and department-based networking.

**Stack**: Next.js 16.2 (App Router) · Clerk (auth) · Prisma v7 + Neon PostgreSQL · Tailwind CSS v4

---

## User Review Required

> [!IMPORTANT]
> The context.md specifies **MongoDB** as the original DB, but the project is already scaffolded with **PostgreSQL (Neon) + Prisma**. This plan uses PostgreSQL with Prisma relational models — the data model is equivalent but uses relations/joins instead of embedded documents. Approve to proceed with PostgreSQL.

> [!IMPORTANT]
> The context.md specifies React.js + Node/Express (MERN). The project is already scaffolded as **Next.js 16 (App Router)**. API routes live in `app/api/` as Route Handlers. Approve to proceed with Next.js.

> [!IMPORTANT]
> **Clerk** is used for auth (student/alumni/admin). Clerk manages passwords/sessions. We'll store role (`student | alumni | admin`) and other profile data in our own database, synced via Clerk webhooks.

> [!NOTE]
> **Phase 1 (this build)** covers modules 1–8 from the build order. Advanced features (WebRTC video, facial recognition admin login, full ML recommendation engine) are Phase 2. The mentor recommendation engine v1 will use cosine-similarity scoring over structured skills/interests (computable server-side without a separate ML service).

---

## Open Questions

> [!WARNING]
> Do you need a Clerk webhook endpoint for user sync? Clerk needs a public URL to call. For local dev, a tunnel (ngrok/localtunnel) or **manual role assignment via a `/onboarding` page** is simpler. This plan will use an **onboarding page** (no webhook required for now).

---

## Proposed Changes

### 1. Database Schema (Prisma)

#### [MODIFY] [schema.prisma](file:///d:/03_PROJECTS/clg-project/prisma/schema.prisma)

Add all models:
- `User` — stores Clerk userId, role (STUDENT/ALUMNI/ADMIN), department, graduationYear, verified
- `StudentProfile` — skills[], interests[], careerGoals, resumeUrl, extractedSkills
- `AlumniProfile` — industry, organization, expertiseAreas[], bio, verificationStatus
- `MentorshipRequest` — studentId ↔ alumniId, status (PENDING/ACCEPTED/DECLINED)
- `Message` — conversationId, senderId, text, timestamp
- `Conversation` — between student and alumni (unlocked after accepted mentorship)
- `Event` — title, description, date, type, department, attendees
- `Internship` — postedByAlumniId, title, company, description, applyLink
- `Notification` — userId, type, message, read, createdAt

---

### 2. Prisma Client Fix

#### [MODIFY] [prisma.js](file:///d:/03_PROJECTS/clg-project/lib/prisma.js)

Fix the import path — generated client is at `@prisma/client`, not `./generated/prisma/client`.

---

### 3. Global Styles & Layout

#### [MODIFY] [globals.css](file:///d:/03_PROJECTS/clg-project/app/globals.css)

Rich dark-mode design system:
- HSL-based color palette (indigo/violet/slate)
- Custom CSS variables for brand colors
- Typography using Geist Sans
- Smooth transition utilities

#### [MODIFY] [layout.js](file:///d:/03_PROJECTS/clg-project/app/layout.js)

- Update metadata (EduBridge title/description)
- Add Inter/Geist fonts
- Wrap with ClerkProvider (already there)

---

### 4. Middleware (Auth + Role Protection)

#### [NEW] [middleware.js](file:///d:/03_PROJECTS/clg-project/middleware.js)

Clerk middleware to:
- Protect all routes except `/`, `/sign-in`, `/sign-up`, `/onboarding`
- Redirect unauthenticated users to `/sign-in`

---

### 5. Pages & Routes

#### [MODIFY] [app/page.js](file:///d:/03_PROJECTS/clg-project/app/page.js)
Landing page — hero section, features, CTA to sign up/sign in.

#### [NEW] `app/onboarding/page.js`
Post-signup form: choose role (Student/Alumni), department, graduation year, etc. Saves to DB.

#### [NEW] `app/dashboard/page.js`
Role-aware dashboard — different views for student, alumni, admin.

#### [NEW] `app/dashboard/layout.js`
Sidebar navigation layout shared by all dashboard routes.

#### [NEW] `app/dashboard/profile/page.js`
View/edit own profile (student or alumni depending on role).

#### [NEW] `app/dashboard/mentors/page.js`
Mentor discovery — filterable list of verified alumni mentors.

#### [NEW] `app/dashboard/mentorship/page.js`
Mentorship requests — student sends/views; alumni accepts/declines.

#### [NEW] `app/dashboard/messages/page.js`
Chat interface — only unlocked between connected mentors/mentees.

#### [NEW] `app/dashboard/internships/page.js`
Internship listing — alumni post, students browse.

#### [NEW] `app/dashboard/events/page.js`
Event listing and RSVP.

#### [NEW] `app/dashboard/admin/page.js`
Admin panel — alumni verification queue, user management.

---

### 6. API Route Handlers (`app/api/`)

#### [NEW] `app/api/users/route.js` — create/get user after onboarding
#### [NEW] `app/api/users/[id]/route.js` — get specific user profile
#### [NEW] `app/api/mentors/route.js` — list/filter alumni mentors
#### [NEW] `app/api/mentors/recommendations/route.js` — cosine-similarity mentor recommendations
#### [NEW] `app/api/mentorship/route.js` — POST to create request, GET to list
#### [NEW] `app/api/mentorship/[id]/route.js` — PATCH to accept/decline
#### [NEW] `app/api/messages/route.js` — GET/POST messages in a conversation
#### [NEW] `app/api/internships/route.js` — GET list, POST new (alumni)
#### [NEW] `app/api/events/route.js` — GET list, POST new (admin)
#### [NEW] `app/api/admin/verify/route.js` — PATCH alumni verification status

---

### 7. UI Components (`components/`)

#### [NEW] `components/Navbar.js` — top nav with Clerk UserButton
#### [NEW] `components/Sidebar.js` — dashboard sidebar with role-based links
#### [NEW] `components/MentorCard.js` — alumni mentor card with request button
#### [NEW] `components/InternshipCard.js` — internship listing card
#### [NEW] `components/EventCard.js` — event card with RSVP
#### [NEW] `components/ChatWindow.js` — real-time-ready chat UI (polling v1)
#### [NEW] `components/RequestCard.js` — mentorship request card (accept/decline)
#### [NEW] `components/NotificationBell.js` — notification indicator

---

### 8. Sign-In / Sign-Up Pages (Clerk)

#### [NEW] `app/sign-in/[[...sign-in]]/page.js` — Clerk `<SignIn />` component
#### [NEW] `app/sign-up/[[...sign-up]]/page.js` — Clerk `<SignUp />` component

---

## Verification Plan

### Manual Verification
1. `npx prisma db push` — sync schema to Neon PostgreSQL.
2. `npm run dev` — confirm app starts without errors.
3. Sign up as student → complete onboarding → see dashboard.
4. Sign up as alumni → complete onboarding → see alumni dashboard.
5. Admin can access `/dashboard/admin` and verify alumni.
6. Student can browse mentors, send request, chat after acceptance.
7. Alumni can post internships; students can browse them.
8. Events page lists and allows RSVP.
