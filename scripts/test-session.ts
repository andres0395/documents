/**
 * Dev-only helper: generates a valid session JWT for a seeded user and
 * prints the cookie. Used to smoke-test the auth flow without having
 * to submit the Server Action from curl.
 *
 * Run with:  pnpm tsx scripts/test-session.ts <email>
 */

import "dotenv/config";
import { SignJWT } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const email = (process.argv[2] ?? "anmuce03@gmail.com").toLowerCase();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) throw new Error("AUTH_SECRET not set");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const secret = new TextEncoder().encode(authSecret);
  const token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  console.log(`User: ${user.email} (${user.id})`);
  console.log(`Cookie: citas.session=${token}`);

  await prisma.$disconnect();
}

main();
