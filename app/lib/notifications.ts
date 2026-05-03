import prisma from "./prisma";
import { Resend } from "resend";
import { UserRole } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Cooperative Admin <admin@jomavi.co.uk>";

async function logNotification(data: {
  cooperativeId: string;
  userId: string;
  type: string;
  channel: string;
  recipient: string;
  subject?: string;
  body: string;
  status: string;
  externalId?: string;
}) {
  try {
    await prisma.notification.create({ data });
  } catch {
    // never let logging break the caller
  }
}

async function sendEmail({
  cooperativeId, userId, type, to, subject, html,
}: {
  cooperativeId: string; userId: string; type: string;
  to: string; subject: string; html: string;
}) {
  try {
    const { data } = await resend.emails.send({ from: FROM, to, subject, html });
    await logNotification({ cooperativeId, userId, type, channel: "EMAIL", recipient: to, subject, body: html, status: "SENT", externalId: data?.id });
  } catch {
    await logNotification({ cooperativeId, userId, type, channel: "EMAIL", recipient: to, subject, body: html, status: "FAILED" });
  }
}

async function sendSMS({
  cooperativeId, userId, type, to, body,
}: {
  cooperativeId: string; userId: string; type: string;
  to: string; body: string;
}) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );
    const json = await res.json() as { sid?: string };
    await logNotification({ cooperativeId, userId, type, channel: "SMS", recipient: to, body, status: res.ok ? "SENT" : "FAILED", externalId: json.sid });
  } catch {
    await logNotification({ cooperativeId, userId, type, channel: "SMS", recipient: to, body, status: "FAILED" });
  }
}

type UserPrefs = { name: string; email: string; phoneNumber: string | null; emailNotifications: boolean; smsNotifications: boolean };

async function getUserAndCoop(userId: string, cooperativeId: string) {
  const [user, cooperative] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phoneNumber: true, emailNotifications: true, smsNotifications: true },
    }),
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { name: true, currencySymbol: true },
    }),
  ]);
  return { user: user as UserPrefs | null, cooperative };
}

export async function notifyLoanApproved(
  userId: string, cooperativeId: string,
  loanAmount: number, totalDue: number, repaymentMonths: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;
  const monthly = Math.round(totalDue / repaymentMonths).toLocaleString();

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "LOAN_APPROVED",
      to: user.email,
      subject: "Your loan has been approved",
      html: `<p>Hi ${user.name},</p>
<p>Your loan application has been approved.</p>
<ul>
  <li><strong>Loan amount:</strong> ${sym}${loanAmount.toLocaleString()}</li>
  <li><strong>Total to repay:</strong> ${sym}${totalDue.toLocaleString()}</li>
  <li><strong>Monthly payment:</strong> ${sym}${monthly}</li>
  <li><strong>Duration:</strong> ${repaymentMonths} months</li>
</ul>
<p>Log in to view your repayment schedule.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "LOAN_APPROVED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Your loan of ${sym}${loanAmount.toLocaleString()} was approved. Monthly: ${sym}${monthly} for ${repaymentMonths} months.`,
    });
  }
}

export async function notifyLoanRejected(
  userId: string, cooperativeId: string,
  loanAmount: number, reason: string
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "LOAN_REJECTED",
      to: user.email,
      subject: "Your loan application was not approved",
      html: `<p>Hi ${user.name},</p>
<p>Your loan application for ${sym}${loanAmount.toLocaleString()} was not approved.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please contact your cooperative administrator for more information.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "LOAN_REJECTED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Your loan application was not approved. ${reason.slice(0, 100)}`,
    });
  }
}

