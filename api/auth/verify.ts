import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export default function handler(req: VercelRequest, res: VercelResponse) {
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
    jwt.verify(match[1], secret);
    return res.status(200).json({ authenticated: true });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
