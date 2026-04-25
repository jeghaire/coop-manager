import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../app/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function signUp(
  email: string,
  password: string,
  name: string,
  cooperativeId: string,
  role: string
) {
  try {
    await auth.api.signUpEmail({
      body: { email, password, name, cooperativeId, role },
      headers: new Headers({ "Content-Type": "application/json" })
    });
    console.log(`  ✓ ${name} <${email}>`);
  } catch (err: any) {
    const msg: string = err?.body?.message || err?.message || String(err);
    if (msg.toLowerCase().includes("already")) {
      console.log(`  ~ ${name} <${email}> (already exists, skipped)`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log("Seeding cooperatives…");

  const [coop1, coop2] = await Promise.all([
    prisma.cooperative.upsert({
      where: { id: "coop-lagos-001" },
      update: {},
      create: {
        id: "coop-lagos-001",
        name: "Lagos Savings Cooperative",
        subscriptionStatus: "ACTIVE"
      }
    }),
    prisma.cooperative.upsert({
      where: { id: "coop-abuja-002" },
      update: {},
      create: {
        id: "coop-abuja-002",
        name: "Abuja Credit Union",
        subscriptionStatus: "ACTIVE"
      }
    })
  ]);

  console.log(`  ✓ ${coop1.name} (id: ${coop1.id})`);
  console.log(`  ✓ ${coop2.name} (id: ${coop2.id})`);

  console.log("\nSeeding users…");

  // Coop 1: Lagos
  await signUp(
    "owner@lagos.test",
    "Password123!",
    "Ada Okonkwo",
    coop1.id,
    "OWNER"
  );
  await signUp(
    "admin@lagos.test",
    "Password123!",
    "Emeka Nwosu",
    coop1.id,
    "ADMIN"
  );
  await signUp(
    "member@lagos.test",
    "Password123!",
    "Fatima Bello",
    coop1.id,
    "MEMBER"
  );

  // Coop 2: Abuja
  await signUp(
    "owner@abuja.test",
    "Password123!",
    "Chidi Obi",
    coop2.id,
    "OWNER"
  );
  await signUp(
    "member@abuja.test",
    "Password123!",
    "Ngozi Adeyemi",
    coop2.id,
    "MEMBER"
  );

  console.log("\nDone! Test credentials (password: Password123!)");
  console.log(`  Lagos Coop  → owner@lagos.test  | admin@lagos.test  | member@lagos.test`);
  console.log(`  Abuja Coop  → owner@abuja.test  | member@abuja.test`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