export async function notifyGuarantorRequested(
  guarantorId: string, cooperativeId: string,
  applicantName: string, loanAmount: number
) {
  const { user: guarantor, cooperative } = await getUserAndCoop(guarantorId, cooperativeId);
  if (!guarantor || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (guarantor.emailNotifications) {
    await sendEmail({
      cooperativeId, userId: guarantorId, type: "GUARANTOR_REQUESTED",
      to: guarantor.email,
      subject: `${applicantName} has requested you as a loan guarantor`,
      html: `<p>Hi ${guarantor.name},</p>
<p>${applicantName} has requested you as a guarantor for a loan of ${sym}${loanAmount.toLocaleString()}.</p>
<p>Please log in to accept or decline this request.</p>`,
    });
  }
  if (guarantor.smsNotifications && guarantor.phoneNumber) {
    await sendSMS({
      cooperativeId, userId: guarantorId, type: "GUARANTOR_REQUESTED",
      to: guarantor.phoneNumber,
      body: `${cooperative.name}: ${applicantName} requests you as guarantor for ${sym}${loanAmount.toLocaleString()}. Log in to respond.`,
    });
  }
}

export async function notifyContributionVerified(
  userId: string, cooperativeId: string, amount: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "CONTRIBUTION_VERIFIED",
      to: user.email,
      subject: "Your contribution has been verified",
      html: `<p>Hi ${user.name},</p>
<p>Your contribution of ${sym}${amount.toLocaleString()} has been verified and added to your account.</p>
<p>Thank you for contributing to ${cooperative.name}!</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "CONTRIBUTION_VERIFIED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Contribution of ${sym}${amount.toLocaleString()} verified and added to your account.`,
    });
  }
}

export async function notifyContributionRejected(
  userId: string, cooperativeId: string, amount: number, reason: string
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "CONTRIBUTION_REJECTED",
      to: user.email,
      subject: "Your contribution could not be verified",
      html: `<p>Hi ${user.name},</p>
<p>Your contribution of ${cooperative.currencySymbol}${amount.toLocaleString()} could not be verified.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please contact your administrator if you have questions.</p>`,
    });
  }
}

export async function notifyPaymentOverdue(
  userId: string, cooperativeId: string,
  amountBehind: number, daysOverdue: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "PAYMENT_OVERDUE",
      to: user.email,
      subject: "Loan payment overdue — action required",
      html: `<p>Hi ${user.name},</p>
<p>Your loan payment is overdue.</p>
<ul>
  <li><strong>Amount behind:</strong> ${sym}${amountBehind.toLocaleString()}</li>
  <li><strong>Days overdue:</strong> ${daysOverdue}</li>
</ul>
<p>Please make your payment as soon as possible to avoid penalties.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "PAYMENT_OVERDUE",
      to: user.phoneNumber,
      body: `${cooperative.name}: Loan payment ${daysOverdue} days overdue. Amount behind: ${sym}${amountBehind.toLocaleString()}. Please pay now.`,
    });
  }
}

export async function notifyDividendPaid(
  userId: string, cooperativeId: string, amount: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "DIVIDEND_PAID",
      to: user.email,
      subject: `Your dividend of ${sym}${amount.toLocaleString()} has been paid`,
      html: `<p>Hi ${user.name},</p>
<p>Your dividend payment from ${cooperative.name} has been processed.</p>
<p><strong>Amount: ${sym}${amount.toLocaleString()}</strong></p>
<p>Log in to your account to view the details.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "DIVIDEND_PAID",
      to: user.phoneNumber,
      body: `${cooperative.name}: Dividend of ${sym}${amount.toLocaleString()} paid to your account!`,
    });
  }
}

export async function notifyWithdrawalApproved(
  userId: string, cooperativeId: string, amount: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "WITHDRAWAL_APPROVED",
      to: user.email,
      subject: "Your withdrawal request has been approved",
      html: `<p>Hi ${user.name},</p>
<p>Your withdrawal request has been approved.</p>
<p><strong>Amount: ${sym}${amount.toLocaleString()}</strong></p>
<p>Funds will be transferred to you shortly. Log in to track the status.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "WITHDRAWAL_APPROVED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Withdrawal of ${sym}${amount.toLocaleString()} approved. Funds will be transferred shortly.`,
    });
  }
}

