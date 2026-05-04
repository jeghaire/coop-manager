# Member Troubleshooting Guide

This guide covers the most common issues members encounter when using the cooperative management platform. Issues are organized by feature area. Each entry follows a **Problem → Cause → Solution** structure.

---

## Login & Account

### 1. I can't sign in — my credentials aren't being accepted

**Problem:** The login page shows an error or the page reloads without signing you in.

**Cause:** The most common reasons are an incorrect email address or an incorrect password. Email addresses are case-sensitive, so `John@example.com` and `john@example.com` are treated as different addresses. A mistyped password is also common, especially if caps lock is enabled.

**Solution:**
- Double-check your email address, paying attention to uppercase letters.
- Re-type your password manually rather than relying on autofill, which may have saved an old password.
- If you have forgotten your password, contact your cooperative administrator to request a password reset. A self-service "Forgot Password" flow is planned for a future release. Your admin can reset your credentials from the member management panel.

---

### 2. I see a "Your account needs to be verified" message

**Problem:** After signing in, you are blocked from accessing most features with a message about verification.

**Cause:** Account verification is a two-step process. You completed registration (step 1), but an administrator has not yet approved your account (step 2). This is by design — cooperatives manually verify each member before granting full access.

**Solution:**
- Contact your cooperative administrator and request that they verify your account.
- Verification is done by the admin from their member management panel. They will see your account listed under "Unverified Members."
- Typical wait time depends on your cooperative's process, but most verifications are completed within 1–3 business days.
- Once verified, you will receive an email (and SMS if configured) notification. Sign out and sign back in to refresh your session and access all features.

---

### 3. My dashboard shows ₦0 everywhere

**Problem:** The financial summary section of your dashboard shows zero for all amounts.

**Cause:** This is normal for new members. The financial figures — total contributions, borrowing capacity, loan balance — are all calculated from your verified contributions. If you have not yet submitted any contributions, or if your submitted contributions have not been verified by an admin, all values will show as ₦0.

**Solution:**
- Submit your first monthly contribution with a receipt from the contribution page.
- Wait for an administrator to verify the contribution.
- Once at least one contribution is verified, your financial summary will update automatically. Refresh the page if values don't appear immediately after verification.

---

### 4. I can't access most of the dashboard features

**Problem:** Sections of the dashboard are locked, grayed out, or redirect you with an access message.

**Cause:** Your account has not been verified by an administrator yet. Most cooperative features (loan applications, financial summaries, transaction history) require a verified account.

**Solution:**
- Follow the steps in issue #2 above to request account verification from your admin.
- Until verification is complete, you can still update your notification preferences and view any cooperative announcements that are directed to all members.

---

### 5. My session keeps expiring / I keep getting logged out

**Problem:** You are frequently redirected to the sign-in page even though you were just using the app.

**Cause:** Sessions have a timeout period for security reasons. If your browser is configured to block cookies, sessions cannot persist and you will be signed out on every page load or navigation.

**Solution:**
- If your session expires after a period of inactivity, simply sign back in — this is expected behavior.
- If you are being signed out immediately or very frequently, check that your browser is not blocking cookies for this site. Cookies are required for session management.
- Try accessing the site in a private/incognito window. If that works, a browser extension (ad blocker, privacy shield) may be blocking cookies.
- Clearing your browser's site data for this domain and signing in again often resolves persistent session issues.

---

## Contributions

### 6. I received a "Contribution Rejected" notification

**Problem:** You received a notification that a contribution you submitted was rejected.

**Cause:** Administrators review each contribution submission before verifying it. A rejection usually means the receipt was unclear, the amount didn't match cooperative records, or required information was missing. The rejection notice will include the administrator's reason.

**Solution:**
- Read the rejection reason included in the notification — it will tell you what was wrong.
- Do **not** try to edit or reopen the rejected contribution. The system does not support editing submitted contributions.
- Submit a **new** contribution with the correct details and a clear, readable receipt.
- If you believe the rejection was in error, contact your administrator directly and reference the contribution date and amount.

---

### 7. My file upload fails when submitting a contribution

**Problem:** The receipt upload step fails with an error, or the file doesn't attach.

**Cause:** The system accepts only specific file types and may reject files that are too large or formatted incorrectly. The accepted formats are JPEG, PNG, WEBP, and PDF. Other formats (HEIC, TIFF, BMP, Word documents, etc.) are not accepted. Some older browsers also have limited support for the file upload mechanism.

**Solution:**
- Check your file type. Convert HEIC photos (common on iPhones) to JPEG before uploading. Most phones allow you to change camera settings to save as JPEG.
- Ensure the file is a genuine image or PDF, not a renamed file with a mismatched extension.
- If using a PDF, ensure it is not password-protected.
- If the upload still fails, try a different browser (Chrome or Firefox are recommended). Safari on older macOS versions may have issues with presigned upload URLs.
- If none of the above works, contact your admin — they may be able to record the contribution manually on your behalf.

---

### 8. My contribution has been stuck in "Pending" for several days

