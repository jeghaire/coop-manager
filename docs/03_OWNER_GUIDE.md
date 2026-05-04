# Owner Guide — Cooperative Manager

This guide is written for the **Owner** role: the person who created the cooperative on Cooperative Manager and holds ultimate authority over its configuration, finances, and membership. You understand finance and cooperative governance; this guide focuses on how to use the platform to its fullest.

---

## Table of Contents

1. [Owner Responsibilities Overview](#1-owner-responsibilities-overview)
2. [Cooperative Settings Configuration](#2-cooperative-settings-configuration)
3. [Bank Account Management](#3-bank-account-management)
4. [Member Roles and Permissions](#4-member-roles-and-permissions)
5. [Financial Dashboard Deep-Dive](#5-financial-dashboard-deep-dive)
6. [Advanced Reporting](#6-advanced-reporting)
7. [Dividend Distribution Process](#7-dividend-distribution-process)
8. [AGM Preparation](#8-agm-preparation)
9. [Risk Management](#9-risk-management)
10. [Compliance and Financial Controls](#10-compliance-and-financial-controls)
11. [Best Practices for Nigerian Savings Cooperatives](#11-best-practices-for-nigerian-savings-cooperatives)

---

## 1. Owner Responsibilities Overview

The Owner is the only role that cannot be assigned, changed, or removed by anyone else. It is permanently tied to the account that registered the cooperative.

### What Makes the Owner Role Different

Every other role — Admin, Treasurer, Member — can be changed by the Owner at will. The Owner role itself is immutable: it cannot be transferred, demoted, or deleted from within the application. If you need to transfer ownership, contact your system administrator directly.

### Exclusive Owner Capabilities

The following actions can only be performed by the Owner. Admins and Treasurers cannot access these functions:

- **Change Guarantor Coverage Mode** — the rule governing how guarantors' contributions are validated against a loan amount
- **Manage bank accounts** — adding, deleting, and setting the preferred account that members see when making contributions
- **Promote members to Admin** — only the Owner can elevate someone to the Admin role
- **Change any member's role** — including demoting an Admin back to Member
- **Change the cooperative's currency** — currency code and symbol used across the entire platform

Admins share most other capabilities with the Owner (loan review, member management, reports, dividends) but cannot touch settings that affect the fundamental financial rules of the cooperative.

---

## 2. Cooperative Settings Configuration

Navigate to **Admin → Settings** (`/admin/settings`) to manage all cooperative-level rules.

### 2.1 Currency Setup

The platform defaults to **Nigerian Naira (₦ / NGN)** but fully supports any currency.

| Field | Purpose | Example |
|---|---|---|
| Currency Code | ISO 4217 three-letter code | `NGN`, `GHS`, `KES`, `USD` |
| Currency Symbol | Symbol displayed before amounts | `₦`, `GH₵`, `KSh`, `$` |

**To change currency:**
1. Go to Admin → Settings → Loan Settings section
2. Update both the Currency Code and Currency Symbol fields
3. Click **Save Loan Settings**

> **Important:** Changing the currency does not convert existing monetary values in the database. It only changes the symbol displayed. Make this change before any financial activity begins, or coordinate a clear cutover date with members.

### 2.2 Borrowing Multiplier

The borrowing multiplier determines how much a member can borrow relative to their verified contribution balance.

> **Formula:**
> `Maximum Loan Amount = Total Verified Contributions × Borrowing Multiplier`

**Example at the default 3× multiplier:**

| Member | Total Verified Contributions | Maximum Loan Amount |
|---|---|---|
| Amaka | ₦100,000 | ₦300,000 |
| Emeka | ₦50,000 | ₦150,000 |
| Ngozi | ₦200,000 | ₦600,000 |

Only **verified** contributions count toward borrowing capacity. Contributions still pending verification do not increase a member's limit until an Admin or Treasurer marks them as verified.

> **Note:** The borrowing multiplier is currently read-only in the settings page (displayed as "Coming soon"). The default value of 3× is applied at cooperative creation. Contact your system administrator if you need to change the multiplier.

### 2.3 Loan Interest Rate

The interest rate is applied as **simple interest at the time of loan approval**, not compound interest. The full interest amount is calculated once and added to the principal.

> **Formula:**
> ```
> Interest Amount  = Principal × (Interest Rate / 100)
> Total Amount Due = Principal + Interest Amount
> ```

**Example at the default 10% rate:**

| Principal | Interest (10%) | Total Due |
|---|---|---|
| ₦100,000 | ₦10,000 | ₦110,000 |
| ₦250,000 | ₦25,000 | ₦275,000 |
| ₦500,000 | ₦50,000 | ₦550,000 |

The interest rate you set applies to **all new loans approved after the change**. Existing approved loans keep the rate that was in effect when they were approved.

To update: Admin → Settings → Loan Settings → **Interest Rate (%)** field → Save.

### 2.4 Loan Repayment Months

This setting controls how many monthly instalments a loan is divided into.

> **Formula:**
> `Monthly Payment = Total Amount Due / Repayment Months`

**Example: ₦110,000 total due over 12 months:**

`Monthly Payment = ₦110,000 / 12 = ₦9,167 per month`

**Example: ₦110,000 total due over 6 months:**

`Monthly Payment = ₦110,000 / 6 = ₦18,333 per month`

Shorter repayment periods mean higher monthly instalments but less time money is tied up. Longer periods ease the burden on members but slow the return of capital to the pool.

The system generates a full repayment schedule automatically when a loan is approved. Members can track their schedule on the **My Loans** page.

### 2.5 Default Grace Period

The grace period is the number of days after a payment is missed before the system flags a loan as **Defaulted** rather than merely **Behind**.

**How it works:**
- If a member is behind on payments but within the grace period: status is **BEHIND**
- If a member has exceeded the grace period with no payment: status is **DEFAULTED**
- The daily cron job (`/api/cron/check-overdue`) evaluates every active loan and sends payment overdue notifications for BEHIND and DEFAULTED loans

At the default 30-day grace period:
- Day 1–30 past due: member receives overdue notifications; status shown as BEHIND
- Day 31+: loan is flagged as DEFAULTED in reports; overdue notifications continue

To update: Admin → Settings → Loan Settings → **Grace Period (days)** field → Save.

A grace period of 0 means any missed payment immediately counts as a default. This is very strict and not recommended for most cooperatives. A period of 30–60 days is standard practice.

### 2.6 Guarantor Coverage Mode

Guarantors provide a social guarantee for loan repayment. The coverage mode determines whether the system enforces a financial backstop requirement on top of the social guarantee.

| Mode | Description | Behaviour |
|---|---|---|
| **OFF** | No coverage check | Any verified member can be selected as a guarantor. The system does not check their contribution balance. |
| **COMBINED** | Combined coverage required | The sum of both guarantors' verified contributions must be greater than or equal to the loan amount. |
| **INDIVIDUAL** | Individual coverage required | Each guarantor must individually have verified contributions greater than or equal to the loan amount. |

**Choosing the right mode:**

| Mode | Pros | Cons |
|---|---|---|
| OFF | Maximum flexibility; easy to find guarantors | No financial backstop; relies entirely on social trust |
| COMBINED | Practical for most cooperatives; two guarantors together can cover larger loans | Possible for one guarantor to carry most of the coverage burden |
| INDIVIDUAL | Strongest protection; each guarantor fully covers the loan | Hard to find guarantors for large loans; can block legitimate applications |

**Recommendation for most cooperatives:** Use **COMBINED** mode. It balances member accessibility with meaningful financial accountability.

To change: Admin → Settings → Loan Rules section → Guarantor Coverage Mode → Select mode → Save.

> Only the Owner can change the Guarantor Coverage Mode. Admins can view the current setting but cannot change it.

---

## 3. Bank Account Management

The bank accounts you add here are displayed to members on the **Cooperative Details** page and referenced in any payment instructions sent by the system. Members use these account details when making contribution transfers.

### Adding a Bank Account

1. Navigate to Admin → Settings → Bank Accounts section
2. Scroll down to the **Add Bank Account** form
3. Enter:
   - **Account Name** — the registered name on the account (e.g., "XYZ Savings Cooperative")
   - **Account Number** — the full bank account number
   - **Bank Name** — the name of the bank (e.g., "First Bank Nigeria")
4. Click **Add Account**

The account appears in the accounts table immediately.

### Setting the Preferred Account

You can add multiple bank accounts (for example, a primary account and a backup). The **preferred account** is displayed most prominently to members.

To set a preferred account:
1. Find the account in the table
2. Click **Set as Preferred** in the Actions column

Only one account can be preferred at a time. Setting a new preferred account automatically un-marks the previous one.

### Removing a Bank Account

Click the **Delete** button next to the account in the table. The system will ask for confirmation.

> Do not remove an account while members have pending contributions referencing it. Verify with your Treasurer that no in-flight payments are pending to that account before removing it.

### Member-Facing Display

Members see the cooperative's bank accounts on:
- **Dashboard → Cooperative Details** (`/dashboard/cooperative-details`)
- Any system-generated payment instruction emails

The preferred account is shown first and highlighted. Members should reference the account details exactly as shown when making bank transfers.

---

## 4. Member Roles and Permissions

### Role Overview

| Permission | OWNER | ADMIN | TREASURER | MEMBER |
|---|---|---|---|---|
| Change cooperative settings | Yes | Partial* | No | No |
| Change Guarantor Coverage Mode | Yes | No | No | No |
| Manage bank accounts | Yes | No | No | No |
| Change any member's role | Yes | No | No | No |
| Invite new members | Yes | Yes | No | No |
| Import members via CSV | Yes | Yes | No | No |
| Remove members | Yes | Yes | No | No |
| Verify/reject contributions | Yes | Yes | Yes | No |
| Record contributions manually | Yes | Yes | Yes | No |
| Record loan repayments | Yes | Yes | Yes | No |
| Review and approve loans | Yes | Yes | No | No |
| Manage dividend distributions | Yes | Yes | No | No |
| Approve withdrawal requests | Yes | Yes | No | No |
| View all member financial reports | Yes | Yes | No | No |
| View audit trail | Yes | Yes | No | No |
| Submit own contributions | Yes | Yes | No | Yes |
| Apply for loans | Yes | Yes | No | Yes |
| View own transactions | Yes | Yes | Yes | Yes |
| Update own profile/notifications | Yes | Yes | Yes | Yes |

*Admins can update loan interest rate, repayment months, grace period, and currency — but cannot change the Guarantor Coverage Mode or bank accounts.

### Promoting a Member

1. Navigate to **Admin → Members** (`/admin/members`)
2. Find the member in the list
3. Click the role dropdown next to their name
4. Select the new role (**TREASURER** or **ADMIN**)
5. Confirm

> Only the Owner can assign the ADMIN role. An Admin can invite new members as Treasurer or Member, but cannot make someone an Admin.

### Demoting Back to Member

Follow the same process and select **MEMBER** from the role dropdown. The change takes effect immediately — the demoted user's next page load will reflect their reduced permissions.

### Protecting the Owner Role

The Owner role cannot be changed by anyone, including the owner themselves. You cannot demote yourself. You cannot accidentally lose owner-level access through the UI.

---

## 5. Financial Dashboard Deep-Dive

Navigate to **Admin → Reports** (`/admin/reports`) for the full financial picture.

### 5.1 Understanding the Key Metrics

**Total Contributed (Verified)**
The sum of all contribution amounts with status VERIFIED. This is the real money the cooperative has collected. Pending contributions are not included here because they have not yet been confirmed by the Treasurer or Admin.

**Total Loaned Out**
The sum of all loan amounts with status APPROVED (not yet fully repaid). This money has left the cooperative's pool and is in members' hands.

**Available Funds**
> `Available Funds = Total Verified Contributions − Total Loaned Out`

This is the liquid capital the cooperative can deploy for new loans. If this number is negative, the cooperative has approved more loans than it has verified contributions to back — an urgent risk signal.

**Pending Contributions**
The total amount of contributions awaiting verification. This money has been claimed by members but not yet confirmed. Do not treat this as available — instruct your Treasurer to verify promptly.

**Loans in Pipeline**
Loans with status PENDING_GUARANTORS or PENDING_ADMIN_REVIEW. These represent future lending commitments. Factor them into your Available Funds assessment when deciding whether to approve further loans.

**Monthly Target**
The sum of all members' individual monthly contribution targets as configured in their profiles. Compare this to actual monthly verified contributions to assess collection efficiency.

### 5.2 Fund Health Bar Chart

The Fund Health visual on the reports page shows three bars as a percentage of total verified contributions:

- **Contributions (100%)** — your baseline
- **Loaned Out** — the percentage of contributions currently deployed as loans
- **Available** — the percentage remaining as liquid capital

A healthy cooperative typically keeps the Loaned Out bar below 70–75%, leaving a buffer for withdrawals, emergencies, and new loan demand. If the Loaned Out bar reaches 90%+, pause approving new loans until repayments bring it back down.

### 5.3 Aggregate Borrowing Capacity

Although individual borrowing capacity is shown per member (total verified contributions × borrowing multiplier), you can estimate cooperative-wide demand by multiplying total verified contributions by the multiplier. At 3×, a cooperative with ₦5,000,000 in verified contributions has an aggregate borrowing capacity of ₦15,000,000 — but this does not mean all members will draw their full capacity simultaneously.

### 5.4 Default Risk Indicator

A loan is considered in default (no repayment in 90+ days without any payment) when the system's health check shows `daysOverdue > 0` beyond the grace period. Monitor the Reports → Loans section for the **Default Count** figure. Any defaults above zero warrant personal follow-up with the member before escalating to guarantors.

---

## 6. Advanced Reporting

Navigate to **Admin → Reports** (`/admin/reports`).

### 6.1 Report Sections

| Tab/Section | Contents |
|---|---|
| Overview | Total contributions, outstanding loans, available funds, member counts, fund health bar |
| Loan Decisions | Portfolio breakdown: approved/rejected counts, approval rate, decisions by admin, top rejection reasons, full decision log |
| Dividend Snapshot | Contribution breakdown per member with percentage share — the foundation of dividend calculations |
| Audit Trail | Filterable log of all system events (last 500 entries) |

### 6.2 Running Quarterly and Annual Reports

**For a quarterly board presentation:**

1. Go to Admin → Reports → Overview
2. Note Total Contributed, Total Loaned Out, Available Funds, and Monthly Target
3. Go to Loan Decisions — note the approval rate and total approved amount for the period
4. Go to Dividend Snapshot — note the member contribution percentages (useful for dividend planning)
5. Click **Export PDF** (landscape A4) for the cooperative-level report

The PDF export generates a printable report with the cooperative name, all key statistics, and the date of generation. This is suitable for board meetings and regulatory filings.

**For member financial statements:**

Each member can generate their own portrait-format PDF financial statement from their dashboard. As Owner, you can also produce these on behalf of members if needed by navigating to their profile.

### 6.3 Interpreting Loan Portfolio Analysis

In the Loan Decisions section:

- **Approval Rate** — a rate above 90% may indicate insufficient scrutiny; below 60% may indicate overly restrictive criteria
- **Decisions by Admin** — compare approval rates across admins; significant variation may indicate inconsistent policy application
- **Top Rejection Reasons** — if one reason dominates, consider whether the application process provides enough guidance to members upfront

### 6.4 Contribution Verification Rates

In the Overview section, compare:
- **Pending Contributions count** vs **Verified count**

A large pending backlog (more than 2 weeks of submissions) signals that your Treasurer needs to increase verification frequency. Unverified contributions are invisible to the borrowing capacity calculation, which can frustrate members who expect their limit to have increased.

### 6.5 Audit Trail

The audit trail records every significant event in the system. Use it to:
- Verify that a specific action was taken on a given date
- Investigate discrepancies in member balances
- Demonstrate compliance to regulators

Filter by event type (e.g., `loan_approved`, `contribution_verified`, `dividend_payout_processed`) and date range. The trail shows the actor, entity, and full data payload for each event.

---

## 7. Dividend Distribution Process

Dividend distribution is performed at **Admin → Dividends** (`/admin/dividends`). The process has three stages: PENDING → APPROVED → PAID.

### 7.1 Understanding the Dividend Formula

> **Formula:**
> ```
> Admin Costs    = Total Profit × (Admin Costs % / 100)
> Loan Reserve   = Total Profit × (Loan Loss Reserve % / 100)
> Dividend Pool  = Total Profit − Admin Costs − Loan Reserve
>
> Member Share   = (Member's Verified Contributions / Total Cooperative Contributions) × Dividend Pool
> ```

**Example:**

| Input | Value |
|---|---|
| Total Profit (Q4) | ₦2,000,000 |
| Admin Costs (10%) | ₦200,000 |
| Loan Loss Reserve (20%) | ₦400,000 |
| **Dividend Pool** | **₦1,400,000** |

If Amaka has ₦200,000 in verified contributions out of a cooperative total of ₦2,000,000 (10% share):

`Amaka's Dividend = 10% × ₦1,400,000 = ₦140,000`

### 7.2 End-to-End Walkthrough

**Step 1 — Confirm your profit figure**

Before creating a payout, reconcile your cooperative's financial records for the period. The Total Profit figure you enter is taken at face value; the system does not calculate profit itself. Obtain this figure from your accounting records, bank statements, or auditor.

**Step 2 — Determine deduction percentages**

- **Admin Costs %** — operational expenses as a percentage of profit (staff costs, platform fees, printing, etc.). Typical range: 5–15%.
- **Loan Loss Reserve %** — money set aside to absorb defaults. Typical range: 10–25%. A higher reserve is prudent if your default rate is elevated.

The form shows a live preview of the pool as you type.

**Step 3 — Create the payout**

1. Navigate to Admin → Dividends → **New Dividend Payout**
2. Select the **Period** (Q1, Q2, Q3, Q4, or Annual) and **Year**
3. Enter **Total Profit**
4. Enter **Admin Costs %** and **Loan Loss Reserve %**
5. Review the Distribution Preview panel — confirm the Dividend Pool figure
6. Click **Create Payout**

The system calculates each member's share based on their verified contribution percentage at the moment of creation and records the payout in PENDING status.

**Step 4 — Review member shares**

After creating the payout, it appears in the Payout History table. Review the member dividend breakdown (accessible via the payout detail) to confirm allocations look correct before approving.

**Step 5 — Approve the payout**

Click **Approve** next to the PENDING payout. This moves the status to APPROVED. An approval is recorded in the audit trail with the approver's identity and timestamp. Two-eyes review is recommended: have a second Admin or the Owner review before approving.

**Step 6 — Process the payout**

Once approved, click **Process** to finalise. This:
- Marks all member dividends as PAID
- Stamps the payout with the current date/time as `paidAt`
- Sends each member a dividend notification (in-app and email if enabled)
- Records a `dividend_payout_processed` event in the audit trail

**Step 7 — Verify notifications sent**

Navigate to Admin → Notifications or check the audit trail for `dividend_payout_processed`. Review the Notifications section to confirm delivery to members. If a member reports not receiving their notification, check their notification preferences in their profile.

> **Important:** The system records the processing and sends notifications, but it does not transfer funds. Actual bank transfers to members must be made manually outside the platform based on the member dividend amounts shown in the payout detail. Use the Dividend Snapshot report to get a printable breakdown.

### 7.3 Correcting a Dividend Payout

Once a payout is PAID, it cannot be reversed in the UI. If you made an error:
1. Contact your system administrator to make a direct database correction
2. Create a compensating payout in the next period with an offsetting note
3. Document the correction in the audit trail by adding a note through the admin panel

---

## 8. AGM Preparation

Annual General Meetings (AGMs) require advance notice, documentation, and attendance tracking. Cooperative Manager supports all three.

### 8.1 Creating an AGM Announcement

1. Navigate to the Announcements section (accessible via Admin panel or API)
2. Create a new announcement with **Type: AGM**
3. Fill in:
   - **Title** — e.g., "Annual General Meeting 2026"
   - **Message** — agenda, background information, any resolutions to be voted on
   - **AGM Date** — the scheduled date and time
   - **AGM Location** — physical address or virtual meeting link
   - **Allow RSVP** — check this to enable member attendance confirmation
   - **Recipient Type** — typically ALL
4. Set **Expiry Date** to the day after the AGM so the notice disappears automatically

### 8.2 Tracking Attendance

When Allow RSVP is enabled, members can respond ATTENDING, NOT ATTENDING, or MAYBE from their dashboard. Review RSVP counts to plan catering, venue capacity, and quorum estimates.

### 8.3 Generating Compliance Reports for the AGM

For a complete AGM financial pack, generate the following reports:

| Report | Location | Format | Purpose |
|---|---|---|---|
| Overview | Admin → Reports → Overview → Export PDF | Landscape A4 | Board-level financial summary |
| Loan Decisions | Admin → Reports → Loan Decisions | On-screen / PDF | Lending activity for the year |
| Dividend Snapshot | Admin → Reports → Dividend Snapshot | On-screen / CSV | Per-member contribution and dividend share |
| Annual Dividend Payout | Admin → Dividends → History | On-screen | Profit distribution record |
| Audit Trail | Admin → Reports → Audit Trail (full year) | On-screen | Governance and compliance evidence |

### 8.4 Audit Trail for the Board

Filter the audit trail (Admin → Reports → Audit Trail) by the full AGM period (e.g., 1 January to 31 December). Key event types to include in board packs:

| Event Type | Significance |
|---|---|
| `loan_approved` / `loan_rejected` | Lending governance |
| `contribution_verified` | Collection diligence |
| `dividend_payout_processed` | Profit distribution |
| `member_invited` / `member_removed` | Membership changes |
| `member_role_changed` | Role governance |

Export or screenshot the filtered audit trail to include in board minutes.

---

## 9. Risk Management

### 9.1 Interpreting the Default Count

In Admin → Reports → Loan Decisions, the **Default Count** tracks loans with no repayment activity for 90+ days. This is a lagging indicator — by the time a loan appears here, the member has already missed three months of payments.

**Action thresholds:**

| Default Count | Recommended Action |
|---|---|
| 0 | Monitor normally |
| 1–2 | Personal contact with member and guarantors; review repayment plan |
| 3–5 | Escalate to board; consider suspending new loans until defaults are resolved |
| 6+ | Conduct full portfolio review; consider engaging guarantors formally |

### 9.2 Understanding At-Risk Loans

A loan is "at risk" when its health status shows BEHIND or DEFAULTED. The loan health calculation:

1. Calculates the expected paid amount based on months elapsed since approval
2. Compares it to actual payments made
3. If behind, measures how many days since the last expected payment date
4. Compares days past due against the grace period

Review the individual loan detail pages (Admin → Loans) to see the health status of each active loan. Loans with status DEFAULTED should prompt immediate action.

### 9.3 Loan-to-Contribution Ratios

Monitor the ratio of Total Loaned Out to Total Verified Contributions (visible in Admin → Reports → Overview):

| Ratio | Interpretation |
|---|---|
| Below 50% | Conservative; significant capacity available |
| 50–70% | Healthy operating range |
| 70–80% | Caution; approaching capacity limit |
| 80–90% | High utilisation; approve loans selectively |
| Above 90% | Critical; pause new approvals |

### 9.4 Adjusting Multiplier and Interest for Risk

If your default rate is rising:

1. **Tighten the interest rate** — a higher rate increases the total cost to the borrower, which may deter over-borrowing (but increases default risk on existing loans; changes only affect new loans)
2. **Reduce the repayment period** — shorter repayment means higher monthly instalments, which screens out borrowers who cannot sustain them
3. **Increase the grace period** — a longer grace period reduces unnecessary default flags during genuine short-term cash flow problems
4. **Switch to INDIVIDUAL guarantor mode** — requires each guarantor to individually cover the loan amount, providing stronger financial backstops for high-risk periods
5. **Require more verified contributions** before approving loans — achieved by having Treasurers increase verification diligence

---

## 10. Compliance and Financial Controls

### 10.1 Monthly Audit Trail Review

Schedule a monthly review of the audit trail as a control activity:

1. Go to Admin → Reports → Audit Trail
2. Filter to the previous calendar month
3. Review for:
   - Any unusual role changes (`member_role_changed`)
   - Settings changes (`loan_settings_updated`)
   - Large loans approved (`loan_approved` with high amounts)
   - Any dividend payouts not recognised by you (`dividend_payout_processed`)

Document the review date and your sign-off in the cooperative's minute book.

### 10.2 Self-Approval Prevention

The system enforces a self-approval restriction: an Admin or Owner who submits a contribution cannot verify their own contribution. Similarly, loan reviewers are recorded by name in the audit trail, creating an accountability record.

For additional separation of duties:
- Assign different people to the Treasurer role (who can verify contributions) and the Admin role (who can approve loans)
- Do not have the same person both invite a member and approve that member's first loan in a way that bypasses normal scrutiny

### 10.3 Record Retention

The platform stores:
- All contributions with receipt images uploaded to AWS S3
- All loan applications with full history
- All repayments with payment details
- All dividend payouts and per-member allocations
- Full audit trail of system events

For Nigerian cooperative regulations, retain all records for a minimum of 6 years. The audit trail export and PDF reports serve as your primary compliance documentation. Back up the PDF exports to a secure offline location annually.

### 10.4 Data Integrity Checks

Perform these checks quarterly:

1. **Contribution count** — does the number of verified contributions in reports match your physical receipt records?
2. **Loan balance** — does Total Loaned Out match the sum of outstanding loan principals in your manual ledger?
3. **Member count** — does the member count in reports match your membership register?
4. **Dividend trail** — does each processed dividend payout have a corresponding bank transfer out of the cooperative account?

Any discrepancy should be investigated and resolved before the next board meeting.

---

## 11. Best Practices for Nigerian Savings Cooperatives

### 11.1 Contribution Frequency Recommendations

| Cooperative Size | Recommended Frequency | Reasoning |
|---|---|---|
| Under 20 members | Monthly | Manageable verification load for Treasurer |
| 20–50 members | Monthly (biweekly optional) | Balance between capital accumulation and admin workload |
| 50–100 members | Monthly with biweekly option | Larger capital pool benefits from more frequent deployment |
| 100+ members | Biweekly or weekly | Frequent small contributions spread default risk |

Set each member's `monthlyContributionAmount` when inviting them. This feeds the Monthly Target figure on the dashboard, allowing you to monitor collection efficiency.

### 11.2 Loan-to-Savings Ratio Guidance

Nigerian cooperative regulations and best practice generally recommend:

- **Maximum individual loan:** 3× the member's personal verified contributions (the default borrowing multiplier)
- **Cooperative-wide deployment:** no more than 70–75% of total verified contributions deployed as outstanding loans
- **Single-member concentration:** no single member's outstanding loan should exceed 20% of total cooperative funds

The platform enforces the individual limit automatically via the borrowing multiplier. The cooperative-wide and concentration limits require manual monitoring using the Reports dashboard.

### 11.3 Documentation Requirements

For a properly governed cooperative in Nigeria:

**At member onboarding:**
- Completed membership form (kept offline; name/email/monthly amount recorded in system)
- Signed cooperative rules/bye-laws acknowledgement
- Valid government-issued ID

**At each loan:**
- Loan application (recorded in system)
- Guarantor consent forms (recorded in system; guarantors respond via their accounts)
- Loan agreement signed by borrower (keep offline; reference loan ID from system)

**At each dividend:**
- Board resolution approving the profit split percentages (use the AGM meeting minutes)
- Dividend schedule printed from system (the Dividend Snapshot report)
- Evidence of bank transfers to members (keep bank receipts)

**Annually:**
- Audited financial statements prepared by a qualified accountant
- AGM minutes including attendance record and resolutions passed
- Regulatory filing with the relevant state/federal cooperative authority

### 11.4 Handling Late Contributions

When a member consistently misses monthly contributions:

1. The Treasurer should flag the member via a direct message or phone call
2. Check the member's contribution history on their profile page
3. If the member cannot pay the current amount, consider temporarily adjusting their `monthlyContributionAmount` to a reduced amount via Admin → Members → Edit Member
4. If three consecutive months are missed without communication, bring to the board for a decision on membership status

The system does not automatically suspend borrowing privileges for missed contributions, but you can use the Loan Review process to decline applications from members with poor contribution records.

### 11.5 Seasonal Cash Flow Management

Nigerian savings cooperatives often see higher loan demand in:
- Q4 (October–December) — school fees, festive spending, year-end expenses
- Q2 (April–June) — school fees resumption, agricultural inputs

Plan your lending capacity ahead of these periods. Avoid approving loans that would push your loan-to-contribution ratio above 75% entering high-demand periods. Encourage members to increase contributions in the low-demand months (typically Q1 and Q3) to build capacity.
