import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;
  const resource = query.resource as string | undefined;

  try {
    // ── Folders (consolidated to keep under Vercel Hobby 12-function limit) ──
    if (resource === "folders") {
      switch (method) {
        case "GET": {
          const folders = await prisma.folder.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, parentId: true },
          });
          return res.json(folders);
        }
        case "POST": {
          const { name, parentId } = req.body ?? {};
          if (!name || typeof name !== "string") return res.status(400).json({ error: "Missing name" });
          const folder = await prisma.folder.create({
            data: { name, parentId: parentId ?? null },
            select: { id: true, name: true, parentId: true },
          });
          return res.status(201).json(folder);
        }
        case "PATCH": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          const { name, parentId } = req.body ?? {};
          if (parentId === id) return res.status(400).json({ error: "Cannot parent folder to itself" });
          const data: { name?: string; parentId?: string | null } = {};
          if (typeof name === "string") data.name = name;
          if (parentId !== undefined) data.parentId = parentId ?? null;
          const folder = await prisma.folder.update({
            where: { id },
            data,
            select: { id: true, name: true, parentId: true },
          });
          return res.json(folder);
        }
        case "DELETE": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          await prisma.asset.updateMany({ where: { folderId: id }, data: { folderId: null } });
          await prisma.folder.delete({ where: { id } });
          return res.json({ deleted: true });
        }
        default:
          res.setHeader("Allow", "GET,POST,PATCH,DELETE");
          return res.status(405).end();
      }
    }

    // ── Assets ──
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
