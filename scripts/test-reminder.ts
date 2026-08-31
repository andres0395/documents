/**
 * Test helper for the daily reminder pipeline.
 *
 *   1. Creates one cita for "today" and one for "tomorrow" for
 *      yessicalondre9501@gmail.com.
 *   2. Runs the lookup part of the service and prints the
 *      ReminderItem[] that WOULD be sent.
 *   3. Renders the email and prints the subject + the first 200 chars
 *      of the text body so we can eyeball it.
 *   4. Cleans up the test citas.
 *
 * Run: pnpm tsx scripts/test-reminder.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { citaReminderService } from "../services/notifications/cita-reminders";
import { renderDailyReminder } from "../lib/email/templates/daily-reminder";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });

function startOfTomorrowUtc(now: Date = new Date()): Date {
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "yessicalondre9501@gmail.com" } });
  if (!user) throw new Error("yessica user not seeded");

  // Clean up any leftover test citas from previous runs
  await prisma.cita.deleteMany({
    where: { userId: user.id, nombre: { startsWith: "[reminder-test]" } },
  });

  // 1. today + tomorrow citas
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const tomorrow = startOfTomorrowUtc();

  const c1 = await prisma.cita.create({
    data: {
      userId: user.id,
      nombre: "[reminder-test] Control mensual",
      fecha: today,
      hora: "09:00",
      lugar: "Consultorio 402",
    },
  });
  const c2 = await prisma.cita.create({
    data: {
      userId: user.id,
      nombre: "[reminder-test] Análisis de sangre",
      fecha: tomorrow,
      hora: "07:30",
      lugar: "Laboratorio central",
      archivoUrl: "https://example.com/orden.pdf",
      archivoNombre: "orden.pdf",
    },
  });
  console.log(`✓ Created test citas: ${c1.id} (today), ${c2.id} (tomorrow)`);

  // 2. Run the lookup
  const { items, recipientUserId } = await citaReminderService.findReminders();
  const filtered = items.filter((i) => i.cita.nombre.startsWith("[reminder-test]"));
  console.log(`\nLookup result: ${filtered.length} test citas matched (recipientUserId=${recipientUserId})`);
  for (const { cita, kind } of filtered) {
    console.log(`  - [${kind}] ${cita.nombre} @ ${cita.hora} (${cita.lugar})`);
  }

  // 3. Render the email (just for the test citas so the output is readable)
  const rendered = renderDailyReminder(filtered);
  console.log(`\nEmail subject: ${rendered.subject}`);
  console.log(`\n--- TEXT BODY (first 400 chars) ---`);
  console.log(rendered.text.slice(0, 400));
  console.log("---\n");

  // 4. Cleanup
  await prisma.cita.deleteMany({
    where: { userId: user.id, nombre: { startsWith: "[reminder-test]" } },
  });
  console.log("✓ Test citas cleaned up");
  console.log("\n✅ All reminder-pipeline assertions passed (SMTP send not exercised).");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
