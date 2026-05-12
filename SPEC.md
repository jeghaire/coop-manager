# Cooperative Manager — Spec

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

## Tech Stack

- **Frontend:** Next.js (app router), React 19, TypeScript, shadcn/ui
- **Backend:** Next.js Server Actions (`useActionState` + `FormData` — no RHF)
- **Database:** PostgreSQL + Prisma ORM (hosted on Neon)
- **Auth:** Better-auth (email/password; password reset via `Verification` table)
- **Billing:** Stripe (per-cooperative subscription; checkout + billing portal)
- **File Storage:** AWS S3 (contribution receipt uploads — presigned PUT URLs)
- **Email:** Resend (transactional emails + notifications; sender via `EMAIL_FROM` env var)
- **SMS:** Twilio (SMS notifications; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + shadcn/ui components
- **Icons:** lucide-react
- **PDF Export:** jsPDF + jspdf-autotable (client-side; member statements + cooperative reports)

---

## Goals

1. Production-grade SaaS with multi-tenancy isolation
2. Enable 1000+ users per cooperative
3. Compliance audit trail for regulatory bodies
4. Manual contribution verification (members upload receipts)
5. Automated loan approval workflow with guarantor validation
6. Member verification gating for sensitive operations
7. Configurable loan eligibility & repayment rules
8. Flexible loan repayment tracking
9. Site-wide currency configuration (symbol derived at runtime, not stored)
10. Email/SMS notifications for key events
11. Transparent member financial dashboard
12. Dividend distribution based on contribution percentage
13. Password reset + account settings (name, password)
14. Bulk member onboarding via CSV
15. Member withdrawals with approval workflow

---

## Status: Feature Complete

All planned features are implemented. The app is in pre-launch polish/test phase.

### Implemented Features

- **Auth:** Signup, signin, signout, forgot password, password reset
- **Member verification:** Two-tier (unverified → verified); owner auto-verified
- **Loans:** Application, guarantor flow, admin review, repayment tracking, health status
- **Contributions:** Member upload (S3 receipts), treasurer manual entry, admin verification
- **Dividends:** Create with profit split preview → approve → process (PENDING → APPROVED → PAID)
- **Withdrawals:** Member request → admin approve/reject → mark paid (REQUESTED → APPROVED/REJECTED → PAID)
- **Announcements:** Create, pin, RSVP, deactivate; bulk email+SMS notification
- **Reporting:** Financial overview, loan portfolio, contribution report, audit trail, CSV export, PDF export
- **Billing:** Stripe checkout + billing portal per cooperative
- **Settings:** Loan config, guarantor coverage mode, bank accounts, currency
- **Treasurer role:** Dedicated page to record contributions + repayments for offline members
- **Notifications:** Email (Resend) + SMS (Twilio); per-member opt-in/out toggles
- **Account settings:** Name + password change via better-auth client
- **CSV import:** Bulk member onboarding with email invites and temp passwords

---

## Key Architecture Decisions

### 1. Multi-Tenancy
Shared database, `cooperativeId` on every table. All queries filter by cooperativeId. Auth helpers enforce cooperative membership.

### 2. Member Verification (Two-Tier Access)
- **Unverified:** Can log in, see own profile, cannot apply for loans or see member list
- **Verified:** Full member dashboard access
- Owner auto-verified on signup; all others require admin/owner approval

### 3. Loan Eligibility
- Must have at least one verified contribution
- Loan amount ≤ `totalContributed × borrowingMultiplier` (default 3×, configurable)

### 4. Guarantor Coverage (Configurable)
- **OFF:** No coverage requirement
- **COMBINED:** Sum of guarantors' contributions ≥ loan amount (default)
- **INDIVIDUAL:** Each guarantor's contributions ≥ loan amount individually

### 5. Loan Repayment (Simple Interest)
- `Total Due = Principal + (Principal × interestRate%)`
- Divided over `loanRepaymentMonths` (default 12); owner-configurable
- Flexible payments tracked individually; loan auto-marked REPAID when cleared

### 6. Treasurer Role
Distinct from ADMIN. Can record contributions (auto-verified) and repayments for members who pay offline. Cannot approve loans or change settings.

### 7. Currency
`Cooperative.currency` stores ISO code (e.g. `"NGN"`). Symbol (`₦`, `$`, etc.) is derived at runtime via `getCurrencySymbol()`. No stored symbol column.

### 8. Forms
All forms use React's `useActionState` with server actions. FormData is parsed server-side with helpers in `app/lib/form.ts`. No RHF or zod.

### 9. Payment Splitting (Loan Repayment)
The repayment form accepts separate `loanAmount` + `contributionAmount` fields, allowing a member to partially repay a loan and make a contribution in one submission.

### 10. Notification System
Email via Resend + SMS via Twilio. Members can opt out of each channel independently. Daily cron at `/api/cron/check-overdue` checks for overdue loans (8 AM UTC).

### 11. Dividend Distribution
1. Owner enters total profit, admin costs %, loan loss reserve %
2. Remaining pool distributed to members proportional to verified contribution total
3. Status: PENDING → APPROVED → PAID

### 12. Audit Trail
Immutable `Event` table. Every critical action is logged. Never deleted.

### 13. Password Reset
Handled by better-auth via the `Verification` table (token + expiry). No custom `resetToken` fields on User.

### 14. Billing
Stripe per-cooperative subscription. Checkout via `/api/billing/checkout`, portal via `/api/billing/portal`. Webhook at `/api/webhooks/stripe` updates `subscriptionStatus`.

### 15. Mobile Navigation
`BottomTabBar`, `MobileTopBar`, and `MobileNavDrawer` components exist but are currently commented out in the dashboard layout. Desktop sidebar (`DashboardNav`) is active.

---

## Data Model

### Cooperative
`id, name, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, billingCycleEnd, borrowingMultiplier, guarantorCoverageMode, loanInterestRate, loanRepaymentMonths, defaultGracePeriodDays, currency, deletedAt`

### User
`id, cooperativeId, email, name, role (MEMBER|TREASURER|ADMIN|OWNER), monthlyContributionAmount, verifiedAt, verifiedBy, phoneNumber, emailNotifications, smsNotifications, deletedAt`

Note: No `resetToken`/`resetTokenExpiresAt` — better-auth uses its own `Verification` table.

### LoanApplication
`id, cooperativeId, userId, amountRequested, status (PENDING_GUARANTORS|PENDING_ADMIN_REVIEW|APPROVED|REJECTED|REPAID), interestRate, repaymentMonths, totalAmountDue, approvedAt, repaidAt, reviewedBy, reviewedAt, rejectionReason, deletedAt`

### LoanGuarantor
`id, loanId, guarantorId, status (PENDING|ACCEPTED|REJECTED), acceptedAt, rejectionReason, deletedAt`

### LoanRepayment
`id, loanId, amount, paymentType, paidAt, receiptUrl, recordedBy, note`

### Contribution
`id, cooperativeId, userId, amount, status (PENDING_VERIFICATION|VERIFIED|REJECTED), paymentMethod (BANK_TRANSFER|MOBILE_MONEY|CASH|DIRECT_PAYMENT), receiptUrl, receiptKey, receiptFileName, receiptFileSize, receiptFileType, receiptUploadedAt, rejectionCount, verifiedByUserId, verifiedAt, rejectionReason, deletedAt`

### CooperativeBank
`id, cooperativeId, accountName, accountNumber, bankName, isPreferred`

### WithdrawalRequest
`id, userId, cooperativeId, amount, reason, notes, status (REQUESTED|APPROVED|REJECTED|PAID), rejectionReason, approvedAt, approvedBy, paidAt, deletedAt`

### Announcement
`id, cooperativeId, title, message, type (GENERAL|AGM|MAINTENANCE|RULE_CHANGE), recipientType (ALL|MEMBERS_ONLY|ADMINS_ONLY), agmDate, agmLocation, allowRsvp, isPinned, isActive, expiresAt, createdBy`

### AnnouncementRsvp
`id, announcementId, userId, rsvpStatus (ATTENDING|NOT_ATTENDING|MAYBE)` — unique per (announcement, user)

### DividendPayout
`id, cooperativeId, period (Q1|Q2|Q3|Q4|ANNUAL), year, totalProfit, adminCosts, loanLossReserve, dividendPool, totalMembers, status (PENDING|APPROVED|PAID), approvedAt, approvedBy, paidAt`

### MemberDividend
`id, payoutId, userId, cooperativeId, contributionPct, amount, status (PENDING|PAID), paidAt`

### Notification
`id, cooperativeId, userId, type, channel, recipient, subject, body, status, externalId`

### Event (Audit)
`id, cooperativeId, eventType, actorId, actorType, entityType, entityId, data (JSON)` — immutable

---

## Notification Triggers

| Event | Email | SMS |
|---|---|---|
| Loan approved | ✓ | ✓ |
| Loan rejected | ✓ | — |
| Contribution verified | ✓ | ✓ |
| Contribution rejected | ✓ | — |
| Guarantor requested | ✓ | ✓ |
| Dividend paid | ✓ | ✓ |
| Member verified | ✓ | ✓ |
| Announcement created | ✓ (bulk) | ✓ (bulk) |
| Payment overdue | ✓ | ✓ |

Daily cron: `GET /api/cron/check-overdue` (secured with `CRON_SECRET`).

---

## Audit Event Types

```
cooperative_created
member_invited
member_verified
member_role_changed
member_removed
members_imported
loan_application_submitted
loan_auto_rejected
guarantor_accepted
guarantor_rejected
loan_ready_for_review
loan_application_approved
loan_application_rejected
loan_repayment_made
loan_repayment_recorded
contribution_submitted
contribution_verified
contribution_rejected
contribution_recorded_by_treasurer
dividend_payout_created
dividend_payout_approved
dividend_payout_processed
withdrawal_requested
withdrawal_approved
withdrawal_rejected
withdrawal_paid
announcement_created
bank_account_added
bank_account_updated
bank_account_deleted
setting_updated
loan_settings_updated
```

---

## File Structure (Actual)

```
app/
├── actions/
│   ├── admin.ts          (invite, import CSV, role change, remove member)
│   ├── announcements.ts
│   ├── auth.ts
│   ├── contributions.ts
│   ├── cooperative.ts    (create cooperative on signup)
│   ├── dividends.ts
│   ├── loans.ts
│   ├── reports.ts        (read-only data fetchers)
│   ├── settings.ts
│   ├── user.ts           (notification preferences)
│   ├── verification.ts
│   └── withdrawals.ts
├── api/
│   ├── auth/[...all]/route.ts
│   ├── auth/cooperatives/route.ts
│   ├── auth/signup/route.ts
│   ├── billing/checkout/route.ts
│   ├── billing/portal/route.ts
│   ├── cooperative/bank-accounts/route.ts
│   ├── cron/check-overdue/route.ts
│   ├── receipts/presign/route.ts
│   ├── reports/csv/route.ts
│   └── webhooks/stripe/route.ts
├── auth/
│   ├── forgot-password/  (ForgotPasswordForm.tsx, page.tsx)
│   ├── reset-password/   (ResetForm.tsx, page.tsx)
│   ├── signin/
│   └── signup/
├── admin/
│   ├── announcements/    (list, new)
│   ├── contributions/    (list + review, ContributionReviewForm.tsx)
│   ├── dividends/        (list, NewDividendForm.tsx, DividendActions.tsx)
│   ├── loans/            (list + review, LoanReviewForm.tsx)
│   ├── members/          (list, unverified, invite, import CSV)
│   ├── notifications/    (sent log)
│   ├── reports/          (tabs: overview, loans, contributions, audit trail; CSV + PDF export)
│   ├── settings/         (loan config, guarantor mode, bank accounts)
│   ├── treasurer/        (record contribution, record repayment)
│   └── withdrawals/      (list + approve/reject/mark-paid)
├── cooperatives/new/     (create cooperative form)
├── dashboard/
│   ├── announcements/[id]/  (member view + RSVP)
│   ├── billing/          (Stripe subscription management)
│   ├── contributions/    (list + submit with S3 upload)
│   ├── cooperative-details/ (bank accounts, cooperative info)
│   ├── financial-summary/   (stat cards + PDF statement download)
│   ├── loans/            (list, apply, [id] detail + repay, [id]/rejected)
│   ├── profile/
│   ├── settings/         (name + password change, notification preferences)
│   ├── transactions/     (unified contribution + repayment timeline)
│   ├── verification-pending/
│   └── withdrawals/      (request form + status list)
├── components/
│   ├── BottomTabBar.tsx      (exists, not currently active)
│   ├── BottomSheet.tsx
│   ├── ContributionSubmitSheet.tsx
│   ├── DashboardNav.tsx
│   ├── Header.tsx
│   ├── HeroScene.tsx
│   ├── InviteMemberSheet.tsx
│   ├── LoanApplySheet.tsx
│   ├── MobileNavDrawer.tsx
│   ├── MobileTopBar.tsx      (exists, not currently active)
│   ├── PinnedAnnouncementsBanner.tsx
│   ├── ReceiptViewerDialog.tsx
│   └── ...
└── lib/
    ├── auth-helpers.ts   (requireAuth, protectAdminAction, isAdminOrOwner, etc.)
    ├── auth-client.ts
    ├── auth.ts
    ├── currency.ts       (getCurrencySymbol — no stored symbol column)
    ├── email.ts
    ├── form.ts           (getString, getOptionalString, getNumber, getInt)
    ├── loan-helpers.ts   (calculateLoanTotals, calculateLoanHealth, generateRepaymentSchedule)
    ├── notifications.ts
    ├── pdf-export.ts
    ├── prisma.ts
    ├── s3-upload.ts      (presigned PUT URL generation)
    ├── s3.ts
    └── stripe.ts
```

---

## Notes

1. **Migrations:** `pnpm dlx prisma migrate dev --name <name>`
2. **Type check:** `npx tsc --noEmit` (must pass before shipping)
3. **Forms:** `useActionState` + server actions. `app/lib/form.ts` helpers replace `(formData.get("key") as string)?.trim()` boilerplate. No RHF.
4. **Role checks:** Use `isAdminOrOwner(role)` / `isAdminTreasurerOrOwner(role)` from `auth-helpers.ts`.
5. **Currency:** Always call `getCurrencySymbol(cooperative.currency)` — never hardcode symbols.
6. **Mobile nav:** `BottomTabBar` and `MobileTopBar` are built but commented out in `dashboard/layout.tsx`. Can be re-enabled when ready.
7. **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` required.
8. **S3:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` required.