**Problem:** A contribution you submitted is still showing "Pending" review after multiple days.

**Cause:** Contributions are reviewed manually by administrators. Delays can happen during busy periods, public holidays, or if the administrator is unavailable.

**Solution:**
- Allow a reasonable review period (typically 3–5 business days) before following up.
- Contact your cooperative administrator directly and mention the contribution date and amount.
- Check if your cooperative has posted any announcements about delayed reviews — these are often shared via pinned announcements on the dashboard.
- If the delay is causing an issue with a pending loan application, mention that to the admin when following up.

---

### 9. My verified contributions are not showing up in my borrowing capacity

**Problem:** You have contributions that show as "Verified" but your borrowing capacity has not changed.

**Cause:** Only contributions with a status of **VERIFIED** count toward your borrowing capacity. Contributions in PENDING or REJECTED status are excluded from the calculation. If a contribution was recently verified, there may be a brief display delay.

**Solution:**
- Refresh your financial summary page. The borrowing capacity is calculated fresh on page load.
- Confirm the contribution status is actually "Verified" (green status badge), not "Pending" or "Approved" without full verification.
- If the contribution is verified but the capacity still looks wrong, sign out and back in to ensure your session reflects the latest data.
- If the problem persists, contact your administrator to confirm the verification was saved correctly.

---

## Loans

### 10. "Your account must be verified before applying for a loan"

**Problem:** You cannot start a loan application because of this error message.

**Cause:** Loan applications are restricted to verified members only. This is a system-level guard that cannot be bypassed.

**Solution:**
- Contact your administrator to verify your account first. See issue #2 for details on the verification process.
- Once your account is verified, you can return to the loan application form and proceed normally.

---

### 11. "You must have at least one verified contribution to apply for a loan"

**Problem:** Your account is verified, but the loan application still shows this error.

**Cause:** The system requires that you have at least one contribution that has been verified by an administrator before you are eligible to apply for a loan. This ensures members have a financial track record before borrowing.

**Solution:**
- Submit a contribution with a receipt if you have not done so yet.
- If you have submitted a contribution, wait for an administrator to verify it.
- Once at least one contribution shows a "Verified" status on your contributions page, you can return to the loan application.

---

### 12. "Loan amount exceeds your borrowing capacity of ₦X"

**Problem:** You entered a loan amount and received this error when submitting the application.

**Cause:** Your borrowing capacity is calculated as: **Total Verified Contributions × Borrowing Multiplier**. The multiplier is set by your cooperative's owner (for example, 3× means you can borrow up to three times what you have contributed). If your total verified contributions are ₦50,000 and the multiplier is 3, your maximum borrowing capacity is ₦150,000.

**Solution:**
- Check your current borrowing capacity on your financial summary page (`/dashboard/financial-summary`).
- Reduce the loan amount to fit within your capacity.
- Alternatively, submit additional contributions to increase your total and wait for them to be verified. This will increase your borrowing capacity.
- Contact your administrator if you believe your contribution total is incorrect.

---

### 13. "One or both guarantors are invalid"

**Problem:** You entered guarantor information and the application shows this error.

**Cause:** Guarantors must meet all of the following conditions:
- They must be active members of your cooperative (not from a different cooperative).
- They must have verified accounts.
- They cannot be administrators or owners.
- They cannot be you (you cannot be your own guarantor).
- The two guarantors must be two different people.

**Solution:**
- Ask members who you know have verified accounts and are not admins.
- Confirm you have not accidentally entered your own member ID or the same person twice.
- If you are unsure whether a specific member qualifies, ask your administrator.

---

### 14. "Guarantors' combined contributions must cover the loan amount"

**Problem:** Your chosen guarantors are valid members but the application still shows a coverage error.

**Cause:** Depending on your cooperative's guarantor coverage mode, the system checks whether the guarantors have enough verified contributions to back your loan. In "Combined" mode, the sum of both guarantors' verified contributions must be at least equal to the loan amount. In "Individual" mode, each guarantor must individually cover the full loan amount.

**Solution:**
- Check your cooperative's coverage mode by asking your administrator.
- Calculate whether your chosen guarantors' contributions meet the requirement.
- Ask for guarantors who have higher verified contribution amounts.
- Consider reducing the loan amount so that your current guarantors' contributions can cover it.

---

### 15. A guarantor hasn't responded to my loan request

**Problem:** Your loan application has been in "Pending Guarantors" status for a long time.

**Cause:** The loan application is waiting for both guarantors to either accept or decline their role. Guarantors receive a notification but may not have seen it or may be slow to respond.

**Solution:**
- Contact your guarantors directly (phone, WhatsApp, etc.) and remind them to check the app and respond to the guarantor request.
- If a guarantor declines, the loan application will be **automatically rejected** by the system. You will need to submit a new application with different guarantors — there is no way to swap guarantors on an existing application.
- Both guarantors must accept before the loan moves to admin review.

---

### 16. My loan was approved but the repayment page shows a higher amount than expected

**Problem:** The "Total Amount Due" on your loan repayment page is higher than the loan amount you applied for.

