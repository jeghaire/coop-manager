import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },

  // Add custom fields to user
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "MEMBER",
        input: true, // Allow setting on signup
      },
      cooperativeId: {
        type: "number",
        required: true,
        input: true,
      },
      monthlyContributionAmount: {
        type: "string",
        default: "0",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    cookieCache: {
      enabled: true,
    },
  },

  socialProviders: {},
  plugins: [],
});

export type Session = typeof auth.$Infer.Session;
