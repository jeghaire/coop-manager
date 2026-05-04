# Contributions

## Overview

A contribution is a monetary deposit a member makes into the cooperative pool. Contributions are the foundation of a member's financial standing within the cooperative: they determine borrowing capacity, guarantee eligibility, and form the basis for dividend allocation.

### Why Contributions Matter

- **Borrowing capacity** is calculated directly from a member's total verified contributions: `borrowing capacity = total verified contributions × borrowing multiplier` (default multiplier: 3×, configurable by the cooperative owner). See [Loans](08_FEATURE_LOANS.md) for full eligibility rules.
- **Dividend share** is proportional to a member's contribution percentage relative to the total pool. See [Dividends](09_FEATURE_DIVIDENDS.md) for how distributions are calculated.
- Only **VERIFIED** contributions count toward any of the above. Pending and rejected contributions have no effect on a member's financial position.

### Contribution Statuses

| Status | Meaning |
|---|---|
| `PENDING_VERIFICATION` | Submitted by the member; awaiting admin or treasurer review |
| `VERIFIED` | Approved; counts toward borrowing capacity and dividends |
| `REJECTED` | Declined by admin with a stated reason; does not count toward balance |

> **Prerequisite:** Only VERIFIED members can submit contributions. See [Member Verification](06_FEATURE_MEMBER_VERIFICATION.md).

---

## Submitting a Contribution — Member Flow

### Step-by-Step

