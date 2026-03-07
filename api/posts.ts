import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;

  try {
    switch (method) {
      case "GET": {
        const posts = await prisma.post.findMany({ orderBy: { createdAt: "asc" } });
        return res.json(posts);
      }

      case "POST": {
        const post = await prisma.post.create({ data: req.body });
        return res.status(201).json(post);
      }

      case "PATCH": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        const post = await prisma.post.update({ where: { id }, data: req.body });
        return res.json(post);
      }

      case "DELETE": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        await prisma.post.delete({ where: { id } });
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
