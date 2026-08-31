/**
 * Smoke test for the user-management module. Verifies the business
 * rules in services/users.ts:
 *
 *   1. createUser — happy path
 *   2. updateUser — happy path + demote
 *   3. deleteUser — refuses self-delete
 *   4. deleteUser — refuses to delete the last admin
 *   5. cleanup
 *
 * Run: pnpm tsx scripts/test-users.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { userService } from "../services/users";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });

async function main() {
  // 0. Find an existing admin to act as the "current user" for self-delete tests.
  const seededAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  if (!seededAdmin) {
    throw new Error("admin@example.com not seeded. Run pnpm prisma db seed first.");
  }
  console.log(`Seeded admin: ${seededAdmin.email} (${seededAdmin.id})`);

  // Cleanup any leftovers from previous runs
  await prisma.user.deleteMany({
    where: { email: { startsWith: "[user-test]" } },
  });

  // 1. createUser — happy path
  const created = await userService.create({
    email: "[user-test] alice@example.com",
    name: "Alice",
    role: "editor",
    password: "alice1234",
  });
  if (!created.ok) throw new Error(`createUser failed: ${created.error}`);
  console.log(`✓ createUser ok: ${created.data.email} (role=${created.data.role})`);

  // 2. duplicate email
  const dupe = await userService.create({
    email: "[user-test] alice@example.com",
    name: "Alice 2",
    role: "editor",
    password: "alice1234",
  });
  if (dupe.ok) throw new Error("Duplicate email should have failed");
  console.log(`✓ createUser rejects duplicate email: ${dupe.error}`);

  // 3. updateUser — happy path
  const updated = await userService.update({
    id: created.data.id,
    email: "[user-test] alice@example.com",
    name: "Alice Updated",
    role: "editor",
  });
  if (!updated.ok) throw new Error(`updateUser failed: ${updated.error}`);
  console.log(`✓ updateUser ok: name=${updated.data.name}`);

  // 4. deleteUser — refuses self-delete (use seeded admin as current user)
  const selfDel = await userService.delete(seededAdmin.id, seededAdmin.id);
  if (selfDel.ok) throw new Error("Self-delete should have failed");
  console.log(`✓ deleteUser refuses self-delete: ${selfDel.error}`);

  // 5. deleteUser — refuses to delete the last admin (try to delete the
  // only admin in the system). We have exactly one admin (the seeded
  // one), so this should fail.
  const lastAdminDel = await userService.delete(seededAdmin.id, created.data.id);
  if (lastAdminDel.ok) throw new Error("Deleting the last admin should have failed");
  console.log(`✓ deleteUser refuses to remove last admin: ${lastAdminDel.error}`);

  // 6. Create a second admin so we can delete the first one (not the
  // last-admin case). Then delete the new admin.
  const admin2 = await userService.create({
    email: "[user-test] admin2@example.com",
    name: "Admin 2",
    role: "admin",
    password: "admin1234",
  });
  if (!admin2.ok) throw new Error(`createUser admin2 failed: ${admin2.error}`);

  const delAdmin2 = await userService.delete(admin2.data.id, seededAdmin.id);
  if (!delAdmin2.ok) throw new Error(`deleteUser admin2 should succeed: ${delAdmin2.error}`);
  console.log(`✓ deleteUser allows non-last-admin deletion`);

  // 7. updateUser — refuses to demote the last admin
  const demote = await userService.update({
    id: seededAdmin.id,
    email: seededAdmin.email,
    name: seededAdmin.name ?? undefined,
    role: "editor",
  });
  if (demote.ok) throw new Error("Demoting the last admin should have failed");
  console.log(`✓ updateUser refuses to demote last admin: ${demote.error}`);

  // Cleanup
  await prisma.user.delete({ where: { id: created.data.id } }).catch(() => {});
  console.log("✓ Test users cleaned up");

  console.log("\n✅ All user-management assertions passed.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
