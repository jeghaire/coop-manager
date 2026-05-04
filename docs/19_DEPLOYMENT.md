# 19 — Deployment

This document is the complete deployment and operations guide for the Cooperative Manager application. It covers local development setup, all external service integrations, production deployment on Vercel, and ongoing maintenance procedures.

> **Cross-reference:** Security practices for environment variables and secret rotation are described in [18_SECURITY.md](./18_SECURITY.md).

---

## Prerequisites

Before you begin, create accounts with the following services. Free tiers are sufficient for development and small cooperatives.

| Service | Purpose | Free Tier |
|---|---|---|
| [GitHub](https://github.com) | Source code hosting and CI trigger | Yes |
| [Vercel](https://vercel.com) | Application hosting and serverless functions | Yes (Hobby) |
| [Neon](https://neon.tech) | Serverless PostgreSQL database | Yes (0.5 GB storage) |
| [AWS](https://aws.amazon.com) | S3 bucket for receipt file uploads | Yes (5 GB S3 free tier) |
| [Resend](https://resend.com) | Transactional email (invites, notifications) | Yes (100 emails/day) |
| [Twilio](https://twilio.com) | SMS notifications | Optional — graceful degradation if absent |
| [Stripe](https://stripe.com) | Cooperative billing subscriptions | Test mode for dev |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/coop-manager.git
cd coop-manager
```

### 2. Install Dependencies

The project uses `pnpm` as its package manager.

```bash
pnpm install
```

If `pnpm` is not installed: `npm install -g pnpm`

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in every variable. See the [Environment Variables](#environment-variables) section below for where to obtain each value. For local development you can use placeholder values for Stripe, Twilio, and S3 if you do not need those features.

### 4. Run Database Migrations

```bash
pnpm dlx prisma@latest migrate dev --name init
```

This creates all tables in your local database and generates the Prisma client.

### 5. Start the Development Server

```bash
pnpm dev
```

The application runs at `http://localhost:3000`.

### Useful Development Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Production build (runs `prisma migrate deploy` first) |
| `pnpm tsc --noEmit` | Type-check without emitting files |
| `pnpm dlx prisma@latest studio` | Open Prisma Studio (visual DB browser) |
| `pnpm db:seed` | Seed the database with test data |
| `pnpm dlx prisma@latest migrate dev --name feature_name` | Create a new migration for a schema change |

---

## Environment Variables

All 15 environment variables must be present in production. The `.env.example` file in the repository lists all of them with placeholder values.

### DATABASE_URL

**Format:** `postgresql://user:password@host:5432/dbname`

Obtain this from your Neon project dashboard (see [Database Setup](#database-setup-neon) below). For local development, use a local PostgreSQL instance or a Neon development branch.

For serverless/edge deployments, append the pgBouncer connection pooling parameters:

```
postgresql://user:password@host:5432/dbname?pgbouncer=true&connection_limit=1
```

### BETTER_AUTH_SECRET

**Format:** Any string of at least 32 random characters.

Generate a secure value:

```bash
openssl rand -hex 32
```

This secret signs and verifies session tokens. Keep it private. See [18_SECURITY.md](./18_SECURITY.md) for rotation procedure.

### BETTER_AUTH_URL

**Format:** `https://yourdomain.com` (production) or `http://localhost:3000` (development)

This must exactly match the origin where the application is deployed. Better Auth uses it for CSRF validation and email verification links.

### NEXT_PUBLIC_APP_URL

**Format:** `https://yourdomain.com`

Used in notification emails and invite links to construct absolute URLs. Must match your deployed domain. The `NEXT_PUBLIC_` prefix makes it available in client-side code.

### STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Navigate to Developers → API Keys.
3. Copy the **Secret key** (begins with `sk_live_` for production, `sk_test_` for test mode).
4. Navigate to Developers → Webhooks → Add endpoint.
5. Set the endpoint URL to `https://yourdomain.com/api/webhooks/stripe`.
6. Select the events your application listens for (at minimum: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`).
7. Copy the **Signing secret** (begins with `whsec_`).

### RESEND_API_KEY

1. Sign up at [resend.com](https://resend.com).
2. Navigate to API Keys → Create API Key.
3. Copy the key (begins with `re_`).
4. Verify your sending domain under Domains (required for production — see [Resend Email Setup](#resend-email-setup) below).

### EMAIL_FROM

**Format:** `"Display Name <address@yourdomain.com>"`

Example: `"Cooperative Admin <admin@mycooperative.org>"`

This must match a verified sender address or domain in your Resend account. Using an unverified domain will cause emails to be rejected.

### TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

1. Sign up at [console.twilio.com](https://console.twilio.com).
2. From the dashboard, copy your **Account SID** (begins with `AC`).
3. Copy your **Auth Token**.
4. Navigate to Phone Numbers → Manage → Active Numbers and copy a number with SMS capability.

These three variables are optional. If any are missing or empty, SMS sending is silently skipped — the application continues to function with email-only notifications.

### AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

See [AWS S3 Setup](#aws-s3-setup) below for full instructions. The region should match the region where you created your bucket (default: `eu-west-2`).

---

## Database Setup (Neon)

### 1. Create a Neon Account and Project

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Click **New Project**.
3. Choose a name (e.g., `coop-manager-prod`) and a region close to your users.
4. Neon creates a default `main` branch and a `neondb` database.

### 2. Copy the Connection String

1. From the Neon project dashboard, click **Connect**.
2. Select **Prisma** as the framework.
3. Copy the **pooled connection string** (recommended for serverless). It looks like:

```
postgresql://user:password@ep-xxx-yyy.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

4. For Vercel serverless functions, append the pgBouncer parameters:

```
postgresql://user:password@ep-xxx-yyy-pooler.eu-west-2.aws.neon.tech/neondb?pgbouncer=true&connection_limit=1&sslmode=require
```

5. Paste this string as `DATABASE_URL` in your `.env` file and in Vercel's environment variables.

### 3. Run Migrations

**Development (creates migration files):**

```bash
pnpm dlx prisma@latest migrate dev --name init
```

**Production (applies existing migrations without creating new ones):**

```bash
pnpm dlx prisma@latest migrate deploy
```

In production, migrations run automatically via the `build` script in `package.json`:

```json
"build": "prisma migrate deploy && prisma generate && next build"
```

This means every Vercel deployment automatically applies any pending migrations before the new code goes live.

### 4. Staging Environments with Neon Branches

Neon supports database branching — create a branch from `main` for staging or feature testing:

1. In the Neon console, click **Branches → New Branch**.
2. Branch from `main`.
3. Use the branch's connection string as `DATABASE_URL` in your staging Vercel environment.

Branches are cheap (billed only for storage delta) and can be deleted after the feature is merged.

### 5. Backups

Neon performs automatic daily point-in-time recovery (PITR) backups. For the free tier, the retention window is 7 days. No manual backup configuration is required.

---

## AWS S3 Setup

S3 is used to store contribution receipt images and PDFs uploaded by members. The application generates presigned PUT URLs so browsers upload directly to S3 without routing files through the application server.

### 1. Create the Bucket

1. Log in to the [AWS Console](https://console.aws.amazon.com) and navigate to **S3**.
2. Click **Create bucket**.
3. Choose a globally unique name (e.g., `coop-manager-receipts-yourorg`).
4. Select a region. The application defaults to `eu-west-2` (London) — choose one close to your users.
5. Leave **Block all public access** enabled for now (you can adjust per the access model below).
6. Enable **Versioning** (optional but recommended for recovery).
7. Click **Create bucket**.

### 2. Configure CORS

The browser uploads files directly to S3 using presigned PUT URLs. CORS must be configured to allow this from your domain.

1. In the bucket, go to **Permissions → Cross-origin resource sharing (CORS)**.
2. Click **Edit** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

Replace `https://yourdomain.com` with your actual production URL. For local development, add a second origin entry: `"http://localhost:3000"`.

### 3. Create an IAM User with Minimum Permissions

Do not use your root AWS account credentials or any credentials with broad permissions.

1. Navigate to **IAM → Users → Create user**.
2. Give it a name like `coop-manager-s3`.
3. Select **Attach policies directly**, then click **Create policy**.
4. Switch to the JSON editor and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Replace `your-bucket-name` with your actual bucket name. This policy allows only reading and writing objects — it does not permit listing buckets, deleting objects, or any other operations.

5. Name the policy `coop-manager-s3-policy` and attach it to the IAM user.
6. Navigate to the user → **Security credentials → Create access key**.
7. Choose **Application running outside AWS**.
8. Copy the **Access key ID** and **Secret access key** — you will not be able to view the secret again.
9. Set these as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

### 4. Access Model for Receipts

The application currently generates public URLs via `getPublicUrl()`:

```
https://{bucket}.s3.{region}.amazonaws.com/{key}
```

**For public read access** (simpler setup), add a bucket policy:

1. Go to **Permissions → Bucket policy** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/receipts/*"
    }
  ]
}
```

This restricts public read to the `receipts/` prefix only.

**For private receipts** (more secure), replace `getPublicUrl()` calls with `generatePresignUrl()` using `GetObjectCommand` instead of `PutObjectCommand`. This generates time-limited signed GET URLs. The tradeoff is additional latency when loading receipt images.

---

## Resend Email Setup

### 1. Create Account and API Key

1. Sign up at [resend.com](https://resend.com).
2. Go to **API Keys → Create API Key**.
3. Name it (e.g., `coop-manager-prod`), set permissions to **Sending access**.
4. Copy the key and set it as `RESEND_API_KEY`.

### 2. Verify Your Sending Domain

Emails sent from unverified domains are likely to be flagged as spam or rejected entirely.

1. In Resend, go to **Domains → Add Domain**.
2. Enter your domain (e.g., `mycooperative.org`).
3. Resend provides DNS records (SPF, DKIM, DMARC). Add these records through your DNS provider.
4. Click **Verify** in Resend once the records propagate (can take up to 48 hours).

### 3. Test Email Delivery

Once the domain is verified, test it with a curl command:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Cooperative Admin <admin@yourdomain.com>",
    "to": "your-test-address@example.com",
    "subject": "Test from Cooperative Manager",
    "html": "<p>Email delivery is working.</p>"
  }'
```

A successful response contains an email ID.

---

## Twilio SMS Setup (Optional)

### 1. Create Account and Get a Phone Number

1. Sign up at [console.twilio.com](https://console.twilio.com).
2. Complete phone verification.
3. Navigate to **Phone Numbers → Manage → Buy a Number**.
4. Filter by SMS capability and purchase a number.
5. Copy **Account SID**, **Auth Token**, and the phone number.

### 2. Set Environment Variables

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12015551234
```

### 3. Graceful Degradation

The SMS sending function checks for the presence of all three variables before attempting to send:

```ts
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;
if (!sid || !token || !from) return;
```

If any variable is missing, SMS is silently skipped. Email notifications continue to work normally. You do not need to configure Twilio for the application to function — it is a progressive enhancement.

---

## Vercel Deployment

### 1. Import the GitHub Repository

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New → Project**.
3. Select your GitHub repository.
4. Vercel detects Next.js automatically. Accept the defaults:
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm build`
   - **Install Command:** `pnpm install`
   - **Output Directory:** `.next`

### 2. Configure Environment Variables

Before the first deploy, go to **Project Settings → Environment Variables** and add every variable from the [Environment Variables](#environment-variables) section. Set the environment scope:

- `DATABASE_URL`, `BETTER_AUTH_SECRET`, all API keys: **Production** + **Preview** (use separate test/dev values for Preview)
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`: **Production** only (each environment needs its own URL)

### 3. Deploy

Click **Deploy**. Vercel runs `pnpm install` then `pnpm build`. The build script runs `prisma migrate deploy` automatically before `next build`, so the database schema is always in sync with the deployed code.

### 4. Add a Custom Domain (Optional)

1. Go to **Project Settings → Domains**.
2. Add your domain (e.g., `app.mycooperative.org`).
3. Vercel provides DNS records to add at your registrar.
4. Once DNS propagates, Vercel provisions a TLS certificate automatically.
5. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your new domain and redeploy.

### 5. Preview Deployments

Every pull request on GitHub triggers a Preview deployment on Vercel at a unique URL (e.g., `coop-manager-git-feature-branch.vercel.app`). Preview deployments use **Preview** scoped environment variables. Point Preview's `DATABASE_URL` at a Neon branch to get an isolated database for each PR.

---

## Cron Job Configuration

The overdue loan check (`/api/cron/check-overdue`) runs daily at 08:00 UTC and sends payment overdue notifications to members with active loans that are behind schedule.

### 1. vercel.json

The `vercel.json` file in the repository root configures the Vercel Cron:

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

This is already committed to the repository. Vercel reads it on deployment.

### 2. CRON_SECRET

The cron endpoint requires a bearer token to prevent unauthorised triggers.

1. Generate a secret: `openssl rand -hex 32`
2. Add it as `CRON_SECRET` in Vercel's environment variables.
3. Vercel automatically passes this header when triggering the cron — no further configuration is needed.

### 3. Test the Cron Manually

To verify the endpoint is working without waiting for the scheduled time:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://yourdomain.com/api/cron/check-overdue
```

A successful response:

```json
{ "success": true, "loansChecked": 12, "notified": 2 }
```

### 4. Cron on Non-Vercel Deployments

If you are self-hosting, configure a system cron to call the endpoint at 08:00 UTC daily:

```cron
0 8 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/check-overdue
```

---

## Post-Deployment Verification Checklist

Run through this checklist after every fresh deployment and after major upgrades.

- [ ] **Authentication:** Sign up with a new email address. Confirm the verification email arrives and the link works. Sign out and sign back in.
- [ ] **Email notifications:** Trigger a contribution submission. Confirm a notification email is delivered to the member's address.
- [ ] **File upload:** Submit a contribution with a receipt attachment (image or PDF). Confirm the file uploads successfully and the receipt URL is accessible.
- [ ] **Contribution verification:** As an admin, verify the test contribution. Confirm the status changes to VERIFIED and a notification is sent.
- [ ] **Loan application:** As a member, apply for a small loan with two guarantors. Confirm the guarantors receive notification emails.
- [ ] **Admin loan review:** As an admin (different account from the applicant), approve the loan. Confirm the applicant receives an approval email.
- [ ] **PDF export:** From the admin reports page, export a CSV or PDF. Confirm the download works.
- [ ] **Cron endpoint:** Call the cron endpoint manually (as described above) and confirm it returns `success: true`.
- [ ] **Custom domain (if configured):** Confirm HTTPS is working and the certificate is valid.

---

## Monitoring Setup

### Vercel Analytics

1. In your Vercel project dashboard, go to **Analytics**.
2. Click **Enable Analytics**.
3. This provides page view data, Web Vitals scores, and audience metrics without any code changes.

### Vercel Logs (Real-Time)

1. In the project dashboard, go to **Logs**.
2. Logs stream in real time. Filter by function name, status code, or search for specific error messages.
3. For persistent log storage, integrate a log drain (Vercel Pro+) to ship logs to Datadog, Logtail, or a similar service.

### Neon Monitoring Dashboard

The Neon console provides:

- Active connection count (useful for detecting connection pool exhaustion)
- Query volume over time
- Storage usage

Navigate to your Neon project → **Monitoring** to view these metrics.

### S3 Access Logs (Optional)

To track which receipts are accessed:

1. Create a separate S3 bucket for logs (e.g., `coop-manager-receipts-logs`).
2. In the main bucket, go to **Properties → Server access logging → Edit**.
3. Enable logging and set the target bucket.

Access logs are written approximately every hour and are useful for auditing receipt downloads.

### Error Monitoring (Recommended)

For production deployments serving paying cooperatives, consider adding an error monitoring service such as Sentry. Add the Sentry Next.js SDK and configure the DSN as an environment variable. This provides stack traces, error grouping, and alerting for unhandled exceptions.

---

## Upgrade Procedure

Follow this procedure when deploying new versions of the application.

### Standard Upgrade (No Schema Changes)

1. Pull the latest code:
   ```bash
   git pull origin main
   ```
2. Install updated dependencies:
   ```bash
   pnpm install
   ```
3. Type-check:
   ```bash
   pnpm tsc --noEmit
   ```
4. Test locally:
   ```bash
   pnpm dev
   ```
5. Push to GitHub. Vercel auto-deploys.

### Upgrade with Schema Changes

If the upgrade includes changes to `prisma/schema.prisma`:

1. Pull latest code and install dependencies (steps 1–2 above).
2. Create and apply the migration locally:
   ```bash
   pnpm dlx prisma@latest migrate dev --name describe_the_change
   ```
   This creates a new migration file in `prisma/migrations/`.
3. Commit the new migration file:
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration: describe_the_change"
   ```
4. Push to GitHub. Vercel's build runs `prisma migrate deploy` automatically, applying the migration to the production database before starting the new server.

> **Important:** Never run `prisma migrate dev` against a production database. Use `prisma migrate deploy` in production. The `migrate dev` command can prompt interactively and is designed for development only.

### Rolling Back a Migration

Prisma does not support automatic down migrations. If a migration causes problems:

1. Write a new corrective migration that reverses the schema change:
   ```bash
   pnpm dlx prisma@latest migrate dev --name revert_change
   ```
2. Deploy the corrective migration.

For critical data-loss situations, restore from the Neon point-in-time recovery feature.

### Dependency Updates

Run dependency updates regularly to receive security patches:

```bash
pnpm update --interactive
```

Review the changelog for any packages with breaking changes before updating. Pay particular attention to:

- `better-auth` — auth library updates may change session format or cookie behaviour
- `prisma` — major versions may require migration file changes
- `next` — read the Next.js upgrade guide for the specific version
