import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Beyond the Rhythm <team@beyondtherhythm.org>";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  const cookies = req.headers.cookie ?? "";
  const match = cookies.match(/btr_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(match[1], secret) as { sub?: string };
    if (!payload.sub) return res.status(401).json({ error: "Not authenticated" });

    const member = await prisma.teamMember.findUnique({ where: { id: payload.sub } });
    if (!member) return res.status(404).json({ error: "User not found" });

    // Generate a reset token (reuses the setup flow with purpose "reset")
    const resetToken = jwt.sign(
      { email: member.email, purpose: "reset" },
      secret,
      { expiresIn: "1h" },
    );

    const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://beyondtherhythm.org";

    const resetLink = `${siteUrl}/setup?token=${resetToken}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: member.email,
      subject: "Reset your Beyond the Rhythm password",
      html: `
        <div style="font-family:-apple-system,'Segoe UI',system-ui,sans-serif;max-width:520px;margin:0 auto;background:#1a1018;color:#f5f0f7;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#D6246E,#E8652B,#F2A922);padding:32px 24px;text-align:center">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff">Beyond the Rhythm</h1>
          </div>
          <div style="padding:32px 24px">
            <p style="font-size:16px;margin:0 0 16px">Hey ${member.name},</p>
            <p style="font-size:14px;color:#b8a9c2;margin:0 0 24px;line-height:1.6">
              You requested a password reset for your <strong style="color:#f5f0f7">Beyond the Rhythm</strong> account.
              Click the button below to set a new password.
            </p>
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#D6246E,#E8652B);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">
              Reset Password
            </a>
            <p style="font-size:12px;color:#6b5e73;margin:24px 0 0;line-height:1.5">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
