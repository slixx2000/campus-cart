import "server-only";

import { siteUrl } from "@/lib/siteUrl";

/**
 * Transactional email.
 *
 * Two providers are supported, picked by whichever key is set — ZeptoMail first,
 * because it is the one that pairs with a Zoho Mail mailbox on the same domain:
 *
 *   ZEPTOMAIL_TOKEN   Zoho ZeptoMail (pay-as-you-go, 10k emails per credit)
 *   RESEND_API_KEY    Resend (3,000/month free, but only one domain per account)
 *
 * Both are plain `fetch` calls rather than SDKs — each SDK is a thin wrapper over
 * the same HTTP endpoint, and this is the only place the app sends mail.
 *
 * MAIL_FROM is required either way, e.g. "CampusCart <noreply@campuscart.social>".
 * The sending domain must be verified with whichever provider you use.
 */
type SendResult = { ok: true } | { ok: false; error: string };

/** Splits "Name <address@example.com>" into its parts. */
function parseFrom(value: string): { name: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || "CampusCart", address: match[2] };
  return { name: "CampusCart", address: value.trim() };
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<SendResult> {
  const from = process.env.MAIL_FROM;
  if (!from) {
    return { ok: false, error: "MAIL_FROM is not set." };
  }

  const zeptoToken = process.env.ZEPTOMAIL_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;

  if (!zeptoToken && !resendKey) {
    return {
      ok: false,
      error: "Email is not configured (set ZEPTOMAIL_TOKEN or RESEND_API_KEY).",
    };
  }

  try {
    const response = zeptoToken
      ? await fetch("https://api.zeptomail.com/v1.1/email", {
          method: "POST",
          headers: {
            // Note the scheme prefix — ZeptoMail rejects a bare token.
            Authorization: `Zoho-enczapikey ${zeptoToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: parseFrom(from),
            to: [{ email_address: { address: to } }],
            subject,
            htmlbody: html,
            textbody: text,
          }),
        })
      : await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to, subject, html, text }),
        });

    if (!response.ok) {
      // Providers put the useful reason in the body, not the status text.
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Mailer responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the mail service." };
  }
}

export async function sendStudentVerificationEmail(
  to: string,
  token: string
): Promise<SendResult> {
  const link = `${siteUrl()}/student-email/confirm?token=${token}`;

  const text = [
    "Confirm your student email for CampusCart",
    "",
    "Open this link to verify your student email and unlock selling:",
    link,
    "",
    "The link expires in 24 hours and can only be used once.",
    "If you didn't ask for this, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">
        Confirm your student email
      </h1>
      <p style="font-size:14px;line-height:22px;color:#64748b;margin:0 0 24px">
        Verify your student email to unlock selling on CampusCart.
      </p>
      <a href="${link}"
         style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;
                padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600">
        Verify my student email
      </a>
      <p style="font-size:12px;line-height:20px;color:#94a3b8;margin:24px 0 0">
        The link expires in 24 hours and can only be used once.
        If you didn't ask for this, ignore this email.
      </p>
    </div>
  `;

  return sendEmail(to, "Confirm your student email — CampusCart", html, text);
}
