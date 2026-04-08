import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;

  try {
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
        // Prevent setting parent to self or descendant (simple self-check; deep cycle check omitted)
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
        // Reassign assets in this folder to null (preserve them), then delete folder.
        // Cascade on children Folders removes nested folders; their assets also become null via onDelete: SetNull.
        await prisma.asset.updateMany({ where: { folderId: id }, data: { folderId: null } });
        await prisma.folder.delete({ where: { id } });
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