**Cause:** This is expected. The total amount due includes both the **principal** (the amount you borrowed) and the **interest** (a percentage of the principal, set by your cooperative). The formula is: `Total Amount Due = Principal × (1 + Interest Rate / 100)`. For example, a ₦100,000 loan at 10% interest = ₦110,000 total.

**Solution:**
- This is correct and not an error. The interest rate applied to your loan was displayed during the application process.
- Contact your administrator if you believe the interest rate shown is different from what was agreed upon.

---

### 17. I made a repayment but my outstanding balance didn't update

**Problem:** You recorded a payment but the loan balance on your dashboard still shows the same amount.

**Cause:** This is usually a display cache issue. The balance should update immediately after a successful payment is recorded. In rare cases, the page may display a cached version.

**Solution:**
- Refresh the loan repayment page (hard refresh: Ctrl+Shift+R or Cmd+Shift+R).
- Sign out and sign back in to clear your session cache.
- If the balance is still incorrect after a full sign-out/sign-in cycle, contact your administrator. Do not submit the same payment again — duplicate repayments require manual correction.

---

### 18. My loan shows as "Repaid" but I believe I still owe money

**Problem:** The system has marked your loan as fully repaid, but based on your own calculation, there appears to be a remaining balance.

**Cause:** This can happen due to rounding in the interest calculation. The system calculates a `totalAmountDue` and marks the loan as REPAID when all recorded repayments meet or exceed that figure. Small rounding differences may exist.

**Solution:**
- Contact your administrator and provide your loan ID, the total amount due, and a list of all payments you made.
- The admin can review the audit trail for all repayment events on your loan.
- If there is a genuine discrepancy, the admin will need to escalate to the system administrator for a manual adjustment.

---

## Withdrawals

### 19. My withdrawal request was rejected

**Problem:** You submitted a withdrawal request and it was rejected by the admin.

**Cause:** Common reasons for withdrawal rejection include:
- You have an outstanding (unpaid) active loan. Many cooperatives require loans to be fully repaid before allowing withdrawals.
- Your available balance is insufficient to cover the withdrawal amount after accounting for required reserves.
- The withdrawal amount exceeds your available balance.

**Solution:**
- Check the rejection reason if provided in the notification or on the withdrawals page.
- If you have an active loan, repay it fully before submitting a new withdrawal request.
- Contact your administrator to understand the specific reason and the cooperative's withdrawal policy.

---

### 20. My withdrawal was approved but I haven't received the funds

**Problem:** Your withdrawal request shows "Approved" status but the money has not arrived in your account.

**Cause:** Approval and disbursement are two separate steps. An administrator must approve the withdrawal request first, and then a second manual step marks it as "Paid" after the funds have actually been sent. The funds are typically sent via bank transfer outside the system.

**Solution:**
- Contact your administrator to confirm they have completed the disbursement step (marking it as "Paid") after sending the funds.
- Provide your bank account details if the admin doesn't have them — the system stores bank details but confirm they are up to date.
- If your bank account details in the system are incorrect, contact your admin before the disbursement is processed.

---

## Notifications

### 21. I'm not receiving email notifications

**Problem:** You expect to receive email notifications for events (loan approved, contribution verified, etc.) but no emails arrive.

**Cause:** Either email notifications are disabled in your settings, your email address is incorrect, or the emails are being filtered to your spam folder.

**Solution:**
1. Check your spam or junk mail folder — emails from new senders are often filtered automatically.
2. Go to `/dashboard/settings/notifications` and confirm that email notifications are toggled on.
3. Verify that the email address shown on your profile is correct and matches the one you are checking.
4. Add the cooperative's sender email address to your contacts or safe senders list.
5. If none of the above helps, contact your admin — they can check the notification delivery log to see if emails are being sent but failing to deliver.

---

### 22. I'm not receiving SMS notifications

**Problem:** You have opted in to SMS notifications but are not receiving text messages.

**Cause:** Several factors can prevent SMS delivery: SMS notifications may be disabled in your settings, your phone number may be formatted incorrectly, or SMS may not be configured for your cooperative at all (SMS is optional and requires Twilio configuration by the system admin).

**Solution:**
1. Go to `/dashboard/settings/notifications` and confirm SMS is enabled.
2. Check that your phone number includes the full international format with country code (e.g., `+2348012345678` for Nigeria, not `08012345678`).
3. Ask your administrator whether SMS is configured for your cooperative — SMS requires a Twilio account and is not available on all installations. The app works fully without SMS.
4. If your number format and settings are correct but you still don't receive messages, your admin can check the Twilio delivery logs.

---

### 23. I'm receiving too many notifications

**Problem:** You are getting more notifications than you want.

**Cause:** All notification types are on by default when you register. Individual notification channels (email and SMS) can be toggled on or off.

**Solution:**
- Go to `/dashboard/settings/notifications` to manage your notification preferences.
- You can disable email notifications, SMS notifications, or both, independently.
- You cannot disable in-app notifications (the bell icon in the header), but those are non-intrusive.
