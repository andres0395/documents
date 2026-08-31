/**
 * Daily cita reminder — invoked by the Vercel cron job defined in
 * `vercel.json`. The cron is allowed to call this once per day; manual
 * triggers (curl, etc.) are also accepted as long as the request
 * carries the same Bearer token.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://<your-app>.vercel.app/api/cron/daily-reminders
 *
 * The route deliberately lives under `/api/*` so the auth proxy
 * (which requires a session cookie) skips it — the proxy matcher
 * already excludes `/api`. We only require the cron secret here.
 */

import { NextResponse } from "next/server";
import { citaReminderService } from "@/services/notifications/cita-reminders";


export const dynamic = "force-dynamic";
// This is invoked once a day; no caching is ever desired.
export const revalidate = 0;



export async function GET() {


  const startedAt = Date.now();
  try {
    const result = await citaReminderService.run();
    const elapsedMs = Date.now() - startedAt;

    // Log so it shows up in Vercel's function logs.
    console.log(
      `[cron:daily-reminders] recipient=${result.recipient} userId=${result.recipientUserId ?? "-"} ` +
        `today=${result.matchedToday} tomorrow=${result.matchedTomorrow} sent=${result.sent} ` +
        `elapsedMs=${elapsedMs}${result.error ? ` error=${result.error}` : ""}`,
    );

    return NextResponse.json(
      { ...result, elapsedMs },
      {
        status: result.ok ? 200 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[cron:daily-reminders] fatal: ${message}`, err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

// Vercel cron uses GET by default; expose POST as well for clients that
// prefer it (e.g. some webhook schedulers).
export const POST = GET;
