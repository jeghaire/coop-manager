"use server";

import prisma from "@/app/lib/prisma";
import { protectAdminAction } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
};

export async function updateGuarantorCoverageMode(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const mode = (formData.get("guarantorCoverageMode") as string)?.trim();
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();

  if (!cooperativeId) return { error: "Missing cooperative ID." };

  const session = await protectAdminAction(cooperativeId);

  const valid = ["OFF", "COMBINED", "INDIVIDUAL"];
  if (!valid.includes(mode)) return { error: "Invalid coverage mode." };

  await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: { guarantorCoverageMode: mode },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "setting_updated",
      actorId: session.user.id,
      actorType: "admin",
      data: { settingName: "guarantorCoverageMode", newValue: mode },
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function addBankAccount(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  if (!cooperativeId) return { error: "Missing cooperative ID." };

  const session = await protectAdminAction(cooperativeId);

  const accountName = (formData.get("accountName") as string)?.trim();
  const accountNumber = (formData.get("accountNumber") as string)?.trim();
  const bankName = (formData.get("bankName") as string)?.trim();
  const isPreferred = formData.get("isPreferred") === "on";

  if (!accountName || !accountNumber || !bankName) {
    return { error: "Account name, number, and bank name are required." };
  }

  if (isPreferred) {
    await prisma.cooperativeBank.updateMany({
      where: { cooperativeId },
      data: { isPreferred: false },
    });
  }

  await prisma.cooperativeBank.create({
    data: { cooperativeId, accountName, accountNumber, bankName, isPreferred },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "bank_account_added",
      actorId: session.user.id,
      actorType: "admin",
      data: { accountName, bankName },
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/cooperative-details");
  return { success: true };
}

export async function updateBankAccount(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const accountId = (formData.get("accountId") as string)?.trim();
  if (!cooperativeId || !accountId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const accountName = (formData.get("accountName") as string)?.trim();
  const accountNumber = (formData.get("accountNumber") as string)?.trim();
  const bankName = (formData.get("bankName") as string)?.trim();
  const isPreferred = formData.get("isPreferred") === "on";

  if (!accountName || !accountNumber || !bankName) {
    return { error: "Account name, number, and bank name are required." };
  }

  const existing = await prisma.cooperativeBank.findUnique({
    where: { id: accountId },
    select: { cooperativeId: true },
  });

  if (!existing || existing.cooperativeId !== cooperativeId) {
    return { error: "Bank account not found." };
  }

  if (isPreferred) {
    await prisma.cooperativeBank.updateMany({
      where: { cooperativeId },
      data: { isPreferred: false },
    });
  }

  await prisma.cooperativeBank.update({
    where: { id: accountId },
    data: { accountName, accountNumber, bankName, isPreferred },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "bank_account_updated",
      actorId: session.user.id,
      actorType: "admin",
      data: { accountId, accountName },
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/cooperative-details");
  return { success: true };
}

export async function deleteBankAccount(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const accountId = (formData.get("accountId") as string)?.trim();
  if (!cooperativeId || !accountId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const existing = await prisma.cooperativeBank.findUnique({
    where: { id: accountId },
    select: { cooperativeId: true },
  });

  if (!existing || existing.cooperativeId !== cooperativeId) {
    return { error: "Bank account not found." };
  }

  await prisma.cooperativeBank.delete({ where: { id: accountId } });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "bank_account_deleted",
      actorId: session.user.id,
      actorType: "admin",
      data: { accountId },
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/cooperative-details");
  return { success: true };
}

export async function updateLoanSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  if (!cooperativeId) return { error: "Missing cooperative ID." };

  const session = await protectAdminAction(cooperativeId);

  const interestRateStr = (formData.get("loanInterestRate") as string)?.trim();
  const repaymentMonthsStr = (formData.get("loanRepaymentMonths") as string)?.trim();
  const gracePeriodStr = (formData.get("defaultGracePeriodDays") as string)?.trim();
  const currency = (formData.get("currency") as string)?.trim();
  const currencySymbol = (formData.get("currencySymbol") as string)?.trim();

  const interestRate = parseFloat(interestRateStr);
  const repaymentMonths = parseInt(repaymentMonthsStr);
  const gracePeriod = parseInt(gracePeriodStr);

  if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
    return { error: "Interest rate must be between 0 and 100." };
  }
  if (isNaN(repaymentMonths) || repaymentMonths < 1 || repaymentMonths > 60) {
    return { error: "Repayment months must be between 1 and 60." };
  }
  if (isNaN(gracePeriod) || gracePeriod < 0) {
    return { error: "Grace period must be 0 or more days." };
  }
  if (!currency || !currencySymbol) {
    return { error: "Currency and symbol are required." };
  }

  await prisma.cooperative.update({
    where: { id: cooperativeId },
    data: {
      loanInterestRate: interestRate,
      loanRepaymentMonths: repaymentMonths,
      defaultGracePeriodDays: gracePeriod,
      currency,
      currencySymbol,
    },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "loan_settings_updated",
      actorId: session.user.id,
      actorType: "admin",
      data: { interestRate, repaymentMonths, gracePeriod, currency, currencySymbol },
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function setPreferredBankAccount(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const accountId = (formData.get("accountId") as string)?.trim();
  if (!cooperativeId || !accountId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const existing = await prisma.cooperativeBank.findUnique({
    where: { id: accountId },
    select: { cooperativeId: true },
  });

  if (!existing || existing.cooperativeId !== cooperativeId) {
    return { error: "Bank account not found." };
  }

  await prisma.cooperativeBank.updateMany({
    where: { cooperativeId },
    data: { isPreferred: false },
  });

  await prisma.cooperativeBank.update({
    where: { id: accountId },
    data: { isPreferred: true },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/cooperative-details");
  return { success: true };
}
