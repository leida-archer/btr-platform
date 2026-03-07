import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body ?? {};
  const validUser = process.env.TEAM_USER;
  const validPass = process.env.TEAM_PASS;
  const secret = process.env.AUTH_SECRET;

  if (!secret || !validUser || !validPass) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: username, role: "admin" }, secret, {
    expiresIn: "8h",
  });

  res.setHeader(
    "Set-Cookie",
    `btr_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`
  );

  return res.status(200).json({ authenticated: true });
}