export async function notifyWithdrawalRejected(
  userId: string, cooperativeId: string, amount: number, reason: string
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "WITHDRAWAL_REJECTED",
      to: user.email,
      subject: "Your withdrawal request was not approved",
      html: `<p>Hi ${user.name},</p>
<p>Your withdrawal request for ${sym}${amount.toLocaleString()} was not approved.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please contact your cooperative administrator for more information.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "WITHDRAWAL_REJECTED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Withdrawal request not approved. ${reason.slice(0, 100)}`,
    });
  }
}

export async function notifyMemberVerified(userId: string, cooperativeId: string) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "MEMBER_VERIFIED",
      to: user.email,
      subject: `Your ${cooperative.name} account is verified`,
      html: `<p>Hi ${user.name},</p>
<p>Your account with <strong>${cooperative.name}</strong> has been verified. You now have full access.</p>
<p>You can now submit contributions, apply for loans, view dividends, and request withdrawals.</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "MEMBER_VERIFIED",
      to: user.phoneNumber,
      body: `${cooperative.name}: Your account has been verified. You now have full access.`,
    });
  }
}

export async function notifyWithdrawalPaid(
  userId: string, cooperativeId: string, amount: number
) {
  const { user, cooperative } = await getUserAndCoop(userId, cooperativeId);
  if (!user || !cooperative) return;

  const sym = cooperative.currencySymbol;

  if (user.emailNotifications) {
    await sendEmail({
      cooperativeId, userId, type: "WITHDRAWAL_PAID",
      to: user.email,
      subject: "Your withdrawal has been processed",
      html: `<p>Hi ${user.name},</p>
<p>Your withdrawal has been processed and transferred.</p>
<p><strong>Amount: ${sym}${amount.toLocaleString()}</strong></p>
<p>Please check your account for the transfer. Thank you for your membership!</p>`,
    });
  }
  if (user.smsNotifications && user.phoneNumber) {
    await sendSMS({
      cooperativeId, userId, type: "WITHDRAWAL_PAID",
      to: user.phoneNumber,
      body: `${cooperative.name}: Withdrawal of ${sym}${amount.toLocaleString()} processed. Check your account.`,
    });
  }
}

export async function notifyAnnouncement(announcementId: string, cooperativeId: string) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) return;

    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { name: true, currencySymbol: true },
    });
    if (!cooperative) return;

    const roleFilter: UserRole[] | undefined =
      announcement.recipientType === "MEMBERS_ONLY"
        ? [UserRole.MEMBER]
        : announcement.recipientType === "ADMINS_ONLY"
        ? [UserRole.OWNER, UserRole.ADMIN]
        : undefined;

    const recipients = await prisma.user.findMany({
      where: {
        cooperativeId,
        deletedAt: null,
        ...(roleFilter ? { role: { in: roleFilter } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    const agmExtra =
      announcement.type === "AGM" && announcement.agmDate
        ? `<p><strong>Date:</strong> ${new Date(announcement.agmDate).toLocaleString()}</p>${
            announcement.agmLocation
              ? `<p><strong>Location:</strong> ${announcement.agmLocation}</p>`
              : ""
          }`
        : "";

    const rsvpExtra = announcement.allowRsvp
      ? `<p>Please <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard/announcements/${announcementId}">log in to RSVP</a>.</p>`
      : "";

    for (const recipient of recipients) {
      if (recipient.emailNotifications) {
        await sendEmail({
          cooperativeId,
          userId: recipient.id,
          type: "ANNOUNCEMENT",
          to: recipient.email,
          subject: announcement.title,
          html: `<p>Hi ${recipient.name},</p>
<p>${announcement.message.replace(/\n/g, "<br>")}</p>
${agmExtra}${rsvpExtra}`,
        });
      }
      if (recipient.smsNotifications && recipient.phoneNumber) {
        await sendSMS({
          cooperativeId,
          userId: recipient.id,
          type: "ANNOUNCEMENT",
          to: recipient.phoneNumber,
          body: `${cooperative.name}: ${announcement.message.slice(0, 120)}`,
        });
      }
    }
  } catch {
    // never throw
  }
}