1. Sign in and navigate to **Dashboard** → **Contributions**
2. Click **Submit New Contribution** (or navigate directly to `/dashboard/contributions/submit`)
3. Enter the **amount** you are contributing (must be greater than zero)
4. Select your **payment method** (see [Payment Methods Explained](#payment-methods-explained) below)
5. Optionally upload a **receipt** as proof of payment (strongly recommended — see [Receipt Upload](#receipt-upload-technical-details))
6. Click **Submit**

After submission:

- Your contribution appears in your contribution history with status `PENDING_VERIFICATION`
- The cooperative's admins and treasurer are notified that a new contribution is awaiting review
- You will receive a confirmation once an admin verifies or rejects it

> **Note:** Submitting a contribution does not immediately affect your borrowing capacity. It only takes effect once an admin marks it as VERIFIED.

---

## Payment Methods Explained

| Method | When to Use | Notes |
|---|---|---|
| **Bank Transfer** | You transferred funds electronically to the cooperative's bank account | Use the cooperative's bank details shown on the submit form. Upload the bank transfer receipt as proof. |
| **Mobile Money** | You paid via a mobile payment service (e.g., OPay, MTN MoMo, Palmpay) | Upload the mobile payment confirmation screenshot as your receipt. |
| **Cash** | You handed physical cash directly to the treasurer or a designated collection point | The treasurer typically records cash payments manually (see [Manual Entry by Treasurer](#manual-entry-by-treasurer)). If recording yourself, attach a signed acknowledgement slip if available. |
| **Direct Payment** | Internal use only — used by the treasurer when entering a contribution on a member's behalf | This option is not selectable by regular members. It appears only in the admin/treasurer recording flow. |

### Cooperative Bank Accounts

The cooperative's bank account details are shown on the contribution submission page. If multiple bank accounts are configured, the preferred account is highlighted. Contact your treasurer if you are unsure which account to use.

---

## Receipt Upload Technical Details

### Accepted File Formats

| Format | MIME Type | Notes |
|---|---|---|
| JPEG | `image/jpeg` | Standard photo from phone camera |
| PNG | `image/png` | Screenshot or scanned image |
| WEBP | `image/webp` | Modern image format supported by most browsers |
| PDF | `application/pdf` | Bank statement page, official receipt document |

### How the Upload Works

Receipt upload is handled directly between your browser and AWS S3, without the file passing through the application server. This keeps uploads fast and reduces server load.

The technical flow (simplified for users):

1. You select a file using the file picker in the contribution form
2. The app requests a temporary, secure upload permission from the server (`/api/receipts/presign`)
3. Your browser sends the file directly to S3 using that temporary permission
4. Once the upload completes, the form records the file's location reference (not a copy of the file itself)
5. When you submit the form, the server stores the file reference and derives the permanent public URL

From your perspective: select the file, wait for the upload indicator to complete, then submit the form as normal.

### File Storage

Receipts are stored in an S3-compatible bucket. The stored information includes:

| Field | Description |
|---|---|
| Receipt URL | Public link to view the file (used by admins for review) |
| Receipt key | Internal S3 object path (`receipts/YYYY/MM/timestamp-hex.ext`) |
| File name | Original filename as selected on your device |
| File size | Size in bytes |
| File type | MIME type of the uploaded file |
| Uploaded at | Timestamp of when the S3 upload completed |

### Receipt Upload Is Optional

You can submit a contribution without a receipt. However, admins are more likely to verify contributions promptly when a receipt is provided. Without a receipt, the admin must rely on matching the amount and payment date against the cooperative's own bank records.

---

## Contribution Verification — Admin and Treasurer Flow

Admins and treasurers review pending contributions at **Admin** → **Contributions**, which defaults to the **Pending** tab.

### What Admins See

For each pending contribution:

- Member's full name
- Amount submitted
- Payment method selected
- Date the contribution was submitted
- Receipt attachment (if provided)

### Viewing Receipts

| Receipt Type | How It Displays |
|---|---|
| JPEG / PNG / WEBP | Inline image thumbnail in the contribution row; click to open full size in a new tab |
| PDF | Document icon in the contribution row; click to open the PDF in a new tab |
| No receipt | No attachment indicator shown |

### Approving a Contribution

1. Review the member's details and receipt
2. Confirm the payment against your records (bank statement, mobile money history, cash register, etc.)
3. Click **Verify**

On approval:

- Status changes to `VERIFIED`
- The contribution is added to the member's total verified contributions
- Borrowing capacity is recalculated immediately
- The member receives an **email notification** and an **SMS notification** (if phone number is on file and SMS is enabled)
- An audit event (`contribution_verified`) is written to the Event log

### Rejecting a Contribution

1. Click **Reject** on the contribution row
2. Enter a **rejection reason** (required — the member will see this reason)
3. Confirm the rejection

On rejection:

- Status changes to `REJECTED`
- `rejectionCount` is incremented by 1 (visible to admins for tracking repeated issues)
- `rejectionReason` is stored and shown to the member
- The member receives an **email notification** with the reason included
- An audit event (`contribution_rejected`) is written to the Event log

> **Security guard:** An admin or owner cannot verify their own contribution. If a contribution is submitted by the logged-in admin, the Verify button is disabled for that record. Another admin or owner must review it.

---

## Manual Entry by Treasurer

Treasurers and admins can record a contribution on behalf of a member — for example, when a member pays cash and does not have access to the app.

### Step-by-Step

1. Navigate to **Admin** → **Contributions** → **Record for Member**
2. Select the member from the dropdown
3. Enter the contribution amount
4. Add an internal note (optional but recommended for audit purposes)
5. Select payment method (typically **Cash** or **Direct Payment**)
6. Click **Record**

### Key Differences from Member-Submitted Contributions

| Aspect | Member Submission | Treasurer Manual Entry |
|---|---|---|
| Initial status | `PENDING_VERIFICATION` | `VERIFIED` (auto-approved immediately) |
| Receipt required | No (recommended) | No |
| Who submits | The member | Admin or Treasurer |
| Counts toward borrowing capacity | Only after verification | Immediately |

### Self-Entry Prevention

A treasurer or admin **cannot record a contribution for themselves**. If you are logged in as an admin and attempt to record a contribution for your own account, the action is blocked. Another admin or the owner must record it, or you can submit it through the standard member flow (where it will go through the normal pending → verified workflow).

---

## Rejection Workflow — Member Perspective

When a contribution is rejected:

1. You receive an email with the rejection reason
2. The contribution appears in your history at `/dashboard/contributions` with a **Rejected** badge and the reason displayed
3. You **cannot edit** the rejected contribution
4. To address the issue, **submit a new contribution** — correct the amount or payment method based on the feedback provided, and upload an accurate receipt

Your `rejectionCount` is tracked internally by admins. Multiple rejections on your account may prompt a conversation with your treasurer to resolve recurring discrepancies.

---

## Contribution History

All your contributions — regardless of status — are visible at `/dashboard/contributions`.

### What You See

- Amount for each contribution
- Payment method used
- Date submitted
- Current status with a colour-coded badge:
  - Grey — `PENDING_VERIFICATION`
  - Green — `VERIFIED`
  - Red — `REJECTED`
- Rejection reason (displayed inline for rejected entries)

---

## Impact on Borrowing Capacity

Only **VERIFIED** contributions contribute to your borrowing capacity. The formula is:

```
Borrowing Capacity = Total Verified Contributions × Borrowing Multiplier
```

The default multiplier is **3×** and is configurable by the cooperative owner. For example, if your total verified contributions are ₦50,000 and the multiplier is 3×, your borrowing capacity is ₦150,000.

Your current borrowing capacity, along with a breakdown of contributions, is shown on the **Financial Summary** page at `/dashboard/financial-summary`.

| Contribution Status | Counts Toward Borrowing Capacity? |
|---|---|
| `PENDING_VERIFICATION` | No |
| `VERIFIED` | Yes |
| `REJECTED` | No |

> See [Loans](08_FEATURE_LOANS.md) for the full set of loan eligibility conditions, including active loan balance deductions from available borrowing capacity.

---

## Filter Tabs — Admin View

The admin contributions page at **Admin** → **Contributions** provides four filter tabs with live counts:

| Tab | Shows |
|---|---|
| **ALL** | Every contribution across all members |
| **PENDING** | Contributions awaiting verification (the default view) |
| **VERIFIED** | All approved contributions |
| **REJECTED** | All rejected contributions |

Live counts next to each tab update in real time so admins can see at a glance how many items need attention. The **PENDING** tab is the primary working view for day-to-day contribution management.

Admins can also view the full contribution history for a specific member by navigating to **Admin** → **Members** → selecting a member → **Contribution History**.
