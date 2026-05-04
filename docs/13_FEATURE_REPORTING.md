# Reporting and Analytics

Cooperative Manager provides a comprehensive reporting suite for administrators and owners to monitor the cooperative's financial health, track loan portfolios, audit member contributions, and review the full activity history. Reports are exportable to PDF for board meetings and compliance purposes.

> **Related:** [Dividend Distribution](11_FEATURE_DIVIDENDS.md) — dividend payout totals are reflected in the overview tab. [Multi-Tenancy](14_FEATURE_MULTI_TENANCY.md) — all report data is scoped to the logged-in user's cooperative.

---

## Overview

### Who Can Access Reports

The reports page (`/admin/reports`) is accessible to users with the following roles only:

| Role | Access |
|---|---|
| OWNER | Full access |
| ADMIN | Full access |
| TREASURER | Full access |
| MEMBER | No access — redirected to dashboard |

### Navigation

Navigate to **Admin → Reports** from the sidebar. The page opens to the Overview tab. Use the tab bar to switch between:

- Overview
- Loans
- Contributions
- Audit Trail

---

## Overview Tab

The Overview tab presents a snapshot of the cooperative's financial position at the current moment.

### Financial Metrics

| Metric | Calculation |
|---|---|
| Total Verified Contributions | Sum of all VERIFIED contribution amounts |
| Outstanding Loan Balance | Sum of (totalAmountDue − totalRepaid) for all APPROVED, unrepaid loans |
| Total Dividends Paid | Sum of all PAID MemberDividend amounts |
| Net Capital | Total Verified Contributions − Outstanding Loan Balance |

**Example — Abuja Credit Union, May 2026:**

| Metric | Value |
|---|---|
| Total Verified Contributions | ₦8,450,000 |
| Outstanding Loan Balance | ₦2,100,000 |
| Total Dividends Paid | ₦620,000 |
| Net Capital | ₦6,350,000 |

Net Capital is the clearest indicator of the cooperative's financial strength. A declining Net Capital may indicate that loan activity is outpacing contributions, warranting a review of lending policy.

### Membership Metrics

| Metric | Description |
|---|---|
| Total Members | All non-deleted user accounts in the cooperative |
| Verified Members | Members with a non-null `verifiedAt` timestamp |
| Unverified Members | Total Members − Verified Members |

### Loan Metrics

| Metric | Description |
|---|---|
| Active Loans | Loans with status APPROVED and no `repaidAt` date |
| Total Loans | All loan applications ever submitted |
| Defaulted Loans | Active loans with no repayment in the last 90 days (or approved 90+ days ago with no repayment ever) |

A loan is counted as **defaulted** when either of the following is true:
- The most recent repayment was made more than 90 days ago
- The loan was approved more than 90 days ago and no repayment has ever been made

---

## Loan Portfolio Tab

The Loan Portfolio tab shows every loan application in the cooperative, from all time, with full status and repayment detail.

### Summary Statistics

At the top of the tab:

- **Average interest rate** across all loans with a set rate (loans where `interestRate` is not null)
- **Total amount approved** (sum of `amountRequested` for APPROVED and REPAID loans)
- **Total outstanding** (sum of remaining balances on active APPROVED loans)
- **Status breakdown** — count of loans per status

### Loan Table

Each row in the loan table shows:

| Column | Notes |
|---|---|
| Member name / email | The loan applicant |
| Amount Requested | Original principal |
| Total Due | Principal + interest (or principal if no interest applied) |
| Total Repaid | Sum of all repayment records |
| Repayment Progress | Percentage bar: (totalRepaid ÷ totalAmountDue) × 100, capped at 100% |
| Status | Colour-coded badge (see below) |
| Interest Rate | The rate locked in at approval, or blank if not set |
| Repayment Months | Duration agreed at approval |
| Approved Date | When the loan was approved |
| Repaid Date | When the loan was marked REPAID, or blank |

### Loan Status Colour Coding

| Status | Meaning |
|---|---|
| PENDING_GUARANTORS | Awaiting guarantor responses |
| PENDING_ADMIN_REVIEW | Both guarantors accepted; awaiting admin decision |
| APPROVED | Active loan — repayments in progress |
| REJECTED | Admin or guarantor declined |
| REPAID | Fully repaid |

### Default Detection

Loans appearing in the defaulted count on the Overview tab are individually visible in the Loan Portfolio tab. Cross-reference by filtering the status column for APPROVED loans and sorting by last repayment date to identify which loans are at risk.

---

## Contributions Tab

The Contributions tab provides a cooperative-wide summary of all contribution activity and a per-member breakdown.

