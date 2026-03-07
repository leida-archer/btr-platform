import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const member = await prisma.teamMember.findUnique({ where: { email } });
    if (!member || !member.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: member.id, email: member.email, role: member.role, name: member.name },
      secret,
      { expiresIn: "8h" }
    );

    res.setHeader(
      "Set-Cookie",
      `btr_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`
    );

    return res.status(200).json({ authenticated: true, role: member.role, name: member.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
