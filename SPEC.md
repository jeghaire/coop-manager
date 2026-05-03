# Cooperative Manager SaaS - Complete Implementation Spec (FINAL - MERGED)

## Problem Statement

Cooperatives need a digital system to manage:

- Member contributions (monthly, variable amounts per member)
- Loans (with 2-member guarantor requirement + eligibility validation)
- Loan repayments (simple interest, monthly amortization, flexible payments)
- Admin approvals (loans, contribution verification)
- Member verification (two-tier access control)
- Member notifications (email/SMS for key events)
- Financial reporting (dividends, AGM reports, compliance)
- Audit trails (regulatory requirement)

Currently used for Nigerian savings & credit cooperatives.

---

## Goals

1. Build production-grade SaaS with multi-tenancy isolation
2. Enable 1000+ users per cooperative to manage finances
3. Provide compliance audit trail for regulatory bodies
4. Support manual contribution verification (members upload receipts)
5. Automate loan approval workflow with guarantor validation
6. Enforce member verification for sensitive operations
7. Provide configurable loan eligibility & repayment rules
8. Track loan repayments with flexible payment scheduling
9. Enable site-wide currency configuration
10. Keep members informed via email/SMS notifications
11. Provide transparent member financial dashboard
12. Enable dividend distribution to reward member contributions
13. Enable password resets + account management
14. Enable bulk member onboarding via CSV
15. Enable member withdrawals with approval workflow

---

## Tech Stack

- **Frontend:** Next.js 16 (app router), React 19, TypeScript, shadcn/ui
- **Backend:** Next.js Server Actions, TypeScript
- **Database:** PostgreSQL + Prisma 7 ORM
- **Auth:** Better-auth (email/password)
- **Payments:** Stripe (£500/year per cooperative)
- **File Storage:** AWS S3 (contribution receipt uploads — presigned PUT URLs)
- **Email:** Resend (transactional emails + notifications); sender configured via `EMAIL_FROM` env var
- **SMS:** Twilio (SMS notifications)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + shadcn/ui components
- **Icons:** lucide-react
- **PDF Export:** jsPDF + jspdf-autotable (client-side, member statements + cooperative reports)

---

## Current State (Phases 1-4 Partially Complete)

### ✅ Completed

- Prisma schema (all models, enums, soft deletes, timestamps)
- PostgreSQL production setup (Neon)
- Multi-tenancy structure (cooperativeId isolation)
- Cooperative access middleware (verified working)
- Member & admin dashboard endpoints
- Basic authentication (signup/signin working)
- **Phase 1.5:** Member verification system (two-tier access)
- **Phase 2:** Loan eligibility validation + guarantor coverage + repayment tracking
- Mobile bottom navigation
- Bank account management
- **Phase 1.5 (Notifications):** Email via Resend + SMS via Twilio setup
  - Loan approved/rejected notifications
  - Contribution verified/rejected notifications
  - Guarantor request notifications
  - Payment overdue daily check (8 AM UTC cron)
  - Member notification preferences (email/SMS toggles, phone number)
- **Phase 2.5 (Financial Dashboard):** 
  - `/dashboard/financial-summary` (4 stat cards + breakdown + PDF statement download)
  - `/dashboard/transactions` (unified timeline)
- **Phase 2.5 (Dividends):**
  - `/admin/dividends` (create payouts with live preview)
  - Status flow: PENDING → APPROVED → PAID
  - Member share calculation by contribution %
  - Notifications on payment + dashboard visibility
- **Phase 4 (Security Guards):**
  - Self-approval prevention: admins cannot approve their own loans or record their own contributions
  - Self-repayment prevention: admins cannot record repayments against their own loans
  - Member verified notification: email + SMS sent on account verification
- **Phase 4 (Receipt Uploads):**
  - AWS S3 presigned PUT URL flow for direct browser-to-S3 uploads
  - Contribution submit form accepts images (JPEG/PNG/WEBP) and PDFs
  - Admin contributions page shows image thumbnails and PDF icons
  - Filter tabs: ALL / PENDING / VERIFIED / REJECTED with counts
- **Phase 4 (Announcements System):**
  - `/admin/announcements` — list with type badges, RSVP counts, deactivate
  - `/admin/announcements/new` — create form with conditional AGM fields
  - `/dashboard/announcements/[id]` — member view + RSVP
  - Pinned announcement banners on all dashboard pages (dismissable)
  - Types: GENERAL, AGM, URGENT; recipient types: ALL, MEMBERS_ONLY, ADMINS_ONLY
  - Bulk email + SMS notification on announcement creation
