# Cooperative Manager SaaS - Implementation Spec

## Problem Statement
Cooperatives need a digital system to manage:
- Member contributions (monthly, variable amounts per member)
- Loans (with 2-member guarantor requirement)
- Admin approvals (loans, contribution verification)
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

---

## Tech Stack
- **Frontend:** Next.js 15 (app router), React 19, TypeScript, shadcn/ui
- **Backend:** Next.js Server Actions, TypeScript
- **Database:** PostgreSQL + Prisma 6 ORM
- **Auth:** Better-auth (email/password)
- **Payments:** Stripe (£500/year per cooperative)
- **File Storage:** TBD (S3 or local for contribution receipts)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + shadcn/ui components

---

## Current State

### ✅ Completed
- Prisma schema (all models, enums, soft deletes, timestamps)
- PostgreSQL local setup
- Multi-tenancy structure (cooperativeId isolation)
- Cooperative access middleware (verified working)
- Member & admin dashboard endpoints (test endpoints built & working)

### ❌ Not Started
- Authentication system (signup/login)
- Loan management (apply, approve, guarantor response)
- Contribution management (submit, verify)
- CSV member import
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

### 2. Signup Flow (SIMPLIFIED)
**Decision:** Pre-create cooperatives, users choose one
1. Admin creates cooperative (manual or dashboard, not user-facing)
2. User signs up with better-auth → chooses cooperative from list
3. User joins as MEMBER by default
4. Owner/TREASURER can invite others to their cooperative

**Why this approach:**
- No better-auth data complexity (cooperativeId passed by user choice, not signup flow)
- Clearer SaaS model (cooperatives are tenants)
- Admin controls who can create cooperatives (prevents spam)
- Simpler signup validation

### 3. Contribution Verification
**Decision:** Manual upload + admin verification (not auto-debits)
- Members upload receipt images
- Admin verifies in dashboard
- Logged to Event table for compliance

**Why:** Nigerian market reality, lower friction, more control

