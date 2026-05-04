# Announcements and Notifications

Cooperative Manager includes a full announcement system that lets administrators broadcast messages to members, pin important notices to every dashboard page, manage Annual General Meeting (AGM) logistics with RSVP tracking, and deliver notifications via email and SMS.

> **Related:** [Authentication](05_FEATURE_AUTHENTICATION.md) — notification preferences are configured per member. [Member Guide](01_MEMBER_GUIDE.md) — how members view and respond to announcements.

---

## Overview

Administrators can create four types of announcements, each with a distinct visual identity. Pinned active announcements appear as sticky coloured banners across every page of the member dashboard, making critical information impossible to miss. Bulk email and SMS messages are sent to the appropriate recipients the moment an announcement is created.

---

## Announcement Types

| Type | Use Case | Banner Colour |
|---|---|---|
| GENERAL | Regular updates, reminders, policy information | Gray |
| AGM | Annual General Meeting notices with date, location, and RSVP | Blue |
| MAINTENANCE | Planned system downtime or service interruption notices | Yellow |
| URGENT | Critical alerts requiring immediate member attention | Red |

> **Note on RULE_CHANGE:** The database schema includes a `RULE_CHANGE` type. In the current UI, rule change announcements are displayed with GENERAL (gray) styling. Use the GENERAL type for rule change announcements until dedicated styling is added.

---

## Creating an Announcement (Admin/Owner)

### Who Can Create Announcements

Only users with the **ADMIN** or **OWNER** role can create, manage, or deactivate announcements. The creation form is at **Admin → Announcements → Create New** (`/admin/announcements`).

### Required Fields

| Field | Validation |
|---|---|
| Title | Required; minimum 3 characters |
| Message | Required; minimum 10 characters |
| Type | Required; one of: AGM, MAINTENANCE, RULE_CHANGE, GENERAL |

### Optional Fields