### Status Summary

At the top of the tab, totals are shown for each contribution status:

| Status | Meaning |
|---|---|
| PENDING_VERIFICATION | Submitted by member; awaiting admin review |
| VERIFIED | Confirmed; counts toward member balance and borrowing capacity |
| REJECTED | Declined by admin; member has been notified |

For each status, both the **count** (number of contributions) and the **total amount** are displayed.

**Example — Lagos Savings Cooperative:**

| Status | Count | Total Amount |
|---|---|---|
| VERIFIED | 142 | ₦7,250,000 |
| PENDING_VERIFICATION | 8 | ₦320,000 |
| REJECTED | 11 | ₦185,000 |

A high rejection count may indicate members are submitting contributions without receipts or with incorrect documentation. Consider sending an announcement with guidance.

### Per-Member Breakdown

Below the summary, a table lists every member who has ever submitted a contribution, sorted by highest verified total descending:

| Column | Description |
|---|---|
| Member Name / Email | Identifies the contributor |
| Total Verified | Sum of all VERIFIED contribution amounts for this member |
| Total Pending | Sum of all PENDING_VERIFICATION amounts |
| Rejection Count | Number of rejected (not total rejected amount) submissions |

This table is useful for identifying the cooperative's top contributors, which is also the data that drives dividend share calculations. See [Dividend Distribution](11_FEATURE_DIVIDENDS.md).

---

## Audit Trail Tab

The Audit Trail provides a tamper-evident log of every significant action taken within the cooperative. It shows the last **500 events**, ordered newest first.

### Columns

| Column | Description |
|---|---|
| Timestamp | Date and time the event was recorded |
| Event Type | Colour-coded badge (see colour coding below) |
| Actor | Name of the user who performed the action |
| Entity Type | The type of record affected (loan, contribution, dividend, etc.) |
| Details | JSON data specific to the event |

### Filters

The audit trail supports two filters:

- **Event Type** — dropdown; select a specific event type to show only those records
- **Date Range** — start date and end date pickers; narrows the results to a specific window

Filters can be combined. Clearing both filters returns to the full last-500-event view.

### Event Type Colour Coding

| Colour | Event Categories |
|---|---|
| Green | Approvals, verifications, accepted actions |
| Red | Rejections, declines |
| Blue | Submissions, applications |
| Yellow | Admin configuration changes, recordings |

### Event Types Reference

The following event types are recorded in the audit trail:

| Event Type | Description |
|---|---|
| `loan_application_submitted` | Member submitted a loan application |
| `loan_application_approved` | Admin or owner approved a loan |
| `loan_application_rejected` | Admin rejected a loan application |
| `loan_repayment_made` | Member submitted a repayment via the repayment form |
| `loan_repayment_recorded` | Admin or treasurer manually recorded a repayment |
| `contribution_submitted` | Member submitted a new contribution |
| `contribution_verified` | Admin verified a contribution |
| `contribution_rejected` | Admin rejected a contribution |
| `contribution_recorded_by_treasurer` | Treasurer manually recorded a contribution on behalf of a member |
| `member_verified` | Admin verified a member account |
| `announcement_created` | Admin created a new announcement |
| `announcement_rsvp_submitted` | Member submitted or updated an RSVP response |
| `dividend_payout_created` | Admin created a dividend payout record |
| `dividend_payout_approved` | Owner or admin approved a dividend payout |
| `dividend_payout_processed` | Admin processed a dividend payout — members paid |
| `guarantor_accepted` | A guarantor accepted a loan guarantee request |
| `guarantor_rejected` | A guarantor declined a loan guarantee request |
| `withdrawal_requested` | Member submitted a withdrawal request |
| `withdrawal_approved` | Admin approved a withdrawal request |
| `withdrawal_rejected` | Admin rejected a withdrawal request |
| `setting_updated` | Admin changed a cooperative setting |
| `loan_settings_updated` | Admin updated loan interest rate, repayment months, or currency |
| `bank_account_added` | Admin added a bank account to cooperative settings |
| `bank_account_updated` | Admin updated a bank account record |
| `bank_account_deleted` | Admin deleted a bank account record |

### Using the Audit Trail for Compliance

The audit trail satisfies the recordkeeping requirements of most cooperative board meetings by showing:

- Who approved each loan and when
- Who verified which contributions
- Who created and authorised dividend payouts
- What changes were made to cooperative settings and by whom

For regulatory inspections, export the audit trail by filtering the relevant date range and printing or screenshotting the results. For a formal export, use the PDF cooperative report (see below) which includes key financial summaries.