### 4. Loan Guarantors
**Decision:** 2 members must accept before admin can approve
- Guarantor status: pending → accepted/rejected
- If either rejects, loan auto-rejected
- Prevents collusion (guarantors can't be admins)

### 5. Audit Trail
**Decision:** Immutable Event table
- Every action: loan_applied, contribution_submitted, loan_approved, etc.
- Never deleted, soft-delete for records
- Used for compliance reports, dividend calculations, investigations

### 6. Server Actions (Next.js 15 Pattern)
**Decision:** Use Server Actions instead of API routes where possible
- Form submissions → Server Actions
- Data mutations → Server Actions
- Complex queries → Server Actions
- Real-time data fetching → API routes (for polling/SSE)

**Why:**
- Type-safe client↔server communication
- No manual JSON serialization
- Better error handling
- Automatic CSRF protection
- Cleaner code than fetch() calls


---

## UI Component Library
- **shadcn/ui components** for all UI
- Pre-built: Button, Input, Card, Dialog, Form, Table, Alert, etc.
- Tailwind CSS under the hood
- Dark mode support built-in

**Available Components We'll Use:**
- Form (for signup, login, loan applications)
- Button, Input, Label (basic controls)
- Card (dashboard sections)
- Table (member lists, loan history)
- Dialog (modals for approvals, verification)
- Alert (validation, success, error messages)
- Select (dropdown for cooperatives, payment methods)
- Tabs (dashboard sections: pending, approved, rejected)
- Badge (status indicators)
- Progress (loan approval workflow visualization)

---

## Data Model Summary

### Core Tables
- **Cooperative** — Tenant (subscriptionStatus, billingCycleEnd)
- **User** — Member (role: MEMBER|ADMIN|TREASURER|OWNER, cooperativeId, monthlyContributionAmount)
- **LoanApplication** — Request (status: PENDING_GUARANTORS|PENDING_ADMIN_REVIEW|APPROVED|REJECTED)
- **LoanGuarantor** — Link (guarantor + loan, status: PENDING|ACCEPTED|REJECTED)
- **Contribution** — Payment (status: PENDING_VERIFICATION|VERIFIED|REJECTED, receiptUrl)
- **Event** — Audit log (immutable, never delete)

### Key Fields
- All: soft delete (`deletedAt`), timestamps (`createdAt`, `updatedAt`)
- Decimal amounts stored as `String` (Prisma limitation)
- User IDs are `String` (better-auth uses UUIDs)

---

## API Endpoints (Priority Order)

### Auth (Phase 1)
- `POST /api/auth/signup` — User signs up, chooses cooperative
- `POST /api/auth/signin` — Better-auth login
- `POST /api/auth/signout` — Better-auth logout
- `GET /api/auth/cooperatives` — List available cooperatives (for signup dropdown)

### Loans (Phase 2)
- `POST /api/loans/apply` — User applies with 2 guarantor IDs
- `GET /api/loans` — List user's loans
- `POST /api/loans/[id]/approve` — Admin approves (checks funds, creates Event)
- `POST /api/loans/[id]/respond-as-guarantor` — Guarantor accepts/rejects
- `GET /api/admin/loans/pending` — Admin sees pending approvals

### Contributions (Phase 3)
- `POST /api/contributions/submit` — Upload receipt + amount
- `GET /api/contributions` — List member's contributions
- `POST /api/contributions/[id]/verify` — Admin verifies
- `GET /api/admin/contributions/pending` — Admin sees pending verifications

### Admin (Phase 4)
- `POST /api/admin/members/import` — CSV upload (name, email, phone, monthly_contribution)
- `POST /api/admin/invite-member` — Invite by email (sends link to set password)
- `GET /api/admin/dashboard` — Pending approvals, financial overview

### Reports (Phase 5)
- `GET /api/reports/financial` — Total contributed, total loaned, outstanding
- `GET /api/reports/members` — Member list, status, contributions, loans
- `GET /api/reports/loan-decisions` — Approval rates by admin, denial reasons
- `GET /api/reports/dividend-snapshot` — For AGM

---

## Edge Cases & Validation

### Loan Application
- ❌ User can't apply if cooperativeId mismatch
- ❌ User can't pick themselves as guarantor
- ❌ Can't pick deleted/inactive users as guarantors
- ❌ Can't apply if coop subscription inactive
- ❌ Guarantor can't be ADMIN (prevent collusion)

### Guarantor Response
- ❌ Guarantor from wrong cooperative can't access
- ❌ Already accepted/rejected, can't change
- ❌ If one rejects, whole loan auto-rejects

### Contribution Verification
- ❌ Member can't verify own contribution
- ❌ Can't verify twice
- ❌ Receipt URL validation (file type, size)

### Data Integrity
- All monetary amounts: validate > 0, no negatives
- Dates: appliedAt ≤ reviewedAt
- Status transitions: only valid flows allowed

---

## Event Log (Audit Trail)

Every critical action logs an Event:
```
eventType: "loan_application_submitted"
actorId: userId
actorType: "user"
entityType: "loan"
entityId: loanId
data: { amount, guarantorIds, applicantName }
createdAt: auto

eventType: "loan_application_approved"
actorId: adminId
actorType: "admin"
data: { adminName, reason }

eventType: "contribution_submitted"
data: { amount, receiptUrl, paymentMethod }

eventType: "guarantor_accepted"
actorId: guarantorId
data: { guarantorName }
```

Used for:
- Compliance reports (show all rejections + reasons)
- Dividend calculations (verify contributions)
- Disputes (who did what, when, why)

---

## Implementation Steps

### Phase 1: Authentication (Prerequisite)
```
1. Create GET /api/auth/cooperatives endpoint
   - Returns: id, name, memberCount
   - No auth required (public list)

2. Update signup page
   - Fetch cooperative list
   - User picks cooperative from dropdown
   - Submit: email, password, name, cooperativeId

3. Create POST /api/auth/signup endpoint
   - Validate cooperativeId exists
   - Call better-auth to create user
   - Add cooperativeId to user.data
   - Return success → redirect to signin

4. Test signup/signin flow
   - Create 2 test cooperatives manually in DB
   - Sign up as user in coop 1
   - Sign up as user in coop 2
   - Verify middleware blocks cross-coop access
```

### Phase 2: Loans
```
1. POST /api/loans/apply
   - Guard: requireCooperativeAccess
   - Validate: 2 guarantors from same coop, not user, not admin, not deleted
   - Create LoanApplication (status: PENDING_GUARANTORS)
   - Create 2x LoanGuarantor records (status: PENDING)
   - Emit event: loan_application_submitted
   - Send notification: guarantors get notified

2. POST /api/loans/[id]/respond-as-guarantor
   - Guard: requireCooperativeAccess
   - Validate: is guarantor on this loan
   - Update LoanGuarantor.status
   - Check: all guarantors responded?
   - If both accepted: LoanApplication.status = PENDING_ADMIN_REVIEW
   - If any rejected: LoanApplication.status = REJECTED
   - Emit events

3. POST /api/loans/[id]/approve (admin only)
   - Guard: requireCooperativeAccess + requireAdminRole
   - DB transaction: CHECK funds, UPDATE application, UPDATE guarantor, log Event
   - If insufficient funds: reject with reason
   - Emit: loan_approved event
   - Send notification: user gets approved

4. GET /api/admin/loans/pending
   - Guard: requireAdminRole
   - Return: all PENDING_ADMIN_REVIEW loans with user details + guarantor status
```

### Phase 3: Contributions
```
1. POST /api/contributions/submit
   - Guard: requireCooperativeAccess
   - File upload: validate receipt (jpg, png, pdf, < 5MB)
   - Create Contribution (status: PENDING_VERIFICATION)
   - Emit: contribution_submitted event

2. POST /api/contributions/[id]/verify (admin only)
   - Guard: requireAdminRole
   - Update: status, verifiedBy, verifiedAt, verifiedByUserId
   - If approved: Emit contribution_verified event
   - If rejected: Emit contribution_rejected event, add reason

3. GET /api/contributions
   - Guard: requireCooperativeAccess
   - Return: member's contributions only
```

### Phase 4: Admin Tools
```
1. POST /api/admin/members/import
   - Guard: requireAdminRole + owner only
   - Parse CSV: name, email, phone, monthly_contribution
   - For each: create User (role: MEMBER), set monthlyContributionAmount
   - Send invite emails with password reset link
   - Emit: members_imported event

2. POST /api/admin/invite-member
   - Guard: requireAdminRole
   - Create User (emailVerified: false)
   - Send invite email with verification link
```

### Phase 5: Reports & Compliance
```
1. GET /api/reports/financial
   - Total contributions (verified only)
   - Total loans (approved only)
   - Outstanding loans
   - Available funds

2. GET /api/reports/loan-decisions
   - All loan decisions (approved + rejected)
   - Grouped by admin
   - Grouped by reason
   - Approval rate %

3. GET /api/reports/dividend-snapshot
   - Each member: contribution %, amount owed
   - For AGM presentation
```

---

## Testing Strategy

### Unit Tests (Each endpoint)
```
POST /api/loans/apply
✓ Successful apply with 2 valid guarantors
✓ Reject: guarantor is admin
✓ Reject: guarantor from other coop
✓ Reject: guarantor is applicant
✓ Reject: invalid cooperativeId (middleware)

POST /api/contributions/[id]/verify
✓ Admin verifies contribution
✓ Reject: non-admin tries to verify
✓ Reject: verify someone else's contribution
```

### Integration Tests
```
Full loan workflow:
1. User A applies for loan, picks B & C as guarantors
2. B accepts, C rejects
3. Loan auto-rejects
4. Events logged correctly

Full contribution workflow:
1. Member submits receipt
2. Admin verifies
3. Member sees updated balance
4. Event logged
```

---

## API Architecture: Server Actions vs Routes

### Server Actions (Preferred for Mutations)
```typescript
// app/actions/loans.ts
"use server"

export async function applyForLoan(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  
  const cooperativeId = formData.get("cooperativeId")
  // Validate, create in DB, return result
  
  revalidatePath("/dashboard")
}

// Usage in component:
<form action={applyForLoan}>
  <input name="cooperativeId" />
  <button type="submit">Apply</button>
</form>
```

### API Routes (For Complex Logic / Webhooks)
- `/api/webhooks/stripe` — Stripe events
- `/api/auth/[...auth]` — Better-auth handlers
- Report generation (heavy computation)

---

## Implementation Steps (Updated)

### Phase 1: Authentication
```
1. Create Server Action: app/actions/auth.ts
   - getAvailableCooperatives()
   - signUpUser(email, password, name, cooperativeId)
   - signInUser(email, password)

2. Create Pages
   - app/auth/signup/page.tsx
     - Use shadcn Form component
     - Select component for cooperative dropdown
     - Server Action on submit
   - app/auth/signin/page.tsx
     - shadcn Form component
     - Better-auth signIn

3. Test
   - Sign up → redirect to signin
   - Sign in → redirect to dashboard
   - Middleware blocks access if no session
```

### Phase 2: Loans
```
1. Create Server Actions: app/actions/loans.ts
   - applyForLoan(amount, guarantorIds, cooperativeId)
   - approveLoan(loanId, cooperativeId) [admin only]
   - respondAsGuarantor(loanId, response, cooperativeId)

2. Create Pages
   - app/dashboard/loans/page.tsx
     - List user's loans in shadcn Table
     - Button to "Apply for Loan"
   - app/dashboard/loans/apply/page.tsx
     - shadcn Form with amount, guarantor Select (multi)
     - Server Action submission
   - app/admin/loans/pending/page.tsx
     - shadcn Table: pending loans
     - Dialog: approve/reject with reason
     - Server Action on approve

3. Components
   - LoanCard.tsx (shadcn Card)
   - GuarantorBadge.tsx (status: pending|accepted|rejected)
   - LoanApprovalDialog.tsx (shadcn Dialog)

4. Test
   - User applies → loan created
   - Guarantor sees notification, responds
   - Admin approves → funds deducted
   - Events logged
```

### Phase 3: Contributions
```
1. Create Server Actions: app/actions/contributions.ts
   - submitContribution(amount, receiptFile, cooperativeId)
   - verifyContribution(contributionId, approved, reason, cooperativeId) [admin]

2. Create Pages
   - app/dashboard/contributions/page.tsx
     - List contributions in shadcn Table
     - Button: "Submit Contribution"
   - app/dashboard/contributions/submit/page.tsx
     - Form: amount, file upload, payment method Select
     - shadcn Upload component (or custom)
     - Server Action submission
   - app/admin/contributions/pending/page.tsx
     - Table: pending contributions
     - Dialog: verify with approve/reject
     - Server Action

3. Components
   - ContributionTable.tsx
   - FileUploadZone.tsx (custom, styled with Tailwind)
   - VerificationDialog.tsx (shadcn Dialog)

4. Test
   - Member uploads receipt → status: pending
   - Admin verifies → status: verified
   - Contribution counts toward borrowing capacity
```

### Phase 4: Admin Tools
```
1. Server Actions: app/actions/admin.ts
   - importMembers(csvFile, cooperativeId) [owner only]
   - inviteMember(email, name, cooperativeId) [admin]

2. Pages
   - app/admin/members/page.tsx
     - Table: all members
     - Button: "Import CSV", "Invite Member"
   - app/admin/members/import/page.tsx
     - File upload for CSV
     - Preview table
     - Confirm button → Server Action

3. Components
   - CSVUploadForm.tsx
   - CSVPreviewTable.tsx (shadcn Table)
   - ImportProgress.tsx (shadcn Progress)

4. Test
   - Upload CSV → members created
   - Invite email sent
```

### Phase 5: Reports
```
1. Server Actions: app/actions/reports.ts
   - getFinancialReport(cooperativeId)
   - getLoanDecisions(cooperativeId)
   - getDividendSnapshot(cooperativeId)

2. Pages
   - app/admin/reports/page.tsx
     - Tabs: Financial, Loans, Dividends
     - Shadcn Card layout
   - Each tab loads data via Server Action

3. Components
   - FinancialSummary.tsx (shadcn Card + badges)
   - LoanDecisionChart.tsx (shadcn Table)
   - DividendTable.tsx (shadcn Table)

4. Test
   - Generate report → accurate data
```

---

## Middleware & Helpers

### Middleware: app/middleware.ts
```typescript
import { getSession } from "@/lib/auth-helpers"

export async function middleware(request: NextRequest) {
  const session = await getSession()
  
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}
```

### Server Action Guard: lib/server-actions.ts
```typescript
"use server"

import { getSession } from "@/lib/auth-helpers"
import { requireCooperativeAccess, requireAdminRole } from "@/lib/middleware"

export async function protectAction(cooperativeId: string) {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  
  await requireCooperativeAccess(cooperativeId)
  return session
}

export async function protectAdminAction(cooperativeId: string) {
  const session = await protectAction(cooperativeId)
  await requireAdminRole(session)
  return session
}
```

---

## Project Structure (Updated for Server Actions)

```
app/
├── auth/
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── dashboard/
│   ├── page.tsx (overview)
│   ├── loans/
│   │   ├── page.tsx (list)
│   │   └── apply/page.tsx
│   └── contributions/
│       ├── page.tsx (list)
│       └── submit/page.tsx
├── admin/
│   ├── dashboard/page.tsx
│   ├── loans/pending/page.tsx
│   ├── contributions/pending/page.tsx
│   ├── members/
│   │   ├── page.tsx
│   │   └── import/page.tsx
│   └── reports/page.tsx
├── components/
│   ├── loans/
│   │   ├── LoanCard.tsx
│   │   ├── LoanApprovalDialog.tsx
│   │   └── GuarantorBadge.tsx
│   ├── contributions/
│   │   ├── ContributionTable.tsx
│   │   └── FileUploadZone.tsx
│   ├── admin/
│   │   └── CSVUploadForm.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── actions/ (Server Actions)
│   ├── auth.ts
│   ├── loans.ts
│   ├── contributions.ts
│   ├── admin.ts
│   └── reports.ts
├── api/ (Routes, Webhooks only)
│   ├── auth/[...auth]/route.ts (better-auth)
│   └── webhooks/stripe/route.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── middleware.ts
│   ├── server-actions.ts (guards)
│   ├── prisma.ts
│   └── auth.ts (better-auth config)
└── middleware.ts
```

---

## shadcn/ui Installation

```bash
pnpm add next@15 react@19
pnpm dlx shadcn-ui@latest init

# Select components as needed:
pnpm dlx shadcn-ui@latest add form
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add table
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add alert
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add badge
```

---

## Example: Full Loan Application Flow (Server Action)

### Page: app/dashboard/loans/apply/page.tsx
```typescript
import { applyForLoan } from "@/app/actions/loans"
import { LoanForm } from "@/app/components/loans/LoanForm"

export default async function ApplyForLoanPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Apply for Loan</h1>
      <LoanForm action={applyForLoan} />
    </div>
  )
}
```

### Component: app/components/loans/LoanForm.tsx
```typescript
"use client"

import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loanSchema = z.object({
  amount: z.string().pipe(z.coerce.number().positive()),
  guarantor1Id: z.string().min(1),
  guarantor2Id: z.string().min(1),
})

export function LoanForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: { amount: "", guarantor1Id: "", guarantor2Id: "" }
  })

  async function onSubmit(data: z.infer<typeof loanSchema>) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => formData.append(key, String(val)))
    
    try {
      await action(formData)
      router.push("/dashboard/loans")
    } catch (err) {
      form.setError("root", { message: (err as Error).message })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount to Borrow</FormLabel>
            <FormControl>
              <Input type="number" placeholder="50000" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Guarantor selects... */}
      
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Applying..." : "Apply"}
      </Button>
    </form>
  )
}
```

### Server Action: app/actions/loans.ts
```typescript
"use server"

import { protectAction } from "@/lib/server-actions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function applyForLoan(formData: FormData) {
  const session = await protectAction(formData.get("cooperativeId") as string)
  
  const amount = formData.get("amount")
  const guarantor1Id = formData.get("guarantor1Id")
  const guarantor2Id = formData.get("guarantor2Id")
  
  // Validate guarantors
  if (guarantor1Id === session.user.id || guarantor2Id === session.user.id) {
    throw new Error("Cannot be your own guarantor")
  }
  
  // Create loan + guarantor records in transaction
  const loan = await prisma.$transaction(async (tx) => {
    const application = await tx.loanApplication.create({
      data: {
        cooperativeId: parseInt(formData.get("cooperativeId") as string),
        userId: session.user.id,
        amountRequested: amount as string,
        status: "PENDING_GUARANTORS"
      }
    })
    
    await tx.loanGuarantor.createMany({
      data: [
        { loanId: application.id, guarantorId: guarantor1Id as string },
        { loanId: application.id, guarantorId: guarantor2Id as string }
      ]
    })
    
    await tx.event.create({
      data: {
        cooperativeId: parseInt(formData.get("cooperativeId") as string),
        eventType: "loan_application_submitted",
        actorId: session.user.id,
        entityType: "loan",
        entityId: application.id,
        data: { amount, guarantorIds: [guarantor1Id, guarantor2Id] }
      }
    })
    
    return application
  })
  
  revalidatePath("/dashboard/loans")
  return loan
}
```

---

## Testing with shadcn/ui

```typescript
// app/__tests__/loans.test.ts
import { applyForLoan } from "@/app/actions/loans"

describe("Loan Application", () => {
  it("should create loan with 2 guarantors", async () => {
    const formData = new FormData()
    formData.append("amount", "50000")
    formData.append("guarantor1Id", "user-2")
    formData.append("guarantor2Id", "user-3")
    formData.append("cooperativeId", "1")
    
    const result = await applyForLoan(formData)
    expect(result.status).toBe("PENDING_GUARANTORS")
  })
})
```

---

## Success Criteria

When complete, you should be able to:
1. ✅ Sign up as user, choose cooperative
2. ✅ Apply for loan with 2 guarantors
3. ✅ Guarantors accept/reject
4. ✅ Admin approves/rejects loans
5. ✅ Members upload contribution receipts
6. ✅ Admin verifies contributions
7. ✅ Pull financial reports for AGM
8. ✅ Audit log shows all actions (compliance)
9. ✅ No data leaks between cooperatives
10. ✅ Users can't access other cooperatives' data

---

## Notes for Claude Code

- **Use shadcn/ui components** for all UI (Form, Button, Card, Table, Dialog, etc.)
- **Server Actions preferred** for mutations (form submissions, approvals, etc.)
- **API routes only for** webhooks (Stripe) and complex real-time logic
- **Type-safe forms** with react-hook-form + zod validation
- **Revalidate paths** after Server Actions to update UI
- **Error handling:** Throw errors in Server Actions, catch in components
- **Database transactions** for multi-step operations (loans, approvals)
- **All endpoints protected** via middleware guards before Server Actions execute
- **File uploads:** Use native `<input type="file">` with shadcn Form or custom component
- Next.js 15 features: App Router, Server Actions, revalidateTag, unstable_cache
```

---

Done. This spec now includes:
- ✅ shadcn/ui components
- ✅ Server Actions (Next.js 15)

---

## Phase 6: Gaps & Hardening

### Bugs

**TREASURER locked out of admin routes**
- `AdminLayout` only admits `ADMIN` and `OWNER`; TREASURER cannot reach `/admin/contributions` or `/admin/reports` even though those pages allow them
- Fix: extend layout role check to include `TREASURER`; individual pages already enforce their own permissions

**No edge-level route protection**
- Auth guards live inside each page/layout. A `middleware.ts` at the project root intercepts unauthenticated requests before any server component runs
- Fix: add `middleware.ts` — check for `better-auth.session_token` cookie, redirect to `/auth/signin` if missing on protected routes

**No mobile navigation**
- Sidebar is `hidden md:block`; mobile users have no navigation
- Fix: add a slide-up bottom nav bar on mobile with primary member + admin links

### Missing Features

**Forgot password / password reset**
- Invited members get a temp password but have no way to reset it
- Requires `emailAndPassword.sendResetPassword` in auth config + two new pages: `/auth/forgot-password` and `/auth/reset-password`

**Account settings**
- No page to change name or password after signing in
- Implement via better-auth's `updateUser` and `changePassword` APIs

**Cooperative creation UI**
- Cooperatives are seeded manually; no onboarding flow for new customers
- Add `/cooperatives/new` — takes cooperative name + first user details, creates Cooperative + OWNER user in one transaction

**Stripe billing**
- Spec requirement: £500/year per cooperative
- Scaffold: checkout on cooperative creation, webhook handler for subscription events, billing portal link in dashboard

### Cleanup

**Dead routes**
- `/login`, `/signup`, `/test`, `/api/admin/dashboard`, `/api/member/dashboard` are bootstrap stubs with no purpose
- Delete them

**Report CSV export**
- Reports are browser-only; AGM submissions need downloadable files
- Add CSV download endpoint for financial summary and dividend snapshot
- ✅ App Router patterns
- ✅ Full examples