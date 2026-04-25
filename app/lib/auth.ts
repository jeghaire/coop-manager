import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import prisma from "./prisma";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        subject: "Verify your Cooperative Manager account",
        html: `<p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p>`
      });
    }
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "MEMBER",
        input: true
      },
      cooperativeId: {
        type: "string",
        required: true,
        input: true
      },
      monthlyContributionAmount: {
        type: "string",
        default: "0",
        input: false
      }
    }
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60,
    // cookieCache disabled: Prisma Decimal fields can't pass structuredClone
    // which better-auth uses internally when building the cache cookie.
    cookieCache: {
      enabled: false
    }
  },

  socialProviders: {},
  plugins: []
});

export type Session = typeof auth.$Infer.Session;
