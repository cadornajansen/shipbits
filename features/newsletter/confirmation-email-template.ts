const FALLBACK_EMAIL_SITE_ORIGIN = "https://shipbits.dev"

function emailSiteUrl(path: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const origin = configuredOrigin?.startsWith("https://")
    ? configuredOrigin
    : FALLBACK_EMAIL_SITE_ORIGIN

  return new URL(path, `${origin}/`).toString()
}

export function buildNewsletterConfirmationEmailHtml(): string {
  const siteUrl = emailSiteUrl("/")
  const logoUrl = emailSiteUrl("/branding/shipbits-email-logo.png")
  const previewUrl = emailSiteUrl("/branding/shipbits-email-preview.jpg")
  const exploreUrl = emailSiteUrl("/products")

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f7f5;color:#171717;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f7f7f5;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:32px 36px 24px;background:#171717;"><a href="${siteUrl}" style="display:inline-block;text-decoration:none;"><img src="${logoUrl}" width="52" height="52" alt="ShipBits" style="display:block;border:0;border-radius:12px;" /></a></td></tr>
          <tr><td style="padding:40px 36px 32px;">
            <p style="margin:0 0 14px;color:#a16207;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">ShipBits Weekly</p>
            <img src="${previewUrl}" width="528" height="277" alt="Build. Ship. Distribute. with ShipBits" style="display:block;width:100%;max-width:528px;height:auto;margin:0 0 28px;border:0;border-radius:12px;" />
            <h1 style="margin:0 0 18px;font-size:32px;line-height:1.15;letter-spacing:-0.7px;">You&rsquo;re officially on the list.</h1>
            <p style="margin:0 0 18px;color:#57534e;font-size:16px;line-height:1.65;">Welcome to the builders&rsquo; corner of ShipBits. Once a week, we&rsquo;ll send a sharp roundup of new products, founder stories, and launch resources worth your attention.</p>
            <p style="margin:0 0 28px;color:#57534e;font-size:16px;line-height:1.65;">No noise. Just useful things for people who ship.</p>
            <a href="${exploreUrl}" style="display:inline-block;padding:14px 20px;background:#ffb200;border-radius:10px;color:#171717;font-size:15px;font-weight:700;text-decoration:none;">Explore ShipBits</a>
          </td></tr>
          <tr><td style="padding:22px 36px;border-top:1px solid #e7e5e4;"><p style="margin:0;color:#78716c;font-size:13px;line-height:1.55;">You received this because you subscribed to ShipBits Weekly. To opt out, reply to this email with &ldquo;unsubscribe.&rdquo;</p></td></tr>
        </table>
        <p style="margin:18px 0 0;color:#a8a29e;font-size:12px;">&copy; ${new Date().getUTCFullYear()} ShipBits. Built for people who ship.</p>
      </td></tr>
    </table>
  </body>
</html>`
}

export function buildNewsletterConfirmationEmailText(): string {
  return [
    "You're officially on the list.",
    "",
    "Welcome to ShipBits Weekly. Once a week, we'll send a sharp roundup of new products, founder stories, and launch resources worth your attention.",
    "",
    `Explore ShipBits: ${emailSiteUrl("/products")}`,
    "",
    "You received this because you subscribed to ShipBits Weekly. To opt out, reply to this email with 'unsubscribe.'",
  ].join("\n")
}