- **Phase 4 (Advanced Reporting):**
  - `/admin/reports` — overview, loan portfolio, contributions, member breakdown, audit trail
  - Audit trail with event type filter + colour-coded badges
  - PDF export for cooperative-level reports (landscape A4)
  - Member financial statement PDF download (portrait A4)

### ❌ Not Started (Phase 4 - Remaining Pre-Launch Features)

- Forgot password / password reset
- CSV member import
- Account settings (change name/phone/password)
- Withdrawal requests + approval workflow
- Refactoring & mobile polish

---

## Key Architecture Decisions

### 1. Multi-Tenancy Model
**Decision:** Shared database, `cooperativeId` on every table
- Pro: Simple, cost-effective for MVP
- Con: Requires strict authorization middleware
- **Mitigation:** All endpoints validate cooperativeId match

### 2. Member Verification (Two-Tier Access)
**Decision:** Unverified users can only see own profile
- UNVERIFIED: Can log in, see own profile + balance, CANNOT apply for loans or see member list
- VERIFIED: Full access to dashboard, loans, contributions, reports
- Owner auto-verified on signup; other members require owner/admin approval

### 3. Loan Eligibility Validation
**Decision:** Enforce contribution requirement + borrowing multiplier
- User must have: `totalContributed > 0`
- Loan amount cannot exceed: `totalContributed × borrowingMultiplier`
- Default multiplier: 3x (configurable by owner)

