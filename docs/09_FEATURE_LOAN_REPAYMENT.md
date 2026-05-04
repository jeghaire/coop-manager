# Feature: Loan Repayment

> Related docs: [08_FEATURE_LOANS.md](./08_FEATURE_LOANS.md) | [10_FEATURE_WITHDRAWALS.md](./10_FEATURE_WITHDRAWALS.md)

---

## 1. Overview

Once a loan is approved, repayment begins immediately. The total obligation (`totalAmountDue`) is fixed at the moment of approval using simple interest and does not change afterwards, regardless of how quickly or slowly the borrower pays. There is no compound interest and no early-repayment penalty.

Repayments can be recorded in two ways:

- **By the member themselves** — through the repayment form on the loan detail page.
- **By an admin or treasurer** — using the admin repayment entry panel on the same page.

Both paths write to the same `LoanRepayment` table and update the running balance identically. The loan is automatically marked **REPAID** the moment total payments reach (or exceed) `totalAmountDue`.

---

## 2. Understanding Your Loan Balance

When a loan is approved, three monetary values are locked in:

| Field | Description | Example |
|-------|-------------|---------|
| `amountRequested` | The principal — what you borrowed | ₦100,000 |
| `interestRate` | The rate at approval time | 10% |
| `totalAmountDue` | Principal + interest — total you must repay | ₦110,000 |

The **remaining balance** is not a stored field; it is always computed on the fly:

```
remaining = totalAmountDue − sum(all repayment amounts)
```

The loan detail page displays:
- **Principal** — original borrowed amount
- **Interest rate** — the rate applied (e.g., 10%)
- **Interest amount** — the monetary interest portion (e.g., ₦10,000)
- **Total Due** — the full repayment obligation
- **Amount Paid** — sum of all recorded payments to date
- **Remaining** — balance still owed
- **Monthly Due** — `totalAmountDue / repaymentMonths` (indicative; not a hard minimum)

A visual progress bar shows what percentage of the total has been paid.

---

## 3. Repayment Schedule

After approval the system generates a month-by-month repayment schedule based on the approval date and the configured `repaymentMonths`.

```
monthlyPayment = totalAmountDue / repaymentMonths
dueDate[n]     = approvedAt + n months   (n = 1, 2, … repaymentMonths)
```

**Example schedule** for ₦100,000 at 10% over 12 months:

| Month | Due date | Monthly due | Expected cumulative |
|-------|----------|-------------|---------------------|
| 1 | Month 1 after approval | ₦9,167 | ₦9,167 |
| 2 | Month 2 after approval | ₦9,167 | ₦18,334 |
| ... | ... | ₦9,167 | ... |
| 12 | Month 12 after approval | ₦9,167 | ₦110,000 |

The schedule is visible on the loan detail page at `/dashboard/loans/<id>`. Each row shows a status badge:

| Row status | Meaning |
|-----------|---------|
| **Paid** | At least the monthly due amount has been credited against this month |
| **Partial** | Some payment has been credited but less than the monthly amount |
| **Behind** | Due date has passed with no or insufficient payment |
| **Upcoming** | Due date is in the future |

### Flexibility

The monthly amount is **indicative, not enforced**. The system imposes no minimum payment and no penalty for paying more or less than the monthly due amount. You can:
- Pay the exact monthly amount each month.
- Pay larger lump sums to reduce the remaining balance and clear the loan early.
- Pay smaller amounts when funds are tight (the loan simply moves to BEHIND status until caught up).
- Pay the entire remaining balance in a single transaction to close the loan immediately.

---

## 4. Making a Payment (Member Flow)

### Navigation

**Dashboard → Loans → [select an active loan] → Make a Payment**

The payment section appears only when the loan is in `APPROVED` status and there is a remaining balance. Once the loan is REPAID, the section disappears.

### Split Payment Form

The member repayment form has two separate fields:

| Field | Name | Purpose |
|-------|------|---------|
| **Loan Repayment** | `loanAmount` | Reduces the loan balance |
| **Monthly Contribution (optional)** | `contributionAmount` | Creates a new VERIFIED contribution |

You do not need to fill both fields. Common patterns:

- **Loan only:** Fill `loanAmount`, leave `contributionAmount` empty.
- **Contribution only:** Leave `loanAmount` empty, fill `contributionAmount` (keep up contributions without reducing the loan balance this payment).
- **Split:** Fill both to make a loan payment and record a contribution in a single submission.

**Example — paying ₦15,000 split:**
- `loanAmount = 9,167` → reduces loan balance by ₦9,167
- `contributionAmount = 5,833` → creates a VERIFIED contribution of ₦5,833, which immediately increases borrowing capacity

### What Happens on Submit

Both transactions are recorded atomically in a single database transaction:

1. A `LoanRepayment` record is created with `paymentType: LOAN_REPAYMENT`.
2. If `contributionAmount > 0`, a `Contribution` record is created with `status: VERIFIED` and `paymentMethod: DIRECT_PAYMENT`, verified immediately (no admin action required).
3. The new running total is checked against `totalAmountDue`. If `totalPaid >= totalAmountDue`, the loan status is updated to `REPAID` and `repaidAt` is stamped.
4. Both the loan detail page and the loans list are refreshed.

If the submission fails (e.g., network error), neither transaction is committed — the balance is not partially updated.

---

## 5. Payment History

The loan detail page lists every recorded payment in reverse chronological order (most recent first when the API returns them ordered by `paidAt ASC`, displayed from oldest to newest). Each entry shows:

- Amount paid
- Date of payment
- Optional note (if recorded by an admin or treasurer)

