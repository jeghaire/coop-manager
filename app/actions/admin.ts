"use server";

import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";
import { requireAuth } from "@/app/lib/auth-helpers";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type AdminActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  tempPassword?: string;
  importResults?: { created: number; skipped: string[] };
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return (
    "Coop-" +
    Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  );
}

async function sendInviteEmail(
  to: string,
  name: string,
  cooperativeName: string,
  tempPassword: string
) {
  await resend.emails.send({
    from: "Cooperative Manager <onboarding@resend.dev>",
    to,
    subject: `You've been added to ${cooperativeName}`,
    html: `
      <p>Hi ${name},</p>
      <p>You've been added to <strong>${cooperativeName}</strong> on Cooperative Manager.</p>
      <p>Sign in at <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/signin">/auth/signin</a> using:</p>
      <ul>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Temporary password:</strong> ${tempPassword}</li>
      </ul>
      <p>Please change your password after signing in.</p>
    `,
  });
}

export async function inviteMember(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can invite members." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const monthlyAmount = (formData.get("monthlyAmount") as string)?.trim() || "0";
  const memberRole = (formData.get("role") as string)?.trim() || "MEMBER";

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }

  const validRoles = ["MEMBER", "TREASURER", "ADMIN"];
  if (!validRoles.includes(memberRole)) {
    return { error: "Invalid role." };
  }

  // Only OWNER can assign ADMIN role
  if (memberRole === "ADMIN" && role !== "OWNER") {
    return { error: "Only the owner can assign the Admin role." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { name: true },
  });

  const tempPassword = generateTempPassword();

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password: tempPassword,
        cooperativeId,
        role: memberRole,
      },
      headers: await headers(),
    });

    if (!result?.user) {
      return { error: "Failed to create account. Please try again." };
    }

    // Set monthlyContributionAmount (input: false in auth config, set via Prisma)
    if (monthlyAmount !== "0") {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { monthlyContributionAmount: monthlyAmount },
      });
    }

    await prisma.event.create({
      data: {
        cooperativeId,
        eventType: "member_invited",
        actorId: session.user.id,
        actorType: "admin",
        entityType: "user",
        data: { invitedEmail: email, invitedName: name, role: memberRole },
      },
    });

    try {
      await sendInviteEmail(
        email,
        name,
        cooperative?.name ?? "your cooperative",
        tempPassword
      );
    } catch {
      // Email failure is non-fatal — return the temp password so admin can share manually
      revalidatePath("/admin/members");
      return {
        success: true,
        message: `Account created but email delivery failed. Share the temporary password manually.`,
        tempPassword,
      };
    }
  } catch (err: any) {
    const msg: string = err?.body?.message || err?.message || "";
    if (msg.toLowerCase().includes("already")) {
      return { error: "An account with this email already exists." };
    }
    return { error: msg || "Failed to create account." };
  }

  revalidatePath("/admin/members");
  return {
    success: true,
    message: `Invite sent to ${email}.`,
    tempPassword,
  };
}

export async function importMembers(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "OWNER" && role !== "ADMIN") {
    return { error: "Only admins can import members." };
  }

  const cooperativeId = session.user.cooperativeId as string;

  const csvFile = formData.get("csvFile") as File | null;
  const csvText = (formData.get("csvText") as string)?.trim();

  const raw = csvFile
    ? await csvFile.text()
    : csvText;

  if (!raw) {
    return { error: "Please provide a CSV file or paste CSV content." };
  }

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { error: "CSV must have a header row and at least one data row." };
  }

  // Detect and skip header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("name") ||
    firstLine.includes("email") ||
    firstLine.includes("amount");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return { error: "No data rows found." };
  }

  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { name: true },
  });

  let created = 0;
  const skipped: string[] = [];

  for (const line of dataLines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name, email, monthlyAmountStr] = cols;

    if (!name || !email) {
      skipped.push(`"${line}" — missing name or email`);
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped.push(`${email} — invalid email`);
      continue;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      skipped.push(`${email} — already exists`);
      continue;
    }

    const tempPassword = generateTempPassword();
    const monthlyAmount = parseFloat(monthlyAmountStr ?? "0") || 0;

    try {
      const result = await auth.api.signUpEmail({
        body: {
          name,
          email: email.toLowerCase(),
          password: tempPassword,
          cooperativeId,
          role: "MEMBER",
        },
        headers: await headers(),
      });

      if (result?.user && monthlyAmount > 0) {
        await prisma.user.update({
          where: { id: result.user.id },
          data: { monthlyContributionAmount: String(monthlyAmount) },
        });
      }

      try {
        await sendInviteEmail(
          email.toLowerCase(),
          name,
          cooperative?.name ?? "your cooperative",
          tempPassword
        );
      } catch {
        // non-fatal
      }

      created++;
    } catch {
      skipped.push(`${email} — failed to create`);
    }
  }

  if (created > 0) {
    await prisma.event.create({
      data: {
        cooperativeId,
        eventType: "members_imported",
        actorId: session.user.id,
        actorType: "admin",
        entityType: "cooperative",
        data: { created, skipped: skipped.length },
      },
    });
  }

  revalidatePath("/admin/members");
  return { success: true, importResults: { created, skipped } };
}

export async function updateMemberRole(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "OWNER") {
    return { error: "Only the owner can change member roles." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const memberId = (formData.get("memberId") as string)?.trim();
  const newRole = (formData.get("newRole") as string)?.trim();

  if (!memberId || !newRole) return { error: "Missing fields." };

  const validRoles = ["MEMBER", "TREASURER", "ADMIN"];
  if (!validRoles.includes(newRole)) return { error: "Invalid role." };

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { cooperativeId: true, role: true },
  });

  if (!member || member.cooperativeId !== cooperativeId) {
    return { error: "Member not found." };
  }

  if (member.role === "OWNER") {
    return { error: "Cannot change the owner's role." };
  }

  await prisma.user.update({ where: { id: memberId }, data: { role: newRole as any } });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "member_role_changed",
      actorId: session.user.id,
      actorType: "admin",
      entityType: "user",
      data: { memberId, newRole },
    },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function removeMember(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "OWNER" && role !== "ADMIN") {
    return { error: "Only admins can remove members." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const memberId = (formData.get("memberId") as string)?.trim();

  if (!memberId) return { error: "Missing member ID." };
  if (memberId === session.user.id) return { error: "You cannot remove yourself." };

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { cooperativeId: true, role: true, name: true },
  });

  if (!member || member.cooperativeId !== cooperativeId) {
    return { error: "Member not found." };
  }

  if (member.role === "OWNER") {
    return { error: "Cannot remove the cooperative owner." };
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { deletedAt: new Date() },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "member_removed",
      actorId: session.user.id,
      actorType: "admin",
      entityType: "user",
      data: { memberId, memberName: member.name },
    },
  });

  revalidatePath("/admin/members");
  return { success: true };
}
