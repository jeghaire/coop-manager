# Monthly Operations Guide — Cooperative Manager

> **Who this is for:** Administrators, Treasurers, and Owners responsible for running the cooperative on a day-to-day basis.
>
> **Related docs:** [02_ADMIN_GUIDE.md](./02_ADMIN_GUIDE.md) | [07_FEATURE_CONTRIBUTIONS.md](./07_FEATURE_CONTRIBUTIONS.md) | [08_FEATURE_LOANS.md](./08_FEATURE_LOANS.md) | [11_FEATURE_DIVIDENDS.md](./11_FEATURE_DIVIDENDS.md) | [22_COMPLIANCE_AUDIT.md](./22_COMPLIANCE_AUDIT.md)

---

## Table of Contents

1. [Why a Monthly Rhythm Matters](#1-why-a-monthly-rhythm-matters)
2. [Week 1 (Days 1–7): Contribution Processing](#2-week-1-days-17-contribution-processing)
3. [Week 2 (Days 8–14): Loan Management](#3-week-2-days-814-loan-management)
4. [Mid-Month: Financial Health Check](#4-mid-month-financial-health-check)
5. [Week 4 (Days 21–31): Month-End](#5-week-4-days-2131-month-end)
6. [Quarterly Tasks](#6-quarterly-tasks)
7. [Annual Tasks](#7-annual-tasks)
8. [Decision Guide — Common Scenarios](#8-decision-guide--common-scenarios)

---

## 1. Why a Monthly Rhythm Matters

A cooperative is only as healthy as its administrative discipline. Left without a consistent schedule, contributions accumulate in the pending queue, loan repayments go unrecorded, and overdue borrowers receive no follow-up. Members lose confidence when their verified contributions are not reflected in their borrowing capacity, or when they do not hear back about a loan application within a reasonable time.

A monthly operating rhythm solves these problems by creating predictable windows for each category of work: contribution review in the first week, loan management in the second, a mid-month financial check, and month-end reporting before the cycle begins again. This approach:

- Keeps the pending queue short, reducing the chance of members resubmitting duplicate contributions in frustration.
- Ensures overdue loan records are acted on promptly — the daily cron job at `/api/cron/check-overdue-loans` sends automated reminders, but personal follow-up from an admin significantly improves recovery rates.
- Creates a consistent record of financial activity that simplifies quarterly and annual reporting, including audit preparation and AGM presentations.
- Meets the accountability expectations members have as owners of the cooperative's capital.

The guide below assumes one primary admin or treasurer performing most tasks, with an owner or second admin available for tasks that require a separate reviewer (such as approving their own contributions or loans). Adjust the timing to suit the size of your cooperative and the volume of activity.

---

## 2. Week 1 (Days 1–7): Contribution Processing

The first priority each month is clearing the pending contribution queue. Members who submitted contributions before or at the start of the month are waiting for verification before their borrowing capacity updates.

### Checklist

- [ ] Sign in and navigate to **Admin → Contributions** (`/admin/contributions`)
- [ ] Click the **PENDING** tab to see all unreviewed submissions
- [ ] For each pending contribution:
  - [ ] Open the receipt (click the thumbnail for images, or the document icon for PDFs)
  - [ ] Confirm the amount on the receipt matches the submitted amount
  - [ ] Confirm the payment method is consistent with the receipt type (bank transfer confirmation, mobile money screenshot, etc.)
  - [ ] Confirm the payee or destination account on the receipt matches the cooperative's bank account
  - [ ] Click **Verify** if everything checks out, or **Reject** with a clear reason if it does not
- [ ] Check whether any members have not yet contributed this month:
  - [ ] Navigate to **Admin → Members** (`/admin/members`)
  - [ ] Sort or scan by last contribution date (visible in the member list or their profile)
  - [ ] Note members approaching the end of their contribution-free grace period
- [ ] If a contribution deadline is approaching, send a reminder announcement:
  - [ ] Navigate to **Admin → Announcements → New**
  - [ ] Set type to **General**, draft a short reminder with the deadline date
  - [ ] Pin to dashboard banner so members see it on login
  - [ ] Set an expiry date for the day after the deadline
- [ ] Record any cash contributions handed to the treasurer at the meeting:
  - [ ] Navigate to **Admin → Treasurer** (`/admin/treasurer`)
  - [ ] Under **Record Contribution**, select the member, enter the amount and a note (e.g., "January 2026 cash — received at Lagos branch meeting")
  - [ ] Click **Record Contribution** — the record is verified immediately

### Tips

**Receipts to watch for in Nigerian cooperative contexts:**

| Receipt Type | What to Verify |
|---|---|
| GTBank / First Bank transfer confirmation | Check the beneficiary account number matches the cooperative's account |
| OPay / Palmpay screenshot | Confirm the phone number or account it was sent to |
| Cash/treasurer-recorded | No receipt required — you are the receipt; add a note |
| Kuda / Moniepoint confirmation | Verify the reference number and amount |

If a receipt is clear but the amount shown is off by a small rounding difference (e.g., ₦9,950 received when ₦10,000 was declared due to bank charges), use judgment. Rejecting over minor bank fees causes friction; note the discrepancy in the system if your cooperative policy requires it.

---

## 3. Week 2 (Days 8–14): Loan Management

Once contributions are settled, turn your attention to loan applications and repayment tracking.

### Checklist

- [ ] Navigate to **Admin → Loans → Pending** (`/admin/loans/pending`)
- [ ] Review each loan application in **PENDING_ADMIN_REVIEW** status:
  - [ ] Confirm the requested amount is within the applicant's borrowing capacity (shown on the application card)
  - [ ] Review both guarantors: check their names, acceptance status, and contribution totals
  - [ ] Verify the applicant has no outstanding unpaid loans in a problematic state
  - [ ] Review the stated loan purpose (if provided)
  - [ ] Approve or reject each application with a clear reason
- [ ] For loans still in **PENDING_GUARANTORS**, check whether any have been waiting more than 7 days:
  - [ ] Navigate to **Admin → Loans** and filter by PENDING_GUARANTORS status
  - [ ] Identify which guarantors have not yet responded
  - [ ] Contact the unresponsive guarantor directly (phone or in-person) and ask them to log in and respond
- [ ] Check the loan report for overdue loans:
  - [ ] Navigate to **Admin → Reports → Loans** tab
  - [ ] Review loans flagged with no repayment activity in 90+ days
  - [ ] Cross-reference with the daily cron email notifications (the system sends automated overdue alerts)
  - [ ] Follow up personally with members who have active overdue balances — a phone call is more effective than an email for recovering overdue amounts
- [ ] Record any loan repayments that were made offline (cash, direct bank transfer) and not yet entered:
  - [ ] Navigate to **Admin → Loans**, find the relevant loan
  - [ ] Click **Record Repayment**, enter the amount and a reference note (e.g., "Bank transfer ref #TXN9927")
  - [ ] Alternatively use **Admin → Treasurer → Record Repayment**

### Loan Approval Reference

Before approving a loan, verify these five points:

| Check | Where to Look |
|---|---|
| Amount within borrowing capacity | Shown on the loan card |
| At least one verified contribution | Admin → Contributions (filter by member) |
| No active defaults or badly overdue loans | Admin → Reports → Loans |
| Both guarantors accepted | Shown on the loan card |
| Guarantor coverage passes (if mode is COMBINED or INDIVIDUAL) | Shown on the loan card with a pass/fail indicator |

### Interest Calculation Reminder

When you approve a loan, the system locks in the current interest rate and repayment months. For example, a ₦200,000 loan at the default 10% rate over 12 months results in a `totalAmountDue` of ₦220,000, with a suggested monthly payment of ₦18,333. These figures are fixed at approval and will not change if you later update the cooperative's interest rate settings.

---

## 4. Mid-Month: Financial Health Check

Around days 14–16 of each month, perform a brief financial health review. This does not need to be exhaustive — the goal is to catch anything that needs attention before month-end.

### Checklist

- [ ] Navigate to **Admin → Reports → Overview** tab
- [ ] Review the key headline figures:
  - [ ] **Net capital**: Total verified contributions minus total outstanding loans
  - [ ] **Member verification rate**: Ratio of verified to total registered members
  - [ ] **Outstanding loan balance**: Total amount currently owed across all active loans
  - [ ] **Total contributions**: Running total of all verified contributions
- [ ] Verify that the net capital figure is positive and aligns with your expectations
- [ ] Navigate to **Admin → Withdrawals** (`/admin/withdrawals`)
- [ ] Review the **Pending Review** section:
  - [ ] For each REQUESTED withdrawal, confirm the member's available balance supports the request
  - [ ] Approve legitimate requests
  - [ ] Reject requests that exceed available balance, with a clear explanation
- [ ] For APPROVED withdrawals that have been physically paid out, click **Mark as Paid** to close the loop

### Financial Health Indicators

| Metric | Healthy Range | Action if Outside Range |
|---|---|---|
| Net capital positive | > ₦0 | Review recent large loans vs. contribution inflows |
| Verification rate | > 80% | Check the unverified queue; are sign-ups being processed? |
| Overdue loan rate | < 10% of active loan portfolio | Escalate follow-up; consider policy review |
| Pending contributions | < 20 records by mid-month | Clear the queue; members are waiting |

---

## 5. Week 4 (Days 21–31): Month-End

The final week of the month is for reporting, record-keeping, and administrative housekeeping.

### Checklist

**Reporting:**
- [ ] Navigate to **Admin → Reports → Contributions** tab
- [ ] Review the contribution summary for the month: total verified, total rejected, per-member breakdown
- [ ] Navigate to **Admin → Reports → Financial** tab
- [ ] Click **Export PDF** to download the monthly financial overview — save this to your cooperative's records folder
- [ ] Click **↓ Export CSV** if you need a spreadsheet-compatible version for further analysis

**Audit Trail Review:**
- [ ] Navigate to **Admin → Reports → Audit Trail** tab
- [ ] Filter by the current month's date range
- [ ] Scan for any events that look unexpected:
  - Contribution verified or rejected by someone other than the usual reviewer
  - Loan approved outside normal working hours
  - Any `contribution_recorded_by_treasurer` events that you did not personally initiate
- [ ] If anything looks unusual, investigate before closing the month (see [22_COMPLIANCE_AUDIT.md](./22_COMPLIANCE_AUDIT.md) for guidance)

**Member Housekeeping:**
- [ ] Navigate to **Admin → Members → Unverified** (`/admin/members/unverified`)
- [ ] Process any members who have been waiting more than 48 hours for verification
- [ ] Navigate to **Admin → Members** and review the full member list:
  - [ ] Confirm all active members are in VERIFIED status
  - [ ] Note any members who have not contributed in multiple consecutive months

**Notification Log:**
- [ ] Navigate to **Admin → Notifications** (`/admin/notifications`)
- [ ] Review the pending loans queue to confirm no applications were missed
- [ ] If any loan has been in PENDING_ADMIN_REVIEW for more than 5 business days, take action this week

**Archive:**
- [ ] Save the exported PDF report with a filename such as `cooperative-report-2026-05.pdf`
- [ ] Store it in your shared records location (Google Drive, physical file, or as agreed by the board)

---

## 6. Quarterly Tasks

Perform these tasks at the end of each quarter (end of March, June, September, and December).

### Dividend Calculation and Distribution

- [ ] Obtain the net profit figure for the quarter from your financial records
- [ ] Navigate to **Admin → Dividends** and click **New Dividend Payout**
- [ ] Select the quarter (Q1/Q2/Q3/Q4) and the year
- [ ] Enter total profit, admin costs %, and loan loss reserve %
- [ ] Review the distribution preview — confirm each member's share looks proportional
- [ ] Click **Create Payout** to save in PENDING status
- [ ] Have the owner or a second admin review the figures independently
- [ ] Click **Approve** to move to APPROVED status
- [ ] Once funds are confirmed, click **Process** to distribute and notify all members
- [ ] After physical transfer, mark each corresponding withdrawal as PAID

**Recommended loan loss reserve percentages for Nigerian cooperatives:**

| Risk Profile | Recommended Reserve % |
|---|---|
| Strong repayment history, established membership | 10–15% |
| Mixed repayment performance or growing membership | 15–20% |
| New cooperative or high loan activity | 20–30% |

### Loan Portfolio Review

- [ ] Navigate to **Admin → Reports → Loans** tab
- [ ] Export the loan CSV and review:
  - [ ] Total number of active loans
  - [ ] Total outstanding balance
  - [ ] Loans overdue by more than 30 days
  - [ ] Loans overdue by more than 90 days (flagged by the daily cron)
- [ ] For each significantly overdue loan, prepare a follow-up plan:
  - [ ] Personal contact from admin or treasurer
  - [ ] Formal notice per your cooperative's bylaws
  - [ ] Consider restructuring repayment schedule if circumstances warrant
- [ ] Assess overall portfolio health — if defaults are rising, consider tightening borrowing criteria temporarily

### Settings Review

- [ ] Navigate to **Admin → Settings** (`/admin/settings`)
- [ ] Review **Loan Interest Rate** — is it still appropriate given current economic conditions?
- [ ] Review **Borrowing Multiplier** — does the ratio of contributions to loans feel right?
- [ ] Review **Repayment Duration** — is 12 months still the right default?
- [ ] Review **Grace Period Days** — is 30 days giving borrowers enough time?
- [ ] Review **Bank Accounts** — are the listed accounts still active and correctly labelled?
- [ ] Confirm the **Preferred Bank Account** is the current primary receiving account

> **Note:** Changes to interest rate and repayment months only affect new loans approved after the change. Existing active loans retain the rate locked in at their approval time.

### Member List Audit

- [ ] Navigate to **Admin → Members**
- [ ] Review the full member list — are all expected members present?
- [ ] Check for members who have not contributed in 3+ consecutive months — consider contacting them
- [ ] Review roles — are any members' roles incorrect (e.g., someone who was a TREASURER but is no longer in that position)?
- [ ] Check for any duplicate accounts (same person with two registrations)

### AGM Preparation (If Applicable)

If your cooperative holds a quarterly or half-year general meeting:

- [ ] Navigate to **Admin → Announcements → New**
- [ ] Set type to **AGM**, fill in the date, time, and location
- [ ] Enable **Allow members to RSVP** for attendance planning
- [ ] Enable **Pin to dashboard banner** (expires on the meeting date)
- [ ] Click **Create & Send** — all members are notified by email and SMS
- [ ] Prepare the meeting pack: export contribution report, loan portfolio, and financial overview PDFs from Admin → Reports

---

## 7. Annual Tasks

At the close of the financial year (typically December or whenever your cooperative's year ends), complete these tasks before starting the new year.

### Annual Dividend Payout

- [ ] Calculate the full-year net profit
- [ ] Navigate to **Admin → Dividends → New Dividend Payout**
- [ ] Select period **Annual** and the relevant year
- [ ] Enter the full-year figures (admin costs %, loan loss reserve %)
- [ ] Follow the same create → approve → process workflow as quarterly payouts
- [ ] Distribute physical payments and mark all as PAID

### Full Audit Trail Export

- [ ] Navigate to **Admin → Reports → Audit Trail**
- [ ] Set the date range to the full year (1 January to 31 December)
- [ ] Export the PDF for your official records
- [ ] For a complete data export beyond the 500-event display limit, contact the platform administrator or database administrator for a full database export

### Configuration Review for New Year

- [ ] Review all settings (see the quarterly settings review above)
- [ ] Update the cooperative's name, contact details, or currency settings if needed
- [ ] Confirm that bank account details are still accurate for the new year
- [ ] Reset or adjust any temporary settings that were put in place mid-year

### Backup Verification

- [ ] Confirm that automated Neon PostgreSQL backups are running (see [23_DISASTER_RECOVERY.md](./23_DISASTER_RECOVERY.md))
- [ ] Verify that S3 receipt files are accessible by spot-checking 5–10 recent receipt URLs
- [ ] Ensure all exported PDF reports from the year have been saved in a secure location

---

## 8. Decision Guide — Common Scenarios

The following scenarios arise regularly in Nigerian cooperative management. This guide provides a recommended response for each.

### Member Submits a Contribution with a Blurry or Unreadable Receipt

**Situation:** A member submits a ₦20,000 contribution with a receipt that is too dark, cropped, or blurry to verify.

**Action:** Reject with a specific reason. Example rejection message:
> "Receipt is not legible — the image is too blurry to confirm the amount and account details. Please resubmit with a clear photo of your payment confirmation. Ensure the amount, date, and beneficiary account number are all visible."

Do not ask the member to "just trust you" — the receipt requirement protects both the member and the cooperative from disputes.

---

### Loan Application from a Member with Insufficient Contributions

**Situation:** A member with ₦30,000 in verified contributions (borrowing capacity: ₦90,000 at 3× multiplier) applies for a ₦150,000 loan.

**Action:** The system will block the application at submission, but if it reaches your queue, reject it with an explanation:
> "Your current borrowing capacity is ₦90,000, calculated as your verified contributions of ₦30,000 multiplied by our borrowing multiplier of 3×. To qualify for ₦150,000, you would need at least ₦50,000 in verified contributions. Please continue contributing and reapply when your capacity is sufficient."

---

### Guarantor Has Not Responded in 7 or More Days

**Situation:** A loan application has been in PENDING_GUARANTORS for 10 days. One guarantor accepted, but the second (Emeka Nwosu) has not responded.

**Action:**
1. Contact Emeka directly — phone call, WhatsApp, or in person. Ask if he saw the notification. He may have missed the email or SMS.
2. Ask him to log in at `/dashboard/loans` and respond to the pending request.
3. If he is unable or unwilling to respond, advise the applicant that the loan may need to be cancelled and resubmitted with a different second guarantor.
4. There is no admin override to skip the guarantor stage — both responses are required by design.

---

### Member Requests a Withdrawal That Exceeds Their Available Balance

**Situation:** A member requests a ₦300,000 withdrawal, but their total verified contributions are ₦250,000 and they have an active loan with ₦80,000 still outstanding.

**Available balance:** ₦250,000 − ₦80,000 = ₦170,000

**Action:** Reject with explanation:
> "Your requested withdrawal of ₦300,000 exceeds your available balance. Your total verified contributions are ₦250,000, minus your outstanding loan balance of ₦80,000, leaving ₦170,000 available. You may submit a new request for up to ₦170,000, or clear more of your loan balance first."

---

### Member Claims Their Contribution Was Verified but Borrowing Capacity Did Not Update

**Situation:** A member says they can see "VERIFIED" in their contribution history but their borrowing capacity has not changed.

**Action:**
1. Navigate to **Admin → Contributions** and filter by the member. Confirm the contribution status is truly VERIFIED (not PENDING).
2. Navigate to **Admin → Settings** and check the current borrowing multiplier.
3. If the member has an active approved loan, the outstanding balance reduces their available borrowing headroom (not their total capacity, but the remaining amount they can apply for).
4. If everything looks correct but the member's dashboard still shows old data, ask them to refresh the page or clear their browser cache.

---

### Two Admins Disagree on Whether to Approve a Loan

**Situation:** One admin wants to approve, another wants to reject, a ₦500,000 loan application from a long-standing member.

**Action:** Escalate to the cooperative owner. In cooperative governance, significant decisions should be made with board consensus, not individual admin discretion. The owner has final authority over loan policy. In the meantime, leave the loan in PENDING_ADMIN_REVIEW — it will not time out or disappear.

---

*Last updated: May 2026. For technical support, contact the platform administrator. For compliance-related questions, see [22_COMPLIANCE_AUDIT.md](./22_COMPLIANCE_AUDIT.md).*
