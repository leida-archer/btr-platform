import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // GET: validate the invite token
  if (req.method === "GET") {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Missing token" });

    try {
      const payload = jwt.verify(token, secret) as { email: string; purpose: string };
      if (payload.purpose !== "invite") {
        return res.status(400).json({ error: "Invalid token" });
      }
      const member = await prisma.teamMember.findUnique({ where: { email: payload.email } });
      if (!member) return res.status(404).json({ error: "User not found" });
      return res.json({ valid: true, name: member.name, email: member.email, hasPassword: !!member.passwordHash });
    } catch {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
  }

  // POST: set the password
  if (req.method === "POST") {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    try {
      const payload = jwt.verify(token, secret) as { email: string; purpose: string };
      if (payload.purpose !== "invite") {
        return res.status(400).json({ error: "Invalid token" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.teamMember.update({
        where: { email: payload.email },
        data: { passwordHash },
      });

      return res.json({ success: true });
    } catch {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end();
}
