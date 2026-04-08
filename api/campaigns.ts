import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const id = query.id as string | undefined;
  const resource = query.resource as string | undefined;

  try {
    // ── Campaign Phases ──
    if (resource === "phases") {
      const campaignId = query.campaignId as string | undefined;
      switch (method) {
        case "GET": {
          const where = campaignId ? { campaignId } : undefined;
          const phases = await prisma.campaignPhase.findMany({ where, orderBy: { createdAt: "asc" } });
          return res.json(phases);
        }
        case "POST": {
          const phase = await prisma.campaignPhase.create({ data: req.body });
          return res.status(201).json(phase);
        }
        case "PATCH": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          const phase = await prisma.campaignPhase.update({ where: { id }, data: req.body });
          return res.json(phase);
        }
        case "DELETE": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          await prisma.campaignPhase.delete({ where: { id } });
          return res.json({ deleted: true });
        }
        default:
          res.setHeader("Allow", "GET,POST,PATCH,DELETE");
          return res.status(405).end();
      }
    }

    // ── Campaign Flags ──
    if (resource === "flags") {
      const campaignId = query.campaignId as string | undefined;
      switch (method) {
        case "GET": {
          const where = campaignId ? { campaignId } : undefined;
          const flags = await prisma.campaignFlag.findMany({ where, orderBy: { createdAt: "asc" } });
          return res.json(flags);
        }
        case "POST": {
          const flag = await prisma.campaignFlag.create({ data: req.body });
          return res.status(201).json(flag);
        }
        case "PATCH": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          const flag = await prisma.campaignFlag.update({ where: { id }, data: req.body });
          return res.json(flag);
        }
        case "DELETE": {
          if (!id) return res.status(400).json({ error: "Missing id" });
          await prisma.campaignFlag.delete({ where: { id } });
          return res.json({ deleted: true });
        }
        default:
          res.setHeader("Allow", "GET,POST,PATCH,DELETE");
          return res.status(405).end();
      }
    }

    // ── Campaigns (default) ──
    switch (method) {
      case "GET": {
        const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "asc" } });
        return res.json(campaigns);
      }

      case "POST": {
        const campaign = await prisma.campaign.create({ data: req.body });
        return res.status(201).json(campaign);
      }

      case "PATCH": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        const campaign = await prisma.campaign.update({ where: { id }, data: req.body });
        return res.json(campaign);
      }

      case "DELETE": {
        if (!id) return res.status(400).json({ error: "Missing id" });
        await prisma.campaign.delete({ where: { id } });
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