### 4. Guarantor Coverage (Configurable)
**Decision:** Guarantors must collectively cover loan; owner can toggle rule
- Default: **Guarantors Combined** (sum of all guarantors' contributions >= loan amount)
- Owner options: "Off", "Combined" (default), "Individual"

### 5. Loan Repayment (Simple Interest + Monthly Amortization)
**Decision:** Calculate total with interest, divide by months, track flexible payments
- Formula: `Total Due = Principal + (Principal × Interest Rate)`
- Divided over configurable months (default 12)
- Owner configurable: interest rate, duration, grace period

### 6. Treasurer Role (Separate from Admin)
**Decision:** Treasurer is distinct role, can record contributions & repayments for non-tech members
- Treasurer-only actions: record contributions (auto-verified), record repayments
- Can't approve loans, invite members, edit settings (owner only)

### 7. Currency Configuration
**Decision:** Owner sets site-wide currency (not hardcoded)
- Cooperative.currency: "NGN", "USD", "GHS", etc.
- Cooperative.currencySymbol: "₦", "$", "GH₵", etc.
- Used throughout UI dynamically

### 8. Mobile Navigation
**Decision:** Bottom nav bar with 4 icons (best UX for mobile)
- Icons: Home, Contributions, Loans, Profile
- Always visible, tap to navigate
- Icons larger, more discoverable than text

### 9. Payment Splitting
**Decision:** User specifies how much of payment is contribution vs loan repayment
- User payment form: total amount → contribution amount + loan repayment amount
- System validates: contribution + repayment = total
- Overpayment auto-allocation: excess goes to contributions

### 10. Notification System
**Decision:** Email + SMS notifications for key events
- Members informed via email (Resend) + SMS (Twilio)
- Optional for each member (can disable)
- Daily background job checks for overdue loans
- All notifications logged for audit trail

### 11. Member Financial Dashboard
**Decision:** Unified transparent view of member's financial position
- Shows: contributions, loans, borrowing capacity, dividends
- Real-time calculations
- All transactions in one place

### 12. Dividend Distribution
**Decision:** Owner-configured quarterly/annual profit distribution
- Owner enters profit, system calculates member shares
- Admin costs & loan loss reserve taken out (% configurable)
- Remaining distributed to members based on contribution %
- Members see expected dividends on dashboard

### 13. Audit Trail
**Decision:** Immutable Event table
- Every action logged: loan_applied, contribution_submitted, loan_approved, dividend_paid, etc.
- Never deleted, soft-delete for records
- Used for compliance reports, dividend calculations, investigations

### 14. Password Reset
**Decision:** Email-based password recovery with time-limited tokens
- User forgotten password → email with reset link
- Reset link valid for 24 hours
- Token stored as resetToken + resetTokenExpiresAt
- No password hints (security)

### 15. CSV Member Import
**Decision:** Bulk onboarding for cooperatives
- Owner uploads CSV (email, name, phone optional)
- System creates unverified accounts + welcome emails
- Duplicates skipped, counts shown
- Temp password sent, members change on first login

### 16. Member Withdrawals
**Decision:** Members can request to withdraw contributions
- Available = totalContributed - activeBalance
- Owner approves/rejects with reason
- Affects borrowing capacity
- Shows in transaction history

---

## Data Model Summary

### Core Tables

- **Cooperative** — Tenant (subscriptionStatus, billingCycleEnd, borrowingMultiplier, guarantorCoverageMode, loanInterestRate, loanRepaymentMonths, defaultGracePeriodDays, currency, currencySymbol)
- **CooperativeBank** — Multiple bank accounts per cooperative
- **User** — Member (role, cooperativeId, verifiedAt, verifiedBy, monthlyContributionAmount, emailNotifications, smsNotifications, phoneNumber, resetToken, resetTokenExpiresAt)
- **LoanApplication** — Request (status, interestRate, repaymentMonths, totalAmountDue, approvedAt, repaidAt, rejectionReason)
- **LoanRepayment** — Tracking (loanId, amount, paymentType, paidAt, receiptUrl, recordedBy)
- **LoanGuarantor** — Link (guarantorId, status)
- **Contribution** — Payment (status, receiptUrl, receiptKey, receiptFileName, receiptFileSize, receiptFileType, receiptUploadedAt, rejectionCount, verifiedBy, recordedBy, isManualEntry)
- **DividendPayout** — Payout record (quarter, year, totalProfit, dividendPool, status)
- **MemberDividend** — Per-member share (dividendPayoutId, userId, amount, status)
- **Notification** — Audit log (cooperativeId, userId, type, channel, recipient, status)
- **WithdrawalRequest** — Request (userId, amount, reason, status, approvedBy, rejectionReason)
- **Announcement** — Cooperative announcement (type, recipientType, agmDate, agmLocation, allowRsvp, isPinned, isActive, expiresAt, createdBy)
- **AnnouncementRsvp** — RSVP response (announcementId, userId, response) — unique per (announcement, user)
- **Event** — Audit log (immutable)

### Key Fields

- User.phoneNumber: String (for SMS)
- User.emailNotifications: Boolean (default true)
- User.smsNotifications: Boolean (default true)
- User.resetToken: String (unique, password recovery)
- User.resetTokenExpiresAt: DateTime (24-hour expiry)
- WithdrawalRequest: (amount, reason, status, rejectionReason, approvedAt, paidAt)
- Contribution.receiptKey: String? (S3 object key)
- Contribution.receiptFileName: String? (original filename)
- Contribution.receiptFileSize: Int? (bytes)
- Contribution.receiptFileType: String? (MIME type)
- Contribution.receiptUploadedAt: DateTime? (S3 upload timestamp)
- Contribution.rejectionCount: Int (default 0, incremented on each rejection)
- Announcement.type: Enum (GENERAL | AGM | URGENT)
- Announcement.recipientType: Enum (ALL | MEMBERS_ONLY | ADMINS_ONLY)
- AnnouncementRsvp.response: Enum (ATTENDING | MAYBE | NOT_ATTENDING)

---

## Phase Breakdown

### Phase 1.5: Member Verification ✅ Complete
- Two-tier access (unverified → verified)
- Owner auto-verified, members need approval
- Verification page for owner/admin

### Phase 2: Loan System Overhaul ✅ Complete
- Loan eligibility validation
- Guarantor coverage (configurable)
- Loan repayment scheduling
- Simple interest + monthly amortization
- Flexible payment tracking

### Phase 2.5: Notifications, Dashboard, Dividends ✅ Complete
- **Notifications:** Email (Resend) + SMS (Twilio) for key events
- **Financial Dashboard:** Summary + transactions pages
- **Dividends:** Owner-configurable quarterly/annual distribution
- **Settings:** Loan config, bank accounts, currency

### Phase 4a: Security + Uploads + Announcements + Reporting ✅ Complete
- **Security Guards:** Self-approval / self-repayment / self-contribution-entry prevention
- **Receipt Uploads:** AWS S3 presigned PUT URL flow; images + PDFs; admin thumbnail preview
- **Announcements System:** Create/deactivate, pinned banners, RSVP, bulk notifications
- **Advanced Reporting:** Audit trail with filters, PDF export, member statements
- **Member Verified Notification:** Email + SMS triggered on account approval

### Phase 4b: Pre-Launch Features (IN PROGRESS)
1. **Forgot Password / Password Reset**
   - Email with reset link (24-hour token)
   - Page: `/auth/forgot-password`, `/auth/reset-password?token=ABC`
   - Database: User.resetToken, User.resetTokenExpiresAt

2. **CSV Member Import**
   - Page: `/admin/members/import`
   - Upload CSV (email, name, phone)
   - Create unverified accounts + welcome emails
   - Duplicate handling

3. **Account Settings**
   - Page: `/dashboard/settings/account`
   - Change name, phone, password
   - Phone format validation + normalization
   - Password strength requirements

4. **Withdrawal Requests**
   - Page: `/dashboard/withdraw`
   - Calculate: available = totalContributed - activeBalance
   - Status flow: REQUESTED → APPROVED/REJECTED → PAID
   - Admin approval + member notifications

5. **Refactoring & Polish**
   - Mobile responsiveness (375px+)
   - Type safety (zero `any` types)
   - N+1 query optimization
   - Error message consistency
   - Empty states + loading states
   - Form validation polish
   - Soft delete verification
   - Multi-tenancy isolation audit
   - Accessibility (WCAG AA)

---

## Notification System

### What Triggers Notifications
- **Loan Approved** → Email + SMS to member
- **Loan Rejected** → Email to member (reason shown)
- **Payment Overdue** → Email + SMS (daily check, 8 AM UTC, max 1/day)
- **Contribution Verified** → Email + SMS to member
- **Contribution Rejected** → Email to member (reason shown)
- **Guarantor Requested** → Email + SMS to guarantor
- **Dividend Paid** → Email + SMS to member
- **Member Verified** → Email + SMS to member on account approval
- **Announcement Created** → Bulk email + SMS to all matching recipients (based on recipientType)

### Channels
- **Email** via Resend (already configured)
- **SMS** via Twilio (requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)

### User Control
- User.emailNotifications (boolean, default true)
- User.smsNotifications (boolean, default true)
- User.phoneNumber (optional, for SMS)
- Members update in `/dashboard/settings`

### Audit Trail
- Notification table logs all sent/failed
- Used for compliance + troubleshooting

### Background Jobs
- Daily cron: `/api/cron/check-overdue-loans`
- Runs at 8 AM UTC
- Only notifies once per day per member

---

## Member Financial Dashboard

### Pages

**Page 1: Financial Summary** (`/dashboard/financial-summary`)
- 4 stat cards: Total Contributed, Active Loan, Borrowing Capacity, Available to Borrow, Expected Dividend
- Contribution breakdown (total, count, %)
- Loan breakdown (borrowed, repaid, balance, count)

**Page 2: All Transactions** (`/dashboard/transactions`)
- Unified list of contributions + repayments
- Sortable by date, type, amount
- Filterable by status
- Status badges

### Data Calculated Real-Time
- totalContributed = sum(verified contributions)
- borrowingCapacity = totalContributed × multiplier
- activeBalance = totalAmountDue - totalRepaid
- availableToBorrow = borrowingCapacity - activeBalance
- expectedDividend = sum(pending member dividends)

---

## Dividend Distribution System

### Process Flow
1. **Create:** Owner enters profit, admin costs %, reserve %
2. **Calculate:** System calculates member shares by contribution %
3. **Approve:** Owner reviews + approves distribution
4. **Process:** System marks as PAID, sends notifications
5. **Display:** Members see on dashboard

### Configuration
- Admin Costs % (default 10%)
- Loan Loss Reserve % (default 20%)
- Both adjustable per payout

### Status Flow
PENDING → APPROVED → COMPLETED

### Member Visibility
- Pending dividends on financial dashboard
- History of past payouts (reporting)
- Notification on payment

---

## API Endpoints (Complete)

### Auth
- `POST /api/auth/signup` — User signup, choose cooperative
- `POST /api/auth/signin` — Login
- `POST /api/auth/signout` — Logout
- `GET /api/auth/cooperatives` — List cooperatives
- `POST /api/auth/forgot-password` — Request password reset (NEW)
- `POST /api/auth/reset-password` — Reset password (NEW)

### Member Verification
- `GET /api/admin/members/unverified` — List unverified
- `POST /api/admin/members/[id]/verify` — Verify member

### Loans
- `POST /api/loans/apply` — Apply for loan
- `GET /api/loans` — List user's loans
- `GET /api/loans/[id]` — Loan details + schedule
- `POST /api/loans/[id]/approve` — Admin approves
- `POST /api/loans/[id]/reject` — Admin rejects
- `POST /api/loans/[id]/retry` — Retry rejected loan
- `POST /api/loans/[id]/respond-as-guarantor` — Guarantor responds
- `GET /api/admin/loans/pending` — Admin sees pending

### Loan Repayments
- `POST /api/loans/[id]/repay` — User repays
- `GET /api/loans/[id]/repayment-schedule` — Full schedule
- `GET /api/loans/[id]/repayment-status` — Current status
- `POST /api/loans/[id]/record-repayment` — Treasurer records

### Contributions
- `POST /api/contributions/submit` — Submit with receipt
- `GET /api/contributions` — List member's
- `POST /api/contributions/[id]/verify` — Admin/Treasurer verifies
- `POST /api/contributions/record` — Treasurer records manual
- `GET /api/admin/contributions/pending` — Pending verifications

### Financial Dashboard
- `GET /dashboard/financial-summary` — Member's position
- `GET /dashboard/transactions` — All transactions

### Dividends
- `POST /api/admin/dividends` — Create payout
- `POST /api/admin/dividends/[id]/approve` — Approve
- `POST /api/admin/dividends/[id]/process` — Process payment
- `GET /api/admin/dividends` — List payouts
- `GET /api/admin/dividends/[id]/members` — Member shares

### Withdrawals (NEW)
- `POST /api/withdrawals/request` — Request withdrawal
- `GET /api/admin/withdrawals/pending` — Admin sees pending
- `POST /api/admin/withdrawals/[id]/approve` — Approve
- `POST /api/admin/withdrawals/[id]/reject` — Reject with reason
- `POST /api/admin/withdrawals/[id]/mark-paid` — Mark as paid

### Settings
- `GET /api/admin/settings` — Get all
- `POST /api/admin/settings/loan-config` — Update loan config
- `POST /api/admin/settings/guarantor-coverage` — Toggle mode
- `POST /api/admin/settings/currency` — Set currency

### Bank Accounts
- `GET /api/cooperative/bank-accounts` — Public list
- `POST /api/admin/bank-accounts` — Add
- `PUT /api/admin/bank-accounts/[id]` — Edit
- `DELETE /api/admin/bank-accounts/[id]` — Delete
- `POST /api/admin/bank-accounts/[id]/set-preferred` — Set preferred

### Account (NEW)
- `POST /api/account/update-name` — Change name
- `POST /api/account/update-phone` — Change phone
- `POST /api/account/update-password` — Change password

### Admin
- `POST /api/admin/members/import` — CSV import (NEW)
- `POST /api/admin/invite-member` — Invite by email
- `GET /api/admin/dashboard` — Overview

### Background Jobs
- `GET /api/cron/check-overdue-loans` — Daily overdue check
- Config: `CRON_SECRET` env var required

---

## Event Log (Audit Trail)

Every critical action logs an Event:
```
member_verified
member_unverified (if needed)
password_reset_requested
password_reset_completed
account_updated (name, phone, password)
withdrawal_requested
withdrawal_approved
withdrawal_rejected
withdrawal_paid
loan_application_submitted
loan_application_rejected
loan_application_retried
loan_application_approved
loan_repayment_made
loan_repayment_recorded
loan_repaid
loan_marked_defaulted
contribution_submitted
contribution_verified
contribution_rejected
contribution_recorded
notification_sent
notification_failed
announcement_created
announcement_deactivated
announcement_rsvp_submitted
dividend_payout_created
dividend_payout_approved
dividend_payout_completed
bank_account_added
bank_account_updated
bank_account_deleted
setting_updated
currency_changed
members_imported (CSV)
```

---

## Refactoring Checklist

### Mobile Responsiveness
- [ ] Tables → cards on mobile (375px+)
- [ ] Forms full width on mobile
- [ ] Buttons 44x44px minimum (touch)
- [ ] Bottom nav working
- [ ] Sidebar responsive (hamburger on mobile)
- [ ] Cards stack vertically on mobile

### Type Safety
- [ ] No `any` types
- [ ] Prisma queries type-safe
- [ ] Form data types match DB
- [ ] API response types defined
- [ ] Server action parameters typed
- [ ] Run: `npx tsc --noEmit` (zero errors)

### Error Messages
- [ ] All validation: "{Field}: {Error}"
- [ ] Permission: "You don't have permission to {{action}}"
- [ ] Not found: "{{Resource}} not found"
- [ ] Database errors: generic message (don't expose schema)
- [ ] Form errors: near field, not toast

### Performance
- [ ] No N+1 queries (use `include`, not loops)
- [ ] Lists load in <2s
- [ ] Forms submit in <1s
- [ ] Check Network tab: no duplicates

### Data Integrity
- [ ] All queries filter `deletedAt: null`
- [ ] Soft deletes verified
- [ ] Multi-tenancy isolated (no cross-coop data)
- [ ] All monetary amounts validated (> 0)

### UX Polish
- [ ] Empty states on all lists
- [ ] Loading skeletons while fetching
- [ ] Disabled buttons during submission
- [ ] Success toast/message after action
- [ ] Form validation real-time
- [ ] Phone format validation + normalization
- [ ] Amount inputs show currency symbol

### Accessibility
- [ ] All form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Color contrast (WCAG AA)
- [ ] Tab navigation works
- [ ] Focus visible
- [ ] ARIA labels on complex components

---

## Horizontal Scrollbar Fix (Known Issue)

**Problem:** Horizontal scrollbar appears on laptops/smaller screens but not on larger monitors.

**Causes & Solutions:**

1. **Tables overflowing:**
   ```typescript
   // Wrap in scrollable container:
   <div className="overflow-x-auto w-full">
     <Table>
       {/* content */}
     </Table>
   </div>
   ```

2. **Fixed-width sidebars:**
   ```typescript
   // Use responsive classes:
   <div className="grid grid-cols-1 md:grid-cols-[250px_1fr]">
     <Sidebar className="hidden md:block" /> {/* Hide on mobile */}
     <MainContent />
   </div>
   ```

3. **Cards with no max-width:**
   ```typescript
   // Add max-width to prevent overflow:
   <Card className="max-w-full md:max-w-4xl">
     {/* content */}
   </Card>
   ```

4. **Body overflow:**
   ```css
   /* In globals.css */
   body {
     overflow-x: hidden; /* Hide horiz scroll */
     width: 100%;
   }
   
   /* Ensure containers constrained */
   .container {
     max-width: 100vw;
     overflow-x: hidden;
   }
   ```

5. **Check layout.tsx:**
   ```typescript
   // Root layout should NOT have fixed width
   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className="w-full overflow-x-hidden">
           {/* NO fixed width containers */}
           {children}
         </body>
       </html>
     )
   }
   ```

6. **Mobile nav height:**
   ```typescript
   // Bottom nav might push content wider on small screens
   // Ensure main content accounts for nav height:
   <div className="pb-20"> {/* Space for bottom nav */}
     {children}
   </div>
   ```

**Quick Audit:**
1. Open DevTools (F12)
2. Toggle responsive design mode (Ctrl+Shift+M)
3. Set width to 1024px
4. Check if horizontal scrollbar appears
5. Use DevTools Elements tab to find overflow culprit:
   - Right-click element → Inspect
   - Check `overflow-x`, `width`, `max-width`
   - Look for `overflow-x: auto` or `scroll` on body/html

**Fix All At Once:**
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="w-full overflow-x-hidden">
        <div className="min-h-screen w-full">
          {children}
        </div>
      </body>
    </html>
  )
}
```

```css
/* app/globals.css */
* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  overflow-x: hidden;
}

