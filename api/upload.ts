import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, del, get } from "@vercel/blob";

export const config = {
  api: { bodyParser: false },
};

function bufferBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BTRASSETS_READ_WRITE_TOKEN;

  try {
    // GET: proxy a private blob — streams the file to the client
    if (req.method === "GET") {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "Missing url" });

      const result = await get(url, { access: "private", token });
      if (!result || result.statusCode === 304) return res.status(404).json({ error: "Not found" });

      const { stream, blob } = result;
      if (blob.contentType) res.setHeader("Content-Type", blob.contentType);
      if (blob.contentDisposition) res.setHeader("Content-Disposition", blob.contentDisposition);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      const reader = stream.getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(Buffer.from(value));
        return pump();
      };
      return pump();
    }

    if (req.method === "POST") {
      const filename = req.query.filename as string;
      if (!filename) return res.status(400).json({ error: "Missing filename" });

      const body = await bufferBody(req);
      const contentType = req.headers["content-type"] || "application/octet-stream";

      const blob = await put(filename, body, {
        access: "private",
        contentType,
        token,
        addRandomSuffix: true,
      });

      // Return a proxy URL that works for any viewer (no blob token needed)
      const proxyUrl = `/api/upload?url=${encodeURIComponent(blob.url)}`;

      return res.status(200).json({ ...blob, proxyUrl });
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
