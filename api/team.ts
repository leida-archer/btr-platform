import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Swap to "team@beyondtherhythm.org" once domain is verified in Resend
const FROM_EMAIL = "Beyond the Rhythm <onboarding@resend.dev>";

function getCallerRole(req: VercelRequest): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const cookies = req.headers.cookie ?? "";
  const match = cookies.match(/btr_session=([^;]+)/);
  if (!match) return null;
  try {
    const payload = jwt.verify(match[1], secret) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;

  try {
    switch (method) {
      case "GET": {
        const members = await prisma.teamMember.findMany({ orderBy: { createdAt: "asc" } });
        return res.json(members);
      }

      case "POST": {
        if (getCallerRole(req) !== "admin") return res.status(403).json({ error: "Admin only" });
        const { name, email, role } = req.body;
        if (!name || !email) return res.status(400).json({ error: "Name and email required" });

        // Prevent duplicate email
        const existing = await prisma.teamMember.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: "A member with that email already exists" });

        const secret = process.env.AUTH_SECRET;
        if (!secret) return res.status(500).json({ error: "Server misconfigured" });

        const member = await prisma.teamMember.create({
          data: { name, email, role: role ?? "viewer" },
        });

        // Generate invite token (valid 7 days)
        const inviteToken = jwt.sign(
          { email, purpose: "invite" },
          secret,
          { expiresIn: "7d" }
        );

        const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : "https://beyondtherhythm.org";

        const setupLink = `${siteUrl}/setup?token=${inviteToken}`;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `You're invited to Beyond the Rhythm`,
          html: `
            <div style="font-family:-apple-system,'Segoe UI',system-ui,sans-serif;max-width:520px;margin:0 auto;background:#1a1018;color:#f5f0f7;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#D6246E,#E8652B,#F2A922);padding:32px 24px;text-align:center">
                <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff">Beyond the Rhythm</h1>
              </div>
              <div style="padding:32px 24px">
                <p style="font-size:16px;margin:0 0 16px">Hey ${name},</p>
                <p style="font-size:14px;color:#b8a9c2;margin:0 0 24px;line-height:1.6">
                  You've been invited to join the <strong style="color:#f5f0f7">Beyond the Rhythm</strong> team as
                  <strong style="color:#D6246E">${role ?? "viewer"}</strong>. Set up your password to get started.
                </p>
                <a href="${setupLink}" style="display:inline-block;background:linear-gradient(135deg,#D6246E,#E8652B);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">
                  Set Up Your Account
                </a>
                <p style="font-size:12px;color:#6b5e73;margin:24px 0 0;line-height:1.5">
                  This link expires in 7 days. If you didn't expect this invite, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });

        return res.status(201).json(member);
      }

      case "DELETE": {
        if (getCallerRole(req) !== "admin") return res.status(403).json({ error: "Admin only" });
        if (!id) return res.status(400).json({ error: "Missing id" });

        // Prevent deleting the last admin
        const target = await prisma.teamMember.findUnique({ where: { id } });
        if (target?.role === "admin") {
          const adminCount = await prisma.teamMember.count({ where: { role: "admin" } });
          if (adminCount <= 1) {
            return res.status(400).json({ error: "Cannot remove the last admin account" });
          }
        }

        await prisma.teamMember.delete({ where: { id } });
        return res.json({ deleted: true });
      }

      default:
        res.setHeader("Allow", "GET,POST,DELETE");
        return res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
