# 18 — Security

This document describes the security architecture of the Cooperative Manager application: how authentication works, how access is controlled, the fraud-prevention controls built into financial operations, and the practices that protect member data at rest and in transit.

---

## Authentication Security

### Password Handling

Authentication is provided by [Better Auth](https://better-auth.com). Passwords are hashed with bcrypt before storage. The raw password is never persisted anywhere in the system — the `passwordHash` column in the `user` table stores only the bcrypt digest. There is no endpoint that can return or expose a plaintext password.

A minimum password length of 8 characters is enforced at the library level (`minPasswordLength: 8`).

### Email Verification

New accounts require email verification before they can sign in. Better Auth sends a verification link via Resend. Links expire and cannot be replayed. This prevents account creation with addresses the registrant does not control.

### Session Management

Sessions are stored in PostgreSQL (the `session` table), not in self-contained JWTs. This is a deliberate security choice:

- Sessions can be revoked immediately by deleting the row — there is no "wait for the token to expire" window.
- The session token is sent to the browser as an `httpOnly` cookie. JavaScript running in the page cannot read it.
- In production (`NODE_ENV=production`), Better Auth sets the `Secure` flag so the cookie is only transmitted over HTTPS.
- The `SameSite` attribute is set by Better Auth to protect against cross-site request forgery (CSRF).

Sessions expire after 30 days (`expiresIn: 30 * 24 * 60 * 60` seconds). Cookie caching is explicitly disabled because Prisma `Decimal` fields cannot pass `structuredClone`, which Better Auth uses internally when building the cache cookie.

### Password Reset

Password reset links are sent by email and expire after one hour. The reset flow is handled entirely by Better Auth; no reset tokens are stored in application code.

---

## Authorization Model

### Role-Based Access Control

Every user belongs to exactly one cooperative and has exactly one role. Roles are ordered from least to most privileged:

| Capability | MEMBER | TREASURER | ADMIN | OWNER |
|---|:---:|:---:|:---:|:---:|
| View own contributions | Yes | Yes | Yes | Yes |
| Submit a contribution | Yes | Yes | Yes | Yes |
| Apply for a loan | Yes | Yes | Yes | Yes |
| Act as loan guarantor | Yes | Yes | No | No |
| View own loan history | Yes | Yes | Yes | Yes |
| View all members | No | Yes | Yes | Yes |
| Record contribution for another member (auto-verified) | No | Yes | Yes | Yes |
| Record loan repayment for another member | No | Yes | Yes | Yes |
| Verify / reject a pending contribution | No | Yes | Yes | Yes |
| Approve / reject a loan application | No | No | Yes | Yes |
| Invite or import members | No | No | Yes | Yes |
| Verify / suspend member accounts | No | No | Yes | Yes |
| Post announcements | No | No | Yes | Yes |
| Create and distribute dividends | No | No | Yes | Yes |
| Approve withdrawal requests | No | No | Yes | Yes |
| View audit event log | No | No | Yes | Yes |
| View notification log | No | No | Yes | Yes |
| Manage bank accounts | No | No | Yes | Yes |
| Configure loan settings and currency | No | No | No | Yes |
| Change cooperative settings (guarantor mode, multiplier) | No | No | No | Yes |
| Assign ADMIN role to members | No | No | No | Yes |
| Change any member's role | No | No | No | Yes |

Admins and Owners cannot be selected as loan guarantors — the `applyForLoan` action explicitly filters them out:

```
role: { notIn: ["ADMIN", "OWNER"] }
```

### `protectAdminAction(cooperativeId)`

Every server action that modifies shared cooperative data calls `protectAdminAction(cooperativeId)`. This function performs three checks in sequence:

1. **Session check** — calls `requireAuth()`. If there is no valid session, it throws an Unauthorized error. Unauthenticated requests cannot proceed.

2. **Role check** — reads `session.user.role`. If the role is not `ADMIN`, `OWNER`, or `TREASURER` (depending on context), it throws a Forbidden error.

3. **Cooperative membership check** — fetches the user record from the database and compares `user.cooperativeId` against the `cooperativeId` argument. If they do not match, it throws a Forbidden error.

This three-step guard means that even if an attacker somehow obtains a valid session token for a different cooperative, the cooperative membership check at the database level will block the request.

### `requireAuth()`

`requireAuth()` is the baseline guard used on every authenticated endpoint. It calls Better Auth's `getSession()` against the current request headers and throws an `Error("Unauthorized")` if no valid session exists. Server actions that do not modify administrative data (e.g., submitting a contribution, applying for a loan) use `requireAuth()` or `protectVerifiedAction()` instead of `protectAdminAction()`.

### `requireVerified()` and `protectVerifiedAction(cooperativeId)`

Members must be verified by an admin before they can access financial features. `requireVerified()` checks `user.verifiedAt` for any user whose role is `MEMBER`. Non-member roles (TREASURER, ADMIN, OWNER) bypass this check. `protectVerifiedAction(cooperativeId)` combines the cooperative membership check with the verification check.

---

## Self-Approval Prevention (Anti-Fraud Controls)

Small cooperatives are particularly vulnerable to insider fraud because the same person may hold both a staff role and a member account. The application enforces four hard stops that prevent any single person from approving their own financial transactions.

### 1. Own Loan Approval Blocked

`reviewLoan` checks `loan.userId === session.user.id` and returns the error:

> "You cannot approve your own loan application."

An admin who applied for a loan before being promoted, or who holds a member account in addition to an admin account, cannot approve their own application.

### 2. Own Repayment Recording Blocked

`recordRepaymentForMember` checks `loan.userId === session.user.id` and returns:

> "You cannot record a repayment for your own loan. Use the member repayment form instead."

An admin or treasurer cannot record off-system repayments against their own loan. They must use the standard member repayment form, which creates an unverified record visible to other admins.

### 3. Own Contribution Recording Blocked

`recordContributionForMember` checks `memberId === session.user.id` and returns:

> "You cannot record a contribution for yourself. Submit it as a member instead."

Treasurer-recorded contributions are auto-verified (bypassing the normal verification queue). This guard ensures a treasurer cannot silently credit themselves.

### 4. Own Contribution Verification Blocked

`verifyContribution` checks `contribution.userId === session.user.id` and returns:

> "You cannot verify your own contribution."

This prevents a member with an admin role from submitting a contribution and then verifying it themselves, bypassing the two-person verification requirement.

### Why These Controls Matter

In a cooperative where the same small group of people fills multiple roles (treasurer, administrator, member), the technical controls above replace the segregation of duties that larger organisations achieve through headcount. Every financial event that passes through the system has a documented actor, and no actor can complete a financial cycle entirely on their own behalf.

---

## Multi-Tenancy Isolation

### CooperativeId Comes from the Session, Not the Request

The application serves multiple cooperatives from a single deployment. Every piece of member data — contributions, loans, repayments, bank accounts, announcements — is scoped to a `cooperativeId`.

Critically, `cooperativeId` is never read from the URL, query string, or request body for authoritative purposes. It is always sourced from `session.user.cooperativeId`, which is stored in the server-side session record in PostgreSQL and cannot be tampered with by the client.

For example, in `applyForLoan`:

```ts
const cooperativeId = session.user.cooperativeId as string;
```

Not:

```ts
const cooperativeId = formData.get("cooperativeId"); // NEVER trusted for access control
```

### Database Queries Always Filter by CooperativeId

Every Prisma query that returns cooperative data includes `where: { cooperativeId }` sourced from the session. There is no code path that returns data across cooperative boundaries.

The `protectAdminAction(cooperativeId)` function performs an additional sanity check: even when a `cooperativeId` is passed in (e.g., from a settings form), it is verified against the database record for the authenticated user before any mutation is performed.

### What Happens If CooperativeId Is Tampered

If a malicious actor crafts a request with a different `cooperativeId` in the form body:

1. `protectAdminAction(cooperativeId)` fetches the user from the database.
2. It compares `user.cooperativeId` (from the database) against the supplied `cooperativeId`.
3. If they do not match, it throws `"Forbidden: Access denied to this cooperative"`.

The attack fails at the guard layer before any database read or write occurs.

---

## Data Protection

### PII Storage

Personally identifiable information is stored in the `user` table:

- `name` — full name
- `email` — unique, used for login and notifications
- `phoneNumber` — optional, used for SMS notifications
- `passwordHash` — bcrypt digest only; plaintext never stored

The `user` table is scoped to a cooperative via `cooperativeId`. Users in different cooperatives have no shared data and cannot see each other.

### Soft Deletes

Records are never permanently deleted. The `deletedAt` field is set on soft-deleted users, loans, contributions, and withdrawal requests. This ensures financial history is retained for audit and compliance purposes. All queries filter `where: { deletedAt: null }` to exclude soft-deleted records from normal operations.

### Receipt File Storage (AWS S3)

Contribution receipts are stored in S3 with unpredictable object keys generated by `buildReceiptKey()`:

```
receipts/{year}/{month}/{timestamp}-{4-byte-random-hex}.{ext}
```

The random hex component (from `crypto.getRandomValues`) makes receipt URLs non-enumerable. An attacker cannot guess or iterate the URLs of other members' receipts.

Receipt URLs are currently public (accessible without authentication via the S3 bucket URL). If your cooperative requires stricter access control, the `generatePresignUrl` function can be used to serve time-limited signed GET URLs instead of public URLs.

### Audit Trail

Every significant action writes an `Event` record to the database, including the actor's ID and role, the entity affected, and a JSON payload with the relevant data. This log cannot be altered by application users and serves as the immutable audit trail for all financial events.

---

## Input Validation

All server actions validate input before writing to the database.

### Amount Fields

```ts
const amount = parseFloat(amountStr);
if (isNaN(amount) || amount <= 0) {
  return { error: "Amount must be a positive number." };
}
```

Amounts are parsed with `parseFloat`, checked for `NaN`, and required to be strictly positive. This prevents zero-amount records and non-numeric injection.

### Enum Fields

Enum values (payment method, loan decision, guarantor response, guarantor coverage mode) are validated against an explicit allow-list before use:

```ts
const VALID_PAYMENT_METHODS = ["BANK_TRANSFER", "MOBILE_MONEY", "CASH"] as const;
if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
  return { error: "Invalid payment method." };
}
```

### String Fields

All string inputs are trimmed before use. Required fields are checked for empty strings. Fields with length constraints (e.g., rejection reasons) are validated before storage.

### SQL Injection Prevention

The application uses Prisma ORM exclusively for database access. Prisma parameterizes all queries — user-supplied values are never interpolated into raw SQL strings.

---

## API Security

### No Unauthenticated Endpoints

All Next.js route handlers and server actions require a valid session. There are no public data endpoints. The presign endpoint (`/api/receipts/presign`) calls `requireAuth()` as its first operation and returns `401 Unauthorized` if no session is present.

### Presign Endpoint Validation

Before generating a presigned S3 upload URL, the presign endpoint validates both the file extension and MIME type against an explicit allow-list:

```ts
const VALID_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "pdf", "heic", "heif", "webp"]);
const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp",
                              "application/pdf", "image/heic", "image/heif"]);
```

Both must pass for a URL to be generated. This prevents uploading arbitrary file types to the S3 bucket.

### Cron Endpoint

The overdue loan check endpoint (`/api/cron/check-overdue`) requires a `CRON_SECRET` header:

```ts
const auth = request.headers.get("authorization");
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

Without this header, the endpoint returns `401`. This prevents external parties from triggering the overdue notification loop.

### Stripe Webhook Security

The Stripe webhook endpoint verifies the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET` before processing any billing event. Unverified webhook requests are rejected.

---

## Environment Variable Security

### What Is Sensitive

| Variable | Why It Is Sensitive |
|---|---|
| `DATABASE_URL` | Full database access including all member data |
| `BETTER_AUTH_SECRET` | Used to sign/verify session tokens — compromise allows session forgery |
| `STRIPE_SECRET_KEY` | Billing API access — can create charges and read payment data |
| `STRIPE_WEBHOOK_SECRET` | Validates incoming Stripe events — compromise allows fake billing events |
| `RESEND_API_KEY` | Can send email as your domain |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 bucket access — read and write all receipts |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Can send SMS and read message history |

### Storage Rules

- The `.env` file is listed in `.gitignore` and must never be committed to version control.
- In production (Vercel), secrets are stored in Project Settings → Environment Variables, encrypted at rest by Vercel.
- `.env.example` contains only placeholder values and is safe to commit. It documents required variables without exposing real secrets.

### BETTER_AUTH_SECRET Rotation

If the auth secret is compromised:

1. Generate a new secret (minimum 32 random characters): `openssl rand -hex 32`
2. Update the value in Vercel Environment Variables.
3. Redeploy the application.
4. All existing sessions are immediately invalidated — all users must sign in again. This is intentional and is the correct response to a secret compromise.

---

## Security Checklist for Admins

Cooperative administrators should perform the following checks regularly:

- [ ] Review the member list for accounts you do not recognise. Remove or suspend any unauthorised accounts via Admin → Members.
- [ ] Check that only trusted people hold the ADMIN or OWNER role. Demote any accounts that no longer need elevated access.
- [ ] Review the audit event log (Admin → Events) for unexpected actions: large contributions from unfamiliar accounts, loan approvals outside normal business hours, setting changes you did not make.
- [ ] Check the notification log (Admin → Notifications) for delivery failures — repeated failures to a member's email or phone may indicate stale contact details.
- [ ] Ensure at least one backup admin exists. If the sole Owner account is compromised or inaccessible, no one else can change roles.
- [ ] Periodically rotate the `BETTER_AUTH_SECRET` as described above, especially if any team member with access to production environment variables leaves the organisation.
- [ ] Review pending contributions regularly. Contributions that sit in `PENDING_VERIFICATION` for extended periods represent an unresolved reconciliation gap.
