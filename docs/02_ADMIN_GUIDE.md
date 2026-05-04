# Cooperative Manager — Administrator & Treasurer Guide

This guide covers every administrative workflow in Cooperative Manager. It is intended for users with the **ADMIN**, **TREASURER**, or **OWNER** role. Where a task is restricted to a specific role, this is clearly indicated.

> **Roles at a glance:**
> - **OWNER** — Full access to all settings, including bank accounts and guarantor coverage mode.
> - **ADMIN** — Full access to all member, contribution, loan, dividend, withdrawal, and announcement management. Cannot change certain owner-only settings.
> - **TREASURER** — Can record contributions and repayments manually. Access to reports. Cannot approve loans or manage announcements.

---

## Table of Contents

1. [Admin Dashboard Overview](#1-admin-dashboard-overview)
2. [Member Verification Workflow](#2-member-verification-workflow)
3. [Contribution Verification](#3-contribution-verification)
4. [Recording Contributions (Treasurer)](#4-recording-contributions-treasurer)
5. [Loan Approval Workflow](#5-loan-approval-workflow)
6. [Recording Repayments](#6-recording-repayments)
7. [Dividend Distribution](#7-dividend-distribution)
8. [Withdrawal Approvals](#8-withdrawal-approvals)
9. [Announcements](#9-announcements)
10. [Reports & Analytics](#10-reports--analytics)
11. [Managing Bank Accounts](#11-managing-bank-accounts)
12. [Notification Log](#12-notification-log)
13. [Common Admin Tasks](#13-common-admin-tasks)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Admin Dashboard Overview

Navigate to **/admin/dashboard** after signing in with an admin-level account to access the administrative area. The admin dashboard is separate from the member dashboard and provides a consolidated view of cooperative operations.

### Stats Shown

The admin dashboard surfaces the most operationally critical numbers:

- **Pending member verifications** — Members who have signed up and are awaiting approval.
- **Pending contributions** — Contributions submitted by members that have not yet been verified or rejected.
- **Loans awaiting admin review** — Loan applications that have passed the guarantor stage and are ready for your decision.
- **Pending withdrawal requests** — Member withdrawal requests awaiting approval.

### Quick Actions Available

From the admin dashboard you can jump directly to:

- **Admin → Members → Unverified** — Process the verification queue.
- **Admin → Contributions** — Review pending contribution receipts.
- **Admin → Loans** — Review loans ready for approval.
- **Admin → Treasurer** — Record cash contributions or repayments.
- **Admin → Dividends** — Manage dividend payouts.
- **Admin → Reports** — Access financial and audit reports.
- **Admin → Announcements** — Manage member communications.
- **Admin → Settings** — Configure loan rules and bank accounts.

---

## 2. Member Verification Workflow

### The Unverified Queue

New members cannot contribute or apply for loans until their account is verified. Navigate to **Admin → Members → Unverified** (**/admin/members/unverified**) to see the list of members awaiting verification. The page shows each member's name, email, sign-up date, and cooperative.

### What to Check Before Verifying

Before clicking **Verify** on a member, confirm:

| Check | Why It Matters |
|---|---|
| Name matches cooperative records | Prevents duplicate or fraudulent accounts |
| Email address is valid and expected | Confirms the person is who they say they are |
| The member selected the correct cooperative | Ensures they are joined to the right group |

If you are unsure about a member's identity, contact them directly before verifying.

### How to Verify a Member

1. Navigate to **Admin → Members → Unverified**.
2. Locate the member in the list.
3. Click the **Verify** button next to their name.
4. A confirmation prompt appears: "Verify [Name]?"
5. Click **Confirm** to approve, or **Cancel** to go back.
6. The member's row updates to show "✓ Verified".

Once verified, the member:
- Receives an **email and SMS** notification confirming their account is active.
- Can immediately submit contributions and apply for loans (subject to having at least one verified contribution for loans).

### Rejecting a Member Account

There is no formal "reject" button in the current verification workflow. If you need to prevent a member from accessing the platform, do not verify their account. You can contact the member directly to explain any issues. They will remain in the unverified queue until actioned.

### All Members List

Navigate to **Admin → Members** (**/admin/members**) to see all verified members — their name, email, role, join date, and status. Use this page for a full membership overview.

---

## 3. Contribution Verification

### Navigating to Pending Contributions

Go to **Admin → Contributions** (**/admin/contributions**). The page displays contributions organized by status tabs.

### Filter Tabs

| Tab | What It Shows |
|---|---|
| **ALL** | Every contribution regardless of status |
| **PENDING** | Contributions awaiting review (the most important tab for daily work) |
| **VERIFIED** | Contributions already approved |
| **REJECTED** | Contributions that were rejected |

Each tab shows the count of records in that state.

### Reviewing a Contribution

For each pending contribution, you will see:

- Member name and email
- Amount and payment method
- Submission date
- Receipt (if provided): images display inline as a thumbnail; PDFs show a document icon with a download link

### Decision Guidance

| Scenario | Recommended Action |
|---|---|
| Receipt clearly matches the stated amount, date, and cooperative account | **Verify** |
| Receipt is present but the amount shown differs slightly (rounding, fees) | Use judgment; verify if the discrepancy is minor and the payment is otherwise clearly genuine |
| No receipt attached but payment is confirmed through other means (e.g., bank alert) | **Verify** with an internal note if possible |
| Receipt is blurry, cropped, or unreadable | **Reject** with reason "Receipt not legible — please resubmit with a clear image" |
| Receipt clearly shows a different transaction or belongs to someone else | **Reject** with a clear reason |
| Amount on receipt does not match the submitted amount | **Reject** with reason "Amount mismatch — please resubmit with the correct amount" |

### How to Verify or Reject

1. Open **Admin → Contributions** and click the **PENDING** tab.
2. Locate the contribution to review.
3. Click **Verify** to approve it — a confirmation dialog appears; click **Confirm**.
4. To reject, click **Reject**. A text area appears below the buttons.
5. Enter a clear **rejection reason** (required before the form can be submitted).
6. Click **Reject** again to confirm.

After your decision:
- **Verified:** The member receives an email and SMS notification. The contribution is added to their verified total and increases their borrowing capacity.
- **Rejected:** The member receives an email with the reason you entered. They can then resubmit a corrected contribution.

> **Security:** You cannot verify or reject your own contributions. If you attempt to do so, the system will block the action. Ask another administrator to review your personal submissions.

---

## 4. Recording Contributions (Treasurer)

### When to Use Manual Entry

Use the manual recording tool when a member pays in **cash** and does not submit through the member portal, or when you need to record a payment on their behalf (e.g., handed cash directly to you at a meeting).

### How to Record a Cash Contribution

1. Navigate to **Admin → Treasurer** (**/admin/treasurer**).
2. Under the **Record Contribution** section, select the **Member** from the dropdown (shows name and email for accuracy).
3. Enter the **Amount**.
4. Optionally, add a **Note** (e.g., "January 2026 contribution — cash received at meeting").
5. Click **Record Contribution**.

Contributions recorded this way are marked as **VERIFIED immediately** — they do not go through the normal pending/approval flow. The member does not receive a separate notification for treasurer-recorded contributions, but the record appears in their contribution history.

> **Self-entry prevention:** The member dropdown does not include your own account. You cannot record a contribution for yourself using this form.

---

## 5. Loan Approval Workflow

### The Loan Approval Flow

Loans progress through the following statuses before reaching you:

```
PENDING_GUARANTORS → PENDING_ADMIN_REVIEW → APPROVED / REJECTED → REPAID
```

Your queue only shows loans that have already cleared the guarantor stage (i.e., both guarantors have accepted). Loans still waiting for guarantors are managed by the member and their chosen guarantors.

### Accessing the Pending Loans Queue

Navigate to **Admin → Loans → Pending** (**/admin/loans/pending**). The page lists all loans in PENDING_ADMIN_REVIEW status, sorted newest-first.

### Reviewing a Loan Application

For each application you will see:

- **Member name and email**
- **Requested amount**
- **Application date**
- **Purpose** (if provided by the member)
- **Guarantor names** (both guarantors who accepted)
- **Link to the member's contribution history**

Before approving, review:

| Check | Why It Matters |
|---|---|
| Loan amount is within the member's borrowing capacity | Ensures the cooperative is not over-exposed |
| Member has a solid contribution history | Members who contribute consistently are lower risk |
| Both guarantors are verified and in good standing | Weak guarantors reduce security |
| Loan purpose is reasonable (if stated) | Flags potential misuse |
| Member has no outstanding unpaid loans | Prevents stacking of unrepaid debt |

### Decision Guidance

| Scenario | Recommended Action |
|---|---|
| All checks pass and amount is within capacity | **Approve** |
| Amount requested slightly exceeds capacity due to timing | Use judgment; consider approving a reduced amount or asking the member to reapply |
| Member has a history of late repayments | **Reject** with reason, or discuss with member before deciding |
| Guarantors' contributions are very low relative to loan size (relevant in COMBINED/INDIVIDUAL mode) | **Reject** — the system should block this, but double-check if it slips through |
| Something seems unusual or unclear | Put the loan on hold (do not approve or reject) and contact the member for clarification |

### How to Approve or Reject a Loan

1. Navigate to **Admin → Loans → Pending**.
2. Find the loan to review.
3. To approve: click **Approve**. A confirmation appears. Click **Confirm** to finalize.
4. To reject: click **Reject**. A text area appears. Enter a mandatory **reason for rejection**, then click **Reject** to confirm.

After your decision:
- **Approved:** Member receives an email and SMS. The loan moves to APPROVED status.
- **Rejected:** Member receives an email with the reason entered.

> **Security:** You cannot approve or reject your own loan applications. If you have an active loan application, another administrator must review it.

---

## 6. Recording Repayments

### Admin vs. Member Repayments

Members can record their own repayments via **Dashboard → Loans → [Loan] → Make a Repayment**. However, if a member pays in cash or their repayment needs to be recorded manually (e.g., bank transfer confirmed by the treasurer), use the admin repayment form.

### How to Record a Repayment for a Member

**Option A — Via the Treasurer Page:**
1. Navigate to **Admin → Treasurer** (**/admin/treasurer**).
2. Under the **Record Repayment** section, select the active loan from the dropdown. Each entry shows the member's name, loan amount, and remaining balance.
3. Enter the **Amount** being repaid.
4. Optionally, add a **Note** (e.g., "Bank transfer ref #12345").
5. Click **Record Repayment**.

**Option B — Via the Loan Detail Page:**
1. Navigate to **Admin → Loans → [Loan ID] → Record Repayment** (**/admin/loans/[id]/record-repayment**).
2. Enter the **Payment Amount** (cannot exceed the remaining balance).
3. Optionally, add a **Note**.
4. Click **Record Payment**.

Both methods record the repayment immediately and update the remaining balance. If the total repaid now equals or exceeds the total amount due, the loan is automatically marked **REPAID**.

> **Security:** You cannot record a repayment for your own loan. If you need to record a repayment on your own account, another administrator must do it.

---

## 7. Dividend Distribution

### Overview

Dividends distribute a portion of the cooperative's profits back to members in proportion to their verified contributions. Navigate to **Admin → Dividends** (**/admin/dividends**) to manage payouts.

> **Access:** ADMIN and OWNER roles only.

### Creating a New Dividend Payout

1. Click **New Dividend Payout**.
2. Select the **Period**:
   - Q1 (January–March)
   - Q2 (April–June)
   - Q3 (July–September)
   - Q4 (October–December)
   - Annual
3. Enter the **Year**.
4. Enter the **Total Profit** — the cooperative's net income for the period.
5. Set the **Admin Costs %** — the percentage of profit reserved for administrative expenses (default 10%). The naira value is shown in real-time as you type.
6. Set the **Loan Loss Reserve %** — the percentage retained as a safety reserve (default 20%). The naira value is shown in real-time.
7. The **Distribution Preview** panel updates automatically to show:
   - Total profit
   - Admin costs deducted
   - Reserve deducted
   - **Dividend pool** (the amount to be shared among members)
8. Click **Create Payout** when the preview looks correct.

The payout is created in **PENDING** status.

### Approving and Processing a Payout

**Step 1 — Approve**
In the Payout History table, payouts in PENDING status show an **Approve** button. Clicking it moves the payout to **APPROVED** status. This step is for confirming that the figures have been reviewed and signed off before funds are disbursed.

**Step 2 — Process**
Payouts in APPROVED status show a **Process** button. Clicking it calculates each member's share based on their proportion of the total verified contributions across the cooperative and records individual dividend records. The payout moves to **PAID** status and each member receives an email and SMS notification.

### How Individual Shares Are Calculated

Each member receives:

> **Member Share = (Member's Verified Contributions ÷ All Members' Verified Contributions) × Dividend Pool**

For example: if the dividend pool is ₦500,000 and a member contributed 8% of all contributions, they receive ₦40,000.

### Payout History

The history table shows each payout's period, year, total profit, dividend pool, number of members, current status, and action. All three statuses (PENDING, APPROVED, PAID) are shown with color-coded badges.

---

## 8. Withdrawal Approvals

Navigate to **Admin → Withdrawals** (**/admin/withdrawals**) to manage member withdrawal requests.

> **Access:** ADMIN and OWNER roles only.

### Understanding the Withdrawal Queue

The page is split into two sections:

- **Pending Review** — Requests in REQUESTED status that need action.
- **History** — All previously processed requests (APPROVED, REJECTED, PAID).

Each pending request shows: member name and email, requested amount, stated reason, optional notes from the member, and the date submitted.

### Approving a Withdrawal

1. Review the request details.
2. Verify mentally that the member's available balance (contributions minus active loan) is sufficient to cover the request.
3. Click **Approve**.
4. The status moves to **APPROVED** and the member is notified.

### Rejecting a Withdrawal

1. Click **Reject** on the request.
2. Enter a **rejection reason** (shown to the member).
3. Click **Confirm**.
4. The status moves to **REJECTED** and the member is notified with the reason.

### Decision Guidance

| Scenario | Action |
|---|---|
| Member has sufficient available balance and a reasonable reason | **Approve** |
| Member has an active loan that covers most of their balance | Approve only if the requested amount is within the true available balance |
| Reason is "Leaving Cooperative" | Confirm with your cooperative's exit policy before approving |
| Duplicate or suspicious request | **Reject** with a reason; contact the member directly |

### Marking a Withdrawal as Paid

Once payment has been physically transferred to the member:

1. Find the APPROVED withdrawal in the History section.
2. Click **Mark as Paid**.
3. The status moves to **PAID**.

This step closes the loop and confirms the cooperative has disbursed the funds.

---

## 9. Announcements

### Creating an Announcement

1. Navigate to **Admin → Announcements → New** (**/admin/announcements/new**).
2. Fill in the **Title** — a short, clear subject line.
3. Select the **Type**:
   - **General** — General information
   - **AGM** — Annual General Meeting (unlocks date/location/RSVP fields)
   - **Maintenance** — System maintenance notice
   - **Rule Change** — Policy or rule updates
4. Write the **Message** body in the text area.
5. Select **Recipients**:
   - **All Members** — Everyone in the cooperative
   - **Members Only** — Excludes admins and owners
   - **Admins Only** — Internal communication
6. If the type is **AGM**, additional fields appear:
   - **AGM Date & Time** — Set the datetime of the meeting.
   - **AGM Location** — Enter the venue (e.g., "Community Hall, Lagos").
   - **Allow members to RSVP** — Check this to show RSVP buttons (Attending / Maybe / Not Attending) on the announcement page.
7. Optionally, set an **Expiry Date** — the announcement becomes inactive after this datetime. Leave blank for no expiry.
8. Check **Pin to dashboard banner** (enabled by default) to display the announcement as a sticky banner on all member dashboard pages.
9. Click **Create & Send**.

When created, a bulk email and SMS is sent to all recipients and a success message is shown.

### Deactivating an Announcement

If you need to remove a pinned banner or disable an announcement early, navigate to **Admin → Announcements** and click the **Deactivate** button next to the relevant announcement. This removes it from the banner and prevents new members from seeing it.

### Viewing RSVP Counts

On the **Admin → Announcements** list page, AGM announcements with RSVP enabled show the count of responses received. Click into the announcement to see a breakdown of Attending, Maybe, and Not Attending responses.

---

## 10. Reports & Analytics

Navigate to **Admin → Reports** (**/admin/reports**) to access the reporting suite.

> **Access:** ADMIN, OWNER, and TREASURER roles.

### Tab Structure

The Reports page is organized into four tabs, selectable at the top:

| Tab | Contents |
|---|---|
| **Financial** (default) | Overview of contributions by member, loan portfolio summary, dividend totals |
| **Loans** | Loan decision history (approved, rejected, repaid), repayment performance |
| **Dividends** | Member share snapshot; enter a distribution amount to preview per-member dividend amounts |
| **Audit** | Chronological event log of all significant platform actions |

### Financial Tab

The Financial tab is the standard monthly reporting view. It shows:

- Total contributions per member
- Loan totals (disbursed, outstanding, repaid)
- Dividend summary

Click **Export PDF** to generate a formatted PDF report of the financial overview.

### Loans Tab

Shows a log of all loan decisions across the cooperative: amounts, applicants, decision dates, and outcomes. Use this for portfolio health monitoring and identifying overdue repayments.

### Dividends Tab

Enter a hypothetical distribution amount in the input field to preview how much each member would receive based on their current contribution share. This is useful for planning before creating an official payout in the Dividends section.

### Audit Trail Tab

The audit trail is a tamper-evident log of all key events on the platform. Each entry records:

- **Timestamp** — Exact date and time
- **Action** — The type of event (e.g., Loan Approved, Contribution Verified, Member Verified, Dividend Paid)
- **Actor** — The administrator or member who performed the action
- **Entity** — The type and ID of the affected record

**Filtering the Audit Trail:**
Use the filter chips at the top to narrow the log by event type:
- All
- Loans (Loan Approved events)
- Contributions (Contribution Verified events)
- Members (Member Verified events)
- Dividends (Dividend Paid events)

The log displays up to 500 events. For complete historical exports, use the CSV export.

### Exporting Data

- **PDF export** — Available on the Financial tab via the **Export PDF** button.
- **CSV export** — Available on all tabs except Audit via the **↓ Export CSV** link. The CSV content changes based on the active tab (financial, loans, or dividends).

---

## 11. Managing Bank Accounts

Navigate to **Admin → Settings** (**/admin/settings**) and scroll to the **Bank Accounts** section.

> **Add/edit/delete access:** OWNER role only. ADMIN users can view bank accounts but cannot modify them.

### Adding a Bank Account

1. In the **Add Bank Account** form, enter:
   - **Account Name** — The name on the account
   - **Account Number**
   - **Bank Name**
2. Click **Add Account**.
3. The new account appears in the bank accounts table.

### Setting the Preferred Account

The preferred account is highlighted to members when they need to know where to transfer contributions or loan repayments.

1. In the bank accounts table, find the account to set as preferred.
2. Click **Set Preferred** next to it.
3. The account is immediately marked with "✓ Preferred".

Only one account can be preferred at a time. Setting a new preferred account removes the designation from the previous one.

### Deleting a Bank Account

1. Find the account to remove in the bank accounts table.
2. Click **Delete** next to it.
3. Confirm the deletion.

> **Caution:** Deleting a bank account that has been used by members for past contributions does not remove the historical records, but the account details will no longer be shown to members as a payment destination.

---

## 12. Notification Log

Navigate to **Admin → Notifications** (**/admin/notifications**) to view the admin notification center.

> **Note:** The admin notifications page currently surfaces **loans awaiting admin review** — it acts as a focused action queue showing which PENDING_ADMIN_REVIEW loans need your attention, rather than a full log of all outbound notifications.

### What Is Shown

- Each pending loan is shown as a card with: the requested amount, applicant name and email, application date, and the names of the two guarantors.
- A count badge on the page heading shows how many loans need review.
- A **Review →** button on each card links directly to the loan approval queue at **/admin/loans**.

### Notification Delivery

Outbound notifications (emails and SMS messages to members) are sent automatically by the platform at the time of each event. There is no manual send queue for admins to manage — notifications fire immediately when you approve a loan, verify a contribution, distribute dividends, and so on.

---

## 13. Common Admin Tasks

### Monthly Verification Sweep

At the start of each month, check for members who have signed up but not yet been verified:

1. Go to **Admin → Members → Unverified**.
2. Review each pending member.
3. Verify legitimate accounts and contact any uncertain registrations for confirmation.
4. Check **Admin → Contributions → PENDING** for any contributions submitted since the last review.
5. Process all pending contributions and notify members of decisions.

### End-of-Month Reporting

1. Navigate to **Admin → Reports → Financial** tab.
2. Review overall contribution and loan figures.
3. Click **Export PDF** or **↓ Export CSV** for your records.
4. Review the **Loans** tab for any overdue repayments.
5. Check the **Audit** tab for unusual activity or errors during the month.

### AGM Preparation

1. Navigate to **Admin → Announcements → New**.
2. Set the type to **AGM** and fill in the **Date & Time** and **Location**.
3. Enable **Allow members to RSVP** so you can track attendance.
4. Enable **Pin to dashboard banner** so all members see it immediately.
5. Set an expiry date after the meeting so the banner auto-clears.
6. Click **Create & Send** to notify all members.
7. In the days before the meeting, return to **Admin → Announcements** to check RSVP counts and plan for attendance numbers.

### Preparing a Dividend Payout

1. Obtain the total net profit figure for the period.
2. Navigate to **Admin → Dividends** and click **New Dividend Payout**.
3. Enter the period, year, total profit, and agreed deduction percentages for admin costs and the loan loss reserve.
4. Review the **Distribution Preview** to confirm the dividend pool is correct.
5. Click **Create Payout** — this creates the payout in PENDING status.
6. Have a second admin (or the owner) review the figures.
7. Click **Approve** to move to APPROVED status.
8. Once ready to disburse, click **Process** to calculate and record individual member shares.
9. All members receive an email and SMS notification. Mark each withdrawal as PAID after funds are transferred.

---

## 14. Troubleshooting

### Cannot verify a member

- Confirm you have ADMIN or OWNER role. TREASURER users do not have access to the member verification page.
- Check that you are on the correct page: **Admin → Members → Unverified**.
- If the member does not appear, they may already be verified — check **Admin → Members** (the full list).
- Refresh the page; the member's status may have already been updated by another admin.

### Receipt is not visible for a contribution

- The member may not have uploaded a receipt. The receipt field is optional. A contribution without a receipt can still be verified if you can confirm the payment through other means.
- If the member did upload a receipt but it is not showing, it may have failed to upload. Ask the member to resubmit with a fresh upload.
- If you see a PDF document icon instead of an image thumbnail, click the icon to download and view the PDF.

### Cannot approve my own loan

This is by design. The platform enforces a **security guard** that prevents administrators and owners from approving their own loan applications, verifying their own contributions, or recording repayments on their own loans. This is not a bug — it is an integrity control.

**What to do:** Ask another administrator or the cooperative owner to review your application. They will see it in the normal pending loans queue.

### An admin is trying to approve a loan with a guarantor who is also an admin

The system prevents admins and owners from acting as guarantors on loan applications. If this is causing an application to stall, the member needs to reapply with guarantors who are regular (MEMBER role) verified members.

### The borrowing capacity shown for a member seems wrong

Borrowing capacity is calculated as: Total Verified Contributions × Borrowing Multiplier. Check two things:

1. **Verified contributions:** Go to **Admin → Contributions** and filter by the member's name. Confirm their contributions are in VERIFIED status. Pending or rejected contributions do not count.
2. **Borrowing multiplier:** Navigate to **Admin → Settings** and check the current multiplier. If it is set to a low value, capacity will be low relative to contributions.

### A loan is stuck in PENDING_GUARANTORS for a long time

The loan cannot progress until both named guarantors respond. As an admin you can view the loan and see which guarantors have and have not responded. Contact the unresponsive guarantors directly and ask them to log in and review the request. There is no admin override to skip the guarantor stage.

### A dividend payout shows the wrong pool amount

Review the admin costs % and loan loss reserve % inputs. The dividend pool is: Total Profit − Admin Costs − Loan Loss Reserve. If either percentage is entered incorrectly, adjust them in the New Dividend form. Payouts in PENDING status have not been processed yet and can be deleted and recreated if needed.

### The audit trail shows an unexpected event

Review the Actor column — each event records who performed it. If an event was performed by an unexpected user, investigate:

1. Check whether that user's credentials may have been compromised.
2. Review the Entity column to understand exactly what record was affected.
3. Contact Cooperative Manager support if you suspect unauthorized access.

---

*Last updated: May 2026. For technical support, contact the platform administrator.*
