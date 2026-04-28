# Cooperative Manager SaaS - Implementation Spec (FINAL)

## Problem Statement
Cooperatives need a digital system to manage:
- Member contributions (monthly, variable amounts per member)
- Loans (with 2-member guarantor requirement + eligibility validation)
- Loan repayments (simple interest, monthly amortization, flexible payments)
- Admin approvals (loans, contribution verification)
- Member verification (two-tier access control)
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

---

## Tech Stack
- **Frontend:** Next.js 15 (app router), React 19, TypeScript, shadcn/ui
- **Backend:** Next.js Server Actions, TypeScript
- **Database:** PostgreSQL + Prisma 7 ORM
- **Auth:** Better-auth (email/password)
- **Payments:** Stripe (£500/year per cooperative)
- **File Storage:** TBD (S3 or local for contribution receipts)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + shadcn/ui components
- **Icons:** lucide-react (for mobile nav)

---

## Current State

### ✅ Completed
- Prisma schema (all models, enums, soft deletes, timestamps)
- PostgreSQL production setup (Neon)
- Multi-tenancy structure (cooperativeId isolation)
- Cooperative access middleware (verified working)
- Member & admin dashboard endpoints
- Basic authentication (signup/signin working)

### ❌ Not Started
- Member verification system (two-tier access)
- Loan eligibility validation
- Guarantor coverage configuration
- Loan repayment tracking & scheduling
- Mobile bottom navigation
- Bank account management
- Admin/Treasurer notifications
- Treasurer manual contribution/repayment recording
- Contribution history visibility
- Currency configuration
- Event logging system
- Reports & analytics
- Stripe billing integration

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
- Page redirect: unverified members sent to "Awaiting Verification" page

**Why:** Prevents data leaks, reduces fraud, maintains security in multi-member cooperatives

### 3. Loan Eligibility Validation
**Decision:** Enforce contribution requirement + borrowing multiplier
- User must have: `totalContributed > 0`
- Loan amount cannot exceed: `totalContributed × borrowingMultiplier`
- Default multiplier: 3x (configurable by owner, UI disabled for MVP)
- Owner can edit multiplier in settings
- Examples:
  - Contributed 10,000 → can borrow up to 30,000 (3x)
  - Contributed 500 → can borrow up to 1,500 (3x)
  - Contributed 0 → cannot apply for loan

