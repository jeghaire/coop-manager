export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { GuarantorModeForm } from "./GuarantorModeForm";
import { LoanSettingsForm } from "./LoanSettingsForm";
import { BankAccountForm } from "./BankAccountForm";
import { DeleteBankAccountForm, SetPreferredForm } from "./BankAccountActions";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;
  const isOwner = role === "OWNER";

  const [cooperative, bankAccounts] = await Promise.all([
    prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: {
        borrowingMultiplier: true,
        guarantorCoverageMode: true,
        loanInterestRate: true,
        loanRepaymentMonths: true,
        defaultGracePeriodDays: true,
        currency: true,
        currencySymbol: true,
      },
    }),
    prisma.cooperativeBank.findMany({
      where: { cooperativeId },
      orderBy: { isPreferred: "desc" },
    }),
  ]);

  if (!cooperative) redirect("/dashboard");

  const modeDescriptions: Record<string, string> = {
    OFF: "No coverage check — any verified guarantors can be selected.",
    COMBINED: "Guarantors' combined contributions must equal or exceed the loan amount.",
    INDIVIDUAL: "Each guarantor must individually have contributions equal to or exceeding the loan amount.",
  };

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage cooperative loan rules and bank accounts
        </p>
      </div>

      {/* Loan Rules */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Loan Rules
        </h2>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-6">
          {/* Borrowing Multiplier - disabled */}
          <div className="space-y-1.5 opacity-50 pointer-events-none">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Borrowing Multiplier
            </label>
            <div className="flex items-center gap-3">
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800">
                {cooperative.borrowingMultiplier}×
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-600 italic">Coming soon</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Members can borrow up to {cooperative.borrowingMultiplier}× their total contributions.
            </p>
          </div>

          {/* Guarantor Coverage Mode */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Guarantor Coverage Mode
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Current: <strong>{cooperative.guarantorCoverageMode}</strong> —{" "}
              {modeDescriptions[cooperative.guarantorCoverageMode]}
            </p>
            {isOwner ? (
              <GuarantorModeForm
                cooperativeId={cooperativeId}
                currentMode={cooperative.guarantorCoverageMode}
              />
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                Only the cooperative owner can change this setting.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Loan Settings */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Loan Settings
        </h2>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
          <LoanSettingsForm
            cooperativeId={cooperativeId}
            interestRate={Number(cooperative.loanInterestRate)}
            repaymentMonths={cooperative.loanRepaymentMonths}
            gracePeriodDays={cooperative.defaultGracePeriodDays}
            currency={cooperative.currency}
            currencySymbol={cooperative.currencySymbol}
          />
        </div>
      </section>

      {/* Bank Accounts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Bank Accounts
          </h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          {bankAccounts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No bank accounts added yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Number
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Bank
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bankAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {account.accountName}
                        {account.isPreferred && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">✓ Preferred</span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs hidden md:table-cell">
                      {account.accountNumber}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                      {account.bankName}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!account.isPreferred && (
                            <SetPreferredForm
                              accountId={account.id}
                              cooperativeId={cooperativeId}
                            />
                          )}
                          <DeleteBankAccountForm
                            accountId={account.id}
                            cooperativeId={cooperativeId}
                          />
                        </div>
                      </td>
                    )}
                    {!isOwner && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {isOwner && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Add Bank Account
            </h3>
            <BankAccountForm cooperativeId={cooperativeId} />
          </div>
        )}
      </section>
    </div>
  );
}
