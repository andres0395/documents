/**
 * Database seed.
 *
 * Creates the initial users for the app. There is NO public registration —
 * accounts are provisioned through this seed (or a future admin tool).
 *
 * Run with `pnpm prisma db seed` or implicitly via `pnpm prisma migrate dev`.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

interface SeedUser {
  email: string;
  name: string;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: "anmuce03@gmail.com",
    name: "Administrador",
    password: "admin1234",
  },
  {
    email: "yessicalondre9501@gmail.com",
    name: "Yessica Londre",
    password: "yessica1234",
  },
];

async function main() {
  const passwordRounds = 12;

  for (const seed of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seed.password, passwordRounds);
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        name: seed.name,
        passwordHash,
      },
      create: {
        email: seed.email,
        name: seed.name,
        passwordHash,
      },
    });
    console.log(`✓ Seeded user: ${user.email} (${user.id})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
