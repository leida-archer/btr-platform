import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const cookies = req.headers.cookie ?? "";
  const match = cookies.match(/btr_session=([^;]+)/);
  if (!match) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const payload = jwt.verify(match[1], secret) as { sub?: string; email?: string };

    // Require new-style JWT with a DB user ID
    if (!payload.sub || !payload.email) {
      return res.status(401).json({ authenticated: false });
    }

    // Verify user still exists and has a password set
    const member = await prisma.teamMember.findUnique({ where: { id: payload.sub } });
    if (!member || !member.passwordHash) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true, role: member.role, name: member.name });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
