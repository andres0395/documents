/**
 * Email configuration. All values come from env so the secrets never
 * live in source.
 *
 * The config is read lazily on first access (not at module load) so
 * that `next build` doesn't crash when the email env vars are not set
 * on the build machine.
 *
 * The recipient and cron secret are read individually (no validation
 * required) so unauthenticated requests get a clean 401 even when the
 * SMTP creds are missing. The SMTP credentials are only validated at
 * send time.
 */

const DEFAULT_RECIPIENT = "yessicalondre9501@gmail.com";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

function read(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Add it to .env (local) and to the Vercel project's environment variables (prod).`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/** No validation — used at request time before SMTP creds are needed. */
export function getEmailRecipient(): string {
  return optional("EMAIL_TO", DEFAULT_RECIPIENT);
}

/** No validation — used by the cron-route auth check. */
export function getCronSecret(): string {
  return process.env.CRON_SECRET ?? "";
}

let _smtp: SmtpConfig | null = null;

export function getSmtpConfig(): SmtpConfig {
  if (_smtp) return _smtp;
  _smtp = {
    host: optional("SMTP_HOST", "smtp.gmail.com"),
    port: Number(optional("SMTP_PORT", "465")),
    secure: optional("SMTP_SECURE", "true") === "true",
    user: read("GMAIL_USER"),
    pass: read("GMAIL_APP_PASSWORD"),
  };
  return _smtp;
}

/** No validation — used by the route's from-address fallback. */
export function getFromAddressOverride(): string {
  return optional("EMAIL_FROM", "");
}
