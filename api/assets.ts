import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;

  try {
    switch (method) {
      case "GET": {
        const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
        return res.json(assets);
      }

      case "POST": {
        const asset = await prisma.asset.create({ data: req.body });
        return res.status(201).json(asset);
      }

      case "PATCH": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        const asset = await prisma.asset.update({ where: { id }, data: req.body });
        return res.json(asset);
      }

      case "DELETE": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        await prisma.asset.delete({ where: { id } });
        return res.json({ deleted: true });
      }

      default:
        res.setHeader("Allow", "GET,POST,PATCH,DELETE");
        return res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
