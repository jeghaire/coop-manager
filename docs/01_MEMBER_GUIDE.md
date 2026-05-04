# Cooperative Manager — Member Guide

Welcome to Cooperative Manager, the platform your cooperative uses to manage contributions, loans, dividends, and announcements. This guide walks you through everything you need to know as a member — from signing up for the first time to requesting a withdrawal.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Making Contributions](#2-making-contributions)
3. [Loan Application](#3-loan-application)
4. [Guarantor Responsibilities](#4-guarantor-responsibilities)
5. [Repaying Loans](#5-repaying-loans)
6. [Financial Dashboard](#6-financial-dashboard)
7. [Announcements & RSVPs](#7-announcements--rsvps)
8. [Withdrawals](#8-withdrawals)
9. [Notification Preferences](#9-notification-preferences)
10. [Troubleshooting](#10-troubleshooting)
11. [FAQ](#11-faq)

---

## 1. Getting Started

### Creating Your Account

1. Open your browser and go to the cooperative's sign-up page at **/auth/signup**.
2. Fill in your **Full Name**, **Email address**, and a **Password** (minimum 8 characters).
3. Select your cooperative from the **Cooperative** dropdown. If your cooperative does not appear in the list, contact your administrator — they may need to add you directly.
4. Click **Create Account**.
5. You will be redirected to your dashboard. Your account is created but is not yet verified.

### What Happens While You Are Unverified

After signing up, your account starts in an **unverified** state. While unverified:

- You can view the dashboard but cannot submit contributions or apply for loans.
- A notice on your dashboard will explain that your account is pending verification.
- An administrator will review your details and verify your account. You will receive an email and SMS notification once your account is approved.

### Getting Verified

You do not need to do anything extra to trigger verification — your administrator will see your account in their verification queue and review it. If your verification is taking longer than expected:

- Contact your cooperative administrator directly.
- Ensure you signed up with the correct cooperative selected.

Once verified, all features unlock and you can begin making contributions and applying for loans.

---

## 2. Making Contributions

Contributions are the regular payments you make to the cooperative. Each contribution must be verified by an administrator before it counts toward your balance and borrowing capacity.

### Payment Methods

The platform supports three payment methods:

- **Bank Transfer** — Transfer directly to the cooperative's bank account and upload your receipt.
- **Mobile Money** — Pay via mobile money and upload proof of payment.
- **Cash** — Pay cash directly. Ask your treasurer to record the payment on your behalf, or upload a signed receipt if one is provided.

### Submitting a Contribution Step-by-Step

1. From your dashboard, click **Submit Contribution** in the Quick Actions section, or navigate to **Dashboard → Contributions → Submit New**.
2. Enter the **Amount** you are paying (in ₦).
3. Select your **Payment Method** from the dropdown (Bank Transfer, Mobile Money, or Cash).
4. Optionally, upload your **Receipt**:
   - Click the file chooser button.
   - Select a JPEG, PNG, WEBP, PDF, or HEIC file (maximum **10 MB**).
   - The filename will appear below the input once selected.
5. Click **Submit Contribution**.
6. If a receipt file was attached, the system uploads it securely to cloud storage before saving your submission. A brief "Uploading…" message is shown during this step.
7. Once submitted, you are redirected to **Dashboard → Contributions**, where your new submission appears with the status **Pending Verification**.

> **Tip:** Always upload a receipt. Submissions with a receipt are easier for administrators to verify quickly.

### What Happens After Submission

After you submit:

- Your contribution enters the **PENDING_VERIFICATION** status.
- An administrator or treasurer will review it, check the receipt, and either verify or reject it.
- You will receive an **email and SMS** notification once a decision is made.
- Verified contributions are added to your **Total Contributed** balance immediately and increase your borrowing capacity.
- If rejected, the email notification will include the reason. You can then submit a corrected contribution.

### Checking Your Contribution Status

Navigate to **Dashboard → Contributions** to see a full list of your contributions and their current status. Each entry shows the amount, payment method, date, and status badge (Pending, Verified, or Rejected).

---

## 3. Loan Application

### Eligibility Requirements

Before you can apply for a loan, you must meet all of the following conditions:

- Your account must be **verified** by an administrator.
- You must have **at least one verified contribution** on record.
- You must nominate **two guarantors** who are verified cooperative members (not yourself, and not administrators or owners).
- The loan amount must not exceed your **borrowing capacity** (your total verified contributions multiplied by the cooperative's borrowing multiplier, which defaults to 3×).

### Understanding Borrowing Capacity

Your borrowing capacity is calculated as:

> **Borrowing Capacity = Total Verified Contributions × Borrowing Multiplier**

For example, if you have contributed ₦50,000 and the multiplier is 3×, your borrowing capacity is ₦150,000. You can view your exact borrowing capacity on the **Financial Summary** page.

### Choosing Your Guarantors

A guarantor is a verified member who agrees to back your loan. You need exactly two guarantors. Keep in mind:

- Guarantors must be other verified members — you cannot guarantee your own loan.
- Administrators and owners cannot act as guarantors.
- Depending on your cooperative's settings, your guarantors may need to have sufficient contributions of their own:
  - **OFF mode:** No coverage requirement — any two verified members qualify.
  - **COMBINED mode:** The combined total of both guarantors' verified contributions must be at least equal to your loan amount.
  - **INDIVIDUAL mode:** Each guarantor individually must have verified contributions equal to or exceeding your loan amount.
- The application form shows a hint explaining which mode is active.

### Applying for a Loan Step-by-Step

1. Navigate to **Dashboard → Loans → Apply for a Loan**, or click **Apply for a Loan** from the Quick Actions on your dashboard.
2. Enter the **Amount** you wish to borrow. The form shows your maximum borrowing capacity.
3. Optionally, enter a **Purpose** — a brief description of what the loan is for (e.g., "School fees", "Medical expenses").
4. Select your **First Guarantor** from the dropdown list of eligible members.
5. Select your **Second Guarantor** from the dropdown. The two guarantors cannot be the same person.
6. Click **Submit Application**.
7. You are redirected to **Dashboard → Loans**, where your new application appears.

### What Happens Next

After submission, your loan goes through two stages:

**Stage 1 — Guarantor Review (PENDING_GUARANTORS)**
- Both nominated guarantors receive an email and SMS notification asking them to respond.
- Each guarantor must log in and either accept or decline your request.
- If both guarantors accept, the loan moves to Stage 2 automatically.
- If either guarantor declines, you will be notified and the loan will not proceed. You can then submit a new application with different guarantors.

**Stage 2 — Admin Review (PENDING_ADMIN_REVIEW)**
- An administrator reviews your application, your contribution history, and the guarantors.
- If approved: you receive an email and SMS notification. The loan is marked **APPROVED** and funds are released according to your cooperative's process.
- If rejected: you receive an email with the reason.

You can track the current stage of any loan application from **Dashboard → Loans**.

---

## 4. Guarantor Responsibilities

### What It Means to Be a Guarantor

When another member names you as a guarantor on their loan application, you are being asked to vouch for them. If the cooperative has guarantor coverage requirements, your verified contribution total is also used to determine whether the loan is adequately backed.

Being a guarantor is a responsibility you should take seriously. If the borrower fails to repay, you may be asked to assist depending on your cooperative's rules.

### How You Are Notified

When a member nominates you as a guarantor, you will receive an **email and SMS** notification. Additionally, an amber alert banner will appear at the top of your dashboard showing the number of pending guarantor requests.

### How to Accept or Decline

1. On your dashboard, click **Review** in the amber alert banner, or navigate to **Dashboard → Loans**.
2. Find the loan application that requires your response. It will be listed under pending guarantor requests.
3. Open the application to view the borrower's name, requested amount, and loan purpose.
4. Click **Accept** to agree to be a guarantor, or **Decline** to refuse.
5. If you click **Decline**, a text area will appear — you must enter a reason for declining before the form can be submitted.
6. Click **Submit** to confirm your response.

Your response is recorded immediately and the applicant is notified. Once both guarantors have responded and both accepted, the loan moves to admin review automatically.

---

## 5. Repaying Loans

### Where to Make Repayments

Navigate to **Dashboard → Loans**, then click on the loan you want to repay. The loan detail page shows the total amount due, all repayments recorded so far, and the remaining balance.

Click **Make a Repayment** to open the repayment form.

### The Repayment Form

The member repayment form has two fields:

- **Loan Repayment** — The amount to apply toward your outstanding loan balance.
- **Monthly Contribution (optional)** — If you also want to record a monthly contribution at the same time, enter that amount here. Contributions entered this way are verified immediately without going through the normal approval process.

You can submit either field independently. For example, you can make a contribution without any loan repayment, or pay toward your loan without making a contribution.

### Partial Payments

You are not required to pay the full remaining balance at once. You can make as many partial payments as needed. Each payment reduces the outstanding balance shown on the loan detail page. The remaining balance is displayed at the top of the repayment form before you submit.

### When a Loan Is Marked as Repaid

Once the total amount repaid equals or exceeds the total amount due (principal + interest), the loan is automatically marked as **REPAID**. The loan will no longer appear in your active loans and your borrowing capacity is restored.

> **Note on interest:** The total amount due is calculated as: Principal + (Principal × Interest Rate ÷ 100). For example, a ₦100,000 loan at 10% interest = ₦110,000 total due.

---

## 6. Financial Dashboard

### The Financial Summary Page

Navigate to **Dashboard → Financial Summary** (or click **Financial Summary** from the Quick Actions panel) to see your complete financial position in one place.

### The Four Stat Cards

| Card | What It Shows |
|---|---|
| **Total Contributed** | The sum of all your verified contributions |
| **Active Loan Balance** | The remaining amount due on your current approved loan, or "None" if you have no active loan |
| **Borrowing Capacity** | Your total contributions × the cooperative's multiplier; the sub-label shows how much you can still borrow |
| **Pending Dividend / Dividends Received** | If a dividend payout is pending, shows that amount; otherwise shows all dividends received to date |

### The Detailed Breakdown

Below the stat cards, the Financial Summary page shows two detailed sections:

**Contributions section:**
- Verified total
- Borrowing multiplier (e.g., 3×)
- Full borrowing capacity
- Available to borrow (borrowing capacity minus any current loan balance)

**Loans section:**
- Total amount borrowed across all loans
- Total amount repaid to date
- Current outstanding balance
- Total number of loans taken

### Transactions Page

Navigate to **Dashboard → Transactions** to see a unified, chronological list of every financial event on your account: contributions (with their status) and loan repayments. Each row shows:

- **Date**
- **Type** (Contribution or Repayment)
- **Amount**
- **Status** (Verified, Pending, Rejected, or Recorded)
- **Reference** (last 8 characters of the record ID)

The transactions list is sorted newest-first. You can reach this page from the Financial Summary page using the **All Transactions** button.

### Downloading a Statement

From the Financial Summary page, click the **Download Statement** button to export a PDF summary of your financial position.

---

## 7. Announcements & RSVPs

### Pinned Announcement Banners

When an administrator posts an announcement with the "Pin to dashboard banner" option enabled, it appears as a sticky banner at the top of every page in your dashboard. These banners are designed for important notices that need your immediate attention — such as meeting dates, rule changes, or scheduled maintenance.

Click the banner or any link within it to open the full announcement.

### Viewing Announcements

Announcements of the following types can be posted by your administrators:

- **General** — General information for members
- **AGM** — Annual General Meeting notices with date and location
- **Maintenance** — Notices about planned downtime or system maintenance
- **Rule Change** — Updates to cooperative rules or policies

Open any announcement by clicking on it. The full message, date, and any relevant details (such as AGM location) are shown on the announcement detail page at **Dashboard → Announcements → [Announcement Title]**.

### Submitting an RSVP for AGM Announcements

If an AGM announcement has RSVP enabled, three buttons appear at the bottom of the announcement page:

- **Attending** — Confirm you will be present
- **Maybe** — Indicate you are uncertain
- **Not Attending** — Indicate you cannot attend

Click the appropriate button. Your selected response is highlighted (filled green). You can change your response at any time before the meeting by clicking a different button. The system records your latest choice.

---

## 8. Withdrawals

### Understanding Your Available Balance

Your **Available to Withdraw** balance is calculated as:

> **Available = Total Verified Contributions − Active Loan Balance**

This means that if you have an outstanding loan, the loan balance is subtracted from your contributions before any withdrawal can be made. If you have no active loan, your full verified contribution total is available.

Navigate to **Dashboard → Withdrawals** to see your current available balance displayed prominently.

### Requesting a Withdrawal

1. Navigate to **Dashboard → Withdrawals**.
2. If you have an available balance and no pending withdrawal request, the **New Request** form is shown.
3. Enter the **Amount** you wish to withdraw. The form enforces the maximum (your available balance).
4. Select a **Reason** from the dropdown:
   - Personal Use
   - Emergency
   - Leaving Cooperative
   - Other
5. Optionally, enter additional **Notes** to give the administrator context.
6. Click **Request Withdrawal**.
7. A confirmation message appears. Your request enters the **REQUESTED** status.

> **Important:** You may only have one pending withdrawal request at a time. The form is hidden if a request is already awaiting review.

### Tracking Your Withdrawal Status

The **Request History** table on the Withdrawals page shows all your previous and current requests with:

- Amount
- Reason
- Status (REQUESTED, APPROVED, REJECTED, or PAID)
- Date submitted
- Rejection reason (if applicable)

The full flow is: **REQUESTED → APPROVED → PAID** (or **REJECTED** at the admin review stage).

---

## 9. Notification Preferences

### Where to Manage Preferences

Navigate to **Dashboard → Settings → Notifications** (at **/dashboard/settings/notifications**) to control how you receive notifications.

### Available Options

**Phone Number (for SMS)**
Enter your mobile number in international format, including the country code (e.g., +234 800 000 0000). If you leave this blank, SMS notifications are disabled regardless of the toggle below.

**Email Notifications**
Check this box to receive email notifications for: loan approvals and rejections, contribution verifications and rejections, dividend payouts, guarantor requests, and new announcements.

**SMS Notifications**
Check this box to receive SMS notifications (requires a valid phone number above) for: loan approvals, contribution verifications, dividend payouts, guarantor requests, and account verification.

### Saving Your Preferences

Click **Save Preferences** after making any changes. A confirmation message "Preferences saved." appears when the update is successful.

### Events That Trigger Notifications

| Event | Email | SMS |
|---|---|---|
| Loan approved | Yes | Yes |
| Loan rejected (with reason) | Yes | No |
| Contribution verified | Yes | Yes |
| Contribution rejected (with reason) | Yes | No |
| Guarantor request received | Yes | Yes |
| Dividend paid | Yes | Yes |
| Account verified | Yes | Yes |
| New announcement | Yes | Yes |

---

## 10. Troubleshooting

### My contribution was rejected

If your contribution was rejected, you will receive an email explaining the reason. Common reasons include:

- Receipt is unreadable, blurry, or shows the wrong amount.
- The payment method listed does not match the receipt.
- The receipt belongs to a different transaction.

**What to do:** Submit a new contribution with a clear, correct receipt. Make sure the receipt shows the amount, date, and the cooperative's account details.

### My loan was rejected

If your loan application was rejected, you will receive an email with the reason. Common reasons include:

- Insufficient borrowing capacity for the requested amount.
- One or both guarantors declined.
- Concerns about your repayment history.

**What to do:** Read the rejection reason carefully. If you believe the rejection was made in error, contact your cooperative administrator. If the issue is with guarantors, submit a new application with different guarantors.

### A guarantor declined my request

If a guarantor declines, the application cannot proceed. You will need to submit a new loan application with a different second (or first) guarantor. Your previous application will remain visible in your loans history with a declined status.

### My receipt upload failed

If the file upload fails when submitting a contribution:

- Check your internet connection and try again.
- Ensure the file is not larger than **10 MB**.
- Make sure the file is one of the accepted formats: JPEG, PNG, WEBP, PDF, or HEIC.
- If the problem persists, try a different browser or device.

You can still submit a contribution without a receipt and ask your administrator to review it manually.

### I am not receiving email notifications

1. Check your spam or junk mail folder — notification emails may be filtered.
2. Navigate to **Dashboard → Settings → Notifications** and confirm that **Email notifications** is checked and saved.
3. Ensure the email address on your account is correct (visible on your dashboard next to your name).
4. If you still do not receive emails, contact your cooperative administrator.

### I am not receiving SMS notifications

1. Navigate to **Dashboard → Settings → Notifications** and confirm your phone number is entered correctly in international format (e.g., +2348012345678).
2. Make sure the **SMS notifications** checkbox is ticked and saved.
3. If you recently changed your phone number, re-enter it and save again.

### I cannot apply for a loan

You may see a message preventing you from applying if:

- Your account is not yet verified — wait for admin approval.
- You have no verified contributions — submit and get at least one contribution verified first.
- You have no remaining borrowing capacity — repay your existing loan or increase your contributions.

---

## 11. FAQ

**Q: How long does account verification take?**
A: Verification is done manually by your cooperative's administrator. Typical turnaround is 1–3 business days. Contact your admin directly if it has been longer than that.

**Q: Can I have more than one loan at a time?**
A: This depends on your cooperative's rules. Typically, you must repay your existing loan before a new one can be approved. Your borrowing capacity takes any outstanding loan balance into account automatically.

**Q: Does the interest rate change?**
A: The interest rate is set by your cooperative's administrator. Check with your admin for the current rate. The default is 10%. Your total repayment amount is shown on the loan detail page before you begin repaying.

**Q: What is the difference between Total Contributed and Available to Borrow?**
A: **Total Contributed** is the sum of all your verified contributions. **Available to Borrow** is your borrowing capacity (contributions × multiplier) minus any active loan balance — it is the maximum additional amount you can borrow right now.

**Q: Can I cancel a contribution submission before it is verified?**
A: Once submitted, contributions cannot be cancelled by members. Contact your administrator if you submitted in error.

**Q: What happens if a guarantor does not respond?**
A: The loan will remain in the PENDING_GUARANTORS stage until both guarantors respond. There is no automatic timeout; the guarantor will continue to see the request in their pending queue and will receive reminders. Contact the guarantor directly if they have not responded.

**Q: Can I choose the same person as both guarantors?**
A: No. The application form prevents you from selecting the same member for both guarantor slots.

**Q: Does submitting a contribution without a receipt affect verification?**
A: The receipt field is optional, but submissions without a receipt may take longer to verify, as the administrator will need to cross-check payment records manually. We strongly recommend attaching a receipt.

**Q: What formats are accepted for receipts?**
A: JPEG, PNG, WEBP, PDF, and HEIC files are accepted. The maximum file size is 10 MB.

**Q: How do I know if my loan repayment was recorded?**
A: After submitting a repayment, the page shows a "Payment recorded successfully." message. The loan detail page is updated with the new remaining balance. You can also verify the payment in **Dashboard → Transactions**.

**Q: What does "REPAID" mean on a loan?**
A: A loan is marked REPAID when the total amount repaid equals or exceeds the total due (principal + interest). The loan moves out of your active loans list at that point.

**Q: Why does my available withdrawal balance change when I have a loan?**
A: Your withdrawal balance is: Total Verified Contributions − Active Loan Balance. The cooperative deducts your outstanding loan from what you can withdraw to protect the fund.

**Q: Can I update my email address?**
A: Email address changes are managed through your profile settings. Navigate to **Dashboard → Profile** or contact your administrator.

**Q: What is an AGM announcement?**
A: AGM stands for Annual General Meeting. AGM announcements include the date, time, and location of the meeting and may include an RSVP option so administrators can see how many members plan to attend.

**Q: What happens to my contributions if I leave the cooperative?**
A: If you request a withdrawal with the reason "Leaving Cooperative", your administrator will review the request. The withdrawable amount is your total contributions minus any outstanding loan balance. All active loans must typically be settled before departure.

**Q: How are dividends calculated?**
A: Dividends are distributed based on your share of the cooperative's total verified contributions. For example, if you contributed 10% of the total, you receive 10% of the dividend pool. The pool is the cooperative's total profit minus administrative costs and the loan loss reserve.

---

*Last updated: May 2026. For support, contact your cooperative administrator.*
