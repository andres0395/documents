/**
 * Test helper: exercises the cita service's delete flow to verify the
 * idempotent-delete behavior. Run with: pnpm tsx scripts/test-delete.ts
 *
 * Steps:
 *   1. Create a throwaway cita for admin@citas.local
 *   2. Delete it once → expect ok: true
 *   3. Delete it again → expect ok: false with CITA_NOT_FOUND_ERROR
 *      (which the action will treat as ok: true for the user)
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { citaService, CITA_NOT_FOUND_ERROR } from "../services/citas";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "anmuce03@gmail.com" } });
  if (!user) throw new Error("user not seeded (run pnpm prisma db seed)");

  // 1. Create
  const created = await prisma.cita.create({
    data: {
      userId: user.id,
      nombre: "[test-delete] Throwaway",
      fecha: new Date("2026-12-01T00:00:00Z"),
      hora: "10:00",
      lugar: "Test",
    },
  });
  console.log(`✓ Created cita: ${created.id}`);

  // 2. First delete — expect ok
  const first = await citaService.delete(created.id, user.id);
  console.log(`First delete:  ${JSON.stringify(first)}`);
  if (!first.ok) throw new Error("First delete should have succeeded");

  // 3. Second delete — service returns not-found, action treats as success
  const second = await citaService.delete(created.id, user.id);
  console.log(`Second delete: ${JSON.stringify(second)}`);
  if (second.ok) throw new Error("Second delete should report not-found at service level");
  if (second.error !== CITA_NOT_FOUND_ERROR) {
    throw new Error(`Second delete error should be CITA_NOT_FOUND_ERROR, got: ${second.error}`);
  }

  // 4. Confirm DB row is gone
  const stillThere = await prisma.cita.findUnique({ where: { id: created.id } });
  if (stillThere) throw new Error("Row should be deleted from DB");
  console.log("✓ DB row is gone");

  console.log("\n✅ All delete-flow assertions passed.");
  console.log("   (The action would return ok:true for both the first and the second call.)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("Test failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
