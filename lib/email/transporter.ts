import nodemailer, { type Transporter } from "nodemailer";
import { getFromAddressOverride, getSmtpConfig } from "./config";

let cached: Transporter | null = null;

export function getMailer(): Transporter {
  if (cached) return cached;
  const smtp = getSmtpConfig();
  cached = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
  return cached;
}

export function buildFromAddress(): string {
  const override = getFromAddressOverride();
  if (override) return override;
  return getSmtpConfig().user;
}