This history is visible to both the member (for their own loans) and any admin/treasurer with access.

---

## 6. Partial Payments

Partial payments are fully supported. There is no minimum payment amount other than ₦0.01. When a partial payment is made:

- The remaining balance decreases by the exact amount paid.
- The repayment schedule computes which month(s) the payment credits against.
- If the payment does not fully cover a month's due amount, that month row shows **Partial** status.
- The loan stays in `APPROVED` status; it does not advance to REPAID until the full `totalAmountDue` is covered.

---

## 7. Overpayment Prevention

The system enforces a hard cap: no single payment may exceed the remaining balance.

Server-side check (member form):
```
if loanAmount > remaining + 0.01:
  return error("Payment of ₦X exceeds remaining balance of ₦Y.")
```

A tolerance of ₦0.01 is applied to prevent floating-point rounding from incorrectly blocking the final payment. If you attempt to pay more than the balance (e.g., you enter ₦10,000 when only ₦5,000 remains), the form returns an error and no payment is recorded. Adjust the amount to match or be less than the remaining balance.

---

## 8. Admin Recording Repayments

Admins and treasurers can record cash or offline payments on behalf of any member.

### Navigation

**Admin → Loans → [find the loan] → Record Repayment**

Alternatively, navigate to the member's loan detail page directly and use the admin panel (amber-bordered card labelled "Record Repayment").

### Who Can Record

- `ADMIN` role
- `OWNER` role
- `TREASURER` role

### Admin Repayment Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Amount | Yes | Must be > 0 and ≤ remaining balance |
| Note | No | Free text, e.g., "Cash received at office" |

### Self-Repayment Prevention

An admin cannot record a repayment for their own loan using the admin form. If `loan.userId === admin.id`, the action returns: `"You cannot record a repayment for your own loan. Use the member repayment form instead."` The admin must use the member repayment form at `/dashboard/loans/<id>` to pay their own loans.

### Audit Trail

Every admin-recorded repayment stores `recordedBy: admin.id` and the optional `note` in the `LoanRepayment` record. This creates a complete audit trail visible in payment history.

---

## 9. Loan Completion

A loan transitions to **REPAID** status automatically when:

```
sum(all LoanRepayment.amount where loanId = X) >= loan.totalAmountDue - 0.01
```

The `- 0.01` tolerance prevents floating-point arithmetic from leaving a loan permanently open due to sub-cent rounding.

When a loan is marked REPAID:

- `loan.status` → `REPAID`
- `loan.repaidAt` → current timestamp
- The repayment form is hidden from the loan detail page
- The loan moves from "active" to historical in all member-facing views
- Guarantors are implicitly released — their obligation was social/financial attestation only and ends with the loan

The loan record is retained permanently for audit and reporting purposes. It appears in the admin Loan Decisions report and can be included in CSV/PDF exports.

---

## 10. Payment Overdue Notifications

A scheduled cron job runs daily to detect overdue loans and notify borrowers.

### Schedule

The endpoint `GET /api/cron/check-overdue` is called by the scheduler (e.g., Vercel Cron) once per day at 08:00 UTC. It is protected by a `CRON_SECRET` bearer token.

### Logic

For each active (`APPROVED`, not `repaidAt`) loan:

1. Compute `calculateLoanHealth(totalAmountDue, totalPaid, approvedAt, repaymentMonths, gracePeriodDays)`.
2. Skip if health is `ON_TRACK` or `REPAID`.
3. Skip if `daysOverdue <= 0` (still within the grace period).
4. Check whether the borrower received a `PAYMENT_OVERDUE` notification within the last 23 hours — if yes, skip (de-duplication).
5. Send email + SMS notification containing:
   - Amount currently behind
   - Number of days overdue

### Notification Content

**Email subject:** "Loan payment overdue — action required"

**SMS:** `"[Cooperative name]: Loan payment [N] days overdue. Amount behind: ₦X. Please pay now."`

### Grace Period

The grace period (default 30 days, configurable per cooperative) determines how many days after a missed due date the loan is considered BEHIND vs. DEFAULTED. A loan in BEHIND status is still overdue from the system's perspective — the grace period only affects the health status label, not whether a notification fires.

---

## 11. Troubleshooting

### "Payment rejected — exceeds remaining balance"

The loan amount you entered is greater than the current remaining balance. Check the remaining balance shown above the form and enter an equal or lesser amount.

### "I made a payment but the balance looks wrong"

1. Refresh the page — balance is computed live on each page load.
2. Check Payment History to confirm the payment was recorded.
3. If the payment appears in history but the balance is unexpected, note that the balance is `totalAmountDue − sum(all payments)`. Verify that `totalAmountDue` (shown on the loan summary card) matches your expectation.
4. If you believe there is a discrepancy, contact your admin and provide the payment date and amount.

### "I paid the final balance but the loan is not marked REPAID"

This can happen if the total paid is fractionally less than `totalAmountDue` due to rounding. The system applies a ₦0.01 tolerance, so differences larger than that would prevent automatic closure. Contact your admin to record a small corrective payment to clear the balance.

### "The repayment form is not visible on my loan page"

The form only appears for loans in `APPROVED` status with a remaining balance > 0. Check the loan status badge:
- `PENDING_GUARANTORS` or `PENDING_ADMIN_REVIEW` — the loan is not yet active; no payments can be made yet.
- `REJECTED` — the loan was not approved; no repayment needed.
- `REPAID` — the loan is already fully paid.

### "I am an admin but I cannot record a repayment for my own loan"

This is intentional self-repayment prevention. Use the member repayment form by navigating to **Dashboard → Loans → [your loan]** and using the "Make a Payment" section.
