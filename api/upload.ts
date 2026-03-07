import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, del } from "@vercel/blob";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "POST") {
      const filename = req.query.filename as string;
      if (!filename) return res.status(400).json({ error: "Missing filename" });

      const blob = await put(filename, req, {
        access: "public",
        token: process.env.BTRASSETS_READ_WRITE_TOKEN,
      });

      return res.status(200).json(blob);
    }

    if (req.method === "DELETE") {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "Missing url" });

      await del(url, { token: process.env.BTRASSETS_READ_WRITE_TOKEN });
      return res.json({ deleted: true });
    }

    res.setHeader("Allow", "POST,DELETE");
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
