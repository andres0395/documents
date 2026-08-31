/**
 * Daily reminder pipeline.
 *
 * Pulls citas for "today" and "tomorrow" (UTC date boundaries), renders
 * a dark-themed email, and sends it through the configured SMTP
 * provider. Idempotent enough to be re-run by Vercel on retry, but
 * has no in-DB "sent today" guard — duplicates within minutes are
 * acceptable for a daily reminder.
 *
 *   - If the recipient email matches a registered user, we only look
 *     at that user's citas.
 *   - Otherwise we send every user's matching citas (admin / team view).
 */

import { citaRepository } from "@/repositories/citas";
import { userRepository } from "@/repositories/users";
import { getMailer, buildFromAddress } from "@/lib/email/transporter";
import { getEmailRecipient } from "@/lib/email/config";
import {
  renderDailyReminder,
  type ReminderItem,
  type RenderedReminder,
} from "@/lib/email/templates/daily-reminder";

export interface RunResult {
  ok: boolean;
  recipient: string;
  recipientUserId: string | null;
  matchedCitas: number;
  matchedToday: number;
  matchedTomorrow: number;
  sent: boolean;
  messageId?: string;
  error?: string;
}

function dayBoundsUtc(now: Date = new Date()): {
  today: Date;
  tomorrow: Date;
  dayAfter: Date;
} {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);
  return { today, tomorrow, dayAfter };
}

function classify(citaDate: Date, today: Date, tomorrow: Date): "today" | "tomorrow" {
  // cita.fecha is stored as UTC midnight of the chosen calendar day.
  // Comparing epoch ms avoids any timezone surprise in the classifier.
  const t = citaDate.getTime();
  if (t >= today.getTime() && t < tomorrow.getTime()) return "today";
  return "tomorrow";
}

export const citaReminderService = {
  /**
   * Look up matching citas for the configured recipient. No side
   * effects; used by tests and by the no-send code path.
   */
  async findReminders(now: Date = new Date()): Promise<{
    items: ReminderItem[];
    recipientUserId: string | null;
  }> {
    const recipient = getEmailRecipient();
    const recipientUser = await userRepository.findByEmail(
      recipient.toLowerCase(),
    );
    const { today, dayAfter } = dayBoundsUtc(now);

    const citas = await citaRepository.findByDateRange(
      recipientUser?.id ?? null,
      today,
      dayAfter,
    );

    const items: ReminderItem[] = citas.map((cita) => ({
      cita,
      kind: classify(cita.fecha, today, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    }));

    return { items, recipientUserId: recipientUser?.id ?? null };
  },

  /**
   * Full run: lookup, render, send. Always returns a structured
   * result so the HTTP layer can return 200 with a meaningful body
   * (or surface the failure as 500).
   */
  async run(now: Date = new Date()): Promise<RunResult> {
    const recipient = getEmailRecipient();
    const { items, recipientUserId } = await this.findReminders(now);

    const baseResult: RunResult = {
      ok: true,
      recipient,
      recipientUserId,
      matchedCitas: items.length,
      matchedToday: items.filter((i) => i.kind === "today").length,
      matchedTomorrow: items.filter((i) => i.kind === "tomorrow").length,
      sent: false,
    };

    if (items.length === 0) {
      return baseResult;
    }

    const rendered: RenderedReminder = renderDailyReminder(items);
    const mailer = getMailer();
    const from = buildFromAddress();

    try {
      const info = await mailer.sendMail({
        from,
        to: recipient,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      return { ...baseResult, sent: true, messageId: info.messageId };
    } catch (err) {
      return {
        ...baseResult,
        ok: false,
        error: err instanceof Error ? err.message : "SMTP send failed",
      };
    }
  },
};
