import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = "KINGOF <noreply@kingof.lol>";

type ResendSendResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

async function sendEmail(payload: Parameters<Resend["emails"]["send"]>[0]) {
  const resend = getResend();
  const { data, error } = (await resend.emails.send(payload)) as ResendSendResult;
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/\n/g, "").replace(/\r/g, "");
}

export async function sendManagementLinkEmail({
  to,
  productName,
  manageUrl,
}: {
  to: string;
  productName: string;
  manageUrl: string;
}) {
  const safeName = escapeHtml(productName);
  const safeUrl = escapeAttr(manageUrl);

  await sendEmail({
    from: FROM_EMAIL,
    to,
    subject: `Your KINGOF management link for ${productName.replace(/[<>"]/g, "")}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #171717;">
        <h1 style="color: #fbbf24; font-size: 24px;">👑 KINGOF</h1>
        <h2 style="color: #171717; margin-top: 24px; font-size: 20px;">Your product &ldquo;${safeName}&rdquo; is on the board!</h2>
        <p style="color: #525252; line-height: 1.6;">
          Use the link below to manage your listing, view stats, and increase your bid.
        </p>
        <a href="${safeUrl}" style="display: inline-block; background: #fbbf24; color: #0a0a0a; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Manage Your Product
        </a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          Keep this link private — it's your access to manage your listing.
        </p>
      </div>
    `,
  });
}

export async function sendDethronedEmail({
  to,
  productName,
  categoryName,
  newKingName,
  newRequiredBid,
  manageUrl,
}: {
  to: string;
  productName: string;
  categoryName: string;
  newKingName: string;
  newRequiredBid: number;
  manageUrl: string;
}) {
  const safeProd = escapeHtml(productName);
  const safeCat = escapeHtml(categoryName);
  const safeKing = escapeHtml(newKingName);
  const safeUrl = escapeAttr(manageUrl);
  const bidDollars = (newRequiredBid / 100).toLocaleString("en-US");

  await sendEmail({
    from: FROM_EMAIL,
    to,
    subject: `👑 You've been dethroned in ${categoryName.replace(/[<>"]/g, "")}!`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #171717;">
        <h1 style="color: #fbbf24; font-size: 24px;">👑 KINGOF</h1>
        <h2 style="color: #171717; margin-top: 24px; font-size: 20px;">You've been dethroned!</h2>
        <p style="color: #525252; line-height: 1.6;">
          <strong style="color: #171717;">${safeKing}</strong> has outbid
          <strong style="color: #171717;">${safeProd}</strong> in
          <strong style="color: #171717;">${safeCat}</strong>.
        </p>
        <p style="color: #525252; line-height: 1.6;">
          To reclaim your crown, you need to bid at least <strong style="color: #fbbf24;">$${bidDollars}</strong>.
        </p>
        <a href="${safeUrl}" style="display: inline-block; background: #fbbf24; color: #0a0a0a; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Reclaim Your Crown
        </a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          You received this email because your product is listed on KINGOF.
        </p>
      </div>
    `,
  });
}