/* Tables must scroll internally, not page */
.table-container {
  @apply overflow-x-auto w-full;
}

/* Cards constrained */
.card {
  @apply max-w-full;
}
```

---

## Implementation Timeline

### ✅ Completed (Phases 1-4a)
- Week 1-2: Auth + member verification
- Week 2-3: Loan system + guarantors
- Week 3-4: Notifications + financial dashboard
- Week 4-5: Dividends + settings + bank accounts
- Week 5: Security guards + S3 receipt uploads + announcements + advanced reporting

### 🔄 In Progress (Phase 4b)
- Week 6: Password reset + CSV import + account settings
- Week 7: Withdrawals + refactoring + mobile fix

### ✅ Ready for Test Users
- All Phase 4 features complete
- Mobile responsive verified
- Type-safe codebase
- User-friendly error messages
- Full test checklist passed

---

## Testing Checklist

**Full Workflows:**
- [ ] Signup → verify → contribute → borrow → repay → withdraw
- [x] Receipt upload → S3 presign → file stored → admin sees thumbnail/PDF icon
- [x] Announcement created → pinned banner visible → member RSVPs
- [x] Admin cannot approve own loan / record own contribution / record own repayment
- [x] Member verified → email + SMS notification sent
- [x] Audit trail shows all events with type filter
- [x] PDF export generates cooperative report + member statement
- [ ] CSV import → 10 members created + emails sent
- [ ] Password reset → new password works
- [ ] Account settings → name, phone, password changes
- [ ] Dividend creation → calculation correct → payment processed → member notified
- [ ] Overdue loan → daily notification works

**Mobile (375px):**
- [ ] All pages responsive
- [ ] Forms usable
- [ ] Bottom nav works
- [ ] NO horizontal scrollbar

**Data Integrity:**
- [ ] Soft deletes verified
- [ ] Multi-tenancy isolated
- [ ] Type safety checked
- [ ] N+1 queries fixed
- [ ] Error messages clear

**Performance:**
- [ ] Pages load <2s
- [ ] No console errors
- [ ] No layout shift

---

## Success Criteria

✅ **All Features:**
1. Signup + signin
2. Member verification (two-tier)
3. Loan application + guarantors
4. Loan repayment + schedule
5. Contributions + receipt upload (S3) + verification ✅
6. Notifications (email + SMS) ✅
7. Financial dashboard + PDF statement download ✅
8. Dividend distribution
9. Announcements + RSVP + pinned banners ✅
10. Advanced reporting + audit trail + PDF export ✅
11. Security guards (self-approval/entry prevention) ✅
12. **Password reset** (TODO)
13. **CSV member import** (TODO)
14. **Account settings** (TODO)
15. **Withdrawal requests** (TODO)

✅ **Refactoring:**
13. Mobile responsive (verified)
14. Type-safe (zero `any`)
15. Error messages consistent
16. No N+1 queries
17. Soft deletes verified
18. Multi-tenancy isolated
19. UX polished
20. Accessibility compliant
21. Horizontal scrollbar fixed
22. All tests passed

✅ **Ready for Test Users**
- All workflows end-to-end
- No console errors
- Mobile experience solid
- Database integrity maintained
- Performance acceptable

---

## Notes for Implementation

1. **Database:**
   - Always run migrations: `pnpm dlx prisma@latest migrate dev --name feature_name`
   - Verify migrations folder updated
   - Vercel auto-runs migrations on deploy

2. **Server Actions:**
   - Use `'use server'` at file top
   - Return JSON-serializable data
   - Throw errors (caught by components)
   - Always validate user session

3. **Forms:**
   - Use react-hook-form + zod
   - shadcn/ui Form component
   - Errors near fields, not toasts

4. **Mobile:**
   - Test at 375px (iPhone 12)
   - Test at 412px (Galaxy S21)
   - Test on real device if possible

5. **Type Safety:**
   - Run `npx tsc --noEmit` before commit
   - Zero errors required
   - Use Prisma types

6. **Performance:**
   - Check Network tab for duplicates
   - Lighthouse >90 score
   - No console warnings

---

## Project Structure

```
app/
├── auth/
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx (TODO)
│   └── reset-password/page.tsx (TODO)
├── dashboard/
│   ├── page.tsx
│   ├── layout.tsx (PinnedAnnouncementsBanner)
│   ├── profile/page.tsx
│   ├── settings/
│   │   ├── notifications/page.tsx
│   │   └── account/page.tsx (TODO)
│   ├── verify-pending/page.tsx
│   ├── financial-summary/
│   │   ├── page.tsx
│   │   └── DownloadStatementButton.tsx
│   ├── transactions/page.tsx
│   ├── withdraw/page.tsx (TODO)
│   ├── announcements/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── RsvpForm.tsx
│   ├── loans/
│   │   ├── page.tsx
│   │   ├── apply/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── repay/page.tsx
│   │       └── rejected/page.tsx
│   └── contributions/
│       ├── page.tsx
│       └── submit/
│           ├── page.tsx
│           └── ContributionSubmitForm.tsx
├── admin/
│   ├── dashboard/page.tsx
│   ├── settings/page.tsx
│   ├── dividends/page.tsx
│   ├── notifications/page.tsx
│   ├── members/
│   │   ├── page.tsx
│   │   ├── unverified/page.tsx
│   │   ├── import/page.tsx (TODO)
│   │   └── [id]/contribution-history/page.tsx
│   ├── loans/
│   │   ├── pending/page.tsx
│   │   └── [id]/record-repayment/page.tsx
│   ├── contributions/
│   │   ├── page.tsx (filter tabs + receipt preview)
│   │   ├── ContributionReviewForm.tsx
│   │   ├── record/page.tsx
│   │   └── history/page.tsx
│   ├── announcements/
│   │   ├── page.tsx
│   │   ├── DeactivateButton.tsx
│   │   └── new/
│   │       ├── page.tsx
│   │       └── NewAnnouncementForm.tsx
│   ├── reports/
│   │   ├── page.tsx
│   │   ├── TabNav.tsx
│   │   ├── AuditTrail.tsx
│   │   └── ExportPdfButton.tsx
│   └── withdrawals/
│       ├── page.tsx (TODO)
│       └── [id]/approve/page.tsx (TODO)
├── components/
│   ├── PinnedAnnouncementsBanner.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── loans/
│   │   ├── LoanRepaymentStatus.tsx
│   │   ├── RepaymentScheduleTable.tsx
│   │   └── LoanApprovalDialog.tsx
│   ├── contributions/
│   │   ├── ContributionTable.tsx
│   │   └── PaymentSplitForm.tsx
│   ├── dividends/
│   │   ├── NewDividendDialog.tsx
│   │   ├── DividendPayoutTable.tsx
│   │   └── DividendDistributionSummary.tsx
│   └── admin/
│       ├── BankAccountForm.tsx
│       ├── MemberVerificationDialog.tsx
│       ├── NotificationBadge.tsx
│       └── SettingsForm.tsx
├── actions/
│   ├── auth.ts (+ forgot/reset password TODO)
│   ├── verification.ts (+ notifyMemberVerified)
│   ├── loans.ts (+ self-approval guard)
│   ├── repayments.ts
│   ├── contributions.ts (+ S3 receipt fields, self-entry guard)
│   ├── dividends.ts
│   ├── announcements.ts
│   ├── account.ts (TODO - name, phone, password)
│   ├── withdrawals.ts
│   ├── admin.ts (+ CSV import TODO)
│   └── reports.ts
├── api/
│   ├── auth/[...auth]/route.ts
│   ├── receipts/presign/route.ts (GET — returns presigned S3 PUT URL)
│   ├── cooperative/bank-accounts/route.ts
│   ├── admin/bank-accounts/route.ts
│   ├── cron/check-overdue-loans/route.ts
│   └── webhooks/stripe/route.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── middleware.ts
│   ├── server-actions.ts
│   ├── loan-helpers.ts
│   ├── notifications.ts (+ notifyMemberVerified, notifyAnnouncement)
│   ├── s3.ts (generatePresignUrl, getPublicUrl, buildReceiptKey)
│   ├── pdf-export.ts (exportMemberStatementPdf, exportCooperativeReportPdf)
│   ├── email.ts (EMAIL_FROM env var)
│   ├── csv-parser.ts (TODO)
│   ├── prisma.ts
│   └── auth.ts
├── middleware.ts
├── globals.css (fix horizontal scroll)
└── layout.tsx (ensure no overflow)
```

---

## Deliverables Checklist

✅ When Ready for Test Users:
- [ ] All 16 features working
- [ ] All Phase 4 refactoring complete
- [ ] Mobile responsive (no horiz scroll)
- [ ] Type-safe codebase
- [ ] Zero console errors
- [ ] Full test checklist passed
- [ ] Ready for closed beta

---

## Summary

This merged spec covers a **complete, production-ready MVP** with:

✅ **Authentication & Security:**
- Signup/signin + password reset
- Member verification (two-tier)
- Multi-tenancy isolation
- Audit trail

✅ **Loans & Guarantors:**
- Eligibility validation
- Guarantor coverage (configurable)
- Repayment scheduling + tracking
- Flexible payments

✅ **Contributions:**
- Manual receipt upload + verification
- Treasurer manual entry (auto-verified)
- Transaction history

✅ **Member Features:**
- Financial dashboard (real-time)
- Account settings (name, phone, password)
- Withdrawal requests
- Notifications (email + SMS)

✅ **Admin Features:**
- CSV member import
- Dividend distribution
- Bank account management
- Loan/contribution approval
- Settings + configuration

✅ **Refactoring & Polish:**
- Mobile responsive
- Type-safe
- Optimized queries
- User-friendly errors
- Accessible

**Ready for test user launch mid-late May 2026.**