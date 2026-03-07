import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const name = query.name as string | undefined;

  try {
    switch (method) {
      case "GET": {
        const events = await prisma.calculatorEvent.findMany({ orderBy: { createdAt: "asc" } });
        return res.json(events);
      }

      case "PUT": {
        if (!name) return res.status(400).json({ error: "Missing name" });
        const { artists, venueStaff, prodStaff, ...rest } = req.body;
        const event = await prisma.calculatorEvent.upsert({
          where: { name },
          create: {
            ...rest,
            name,
            artists: artists ?? [],
            venueStaff: venueStaff ?? [],
            prodStaff: prodStaff ?? [],
          },
          update: {
            ...rest,
            artists: artists ?? undefined,
            venueStaff: venueStaff ?? undefined,
            prodStaff: prodStaff ?? undefined,
          },
        });
        return res.json(event);
      }

      default:
        res.setHeader("Allow", "GET,PUT");
        return res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
