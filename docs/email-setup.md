# Email setup — campuscart.social

Transactional email (student verification links) goes through **Zoho ZeptoMail**.
Registrar and DNS are at **Name.com**; the domain also points at Vercel
(`A → 76.76.21.21`, `www CNAME → cname.vercel-dns.com`).

## App configuration

`src/lib/mailer.ts` picks a provider from whichever key is set:

```
MAIL_FROM=CampusCart <noreply@campuscart.social>
ZEPTOMAIL_TOKEN=<Send Mail Token>     # ZeptoMail → Agents → Campuscart → SMTP & API
NEXT_PUBLIC_SITE_URL=https://campuscart.social
```

`NEXT_PUBLIC_SITE_URL` is not optional in production: without it the verification
link falls back to `http://localhost:3000` and is useless to a student.

If mail is unconfigured the app does **not** fail — it returns the verification
link in the UI so an admin can pass it on by hand.

## DNS state (verified 2026-08-19)

| Record | Host | Status |
|---|---|---|
| TXT (DKIM) | `1914110._domainkey` | ✅ resolving |
| CNAME (bounce/Return-Path) | `bounce-zem` → `cluster89.zeptomail.com` | ✅ resolving |
| TXT (SPF) | root | not present — **and not needed**, see below |
| TXT (DMARC) | `_dmarc` | ❌ missing |
| MX | root | none (no mailbox yet) |

### Why there is no SPF record

SPF authenticates the **envelope sender (Return-Path)**, not the `From:` header.
ZeptoMail sets the Return-Path to `bounce-zem.campuscart.social`, which CNAMEs to
`cluster89.zeptomail.com`, and *that* publishes `v=spf1 include:zeptomail.net -all`.
So SPF is already satisfied for this path, which is why ZeptoMail's own docs say
to add only the DKIM and CNAME records.

DMARC alignment is satisfied by **DKIM**: the key is published under
`campuscart.social`, so signatures carry `d=campuscart.social` and align with a
`From:` at the same domain.

An SPF record only becomes necessary if a *second* system starts sending as
`@campuscart.social` — e.g. adding Zoho Mail mailboxes. At that point add **one**
TXT record covering every sender; a domain with two SPF records fails SPF outright.

### DMARC — the one record still worth adding

```
Type: TXT   Host: _dmarc   TTL: 3600
Value: v=DMARC1; p=none;
```

Start at `p=none` (monitor only, nothing is rejected). Once real verification
emails are landing in inboxes, tighten to `p=quarantine` and then `p=reject` to
stop anyone spoofing the domain.

## If mailboxes are added later (hello@campuscart.social)

Zoho Mail is a separate product from ZeptoMail — mailboxes for humans, versus the
API the app sends through. Keep them separate: routing app mail through a personal
mailbox's SMTP hits low rate limits and damages domain reputation.

Two things to watch when adding it:

1. **MX conflict.** The root domain carries an `apple-domain-verification` TXT.
   If that came from iCloud+ Custom Email Domain, only one provider can own MX —
   resolve that before pointing MX at Zoho.
2. **One SPF record**, merging Zoho Mail's include with anything else sending as
   the domain.

## Hardening

ZeptoMail's **Sender Address Restriction** is currently off, so any address at
the domain can send. Turning it on and allowing only `noreply@campuscart.social`
limits the blast radius if the token ever leaks.
