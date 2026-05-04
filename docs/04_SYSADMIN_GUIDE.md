# System Administrator Guide — Cooperative Manager

This guide covers everything needed to deploy, configure, maintain, and troubleshoot the Cooperative Manager application. It assumes familiarity with Linux/macOS terminals, environment variables, cloud provider dashboards, and basic PostgreSQL administration.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation Steps](#2-installation-steps)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup](#4-database-setup)
5. [AWS S3 Setup](#5-aws-s3-setup)
6. [Email Configuration (Resend)](#6-email-configuration-resend)
7. [SMS Configuration (Twilio)](#7-sms-configuration-twilio)
8. [Vercel Deployment](#8-vercel-deployment)
9. [Cron Job Setup](#9-cron-job-setup)
10. [Backup Procedures](#10-backup-procedures)
11. [Monitoring](#11-monitoring)
12. [Security Hardening](#12-security-hardening)
13. [Performance Tuning](#13-performance-tuning)
14. [Troubleshooting Deployment](#14-troubleshooting-deployment)
15. [Upgrade Procedures](#15-upgrade-procedures)

---

## 1. System Requirements

### Runtime

| Component  | Minimum Version | Notes                                                   |
| ---------- | --------------- | ------------------------------------------------------- |
| Node.js    | 20.x LTS        | 22.x LTS also supported                                 |
| pnpm       | 9.x             | Used as the package manager; npm/yarn are not supported |
| PostgreSQL | 15+             | Neon serverless recommended for production              |

### External Service Accounts Required

| Service                       | Purpose                        | Required?            |
| ----------------------------- | ------------------------------ | -------------------- |
| [Vercel](https://vercel.com)  | Hosting and CI/CD              | Yes (for production) |
| [Neon](https://neon.tech)     | Serverless PostgreSQL          | Yes                  |
| [AWS](https://aws.amazon.com) | S3 storage for receipt uploads | Yes                  |
| [Resend](https://resend.com)  | Transactional email            | Yes                  |
| [Stripe](https://stripe.com)  | SaaS billing/subscriptions     | Optional\*           |
| [Twilio](https://twilio.com)  | SMS notifications              | Optional             |

\*Stripe is required only if you are running the multi-tenant SaaS billing features. Single-cooperative deployments without billing can leave Stripe variables unset.

### Local Development Tools

- Git
- A code editor (VS Code recommended)
- A PostgreSQL client (e.g., TablePlus, psql, or Prisma Studio)

---

## 2. Installation Steps

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/coop-manager.git
cd coop-manager
```

### Step 2 — Install dependencies

```bash
pnpm install
```

This installs all runtime and development dependencies as declared in `pnpm-lock.yaml`. Do not use `npm install` or `yarn install` — the lockfile is pnpm-specific.

### Step 3 — Configure environment variables

Copy the example env file and populate it:

```bash
cp .env.example .env
```

If no `.env.example` exists, create `.env` from scratch using the variables documented in [Section 3](#3-environment-configuration).

### Step 4 — Run database migrations

```bash
pnpm dlx prisma@latest migrate dev --name init
```

For an existing database with no migration history, use push instead:

```bash
pnpm dlx prisma@latest db push
```

### Step 5 — Start the development server

```bash
pnpm dev
```

The application starts at `http://localhost:3000`. The first time you open it you will be prompted to create a cooperative.

### Step 6 — (Optional) Seed the database

A seed script is available for development environments:

```bash
pnpm db:seed
```

Do **not** run the seed script against a production database.

---

## 3. Environment Configuration

Create a `.env` file in the project root. All variables listed below must be present for the application to function correctly in production (exceptions noted).

### Database

#### `DATABASE_URL`

- **Purpose:** PostgreSQL connection string used by Prisma for all database operations
- **Format:** `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`
- **Where to get it:** Neon dashboard → your project → Connection Details → Connection string (select "Pooled connection" for production)
- **Example:** `postgresql://neondb_owner:abc123xyz@ep-cool-fog-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require`

### Authentication

#### `BETTER_AUTH_SECRET`

- **Purpose:** Signs and verifies session tokens. Must be kept secret and consistent across deployments. Rotating this value invalidates all existing sessions.
- **Format:** Minimum 32 characters, random string
- **Where to get it:** Generate with `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **Example:** `K9mXnPqR2sT5vW8yA1bC4dF7hJ0kL3mN6pQ9rS2u`

#### `BETTER_AUTH_URL`

- **Purpose:** The canonical base URL of the application, used to construct auth callback URLs
- **Format:** Full URL with protocol, no trailing slash
- **Where to get it:** Your domain or Vercel deployment URL
- **Example:** `https://coop.yourdomain.com`

### Application

#### `NEXT_PUBLIC_APP_URL`

- **Purpose:** Client-side base URL used for generating links in emails and other user-facing contexts. The `NEXT_PUBLIC_` prefix makes it available in browser-side code.
- **Format:** Full URL with protocol, no trailing slash
- **Where to get it:** Same as `BETTER_AUTH_URL`
- **Example:** `https://coop.yourdomain.com`

### Billing (Stripe)

#### `STRIPE_SECRET_KEY`

- **Purpose:** Authenticates server-side Stripe API calls (creating checkout sessions, billing portal sessions, handling webhooks)
- **Format:** Starts with `sk_live_` (production) or `sk_test_` (test mode)
- **Where to get it:** Stripe Dashboard → Developers → API keys → Secret key
- **Example:** `sk_live_51AbcDefGhiJklMno...`

#### `STRIPE_WEBHOOK_SECRET`

- **Purpose:** Verifies that incoming webhook events genuinely originate from Stripe
- **Format:** Starts with `whsec_`
- **Where to get it:** Stripe Dashboard → Developers → Webhooks → Select your endpoint → Signing secret
- **Example:** `whsec_abcdef1234567890abcdef1234567890abcdef12`

> If not using Stripe billing, these variables can be omitted. The billing-related pages will error if accessed, but all cooperative management features function normally.

### Email (Resend)

#### `RESEND_API_KEY`

- **Purpose:** Authenticates email send requests to the Resend API
- **Format:** Starts with `re_`
- **Where to get it:** Resend Dashboard → API Keys → Create API Key
- **Example:** `re_AbcDef12_GhiJklMnoPqrStuVwxYZ`

#### `EMAIL_FROM`

- **Purpose:** The sender address and display name for all outgoing emails
- **Format:** `"Display Name <email@yourdomain.com>"` — quotes are required if the name contains spaces
- **Where to get it:** Use a verified domain in your Resend account; see [Section 6](#6-email-configuration-resend)
- **Example:** `"Cooperative Manager <noreply@yourdomain.com>"`

### SMS (Twilio — optional)

#### `TWILIO_ACCOUNT_SID`

- **Purpose:** Identifies your Twilio account for API authentication
- **Format:** Starts with `AC`, 34 characters
- **Where to get it:** Twilio Console → Account Info

#### `TWILIO_AUTH_TOKEN`

- **Purpose:** Authenticates API requests to Twilio
- **Format:** 32-character hex string
- **Where to get it:** Twilio Console → Account Info → Auth Token (click to reveal)

#### `TWILIO_PHONE_NUMBER`

- **Purpose:** The "from" number for outgoing SMS messages
- **Format:** E.164 format (e.g., `+12345678901`)
- **Where to get it:** Twilio Console → Phone Numbers → Active Numbers

> All three Twilio variables must be set for SMS to work. If any are missing, the SMS notification function silently skips sending — email notifications continue normally.

### AWS S3

#### `AWS_ACCESS_KEY_ID`

- **Purpose:** Identifies the IAM user making S3 API requests
- **Format:** 20-character alphanumeric string
- **Where to get it:** AWS Console → IAM → Users → your user → Security credentials → Create access key
- **Example:** `AKIAIOSFODNN7EXAMPLE`

#### `AWS_SECRET_ACCESS_KEY`

- **Purpose:** Authenticates the IAM user's API requests
- **Format:** 40-character base64 string
- **Where to get it:** Shown only once at IAM key creation; store securely immediately
- **Example:** `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

#### `AWS_REGION`

- **Purpose:** AWS region where the S3 bucket is located
- **Format:** AWS region code
- **Where to get it:** The region you selected when creating the bucket
- **Example:** `eu-west-2`

#### `AWS_S3_BUCKET`

- **Purpose:** The name of the S3 bucket used for storing contribution receipt files
- **Format:** Lowercase letters, numbers, hyphens; globally unique
- **Where to get it:** AWS Console → S3 → your bucket name
- **Example:** `coop-manager-receipts-prod`

### Cron Jobs

#### `CRON_SECRET`

- **Purpose:** Bearer token that authorises calls to the `/api/cron/check-overdue` endpoint. Vercel Cron sends this token automatically; without it, the endpoint returns 401.
- **Format:** Any strong random string (minimum 32 characters recommended)
- **Where to get it:** Generate with `openssl rand -base64 32`
- **Example:** `Fg3kLm9pQr2sTvWx5yZa8bCd1eGh4iJn`

### Summary Table

| Variable                | Required | Service         |
| ----------------------- | -------- | --------------- |
| `DATABASE_URL`          | Yes      | Neon/PostgreSQL |
| `BETTER_AUTH_SECRET`    | Yes      | Better-auth     |
| `BETTER_AUTH_URL`       | Yes      | Better-auth     |
| `NEXT_PUBLIC_APP_URL`   | Yes      | App             |
| `STRIPE_SECRET_KEY`     | Optional | Stripe          |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe          |
| `RESEND_API_KEY`        | Yes      | Resend          |
| `EMAIL_FROM`            | Yes      | Resend          |
| `TWILIO_ACCOUNT_SID`    | Optional | Twilio          |
| `TWILIO_AUTH_TOKEN`     | Optional | Twilio          |
| `TWILIO_PHONE_NUMBER`   | Optional | Twilio          |
| `AWS_ACCESS_KEY_ID`     | Yes      | AWS S3          |
| `AWS_SECRET_ACCESS_KEY` | Yes      | AWS S3          |
| `AWS_REGION`            | Yes      | AWS S3          |
| `AWS_S3_BUCKET`         | Yes      | AWS S3          |
| `CRON_SECRET`           | Yes      | Cron job        |

---

## 4. Database Setup

### 4.1 Creating a Neon Project

1. Sign in to [neon.tech](https://neon.tech)
2. Click **New Project**
3. Choose a region close to your users (the application defaults to `eu-west-2` for S3; consider matching your database region)
4. Name the project (e.g., `coop-manager-prod`)
5. Neon creates a default branch (`main`) and database (`neondb`)

### 4.2 Connection String Format

Neon provides two connection strings:

- **Direct connection:** Use for migrations and Prisma Studio (avoids pooler overhead during schema changes)
- **Pooled connection:** Use for the application in production (uses Neon's serverless connection pooler, essential for serverless environments like Vercel)

The application uses the `@prisma/adapter-pg` driver with a standard `pg.Pool`. For Vercel serverless deployments, use the **pooled connection string** as `DATABASE_URL`.

Connection string format:

```
postgresql://USER:PASSWORD@ep-ENDPOINT-ID.REGION.aws.neon.tech/DBNAME?sslmode=require
```

### 4.3 Running Migrations

**Development (creates migration files):**

```bash
pnpm dlx prisma@latest migrate dev --name <description>
```

**Production (applies existing migration files):**

```bash
pnpm dlx prisma@latest migrate deploy
```

The `build` script in `package.json` runs `prisma migrate deploy && prisma generate` automatically before each Next.js build. On Vercel, this means migrations run on every deploy.

### 4.4 Useful Prisma Commands

| Command                                 | Purpose                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dlx prisma@latest studio`         | Launch a browser-based database explorer on port 5555                                  |
| `pnpm dlx prisma@latest db push`        | Sync schema to the database without creating a migration file (useful for prototyping) |
| `pnpm dlx prisma@latest migrate deploy` | Apply all pending migrations (production-safe)                                         |
| `pnpm dlx prisma@latest migrate status` | Show which migrations are applied and which are pending                                |
| `pnpm dlx prisma@latest generate`       | Regenerate the Prisma client after a schema change                                     |
| `pnpm dlx prisma@latest db seed`        | Equivalent to `pnpm db:seed`                                                           |

> **Warning:** Never run `prisma migrate dev` against a production database. Use `prisma migrate deploy` in production.

---

## 5. AWS S3 Setup

The application uses AWS S3 to store contribution receipt images. Receipts are uploaded directly from the browser using pre-signed PUT URLs (to avoid routing large files through the Next.js server).

### 5.1 Create the S3 Bucket

1. Log in to the AWS Console → S3 → **Create bucket**
2. Bucket name: choose a globally unique name (e.g., `coop-manager-receipts-prod`)
3. Region: `eu-west-2` (or match your deployment region)
4. **Block all public access:** Leave enabled for now (see policy step below)
5. Versioning: Enable (recommended for receipt preservation)
6. Click **Create bucket**

### 5.2 Configure CORS Policy

CORS configuration is required to allow browsers to upload files directly to S3 using pre-signed PUT URLs.

In the S3 Console: select the bucket → **Permissions** tab → **Cross-origin resource sharing (CORS)** → Edit → paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://yourdomain.com` with your actual production domain. Keep `http://localhost:3000` for local development. Multiple origins are supported by adding more strings to the `AllowedOrigins` array.

### 5.3 Create an IAM Policy

Create a restrictive IAM policy that grants only the permissions the application needs.

AWS Console → IAM → Policies → **Create policy** → JSON tab → paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CoopManagerS3Access",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::coop-manager-receipts-prod/*"
    }
  ]
}
```

Replace `coop-manager-receipts-prod` with your actual bucket name. Save the policy as `CoopManagerS3Policy`.

### 5.4 Create an IAM User and Attach the Policy

1. AWS Console → IAM → Users → **Create user**
2. Username: `coop-manager-app`
3. Access type: **Programmatic access** only (no console access needed)
4. Attach the `CoopManagerS3Policy` directly
5. Complete creation and **download or copy the Access Key ID and Secret Access Key** — these become `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### 5.5 Bucket Policy for Public Receipt Viewing

Receipt images must be publicly readable so members can view them without authenticating to S3. Set a bucket policy that allows public GET on all objects:

AWS Console → S3 → your bucket → **Permissions** tab → **Bucket policy** → Edit → paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForReceipts",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::coop-manager-receipts-prod/*"
    }
  ]
}
```

After saving this policy, disable the "Block public access" setting on the bucket for the specific option "Block public access to buckets and objects granted through new bucket ACLs." The policy-based public access setting must be permitted.

> **Security note:** This policy makes all objects in the bucket publicly readable by anyone with the URL. Receipt URLs contain UUIDs that are effectively unguessable, but users could share URLs with third parties. If stricter access control is required, remove this bucket policy and use pre-signed GET URLs in the application instead.

---

## 6. Email Configuration (Resend)

### 6.1 Create an API Key

1. Sign in to [resend.com](https://resend.com)
2. Dashboard → **API Keys** → **Create API Key**
3. Name: `coop-manager-prod`
4. Permission: **Sending access** only (no need for full access)
5. Copy the key immediately — it is shown only once

Set this as `RESEND_API_KEY` in your environment.

### 6.2 Verify Your Domain

Sending from a verified custom domain avoids spam filters and improves deliverability.

1. Resend Dashboard → **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourdomain.com`)
3. Resend provides DNS records (TXT for verification, SPF, DKIM, DMARC)
4. Add these records to your DNS provider
5. Click **Verify** in the Resend dashboard — propagation can take 5–60 minutes

### 6.3 EMAIL_FROM Format

The `EMAIL_FROM` variable must include a display name and the verified email address:

```
"Cooperative Manager <noreply@yourdomain.com>"
```

The display name is what recipients see in their email client. The address must belong to a domain verified in Resend.

### 6.4 Testing Email Delivery

After setting up, trigger a test email by inviting a member through the Admin panel. Check:

1. The invite email arrives in the recipient's inbox (not spam)
2. The from name and address match your configuration
3. Links in the email point to your `NEXT_PUBLIC_APP_URL`

If emails go to spam, check that SPF, DKIM, and DMARC records are properly configured in Resend.

---

## 7. SMS Configuration (Twilio)

### 7.1 Obtain Twilio Credentials

1. Sign in to [console.twilio.com](https://console.twilio.com)
2. From the Account Info panel on the main dashboard, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** (click eye icon to reveal) → `TWILIO_AUTH_TOKEN`

### 7.2 Obtain a Phone Number

1. Twilio Console → Phone Numbers → Manage → **Buy a number**
2. Filter by country and SMS capability
3. Purchase a number in E.164 format (e.g., `+12015555555`) → `TWILIO_PHONE_NUMBER`

For Nigerian users, Twilio's international SMS pricing and delivery rates vary. Consider a local carrier integration if SMS delivery rates are poor.

### 7.3 Making Twilio Optional

The application handles missing Twilio configuration gracefully. In the notification library, SMS sends are wrapped in try/catch with silent failure. If `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, or `TWILIO_PHONE_NUMBER` are not set, the Twilio client will not initialise and SMS notifications will be silently skipped. Email notifications continue functioning normally.

To disable SMS entirely, simply omit all three Twilio variables from your environment. No code changes are required.

### 7.4 Testing SMS

Set up Twilio credentials in a staging environment and invite a test member with a valid phone number. Trigger a notification (e.g., approve a loan) and verify the SMS arrives. Check Twilio Console → Monitor → Logs → SMS for delivery status.

---

## 8. Vercel Deployment

### 8.1 Connect the GitHub Repository

1. Sign in to [vercel.com](https://vercel.com)
2. Dashboard → **Add New Project** → **Import Git Repository**
3. Select your GitHub repository
4. Vercel detects the Next.js framework automatically
5. Do not change the default build command (`pnpm build`) — it already includes `prisma migrate deploy && prisma generate`

### 8.2 Configure Environment Variables

Before clicking Deploy, add all environment variables:

1. In the Vercel project setup page, expand **Environment Variables**
2. Add each variable from [Section 3](#3-environment-configuration)
3. For each variable, select the appropriate environments:
   - `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AWS_*`, `RESEND_*`, `CRON_SECRET` → **Production**, **Preview**, **Development**
   - Keep Stripe keys to **Production** only unless you have a Stripe test key for preview

Alternatively, after initial deployment: Vercel Dashboard → Project → **Settings** → **Environment Variables**.

### 8.3 Automatic Migrations on Deploy

The `build` script in `package.json`:

```json
"build": "prisma migrate deploy && prisma generate && next build"
```

This ensures every Vercel deployment:

1. Applies any pending Prisma migrations to the production database
2. Regenerates the Prisma client
3. Builds the Next.js application

**Important:** If a migration fails (e.g., due to a breaking schema change), the build fails and Vercel does not deploy the broken code. The previous deployment remains live.

### 8.4 Custom Domain Setup

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Click **Add Domain** → enter your domain (e.g., `coop.yourdomain.com`)
3. Vercel provides DNS records (CNAME or A record)
4. Add these to your DNS provider
5. Vercel auto-provisions a TLS certificate via Let's Encrypt

After the domain is live, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to use the new domain, then trigger a redeployment.

---

## 9. Cron Job Setup

The application includes a scheduled job that checks for overdue loans and sends payment notifications.

### 9.1 The Endpoint

```
GET /api/cron/check-overdue
Authorization: Bearer <CRON_SECRET>
```

The endpoint:

1. Fetches all APPROVED loans that have not been marked as repaid
2. Calculates the health of each loan using the `calculateLoanHealth` function
3. For loans that are BEHIND or DEFAULTED, sends an overdue notification to the borrower
4. Deduplicates: if a notification has already been sent within the last 23 hours, it is skipped
5. Returns `{ success: true, loansChecked: N, notified: M }`

### 9.2 Vercel Cron Configuration

Vercel Cron jobs are configured in `vercel.json`. The file already exists in the repository:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This schedules the job to run at **08:00 UTC daily**. Vercel sends an authenticated GET request to the endpoint with the `Authorization: Bearer <CRON_SECRET>` header automatically.

**Prerequisites:**

- Your Vercel project must be on the **Pro plan or above** — cron jobs are not available on the Hobby plan
- `CRON_SECRET` must be set in Vercel environment variables

### 9.3 Adding CRON_SECRET to Vercel

The endpoint checks:

```typescript
const auth = request.headers.get("authorization");
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

Generate a strong secret:

```bash
openssl rand -base64 32
```

Add it as `CRON_SECRET` in Vercel → Project → Settings → Environment Variables (Production only; cron jobs do not run in Preview/Development).

### 9.4 Testing the Cron Endpoint Manually

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/check-overdue
```

Expected response:

```json
{ "success": true, "loansChecked": 12, "notified": 2 }
```

---

## 10. Backup Procedures

### 10.1 Neon Automated Backups

Neon automatically creates daily backups on all paid plans and retains them for 7–30 days depending on the plan tier. These are managed by Neon and require no configuration.

To verify backup retention:

1. Neon Dashboard → your project → **Branches**
2. Neon uses branch-based snapshots; the `main` branch history represents your backup

To restore a specific point in time:

1. Neon Dashboard → your project → **Branches** → **Restore**
2. Select date and time
3. Neon creates a restore branch; you can point a staging environment at it to verify before promoting

### 10.2 S3 Versioning for Receipts

Enable versioning on the S3 bucket (recommended at creation time; see Section 5.1). With versioning enabled:

- Deleted objects are retained as delete markers (recoverable)
- Overwritten objects retain previous versions
- You can restore any previous version from the AWS Console or CLI

Configure a lifecycle rule to expire older versions after 365 days to manage storage costs:

1. S3 → your bucket → **Management** → **Lifecycle rules** → **Create rule**
2. Rule name: `expire-old-versions`
3. Scope: apply to all objects
4. Add action: **Expire previous object versions after 365 days**

### 10.3 Manual Export Procedures

**Database export (full dump):**

```bash
pg_dump "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" \
  --no-owner \
  --no-acl \
  -f backup_$(date +%Y%m%d).sql
```

**Export member data to CSV:**
Navigate to Admin → Reports and use the **Export CSV** function (available for contribution and loan data). This downloads a CSV of the current filtered view.

**Export audit trail:**
The audit trail displays up to the last 500 events. For a complete export, use a database dump or query the `Event` table directly via Prisma Studio or psql.

Schedule monthly manual database dumps and store them in a separate location from Neon (e.g., a separate AWS S3 bucket with restricted access or an encrypted local drive).

---

## 11. Monitoring

### 11.1 Vercel Log Viewer

1. Vercel Dashboard → Project → **Logs**
2. Filter by:
   - **Function:** `/api/*` routes
   - **Level:** Error to focus on failures
   - **Time range:** Custom date ranges for incident investigation

Vercel retains logs for 1 hour (Hobby) or up to 30 days (Pro+). For longer retention, configure log drains.

### 11.2 Vercel Log Drains

To retain logs beyond Vercel's default retention:

1. Vercel Dashboard → Project → **Settings** → **Log Drains**
2. Add a drain destination (Datadog, Logtail, Axiom, or a custom HTTP endpoint)
3. Select log sources: **Function Logs** and **Edge Logs**

### 11.3 Error Tracking

For production error tracking, integrate Sentry or a compatible error monitoring service:

1. Install the Sentry SDK: `pnpm add @sentry/nextjs`
2. Run the Sentry wizard: `pnpm dlx @sentry/wizard@latest -i nextjs`
3. Add `SENTRY_DSN` to environment variables
4. Sentry captures unhandled exceptions in both server and client code

Without Sentry, monitor the Vercel function logs for `Error:` and `Unhandled` strings as a manual alternative.

### 11.4 Performance Monitoring

Vercel provides built-in performance metrics:

- Vercel Dashboard → Project → **Analytics** — Core Web Vitals, page load times
- Vercel Dashboard → Project → **Speed Insights** — per-route performance breakdown

For database query performance, enable Prisma query logging in development by setting `log: ['query']` in the PrismaClient constructor.

---

## 12. Security Hardening

### 12.1 Environment Variable Security

- Never commit `.env` to source control. Ensure `.env` is in `.gitignore`.
- Rotate `BETTER_AUTH_SECRET` if you suspect it has been exposed. Rotating it invalidates all active sessions — users will need to log in again.
- Rotate `AWS_SECRET_ACCESS_KEY` immediately if exposed. Create a new IAM access key and delete the compromised one.
- Use Vercel's environment variable system rather than hardcoding values. Vercel encrypts secrets at rest.

### 12.2 S3 Bucket Policy

Ensure the S3 bucket policy only allows public GET (read) access, not PUT or DELETE:

```json
{
  "Action": "s3:GetObject"
}
```

The IAM user policy grants PUT access. The bucket policy grants public GET access. These are separate and serve different purposes. Never grant public PUT, DELETE, or ListBucket permissions on the bucket policy.

Review IAM permissions quarterly and remove unused access keys.

### 12.3 Rate Limiting

Better-auth includes built-in rate limiting on authentication endpoints. For additional protection on API routes, consider adding a middleware layer using Vercel's Edge Middleware or the `@upstash/ratelimit` library with a Redis backend.

The cron endpoint (`/api/cron/check-overdue`) is protected by a bearer token check. Do not expose this endpoint without the secret.

### 12.4 HTTPS Enforcement

Vercel enforces HTTPS automatically on all deployments. The `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` should always use `https://` in production. Any `http://` URLs will cause session cookies to fail (they are set with `Secure` flag by better-auth).

### 12.5 Database Security

- Use the Neon **pooled connection string** in production — it runs through Neon's connection pooler which adds a layer of isolation
- Enable `sslmode=require` in the connection string (already in the default format)
- Do not expose the database to the public internet; use Neon's IP restrictions if available on your plan
- Create a read-only database user for any analytics or reporting tools that do not need write access

---

## 13. Performance Tuning

### 13.1 Database Query Optimization

The primary database performance concerns are:

**N+1 queries:** The application uses Prisma's `include` for related data loading. Review any new data-fetching code for missing `include` clauses that would trigger N+1 patterns.

**Index coverage:** The Prisma schema includes indexes on all foreign keys and common filter columns (`cooperativeId`, `userId`, `status`, `createdAt`). If you add custom queries, ensure the relevant columns are indexed.

**Pagination:** The audit trail query fetches the last 500 events. For large cooperatives, consider adding pagination if this query becomes slow.

### 13.2 Connection Pooling with Neon Serverless

The application uses `@prisma/adapter-pg` with `pg` (node-postgres) which manages its own connection pool. In a Vercel serverless environment, each function invocation may create a new connection.

Neon's serverless driver handles connection multiplexing via its pooler endpoint. Use the **pooled connection string** (which points to `ep-*.pooler.neon.tech`) in `DATABASE_URL` for production. This is critical — without the pooler, Vercel functions can exhaust the database's connection limit under load.

The Prisma client singleton pattern in `app/lib/prisma.ts` reuses the client instance in development to prevent hot-reload connection exhaustion:

```typescript
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

In production (Vercel), each serverless function instance has its own process lifecycle, so the `globalForPrisma` pattern mainly benefits development. The pooler handles production connection management.

### 13.3 Static Generation vs Dynamic Rendering

Most admin pages use `export const dynamic = "force-dynamic"` to ensure they are always server-rendered with fresh data. This is correct for financial data — cached stale values would be misleading.

The public marketing page (`/`) and auth pages (`/auth/*`) do not use force-dynamic and are statically generated or ISR. Do not add force-dynamic to these pages.

---

## 14. Troubleshooting Deployment

### Database Connection Failed

**Symptom:** Application fails to start; error log shows `can't reach database server` or `SSL connection error`

**Steps:**

1. Verify `DATABASE_URL` is set correctly in Vercel environment variables
2. Ensure the connection string uses the **pooled** endpoint (contains `pooler.neon.tech`) for Vercel deployments
3. Confirm `?sslmode=require` is appended to the connection string
4. Test the connection string locally: `psql "YOUR_DATABASE_URL" -c "SELECT 1;"`
5. Check Neon dashboard to confirm the project is active and not suspended (free tier projects suspend after inactivity)

### Migrations Not Running

**Symptom:** Application starts but database schema is out of date; 500 errors on pages that use new models

**Steps:**

1. Check the Vercel build logs for the output of `prisma migrate deploy`
2. If migrations show as failed, check if the migration SQL is valid: `pnpm dlx prisma@latest migrate status`
3. Verify the `DATABASE_URL` in the build environment matches the production database (not a stale preview database)
4. Run `pnpm dlx prisma@latest migrate deploy` manually against the production database if the Vercel build migration is failing but the schema is correct

### S3 CORS Errors

**Symptom:** Receipt upload fails in browser; console shows `CORS policy` error or `Access to fetch blocked`

**Steps:**

1. Open the S3 Console → your bucket → Permissions → CORS configuration
2. Verify `AllowedOrigins` includes your production domain exactly as it appears in the browser URL bar (include `https://`, no trailing slash)
3. Verify `AllowedMethods` includes `PUT`
4. After saving the CORS config, wait 1–2 minutes for propagation
5. Test with: `curl -X OPTIONS -H "Origin: https://yourdomain.com" -H "Access-Control-Request-Method: PUT" https://YOUR-BUCKET.s3.eu-west-2.amazonaws.com/test`
6. Check that the IAM user has `s3:PutObject` permission on the bucket

### Email Not Sending

**Symptom:** Members are not receiving invitation emails or notification emails

**Steps:**

1. Verify `RESEND_API_KEY` starts with `re_` and is not expired in the Resend dashboard
2. Verify the domain in `EMAIL_FROM` is verified in Resend (green status in Resend → Domains)
3. Check Resend dashboard → Logs for delivery status — look for bounce or spam filter rejections
4. Ensure `EMAIL_FROM` format is correct: `"Name <email@domain.com>"` with quotes if the name has spaces
5. Test by sending a manual email via Resend's API tester in their dashboard

### Twilio Not Configured

**Symptom:** No SMS notifications are being sent, but no errors appear

**Behaviour:** This is expected when Twilio variables are not set. SMS notifications silently fail. Email notifications continue working.

**To confirm:** Search Vercel function logs for `Twilio` — if no entries appear, Twilio is not being reached. If you see `Error: accountSid must start with AC`, the `TWILIO_ACCOUNT_SID` is malformed or wrong.

### Cron Job Not Running

**Symptom:** Overdue loan notifications are not being sent; manual test of the endpoint returns 401

**Steps:**

1. Verify `CRON_SECRET` is set in Vercel environment variables for Production
2. Verify the Vercel project is on a paid plan (cron is not available on Hobby)
3. Check `vercel.json` contains the cron configuration (see Section 9.2)
4. Test manually with the correct secret: `curl -H "Authorization: Bearer YOUR_SECRET" https://yourdomain.com/api/cron/check-overdue`
5. Check Vercel Dashboard → Project → **Cron Jobs** tab for run history and any errors

---

## 15. Upgrade Procedures

### 15.1 Pulling Latest Code

```bash
git fetch origin
git checkout main
git pull origin main
pnpm install
```

Review `CHANGELOG.md` or git log for any breaking changes, new required environment variables, or manual steps required.

### 15.2 Running New Migrations Locally

Before deploying, test any new migrations against a local or staging database:

```bash
pnpm dlx prisma@latest migrate dev
```

This applies any new migration files in `prisma/migrations/`. If migration fails, investigate and fix the SQL before deploying to production.

### 15.3 Zero-Downtime Deploys on Vercel

Vercel deployments are zero-downtime by default:

1. The new build is compiled in an isolated environment
2. Migrations run during the build phase (before the deployment is promoted)
3. Once the build succeeds, Vercel atomically promotes the new deployment
4. The previous deployment remains available as a fallback (Vercel → Project → Deployments → Previous deployment → **Promote**)

**Important for schema changes:** Migrations run before the new code goes live. This means the database schema changes while the old code is still serving traffic. Write migrations that are backward-compatible:

- Adding a column: always provide a default value or make it nullable
- Renaming a column: use a two-phase migration (add new → deploy code that handles both → remove old)
- Removing a column: remove code references first → deploy → then run the DROP COLUMN migration

### 15.4 Rolling Back a Deployment

If a deployment causes production issues:

1. Vercel Dashboard → Project → **Deployments**
2. Click the previous successful deployment
3. Click **... (more actions)** → **Promote to Production**

This instantly switches production traffic back to the previous build. If the failed deployment included a database migration, you may need to manually revert it depending on whether the migration was destructive.

### 15.5 Updating Dependencies

Regularly update dependencies to receive security patches:

```bash
pnpm update --interactive
```

After updating, run the full test suite (if available) and test critical paths manually:

- Member login and contribution submission
- Loan application and approval flow
- Dividend creation and processing
- PDF export

Update Prisma separately as major versions may require schema or client changes:

```bash
pnpm update prisma @prisma/client @prisma/adapter-pg
pnpm dlx prisma@latest generate
```

Review the [Prisma release notes](https://github.com/prisma/prisma/releases) before major version upgrades.
