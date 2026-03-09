import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BTR_PUB_ASSETS_READ_WRITE_TOKEN;

  try {
    // POST: generate a client upload token (client uploads directly to Blob)
    if (req.method === "POST") {
      const filename = req.query.filename as string;
      if (!filename) return res.status(400).json({ error: "Missing filename" });

      const clientToken = await generateClientTokenFromReadWriteToken({
        token: token!,
        pathname: filename,
        maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB max
      });

      return res.status(200).json({ clientToken });
    }

    if (req.method === "DELETE") {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "Missing url" });

      await del(url, { token });
      return res.json({ deleted: true });
    }

    res.setHeader("Allow", "POST,DELETE");
    return res.status(405).end();
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return res.status(500).json({ error: message });
  }
}
