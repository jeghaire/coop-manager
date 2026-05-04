# Authentication

## Overview

Coop Manager uses **Better-auth** for authentication, with email and password as the sole credential method. There is no OAuth, Google Sign-In, or social login. Sessions are stored server-side in the database and are tied to an HTTP-only cookie on the client. All authentication state is validated on the server before any data is returned.

> **Related:** See [Member Verification](06_FEATURE_MEMBER_VERIFICATION.md) for the distinction between logging in and being granted full dashboard access.

---

## Sign Up

### Registration Fields

| Field | Required | Notes |
|---|---|---|
| Full name | Yes | Displayed throughout the app |
| Email address | Yes | Used as login identifier; must be unique |
| Password | Yes | See password requirements below |
| Cooperative | Yes | Select an existing cooperative or create a new one |

### Cooperative Selection

During sign-up, a member either:

- **Joins an existing cooperative** — selects it from a list returned by `/api/auth/cooperatives`
- **Creates a new cooperative** — provides a cooperative name; the signing-up user becomes the **OWNER** of that cooperative

### What Happens After Sign-Up

| Scenario | Role Assigned | Verified Immediately? |
|---|---|---|
| Created a new cooperative | OWNER | Yes — auto-verified |
| Joined an existing cooperative | MEMBER | No — starts UNVERIFIED |

Unverified members are redirected to a `verify-pending` page after signing in and cannot access most dashboard features until an admin or owner manually verifies their account. See [Member Verification](06_FEATURE_MEMBER_VERIFICATION.md) for the full access comparison.

---

## Sign In

### How It Works

1. Navigate to `/auth/signin`
2. Enter your registered email address and password
3. On success, a session cookie is set and you are redirected to the dashboard

### What Gets Checked

- Email exists in the database
- Password matches the stored hash
- The account belongs to a cooperative (all users must be associated with one)

### After Sign-In

- **OWNER / ADMIN / TREASURER / VERIFIED MEMBER** — redirected to `/dashboard`
- **UNVERIFIED MEMBER** — redirected to `/dashboard/verify-pending` with a message explaining that account approval is pending

### Common Sign-In Errors

- `Invalid email or password` — credentials do not match; no indication of which field is wrong (intentional, for security)
- `Account not found` — email is not registered

---

## Session Management

### How Sessions Work

Better-auth creates a server-side session record in the database when you sign in. The browser receives an HTTP-only cookie containing a session token. On each request, the server validates this token against the database record.

Because sessions are stored in the database, they can be invalidated server-side at any time — for example, when an account is suspended or when a password is reset.

### Session Expiry

Sessions expire automatically after a period of inactivity. When a session expires, the user is redirected to the sign-in page. The exact duration is configured at the application level; there is currently no "remember me" toggle.

### Signing Out

Click your name or avatar in the top navigation, then select **Sign Out**. This calls `POST /api/auth/signout`, which:

1. Deletes the session record from the database
2. Clears the session cookie from the browser
3. Redirects to `/auth/signin`

> **Security note:** Always sign out when using a shared or public device. Closing the browser tab does not end the session; the cookie persists until expiry or explicit sign-out.

---

## Password Reset

> **Status: Planned feature — not yet available.** The database schema and API routes are defined; the UI pages are pending implementation.

### Intended Flow

1. Go to `/auth/forgot-password`
2. Enter your registered email address and submit
3. You receive an email with a secure reset link (valid for **24 hours**)
4. Click the link — it opens `/auth/reset-password?token=<token>`
5. Enter and confirm your new password
6. On success, the token is invalidated and you are redirected to sign in with your new credentials

### Token Details

- The reset token is stored hashed in the database alongside an expiry timestamp (`resetTokenExpiresAt`)
- Tokens are single-use: once a password is reset, the token is cleared
- If the link has expired, request a new one from the forgot-password page
- The token is never shown in plain text after the email is sent

### Current Workaround

Until the password reset UI is live, contact your cooperative administrator or owner to have your account credentials updated manually.

---

## Account Settings

> **Status: Planned feature — not yet available.** The API endpoints (`/api/account/update-name`, `/api/account/update-phone`, `/api/account/update-password`) are defined; the settings page at `/dashboard/settings/account` is pending implementation.

### Fields You Will Be Able to Change

| Setting | Notes |
|---|---|
| Full name | Updates the name shown throughout the app |
| Phone number | Used for SMS notifications; must be in valid international format |
| Password | Requires entering your current password to confirm identity |

### Password Change Requirements

- Must enter your current password before setting a new one
- New password must meet the minimum strength requirements (see [Security Best Practices](#security-best-practices))
- Cannot reuse the current password as the new one

---

## Notification Preferences

Available now at `/dashboard/settings/notifications`.

### Settings

| Option | Default | Effect When Disabled |
|---|---|---|
| Email notifications | On | You will not receive any notification emails |
| SMS notifications | On | You will not receive any SMS messages |
| Phone number | — | Required to receive SMS; no SMS sent if blank |

### What Is Affected

Disabling a notification channel suppresses all event-driven messages to that channel, including:

- Contribution verified or rejected
- Loan approved or rejected
- Guarantor request
- Dividend paid
- Account verified
- Overdue payment reminders
- Cooperative announcements

> **Important:** Disabling email notifications does not affect password reset emails, which are always sent regardless of preference.

---

## Security Best Practices

### Password Strength

- Use at least 12 characters
- Mix uppercase letters, lowercase letters, numbers, and symbols
- Avoid names, dates, or sequential patterns
- Do not reuse passwords from other services

### Shared and Public Devices

- Always click **Sign Out** before leaving a shared computer or phone
- Do not allow your browser to save your Coop Manager password on devices you do not own
- If you suspect someone has accessed your account, change your password immediately (once account settings are available) and notify your cooperative administrator

### Phone Number

- Keep your phone number up to date in notification preferences
- An accurate phone number ensures you receive SMS alerts for critical events (contribution rejected, loan approved, overdue payments)
- SMS notifications are opt-in; they provide a secondary channel in addition to email

### Email Address

- Your email address is your login credential and cannot currently be changed through the UI
- If your email address changes, contact your cooperative owner or administrator

---

## Troubleshooting

### I Cannot Sign In

1. Verify you are using the email address you registered with (check for typos)
2. Check that Caps Lock is not on when typing your password
3. If you have never signed in before, ensure your account was created — ask your cooperative administrator to confirm your email is in the system
4. If credentials are correct but login still fails, your session cookie may be corrupted — try clearing site data in your browser settings and attempting sign-in again

### I Forgot My Password

The self-service password reset feature is not yet available. In the meantime:

- Contact your cooperative **OWNER** or **ADMIN** to reset your credentials manually
- Provide your registered email address so they can identify your account

### My Session Expired

Sessions expire after a period of inactivity. If you are redirected to the sign-in page unexpectedly:

1. Sign in again normally — your data is not lost
2. If this happens frequently on a short time scale, check that your browser is not blocking cookies for this site

### I Am Redirected to a "Pending Verification" Page

Your account exists and your password is correct, but your membership has not been approved yet by your cooperative's administrator. See [Member Verification](06_FEATURE_MEMBER_VERIFICATION.md) for what to expect and what limited access is available while you wait.
