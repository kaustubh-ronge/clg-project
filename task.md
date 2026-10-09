# Admin Registration Overhaul Tasks

- `[x]` Clarify table requirements (View Details + Approve + Reject on all rows)
- `[ ]` Backend: Add REVOKE and RECONSIDER actions to PATCH /api/admin/registrations
- `[ ]` Backend: Update GET to return counts per status
- `[ ]` Admin page.js: Fetch pending, approved, rejected registrations separately
- `[ ]` AdminClient.js: Full rewrite
  - `[ ]` Tabbed layout: Pending / Approved / Rejected / All Users
  - `[ ]` RegistrationTable with search, pagination
  - `[ ]` Row actions: View Details, Approve, Reject (Pending), Revoke (Approved), Reconsider (Rejected)
  - `[ ]` DetailsDialog modal
  - `[ ]` Reject reason textarea in dialog or inline
  - `[ ]` Immediate state transitions between tabs
- `[ ]` Onboarding page: polling for auto-redirect on approval
- `[ ]` Homepage (app/page.js): Dynamic CTA based on request status