| Field | Default | Notes |
|---|---|---|
| Recipient Type | ALL | See [Recipient Types](#recipient-types) below |
| Pin to dashboard banner | On (true) | Whether the announcement appears as a sticky banner |
| Expiry date | None | If set, banner auto-hides after this date/time |
| AGM Date | — | Appears only when Type = AGM |
| AGM Location | — | Appears only when Type = AGM |
| Allow RSVP | Off | Appears only when Type = AGM; enables RSVP buttons for members |

### Submission Behaviour

On submit, the system:

1. Creates the `Announcement` record in the database with `isActive: true`.
2. Records an `announcement_created` event in the audit trail.
3. Fires a **non-blocking** call to `notifyAnnouncement`, which delivers email and SMS to all qualifying recipients. This runs as fire-and-forget — a failure to deliver does not prevent the announcement from being saved.
4. Revalidates the dashboard and admin announcements pages so the banner appears immediately.

---

## Recipient Types

When creating an announcement, the **Recipient Type** controls who receives the push notification (email and SMS) and, for dashboard banners, who sees the banner.

| Recipient Type | Who Is Notified | Who Sees the Banner |
|---|---|---|
| ALL | Every cooperative member, admin, and owner | All logged-in users |
| MEMBERS_ONLY | Only users with the MEMBER role | Only MEMBER-role users |
| ADMINS_ONLY | Only users with the OWNER or ADMIN role | Only OWNER/ADMIN-role users |

**Example:** A maintenance notice about a scheduled system downtime at 2 AM would typically target ALL members. An internal note about admin procedures would use ADMINS_ONLY.

---

## Pinned Banners

### How Banners Work

Any announcement with `isPinned: true` and `isActive: true` (and a non-expired `expiresAt`, if set) appears as a sticky coloured banner at the top of every page in the member and admin dashboard.

If multiple announcements qualify simultaneously, they stack vertically — newest first.

### Dismissing Banners

Members can dismiss individual banners by clicking the close button on the banner. The dismissed state is stored in **localStorage** (browser-side only). This means:

- The banner disappears for the remainder of that browser session and future sessions on that device.
- The banner reappears if the member clears their browser data, uses a different browser, or logs in from a new device.
- No server record of the dismissal is stored.

### Banner Auto-Expiry

If an announcement has an `expiresAt` date, the banner stops appearing after that date and time, regardless of the `isActive` flag. This is useful for time-limited notices like a deadline reminder.

### When Banners Disappear

A banner is removed from display when **any** of the following is true:

- `isActive` is set to `false` (admin deactivated the announcement)
- `expiresAt` has passed
- `isPinned` is `false`
- The member has dismissed it in localStorage

---

## AGM Workflow

Annual General Meeting announcements have additional fields and behaviour to support meeting logistics.

### Creating an AGM Announcement

1. Navigate to **Admin → Announcements → Create New**.
2. Set **Type** to **AGM**.
3. Additional fields appear: **AGM Date** and **AGM Location**.
4. Enable **Allow RSVP** if you want members to indicate attendance.
5. Submit. The announcement is created with AGM-specific details stored and the blue AGM banner appears on member dashboards.

### Member Experience

Members opening an AGM announcement (via the banner or the announcements list) see:

- The full announcement message
- The meeting date and location
- RSVP buttons if `allowRsvp: true`: **Attending**, **Maybe**, **Not Attending**

Clicking an RSVP button submits an upsert — if the member has already responded, their answer is updated. The selected button is highlighted to confirm the current response.

### Admin RSVP Visibility

On the **Admin → Announcements** list page, each AGM announcement row shows a count of RSVP responses. Admins can open the announcement to see a full breakdown by status:

- Number of members who selected Attending
- Number who selected Maybe
- Number who selected Not Attending

This allows the board to plan seating, catering, and quorum requirements.

### Example — Lagos Savings Cooperative AGM

```
Title:     2026 Annual General Meeting
Type:      AGM
Message:   All members are invited to the 2026 Annual General Meeting.
           Please attend or send your apologies. Agenda will be circulated 7 days prior.
AGM Date:  Saturday, 20 June 2026, 10:00 AM
Location:  Lagos State Cooperative Centre, Yaba
Allow RSVP: Yes
Pinned:    Yes
```

Members receive an email with the date, location, and a link to RSVP. An SMS is also sent: "Lagos Savings Cooperative: All members are invited to the 2026 Annual General Meeting…"

---

## Deactivating Announcements

Deactivating an announcement immediately removes its banner from all dashboard pages without deleting the record.

### Steps

1. Navigate to **Admin → Announcements**.
2. Find the announcement to deactivate.
3. Click **Deactivate**.
4. A **two-step confirmation** dialog appears, asking you to confirm the action. This prevents accidental deactivation of active notices.
5. Confirm. The `isActive` flag is set to `false` and the banner vanishes from the dashboard.

Deactivated announcements remain visible in the admin announcements list for record-keeping. They can be viewed but cannot be re-activated through the UI — create a new announcement if re-publishing is needed.

---

## Notification Delivery

### Email

Email notifications are sent via **Resend**. Each qualifying recipient receives a formatted HTML email containing:

- The announcement title as the email subject
- The announcement message body
- For AGM announcements: meeting date and location
- For announcements with RSVP enabled: a link to the RSVP page

Requires: `RESEND_API_KEY` environment variable.

### SMS

SMS notifications are sent via **Twilio**. The SMS body contains the cooperative name and the first 120 characters of the announcement message.

Requires: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` environment variables. If any of these are missing, SMS sending is silently skipped.

### Fire-and-Forget Delivery

Notification sending is non-blocking. If email or SMS delivery fails for any reason, the announcement is still created and the error is swallowed. Each delivery attempt (success or failure) is logged to the `Notification` table in the database, including the channel, recipient, status, and any external message ID returned by Resend or Twilio.

This means you can audit notification delivery by querying the `Notification` table, even when individual sends fail.

### Member Notification Preferences

Members control their notification channels at **Dashboard → Settings → Notifications** (`/dashboard/settings/notifications`).

| Preference | Effect When Disabled |
|---|---|
| Email Notifications | No emails of any kind (except critical system messages) |
| SMS Notifications | No SMS messages |
| Phone Number (blank) | SMS disabled regardless of toggle |

When the system builds the recipient list for an announcement, it queries only members with the relevant notification channel enabled and, for SMS, with a non-null phone number. Members who have disabled a channel are silently skipped.

---

## Troubleshooting

### Announcement is not showing as a banner

Check all of the following:

1. **isPinned is false** — the announcement was created without the "Pin to dashboard banner" option. Banners only appear when `isPinned: true`.
2. **isActive is false** — the announcement has been deactivated. Check the announcements list for a "Deactivated" status indicator.
3. **expiresAt has passed** — the expiry date was set in the past. The banner auto-hides after the expiry timestamp.
4. **Member dismissed the banner** — the member clicked the dismiss (close) button, and the dismissal is stored in their browser's localStorage. Ask them to clear site data or try a different browser.
5. **Recipient type mismatch** — the member's role does not match the announcement's recipient type. For example, an ADMINS_ONLY announcement will not be bannable for MEMBER-role users.

### Notifications were not delivered

1. Confirm the required environment variables are set: `RESEND_API_KEY` for email, `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` for SMS.
2. Check whether the member has their notification preferences enabled at `/dashboard/settings/notifications`.
3. Ask the member to check their email spam folder.
4. Verify the member's phone number is in valid international format (e.g., +2348012345678).
5. Query the `Notification` table directly to see the delivery status and any error captured for the send attempt.

### RSVP not saving

- Confirm the announcement was created with `allowRsvp: true`. RSVP buttons only appear and the RSVP endpoint only accepts requests for announcements with RSVP enabled.
- Confirm the member is logged in — the RSVP action calls `requireAuth()` and will fail for unauthenticated requests.
- Check the browser console for any client-side form submission errors.

### Cannot see the RSVP count as admin

RSVP counts are displayed on the announcements list page only for announcements of type AGM with `allowRsvp: true`. For other announcement types, RSVP is not applicable and no count is shown.

### Announcement was created but no banner appeared immediately

The dashboard pages use server-side rendering with `revalidatePath` calls. If the banner does not appear after creation, try a hard refresh of the dashboard page (Ctrl+Shift+R or Cmd+Shift+R). If the issue persists, check that the application's cache revalidation is working correctly.