---

## PDF Export

Cooperative Manager generates PDF reports client-side using **jsPDF** and **jspdf-autotable**. No server round-trip is needed — the browser generates and downloads the file directly.

### Cooperative Report

**Format:** Landscape A4

**Triggered from:** Admin → Reports → Overview tab → **Download PDF Report** button

**Contents:**

1. Cooperative name and report date header
2. Financial Summary table: Total Verified Contributions, Outstanding Loan Balance, Total Dividends Paid, Net Capital
3. Membership and Loans table: Total Members, Verified Members, Unverified Members, Active Loans, Total Loans, Defaulted Loans (90+ days), Dividend Payouts count

**File name:** `cooperative-report-[cooperative-name].pdf`

**Footer on every page:** "Confidential — Generated by Cooperative Manager" with page number.

### Member Financial Statement

**Format:** Portrait A4

**Triggered from:** Dashboard → Financial Summary → **Download Statement** button (available to members for their own account, and to admins for any member's account)

**Contents:**

1. Cooperative name, "Member Financial Statement" heading, member name and email, report date
2. Summary table with:
   - Total Verified Contributions
   - Active Loan Balance
   - Available (Contributions − Loan Balance)
   - Total Dividends Received
   - Pending Withdrawal Amount
3. Footer rows: contribution count, active loan count

**File name:** `member-statement-[member-name].pdf`

Members can use this document as proof of their cooperative financial position, for example when applying for external credit.

---

## Report Interpretation Guide

### For Board Meetings

When presenting at a board meeting, the following sequence of reports is recommended:

1. **Overview Tab** — open with the four financial KPIs to set the context for the period.
2. **Net Capital trend** — compare Net Capital from the previous meeting. Rising Net Capital indicates the cooperative is growing; a decline warrants discussion.
3. **Loan Portfolio** — review the active loan count, outstanding balance, and any defaulted loans. Discuss remediation plans for defaults.
4. **Contributions** — highlight top contributors and note any members with high rejection counts who may need guidance.
5. **Audit Trail** — demonstrate to the board that all approvals and changes are recorded and attributable.

### Reading the Contributions Table

- **High pending count** — may indicate a backlog of admin review work. Assign a treasurer to clear the queue.
- **High rejection count for a single member** — reach out to that member to explain the receipt requirements. See [Member Guide](01_MEMBER_GUIDE.md).
- **Large gap between verified and pending totals** — normal during active contribution periods; should clear within 1–3 business days.

### Reading the Loan Portfolio

- **Repayment progress bars** — any bar below 50% on a loan that was approved more than half the repayment term ago warrants a follow-up with the member.
- **Average interest rate** — if this is significantly higher or lower than your cooperative's configured rate, check whether older loans were approved with non-standard rates.
- **Defaulted loans count on Overview** — these are approximate; confirm individually by reviewing APPROVED loans in the portfolio tab.

---

## Troubleshooting

### PDF export fails or produces a blank document

- The PDF is generated client-side using jsPDF. If it fails, check the browser console for JavaScript errors.
- Ensure you are using a modern browser (Chrome, Firefox, Edge, or Safari). Internet Explorer is not supported.
- If the cooperative report shows no data, verify that the Overview tab loaded successfully with data before clicking the download button. The export uses the data already loaded on the page.
- Very large cooperatives with thousands of records may cause the browser tab to become briefly unresponsive during generation. This is expected; wait for the download to complete.

### Audit trail is empty

The audit trail only shows events that occurred after the audit logging system was enabled. If the cooperative was migrated from another system or if old activity predates the `Event` table, those actions will not appear. All actions performed through the Cooperative Manager UI from the point of deployment onwards are captured.

If the trail appears empty but activity has occurred, check that the `cooperativeId` filter in the query is correct — the audit trail only shows events for the logged-in user's cooperative.

### Data appears incorrect or out of date

All report pages use server-side rendering with `force-dynamic` to ensure fresh data on every load. If you believe a figure is stale:

1. Hard-refresh the reports page (Ctrl+Shift+R or Cmd+Shift+R).
2. If the figure still looks wrong, check the underlying data in the relevant admin section (Contributions, Loans, Dividends).
3. For contribution totals, confirm that the status shown in the Contributions tab matches what you expect — pending contributions are not included in verified totals.

### A member does not appear in the contributions breakdown

The per-member contributions table only includes members who have at least one contribution record (regardless of status). Members who have never submitted a contribution will not appear. If you expect a member to appear, check whether their contributions were soft-deleted (`deletedAt` is not null) — soft-deleted contributions are excluded from all reports.
