# Member Verification

## Why Verification Exists

Member verification is a deliberate access-control gate between signing up and gaining full cooperative membership. It serves three purposes:

1. **Financial access control** — prevents anyone who creates an account from immediately applying for loans or viewing the member list; the cooperative needs to confirm the person is a legitimate member before granting financial privileges
2. **Identity confirmation** — ensures an administrator has acknowledged the person and their identity before they can interact with cooperative finances
3. **Regulatory compliance** — Nigerian savings and credit cooperatives are subject to oversight requirements; having an auditable record of who approved each member, and when, supports compliance reporting

> **Related:** See [Authentication](05_FEATURE_AUTHENTICATION.md) for how sign-in and sessions work. See [Loans](08_FEATURE_LOANS.md) for how verification affects loan eligibility.

---

## The Two Tiers

### UNVERIFIED — Limited Access

A member is UNVERIFIED from the moment they sign up until an admin or owner manually approves them.

**What an UNVERIFIED member CAN do:**

- Sign in and maintain a session
- View their own profile (`/dashboard/profile`)
- View their own contribution balance (will show ₦0 until contributions are both submitted and verified)
- View notification preferences at `/dashboard/settings/notifications`

**What an UNVERIFIED member CANNOT do:**

- Apply for loans
- View the member list
- Submit contributions
- View the financial summary or transaction history
- Access admin features
- Act as a loan guarantor

An UNVERIFIED member who signs in is redirected to `/dashboard/verify-pending`, which displays a message explaining that their account is awaiting approval.

### VERIFIED — Full Access

Once an admin or owner approves the account, the member's `verifiedAt` timestamp is set and their role status updates to VERIFIED.

**What a VERIFIED member CAN do:**

- Access the full dashboard
- Submit contributions with optional receipt upload
- Apply for loans (subject to borrowing capacity)
- View the member list and cooperative announcements
- Act as a guarantor on another member's loan application
- View their financial summary and full transaction history
- Request withdrawals (when available)
- Download their member financial statement as a PDF

---

## Access Comparison Table

| Feature | UNVERIFIED | VERIFIED |
|---|---|---|
| Sign in | Yes | Yes |
| Own profile | Yes | Yes |
| Own balance | Yes (shows ₦0) | Yes |
| Notification settings | Yes | Yes |
| Full dashboard | No | Yes |
| Submit contributions | No | Yes |
| Apply for loans | No | Yes |
| View member list | No | Yes |
| Act as guarantor | No | Yes |
| Financial summary | No | Yes |
| Transaction history | No | Yes |
| Withdrawal requests | No | Yes |
| Download PDF statement | No | Yes |

---

## Who Gets Auto-Verified

Certain roles bypass the manual verification queue entirely:

| Scenario | Role | Auto-Verified? |
|---|---|---|
| User creates a new cooperative | OWNER | Yes — immediately on signup |
| Admin invites or promotes a member to ADMIN | ADMIN | Yes |
| Admin invites or promotes a member to TREASURER | TREASURER | Yes |
| Member joins an existing cooperative | MEMBER | No — requires manual approval |

The OWNER is auto-verified because they created the cooperative and are by definition a legitimate member. ADMIN and TREASURER roles are granted by the OWNER or an existing ADMIN, so their identity has already been implicitly confirmed through that role assignment.

---

## Verification Workflow — Admin Side

### Step-by-Step

1. Sign in as OWNER, ADMIN, or TREASURER with sufficient permissions
2. Navigate to **Admin** in the sidebar
3. Select **Members** → **Unverified**
4. The unverified queue lists all pending members with:
   - Full name
   - Email address
   - Date they joined (account creation timestamp)
5. Review the member's details
6. Click **Verify** to approve, or take no action to leave them in the queue
7. To decline, leave the member in the queue or remove their account if necessary (there is no explicit "decline" status — unverified members simply remain pending)

### What Happens Immediately on Verification

- The member's `verifiedAt` timestamp is written to the database
- The approving admin's user ID is stored as `verifiedBy`
- An **email notification** is sent to the member informing them their account is approved
- An **SMS notification** is sent if the member has a phone number on file and SMS notifications are enabled
- An audit event (`member_verified`) is logged in the Event table with the admin's ID

---

## What Triggers Verification

Verification is **always manual** for standard MEMBER accounts. There is no automatic approval based on time, payment, or any other condition. The queue at Admin → Members → Unverified is the only place from which a MEMBER account can be verified.

The only exception is the auto-verification paths described above (OWNER on cooperative creation; ADMIN/TREASURER via role assignment).

---

## Verification Data Stored

When a member is verified, the following fields are written to their User record:

| Field | Description |
|---|---|
| `verifiedAt` | Timestamp of when the verification occurred |
| `verifiedBy` (stored as `verifiedByUserId` on related records) | User ID of the admin who performed the verification |

This data appears in the audit trail (`/admin/reports` → Audit Trail tab) and can be used in compliance reports.

---

## Impact on Member Access — Detailed

### Loans

An UNVERIFIED member cannot visit the loan application page. Even if they navigate directly to `/dashboard/loans/apply`, the server-side check will block the request. See [Loans](08_FEATURE_LOANS.md) for full eligibility rules.

### Contributions

An UNVERIFIED member cannot submit a contribution. Their balance shows ₦0 because no verified contributions exist, and they cannot take steps to build that balance until verification is complete.

### Guarantor Requirement

Only VERIFIED members can act as guarantors on loan applications. This is enforced at the point of loan submission — if a nominated guarantor is unverified, the application cannot proceed. See [Loans](08_FEATURE_LOANS.md) for guarantor coverage rules.

### Borrowing Capacity

Because borrowing capacity is calculated from verified contributions, and because UNVERIFIED members cannot submit contributions, their borrowing capacity is always zero until both verification and contribution verification have occurred.

---

## Common Issues

### Member Says They Cannot Access Features

1. Go to **Admin** → **Members** → **Unverified** and search for the member by name or email
2. If they appear in the unverified queue, they have not been approved yet — click **Verify** to approve them
3. If they do not appear in the unverified queue, check the full member list under **Admin** → **Members** — they may already be verified; if so, the access issue may be caused by something else (e.g., session expiry — ask them to sign out and back in)

### Admin Cannot Find a Member in the Unverified Queue

Possible reasons:

- The member has already been verified by another admin — check the full member list
- The member's account was deleted
- The member signed up with a different email address than expected — search by partial name

### Member Did Not Receive a Notification After Being Verified

1. Check that the member's email address is correct in their profile
2. Confirm the member has not disabled email notifications (`/dashboard/settings/notifications`)
3. Ask the member to check their spam/junk folder
4. For SMS: confirm the member has a phone number on file and SMS notifications enabled
5. If notifications are consistently failing, check the Notification audit log under **Admin** → **Reports** → Audit Trail, filtering for `notification_failed` events

### Member Was Verified but Still Sees the Pending Page

Ask the member to sign out and sign back in. The session may be caching the old verification state. After a fresh sign-in the redirect logic will re-evaluate their status and route them to the full dashboard.
