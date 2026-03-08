import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

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

    const { email } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email is already taken by another user
    const existing = await prisma.teamMember.findUnique({ where: { email } });
    if (existing && existing.id !== payload.sub) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const member = await prisma.teamMember.update({
      where: { id: payload.sub },
      data: { email },
    });

    // Issue a new JWT with the updated email
    const token = jwt.sign(
      { sub: member.id, email: member.email, role: member.role, name: member.name },
      secret,
      { expiresIn: "8h" },
    );

    res.setHeader(
      "Set-Cookie",
      `btr_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`,
    );

    return res.json({ success: true, email: member.email });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
