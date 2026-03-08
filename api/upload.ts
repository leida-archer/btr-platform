import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, head } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BTRASSETS_READ_WRITE_TOKEN;

  try {
    // GET: redirect to blob's signed URL (supports Range requests natively)
    if (req.method === "GET") {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "Missing url" });

      const blobInfo = await head(url, { token });
      if (!blobInfo) return res.status(404).json({ error: "Not found" });

      // Generate a short-lived client token to access the private blob directly
      const clientToken = await generateClientTokenFromReadWriteToken({
        token: token!,
        pathname: blobInfo.pathname,
        maximumSizeInBytes: 0, // read-only token
      });

      // Build the direct blob URL with token auth
      const separator = blobInfo.url.includes("?") ? "&" : "?";
      const signedUrl = `${blobInfo.url}${separator}token=${clientToken}`;

      const download = req.query.download === "1";
      if (download) {
        const fname = blobInfo.pathname?.split("/").pop() || "download";
        res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
      }

      res.setHeader("Cache-Control", "public, max-age=300");
      return res.redirect(302, signedUrl);
    }

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

    res.setHeader("Allow", "GET,POST,DELETE");
    return res.status(405).end();
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return res.status(500).json({ error: message });
  }
}