### 4. Guarantor Coverage (Configurable)
**Decision:** Guarantors must collectively cover loan; owner can toggle rule
- Default: **Guarantors Combined** (sum of all guarantors' contributions >= loan amount)
- Owner options: "Off", "Combined" (default), "Individual"
- Example (Combined):
  - User requests 30,000 (contributed 10,000, 3x rule)
  - Guarantor 1 contributed 20,000 ✅
  - Guarantor 2 contributed 10,000 ✅
  - Combined: 30,000 >= 30,000 ✅ VALID

### 5. Loan Repayment (Simple Interest + Monthly Amortization)
**Decision:** Calculate total with interest, divide by months, track flexible payments
- Formula: `Total Due = Principal + (Principal × Interest Rate)`
- Example: Borrow 30,000 at 10% → Total Due: 33,000
- Divided over 12 months: Monthly Payment = 33,000 ÷ 12 = 2,750
- Owner configurable:
  - Interest rate (default 10%, editable)
  - Repayment duration (default 12 months, editable)
  - Grace period before defaulted (default 30 days, editable)
- User can pay anytime: full amount, partial, or ahead of schedule
- Status tracking: ON_TRACK, BEHIND, DEFAULTED, REPAID

**Why:** Nigerian cooperative standard, simple to understand, flexible for members

### 6. Treasurer Role (Separate from Admin)
**Decision:** Treasurer is distinct role, can record contributions & repayments for non-tech members
- Treasurer-only actions:
  - Record contributions on behalf of members (auto-verified)
  - Record loan repayments on behalf of members
  - Approve/reject contributions (manual verification)
  - View contribution history + member details
- Treasurer can specify payment split (contribution vs repayment)

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
- Labels included (icon + text)

### 9. Payment Splitting
**Decision:** User specifies how much of payment is contribution vs loan repayment
- User payment form:
  - Total amount
  - Amount for contribution
  - Amount for loan repayment
  - System validates: contribution + repayment = total
- Overpayment auto-allocation:
  - If paying 250,000 for loan but only 200,000 owed
  - 200,000 → clears loan
  - 50,000 → goes to contributions

### 10. Audit Trail
**Decision:** Immutable Event table
- Every action: loan_applied, contribution_submitted, loan_approved, loan_repaid, etc.
- Never deleted, soft-delete for records
- Used for compliance reports, dividend calculations, investigations

---

## UI Component Library
- **shadcn/ui components** for all UI
- **lucide-react icons** for mobile nav
- Tailwind CSS for styling
- Dark mode support built-in

**Components Used:**
- Form, Button, Input, Label, Card, Table, Dialog, Alert, Select, Tabs, Badge, Progress, Toast

---

## Data Model Summary (UPDATED)

### Core Tables
- **Cooperative** — Tenant (subscriptionStatus, billingCycleEnd, borrowingMultiplier, guarantorCoverageMode, loanInterestRate, loanRepaymentMonths, defaultGracePeriodDays, currency, currencySymbol)
- **CooperativeBank** — Multiple bank accounts per cooperative
- **User** — Member (role, cooperativeId, verifiedAt, verifiedBy, monthlyContributionAmount)
- **LoanApplication** — Request (status, interestRate, repaymentMonths, totalAmountDue, approvedAt, repaidAt)
- **LoanRepayment** — Tracking (loanId, amount, paymentType, paidAt, receiptUrl, recordedBy)
- **LoanGuarantor** — Link (guarantorId, status)
- **Contribution** — Payment (status, receiptUrl, verifiedBy, recordedBy, isManualEntry)
- **Event** — Audit log (immutable)

### Key Fields (NEW)
- Cooperative.currency: String (default "NGN")
- Cooperative.currencySymbol: String (default "₦")
- Cooperative.loanInterestRate: Decimal (default 10)
- Cooperative.loanRepaymentMonths: Int (default 12)
- Cooperative.defaultGracePeriodDays: Int (default 30)
- User.verifiedAt: DateTime?
- LoanApplication.interestRate: Decimal
- LoanApplication.repaymentMonths: Int
- LoanApplication.totalAmountDue: Decimal
- LoanApplication.repaidAt: DateTime?
- LoanRepayment.paymentType: String ("CONTRIBUTION" | "LOAN_REPAYMENT")
- LoanRepayment.recordedBy: String? (treasurer user ID)

---

## API Endpoints (Priority Order)

### Auth (Phase 1) ✅ Complete
- `POST /api/auth/signup` — User signs up, chooses cooperative
- `POST /api/auth/signin` — Better-auth login
- `POST /api/auth/signout` — Better-auth logout
- `GET /api/auth/cooperatives` — List available cooperatives

### Member Verification (Phase 1.5) — NEW
- `GET /api/admin/members/unverified` — List unverified members
- `POST /api/admin/members/[id]/verify` — Owner/Admin verifies member
- `GET /api/verification-status` — Check current user's verification status

### Loans (Phase 2) — UPDATED
- `POST /api/loans/apply` — Apply with eligibility + guarantor validation
- `GET /api/loans` — List user's loans
- `GET /api/loans/[id]` — Loan details + full repayment schedule
- `POST /api/loans/[id]/approve` — Admin approves
- `POST /api/loans/[id]/reject` — Admin rejects with reason
- `POST /api/loans/[id]/retry` — User retries rejected loan
- `POST /api/loans/[id]/respond-as-guarantor` — Guarantor accepts/rejects
- `GET /api/admin/loans/pending` — Admin sees pending approvals
- `GET /api/notifications/loans` — Get pending loan approvals

### Loan Repayments (Phase 2.5) — NEW
- `POST /api/loans/[id]/repay` — User pays loan (with split: contribution + repayment)
- `GET /api/loans/[id]/repayment-schedule` — Full schedule with status
- `GET /api/loans/[id]/repayment-status` — Current status (on-track, behind, etc.)
- `POST /api/loans/[id]/record-repayment` — Treasurer records payment

### Contributions (Phase 3) — UPDATED
- `POST /api/contributions/submit` — Upload receipt + amount
- `GET /api/contributions` — List member's contributions
- `POST /api/contributions/[id]/verify` — Admin/Treasurer verifies
- `POST /api/contributions/record` — Treasurer records manual contribution
- `GET /api/admin/contributions/pending` — Admin sees pending verifications
- `GET /api/admin/members/contributions` — Sortable contribution history

### Cooperative Settings (Phase 2.5) — NEW
- `GET /api/admin/settings` — Get all settings
- `POST /api/admin/settings/loan-config` — Update interest + duration + grace period
- `POST /api/admin/settings/guarantor-coverage` — Toggle coverage mode
- `POST /api/admin/settings/currency` — Set site-wide currency

### Bank Accounts (Phase 2.5) — NEW
- `GET /api/cooperative/bank-accounts` — Public list (no auth)
- `POST /api/admin/bank-accounts` — Owner adds account
- `PUT /api/admin/bank-accounts/[id]` — Owner edits account
- `DELETE /api/admin/bank-accounts/[id]` — Owner deletes account
- `POST /api/admin/bank-accounts/[id]/set-preferred` — Mark as preferred

### Admin (Phase 4)
- `POST /api/admin/members/import` — CSV upload
- `POST /api/admin/invite-member` — Invite by email
- `GET /api/admin/dashboard` — Overview + notifications

### Reports (Phase 5)
- `GET /api/reports/financial` — Totals + outstanding
- `GET /api/reports/members` — Member list + status
- `GET /api/reports/loan-decisions` — Approval rates
- `GET /api/reports/dividend-snapshot` — For AGM

---

## Edge Cases & Validation (UPDATED)

### Member Verification
- ❌ Unverified user tries to apply for loan → redirect to verification pending
- ❌ Unverified user tries to access /dashboard → redirect to verification pending
- ✅ Unverified user CAN access /dashboard/profile

### Loan Application (Updated)
- ❌ User not VERIFIED → error
- ❌ totalContributed = 0 → error "Must have contributions"
- ❌ requestedAmount > totalContributed × multiplier → error "Exceeds capacity"
- ❌ Unverified guarantors → error
- ❌ Guarantor coverage violations → error based on mode
- ✅ If COMBINED: sum(guarantors) >= amount
- ✅ If INDIVIDUAL: each guarantor >= amount
- ✅ If OFF: no coverage check

### Loan Repayment (NEW)
- ❌ Pay amount > total due → auto-allocate overpayment
- ❌ Payment split: contribution + repayment > total → error
- ❌ Loan already repaid → show "Fully Repaid" badge
- ✅ User can pay partial, flexible, or ahead of schedule
- ✅ Late payment detected → trigger notification

### Treasurer Recording (NEW)
- ✅ Treasurer can record contribution (auto-verified)
- ✅ Treasurer can record repayment (split allocation)
- ✅ Overpayment auto-allocation still applies
- ✅ Member sees recorded amount in history

---

## Event Log (Audit Trail) — Updated

```
member_verified
loan_application_submitted (with guarantor contributions)
loan_application_rejected (with reason)
loan_application_retried
loan_application_approved
loan_repayment_made (with split details)
loan_repayment_recorded (by treasurer)
loan_repaid (fully paid off)
loan_marked_defaulted
loan_status_behind_payment
contribution_submitted
contribution_verified
contribution_recorded (by treasurer)
setting_updated
bank_account_added
notification_sent
```

---

## Implementation Steps

### Phase 1.5: Member Verification — Do First

**Database:**
```
ALTER TABLE "User" ADD COLUMN "verifiedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "verifiedBy" TEXT;
```

**Pages:**
- `app/dashboard/verification-pending/page.tsx` — Unverified landing page
- `app/dashboard/profile/page.tsx` — Profile (accessible to unverified)
- `app/admin/members/unverified/page.tsx` — Verification UI

**Server Actions:**
- `verifyMember(memberId, cooperativeId)` — owner/admin only

**Middleware:**
- Redirect unverified users to verification-pending page
- Allow /dashboard/profile only

---

### Phase 2: Loan Eligibility, Guarantor Coverage, Repayment Tracking

**Database:**
```
ALTER TABLE "Cooperative" ADD COLUMN "borrowingMultiplier" INT DEFAULT 3;
ALTER TABLE "Cooperative" ADD COLUMN "guarantorCoverageMode" TEXT DEFAULT 'COMBINED';
ALTER TABLE "Cooperative" ADD COLUMN "loanInterestRate" DECIMAL DEFAULT 10;
ALTER TABLE "Cooperative" ADD COLUMN "loanRepaymentMonths" INT DEFAULT 12;
ALTER TABLE "Cooperative" ADD COLUMN "defaultGracePeriodDays" INT DEFAULT 30;
ALTER TABLE "Cooperative" ADD COLUMN "currency" TEXT DEFAULT 'NGN';
ALTER TABLE "Cooperative" ADD COLUMN "currencySymbol" TEXT DEFAULT '₦';

ALTER TABLE "LoanApplication" ADD COLUMN "interestRate" DECIMAL;
ALTER TABLE "LoanApplication" ADD COLUMN "repaymentMonths" INT;
ALTER TABLE "LoanApplication" ADD COLUMN "totalAmountDue" DECIMAL;
ALTER TABLE "LoanApplication" ADD COLUMN "approvedAt" TIMESTAMP;
ALTER TABLE "LoanApplication" ADD COLUMN "repaidAt" TIMESTAMP;

CREATE TABLE "LoanRepayment" (
  id INT PRIMARY KEY,
  loanId INT NOT NULL REFERENCES "LoanApplication"(id),
  amount DECIMAL NOT NULL,
  paymentType TEXT NOT NULL, -- CONTRIBUTION or LOAN_REPAYMENT
  paidAt TIMESTAMP NOT NULL,
  receiptUrl TEXT,
  recordedBy TEXT, -- treasurer user ID
  createdAt TIMESTAMP DEFAULT now()
);
```

**Pages:**
- `app/dashboard/loans/apply/page.tsx` (updated) — Show capacity, validate amount
- `app/dashboard/loans/[id]/page.tsx` (updated) — Show status + schedule
- `app/dashboard/loans/[id]/repay/page.tsx` (NEW) — Payment form with split
- `app/dashboard/loans/[id]/rejected/page.tsx` (NEW) — Retry button
- `app/admin/loans/pending/page.tsx` (updated) — Show contribution details
- `app/admin/settings/page.tsx` (NEW) — Configure interest, duration, grace period, currency

**Server Actions:**
- `applyForLoan()` (updated) — validate eligibility + coverage
- `rejectLoan()` — save reason, emit event
- `retryLoan()` — create new loan with same guarantors
- `repayLoan()` — process payment with split
- `recordRepayment()` (treasurer only)
- `updateLoanSettings()` — owner updates interest, duration, grace period

**Helper Functions:**
- `getTotalContributed(userId)` — sum verified contributions
- `getBorrowingCapacity(user, cooperative)` — totalContributed × multiplier
- `generateRepaymentSchedule(loanId, amount, months)` — create 12-month schedule
- `calculateLoanStatus(loan)` — ON_TRACK, BEHIND, DEFAULTED, REPAID
- `checkGuarantorCoverage(guarantorIds, amount, mode)` — validate coverage

---

### Phase 2.5: Mobile Bottom Nav, Bank Accounts, Notifications

**Pages:**
- `app/components/layout/BottomNav.tsx` (NEW) — 4 icons (Home, Contributions, Loans, Profile)
- `app/dashboard/cooperative-details/page.tsx` (NEW) — Bank accounts + stats
- `app/admin/notifications/page.tsx` (NEW) — Pending loan approvals
- `app/admin/settings/page.tsx` (updated) — Add bank account management

**Server Actions:**
- `addBankAccount(formData, cooperativeId)` — owner only
- `updateBankAccount(accountId, formData, cooperativeId)` — owner only
- `deleteBankAccount(accountId, cooperativeId)` — owner only
- `setPreferredBankAccount(accountId, cooperativeId)` — owner only

**Components:**
- `BottomNav.tsx` — Mobile navigation with lucide-react icons
- `BankAccountForm.tsx` — Add/edit bank account
- `BankAccountTable.tsx` — List with actions
- `LoanRepaymentStatus.tsx` — Current status card
- `RepaymentScheduleTable.tsx` — Full 12-month schedule
- `NotificationBadge.tsx` — Count of pending approvals
- `LatePaymentAlert.tsx` — Payment overdue warning

**Notifications:**
- Late payment alert on dashboard (user + admin)
- Toast on successful payment
- Badge count on admin notifications

---

### Phase 3: Treasurer Manual Entry

**Pages:**
- `app/admin/contributions/record/page.tsx` (NEW) — Treasurer records contribution
- `app/admin/loans/[id]/record-repayment/page.tsx` (NEW) — Treasurer records repayment
- `app/admin/members/contributions/history/page.tsx` (NEW) — Sortable/filterable table

**Server Actions:**
- `recordManualContribution(memberId, amount, paymentMethod, date, cooperativeId)` — treasurer only, auto-verifies
- `recordManualRepayment(loanId, amount, paymentType, date, cooperativeId)` — treasurer only, handles overpayment

---

### Phase 4: Admin Tools
- CSV member import
- Invite members

### Phase 5: Reports
- Financial summary
- Loan decisions
- Dividend snapshot

---

## Testing Strategy

### Unit Tests
```
Loan Eligibility:
✓ 0 contribution → reject
✓ amount > 3x capacity → reject
✓ unverified user → reject
✓ unverified guarantor → reject
✓ coverage COMBINED, sum < amount → reject
✓ coverage INDIVIDUAL, any < amount → reject
✓ valid application → success

Loan Repayment:
✓ Partial payment → balance updates
✓ Ahead of schedule → next month adjusts
✓ Overpayment → auto-allocate to contribution
✓ Full payment → marked REPAID
✓ Treasurer records → auto-verified
✓ Late payment → status BEHIND

Member Verification:
✓ Signup → unverified
✓ Owner signup → auto-verified
✓ Owner verifies member → access granted
```

### Integration Tests
```
Full loan workflow:
1. Member signs up → unverified
2. Owner verifies
3. Member applies (with capacity check)
4. Guarantors respond
5. Admin approves
6. Member repays (with schedule)
7. Check late payment status

Payment split workflow:
1. Member makes 5,000 contribution + 3,000 repayment
2. Both recorded separately
3. Member sees both in history

Treasurer workflow:
1. Treasurer records contribution for non-tech member
2. Member sees in their history
3. Capacity updated automatically
```

---

## Project Structure

```
app/
├── auth/
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── dashboard/
│   ├── page.tsx
│   ├── profile/page.tsx
│   ├── verification-pending/page.tsx
│   ├── cooperative-details/page.tsx
│   ├── loans/
│   │   ├── page.tsx
│   │   ├── apply/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── repay/page.tsx
│   │       └── rejected/page.tsx
│   └── contributions/
│       ├── page.tsx
│       └── submit/page.tsx
├── admin/
│   ├── dashboard/page.tsx
│   ├── notifications/page.tsx
│   ├── settings/page.tsx
│   ├── members/
│   │   ├── page.tsx
│   │   ├── unverified/page.tsx
│   │   └── [id]/contribution-history/page.tsx
│   ├── loans/
│   │   ├── pending/page.tsx
│   │   └── [id]/record-repayment/page.tsx
│   └── contributions/
│       ├── pending/page.tsx
│       ├── record/page.tsx
│       └── history/page.tsx
├── components/
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
│   └── admin/
│       ├── BankAccountForm.tsx
│       ├── MemberVerificationDialog.tsx
│       └── NotificationBadge.tsx
├── actions/
│   ├── auth.ts
│   ├── verification.ts
│   ├── loans.ts
│   ├── repayments.ts
│   ├── contributions.ts
│   ├── settings.ts
│   ├── admin.ts
│   └── reports.ts
├── api/
│   ├── auth/[...auth]/route.ts
│   ├── cooperative/bank-accounts/route.ts
│   └── admin/bank-accounts/route.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── middleware.ts
│   ├── server-actions.ts
│   ├── loan-helpers.ts (NEW)
│   ├── prisma.ts
│   └── auth.ts
└── middleware.ts
```

---

## Success Criteria

When complete:
1. ✅ Member verification (unverified → pending page)
2. ✅ Loan eligibility (verified, contributed > 0, capacity limit)
3. ✅ Guarantor coverage (configurable: OFF / COMBINED / INDIVIDUAL)
4. ✅ Loan repayment (simple interest, monthly amortization)
5. ✅ Repayment schedule (visible, full 12 months)
6. ✅ Payment status tracking (ON_TRACK, BEHIND, DEFAULTED, REPAID)
7. ✅ Late payment notifications (user + admin)
8. ✅ Flexible payments (any amount, anytime)
9. ✅ Payment split (contribution + repayment)
10. ✅ Treasurer manual entry (contributions + repayments)
11. ✅ Overpayment auto-allocation
12. ✅ Mobile bottom nav (4 icons)
13. ✅ Bank account management (multiple, preferred)
14. ✅ Currency configuration (site-wide)
15. ✅ Contribution history (admin sortable/filterable)
16. ✅ Notifications (badge + pending list)
17. ✅ Owner settings (interest, duration, grace period)
18. ✅ Events logged (all actions)
19. ✅ Multi-tenancy maintained

---

## Notes for Claude Code

- **Verify membership** in all sensitive operations
- **Check guarantor coverage** based on cooperative mode
- **Calculate capacity dynamically:** totalContributed × borrowingMultiplier
- **Generate schedule** when loan approved (append-only)
- **Track late payments** by comparing (today - approvedAt) to dueDate
- **Auto-allocate overpayments** if payment > remaining balance
- **Show currency dynamically** from Cooperative.currencySymbol
- **Treasurer actions** are admin-level permissions
- **Mobile-first nav** using lucide-react icons
- **Use Server Actions** for all mutations
- **Revalidate paths** after every change
- **Log events** for compliance
- **Show repayment schedule** both as card + detailed table

---

## Open Questions (For Later)

1. Email/SMS notifications on loan approval?
2. Dividend distribution automation?
3. Loan interest accrual vs simple upfront?
4. Collateral tracking for high-value loans?
5. Member co-signer requirements?