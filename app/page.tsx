import Link from "next/link";
import {
  Shield,
  Users,
  FileText,
  ArrowRight,
  CheckCircle,
  Building2,
  Lock,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { Header } from "./components/Header";
import { ScrollReveal } from "./components/ScrollReveal";
import { TiltCard } from "./components/TiltCard";
import { HeroScene } from "./components/HeroScene";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full bg-zinc-50 dark:bg-[#0c0c0c] font-sans">
      <Header />
      <main className="flex-1">
        <Hero />
        <ContributionsFeature />
        <LoansFeature />
        <MembersFeature />
        <HowItWorks />
        <Security />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

// ─── App mockup primitives ────────────────────────────────────────────────────

function AppWindow({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <div className="ml-3 bg-zinc-800 rounded px-3 py-0.5 flex items-center gap-1.5">
          <Lock className="w-2.5 h-2.5 text-emerald-500" strokeWidth={2} />
          <span className="text-[10px] text-zinc-400 font-mono">{url}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

const rolePill: Record<string, string> = {
  OWNER:     "bg-emerald-500/15 text-emerald-400",
  ADMIN:     "bg-sky-500/15 text-sky-400",
  TREASURER: "bg-amber-500/15 text-amber-400",
  MEMBER:    "bg-zinc-700 text-zinc-400"
};

// ─── Mockup: dashboard overview ───────────────────────────────────────────────

function DashboardMockup() {
  const rows = [
    { name: "Ada Okonkwo",    amount: "₦25,000", status: "VERIFIED" },
    { name: "Emeka Nwosu",    amount: "₦25,000", status: "PENDING"  },
    { name: "Fatima Bello",   amount: "₦25,000", status: "VERIFIED" },
    { name: "Chidi Obi",      amount: "₦30,000", status: "VERIFIED" },
    { name: "Ngozi Adeyemi",  amount: "₦20,000", status: "PENDING"  }
  ];
  return (
    <AppWindow url="cooperative-manager.app/dashboard">
      <div className="bg-zinc-900/50 px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
            <Building2 className="w-3 h-3 text-white" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-medium text-zinc-300">Lagos Savings Cooperative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">OWNER</span>
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-[8px] font-semibold text-zinc-200">AO</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: "Members",      value: "47",    color: "text-zinc-100"   },
            { label: "Total Saved",  value: "₦2.4M", color: "text-emerald-400"},
            { label: "Active Loans", value: "12",    color: "text-zinc-100"   }
          ].map((s) => (
            <div key={s.label} className="bg-zinc-800 rounded-lg p-3">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1.5">{s.label}</p>
              <p className={`text-[17px] font-semibold font-mono leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Recent Contributions</p>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between bg-zinc-800/50 rounded-md px-3 py-2">
              <span className="text-[11px] text-zinc-300 w-28 truncate">{r.name}</span>
              <span className="text-[11px] font-mono text-zinc-400">{r.amount}</span>
              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full ${
                r.status === "VERIFIED" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </AppWindow>
  );
}

// ─── Mockup: contribution verification ───────────────────────────────────────

function VerificationMockup() {
  const pending = [
    { name: "Emeka Nwosu",   amount: "₦25,000", method: "Bank Transfer", date: "Apr 23" },
    { name: "Ngozi Adeyemi", amount: "₦20,000", method: "Mobile Money",  date: "Apr 22" },
    { name: "Taiwo Adeleke", amount: "₦25,000", method: "Bank Transfer", date: "Apr 21" }
  ];
  return (
    <AppWindow url="cooperative-manager.app/admin/contributions">
      <div className="p-4 bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-100">Pending Verification</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">3 receipts awaiting review</p>
          </div>
          <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">3 pending</span>
        </div>
        <div className="space-y-3">
          {pending.map((c) => (
            <div key={c.name} className="bg-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-200">{c.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{c.method} · {c.date}</p>
                </div>
                <span className="text-[15px] font-semibold text-zinc-100 font-mono">{c.amount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-700/50 rounded-md px-2 py-1.5 mb-3">
                <div className="w-3 h-3 rounded-sm bg-zinc-600 shrink-0" />
                <span className="text-[9px] text-zinc-400 font-mono truncate">
                  receipt_{c.name.split(" ")[0].toLowerCase()}_apr.jpg
                </span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md py-1.5">✓ Verify</button>
                <button className="flex-1 text-[10px] font-semibold bg-zinc-700/60 text-zinc-500 rounded-md py-1.5">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppWindow>
  );
}

// ─── Mockup: loan approval ────────────────────────────────────────────────────

function LoanMockup() {
  return (
    <AppWindow url="cooperative-manager.app/admin/loans/pending">
      <div className="p-4 bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-100">Loan Application</p>
          <span className="text-[9px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">PENDING_REVIEW</span>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 mb-3">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1 font-mono">Applicant</p>
              <p className="text-xs font-semibold text-zinc-200">Fatima Bello</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Member since Feb 2024</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1 font-mono">Requested</p>
              <p className="text-2xl font-semibold text-emerald-400 font-mono leading-none">₦150k</p>
            </div>
          </div>
          <div className="h-px bg-zinc-700 mb-4" />
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2.5 font-mono">Guarantors (2/2)</p>
          <div className="space-y-2">
            {[
              { name: "Ada Okonkwo", role: "OWNER" },
              { name: "Emeka Nwosu", role: "ADMIN" }
            ].map((g) => (
              <div key={g.name} className="flex items-center justify-between bg-zinc-700/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-zinc-300">{g.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <span className="text-[11px] text-zinc-300">{g.name}</span>
                </div>
                <span className="text-[9px] font-mono font-medium bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">✓ Accepted</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg py-2.5">Approve Loan</button>
          <button className="flex-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg py-2.5">Reject</button>
        </div>
      </div>
    </AppWindow>
  );
}

// ─── Mockup: member roster ────────────────────────────────────────────────────

function MembersMockup() {
  const members = [
    { name: "Ada Okonkwo",   role: "OWNER",     contrib: "₦25,000/mo", initials: "AO" },
    { name: "Emeka Nwosu",   role: "ADMIN",     contrib: "₦25,000/mo", initials: "EN" },
    { name: "Fatima Bello",  role: "MEMBER",    contrib: "₦25,000/mo", initials: "FB" },
    { name: "Chidi Obi",     role: "TREASURER", contrib: "₦30,000/mo", initials: "CO" },
    { name: "Ngozi Adeyemi", role: "MEMBER",    contrib: "₦20,000/mo", initials: "NA" }
  ];
  return (
    <AppWindow url="cooperative-manager.app/admin/members">
      <div className="p-4 bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-100">Members</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Lagos Savings Cooperative</p>
          </div>
          <button className="text-[10px] font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-md">+ Invite member</button>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 mb-3">
          <span className="text-zinc-500 text-sm">⌕</span>
          <span className="text-[10px] text-zinc-600">Search members…</span>
        </div>
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-zinc-300">{m.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-200 truncate">{m.name}</p>
                <p className="text-[9px] text-zinc-500 font-mono">{m.contrib}</p>
              </div>
              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full shrink-0 ${rolePill[m.role]}`}>{m.role}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
          <span className="text-[9px] text-zinc-600">Showing 5 of 47 members</span>
        </div>
      </div>
    </AppWindow>
  );
}

// ─── Mockup: audit log ────────────────────────────────────────────────────────

function AuditLogMockup() {
  const events = [
    { time: "09:42:11", actor: "ada.okonkwo",   action: "contribution.verified",  ref: "contrib_k9x2" },
    { time: "09:38:05", actor: "fatima.bello",  action: "loan.applied",            ref: "loan_m3p7"    },
    { time: "09:31:22", actor: "emeka.nwosu",   action: "contribution.submitted",  ref: "contrib_j8w1" },
    { time: "09:17:44", actor: "ada.okonkwo",   action: "loan.approved",           ref: "loan_n2q5"    },
    { time: "08:59:03", actor: "chidi.obi",     action: "guarantor.accepted",      ref: "loan_n2q5"    },
    { time: "08:44:17", actor: "ngozi.adeyemi", action: "loan.applied",            ref: "loan_p4r8"    }
  ];
  return (
    <AppWindow url="cooperative-manager.app/admin/audit-log">
      <div className="p-4 bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-100">Audit Log</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-mono">live</span>
          </div>
        </div>
        <div className="space-y-2 font-mono">
          {events.map((e, i) => (
            <div key={i} className="grid grid-cols-[52px_1fr] gap-2 text-[10px] bg-zinc-800/40 rounded-md px-2.5 py-2">
              <span className="text-zinc-600 tabular-nums">{e.time}</span>
              <div className="truncate">
                <span className="text-zinc-400">{e.actor}</span>
                <span className="text-zinc-700 mx-1">›</span>
                <span className="text-emerald-400">{e.action}</span>
                <span className="text-zinc-700"> ({e.ref})</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
          <span className="text-[9px] text-zinc-600 font-mono">awaiting next event…</span>
        </div>
      </div>
    </AppWindow>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] bg-white dark:bg-[#0c0c0c] border-b border-zinc-200 dark:border-zinc-800/60 flex items-center overflow-hidden">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/7 rounded-full translate-x-1/4 -translate-y-1/4"
          style={{ animation: "floatA 18s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-300/20 dark:bg-zinc-800/50 rounded-full -translate-x-1/4 translate-y-1/4"
          style={{ animation: "floatB 22s ease-in-out infinite" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
        {/* Two-layer 3D scene: outer scene tilts gently, inner TiltCard on mockup tilts deeper */}
        <HeroScene>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text — animate in on load */}
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full mb-8"
                style={{ animation: "fadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Purpose-built for cooperative finance
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-[58px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.07] mb-6"
                style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both 0.1s" }}
              >
                Run your cooperative
                <br />
                <span className="text-emerald-600 dark:text-emerald-400">like a bank.</span>
              </h1>

              <p
                className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10 max-w-lg"
                style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both 0.22s" }}
              >
                Member contributions. Loan administration. Financial oversight. All in one platform built for the way savings cooperatives actually work.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3 mb-12"
                style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both 0.32s" }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white font-medium px-6 py-3 rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors text-sm shadow-sm"
                >
                  Join your cooperative
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium px-6 py-3 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                  Sign in to your account
                </Link>
              </div>

              <div
                className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-100 dark:border-zinc-800/60"
                style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both 0.42s" }}
              >
                {[
                  { value: "4 roles",      label: "Owner · Admin · Treasurer · Member" },
                  { value: "Multi-tenant", label: "Strict data isolation"               },
                  { value: "Audit trail",  label: "Every action logged"                 }
                ].map((s) => (
                  <div key={s.value}>
                    <p className="text-xs font-semibold font-mono text-emerald-700 dark:text-emerald-400 mb-1">{s.value}</p>
                    <p className="text-[11px] text-zinc-500 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup — inner 3D tilt within the outer scene */}
            <div
              className="relative"
              style={{ animation: "scaleIn 0.9s cubic-bezier(0.16,1,0.3,1) both 0.18s" }}
            >
              <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/8 rounded-3xl blur-2xl scale-110" />
              <TiltCard className="relative">
                <DashboardMockup />
              </TiltCard>
            </div>
          </div>
        </HeroScene>
      </div>
    </section>
  );
}

// ─── Feature: contributions ───────────────────────────────────────────────────

function ContributionsFeature() {
  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full mb-6">
              <CreditCard className="w-3 h-3" />
              Contribution Tracking
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1] mb-5">
              Every payment,
              <br />verified and on record.
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-md">
              Members submit their monthly contributions with a receipt upload. Admins and treasurers review, verify, or reject each one — creating an airtight financial record the whole cooperative can trust.
            </p>
            <ul className="space-y-3">
              {[
                "Bank transfer, mobile money, or cash — all payment methods covered",
                "Receipt attachments stored alongside every contribution",
                "Instant status updates: pending, verified, or rejected",
                "Full contribution history per member, exportable to CSV"
              ].map((p, i) => (
                <ScrollReveal key={p} direction="up" delay={i * 80}>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{p}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="scale" delay={120} className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/6 rounded-3xl blur-2xl scale-110" />
            <TiltCard className="relative">
              <VerificationMockup />
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Feature: loans ───────────────────────────────────────────────────────────

function LoansFeature() {
  return (
    <section className="min-h-screen bg-white dark:bg-[#0f0f0f] border-b border-zinc-200 dark:border-zinc-800/60 flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="scale" delay={80} className="relative">
            <div className="absolute inset-0 bg-sky-500/5 dark:bg-sky-500/6 rounded-3xl blur-2xl scale-110" />
            <TiltCard className="relative">
              <LoanMockup />
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={60}>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-3 py-1.5 rounded-full mb-6">
              <FileText className="w-3 h-3" />
              Loan Administration
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1] mb-5">
              From application
              <br />to decision, structured.
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-md">
              Members apply for a loan, nominate two guarantors from within the cooperative, and wait. Guarantors respond in-app. Once both accept, the application lands in the admin queue — ready for a final decision with full context.
            </p>
            <ul className="space-y-3">
              {[
                "Multi-step workflow: apply → guarantors → admin review",
                "Guarantors accept or reject with optional reasons",
                "Admins approve or reject with documented decisions",
                "Rejection reasons preserved for transparency and appeals"
              ].map((p, i) => (
                <ScrollReveal key={p} direction="up" delay={60 + i * 80}>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{p}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Feature: members ─────────────────────────────────────────────────────────

function MembersFeature() {
  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full mb-6">
              <Users className="w-3 h-3" />
              Member Management
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1] mb-5">
              Everyone in their lane,
              <br />nothing overlapping.
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-md">
              Four roles. Four sets of permissions. Owners configure the cooperative. Admins run operations. Treasurers verify money. Members participate. Each role sees exactly what they need to — nothing more.
            </p>
            <ul className="space-y-3">
              {[
                "Owner, Admin, Treasurer, and Member roles built in",
                "Per-member monthly contribution targets tracked individually",
                "Invite members by email or let them join via cooperative code",
                "Soft-delete preserves history when members leave"
              ].map((p, i) => (
                <ScrollReveal key={p} direction="up" delay={i * 80}>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{p}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="scale" delay={120} className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-amber-500/5 dark:bg-amber-500/6 rounded-3xl blur-2xl scale-110" />
            <TiltCard className="relative">
              <MembersMockup />
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Administrator provisions the cooperative",
      body: "An owner account is created for your cooperative. They set contribution targets, define roles, and invite the first wave of members. The platform is ready to run in minutes."
    },
    {
      number: "02",
      title: "Members join and contribute monthly",
      body: "Members sign up, select their cooperative, and begin submitting monthly payments with receipt uploads. Treasurers review each one and mark it verified — building a clean financial record over time."
    },
    {
      number: "03",
      title: "Loans are applied for, reviewed, and decided",
      body: "Any member can apply for a loan. Guarantors accept or decline. Once the threshold is met, the application moves to admin review. Approved or rejected — with reasons, always on record."
    }
  ];

  return (
    <section id="how-it-works" className="min-h-screen bg-white dark:bg-[#0c0c0c] border-b border-zinc-200 dark:border-zinc-800/60 flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <ScrollReveal direction="up" className="mb-16 max-w-xl">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">How it works</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1] mb-4">
            Three phases.
            <br />Infinite clarity.
          </h2>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Cooperative Manager follows the natural lifecycle of a savings cooperative — setup, operations, and lending — each phase building on the last.
          </p>
        </ScrollReveal>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} direction="flip" delay={i * 120}>
              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8 md:gap-16 py-12 border-t border-zinc-100 dark:border-zinc-800/60 first:border-t-0">
                <div className="flex md:flex-col md:items-start items-center gap-4">
                  <span className="text-5xl md:text-6xl font-semibold font-mono text-zinc-100 dark:text-zinc-900 select-none leading-none">
                    {step.number}
                  </span>
                  <div className="hidden md:block w-8 h-px bg-emerald-500/40 mt-4" />
                </div>
                <div className="max-w-xl pt-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">{step.title}</h3>
                  <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.body}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────

const securityPoints = [
  "Data isolated per cooperative — no cross-tenant access, ever",
  "Role-based access enforcement on every API endpoint",
  "Passwords hashed with scrypt before storage",
  "Session tokens expire after 30 days with secure cookie flags",
  "Soft deletes preserve audit integrity — records are never truly lost",
  "All financial mutations require authenticated, authorised sessions"
];

function Security() {
  return (
    <section id="security" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="scale" delay={80} className="relative">
            <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/6 rounded-3xl blur-2xl scale-110" />
            <TiltCard className="relative">
              <AuditLogMockup />
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={60}>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full mb-6">
              <Lock className="w-3 h-3" />
              Security by default
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1] mb-5">
              Built for institutions
              <br />that handle real money.
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-md">
              Cooperative finances carry real consequences. Every architectural decision — from data isolation to session management — treats security as a first-class requirement, not an afterthought.
            </p>
            <ul className="space-y-4">
              {securityPoints.map((point, i) => (
                <ScrollReveal key={point} direction="right" delay={60 + i * 60}>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{point}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="min-h-screen bg-zinc-900 dark:bg-zinc-950 flex items-center py-20 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ animation: "floatA 20s ease-in-out infinite" }}
      >
        <div className="w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal direction="up">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-8">
            <Shield className="w-3 h-3" />
            Trusted with cooperative finances
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight leading-[1.1] mb-6">
            Your cooperative deserves
            <br />
            <span className="text-emerald-400">proper infrastructure.</span>
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Stop managing contributions in spreadsheets and loans in WhatsApp threads. Give your cooperative a platform built for the work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-8 py-3.5 rounded-md transition-colors text-sm shadow-lg shadow-emerald-500/20"
            >
              Get started — it&apos;s free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-100 font-medium px-8 py-3.5 rounded-md border border-zinc-700 hover:border-zinc-500 transition-colors text-sm"
            >
              Already a member? Sign in
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/60 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">Cooperative Manager</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-zinc-600">
          <Link href="/auth/signin" className="hover:text-zinc-400 transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="hover:text-zinc-400 transition-colors">Sign up</Link>
          <span>&copy; {new Date().getFullYear()} Cooperative Manager</span>
        </div>
      </div>
    </footer>
  );
}
