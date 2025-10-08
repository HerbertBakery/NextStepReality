// app/api/upload/route.ts
export const runtime = "nodejs";           // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Optional hard cap to avoid 500s on huge images (Vercel body limit is ~4–5MB)
const MAX_FILE_BYTES = 4_500_000; // ~4.5 MB

// Map common MIME -> extension fallback if file.name doesn't include an ext
const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size guard to avoid exceeding serverless body limits
    if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Image too large (${Math.round(file.size / 1024 / 1024)}MB). Max ~4.5MB.` },
        { status: 413 }
      );
    }

    // Build a stable filename with an extension
    const originalName = file.name || "upload";
    const hasExt = /\.[a-z0-9]+$/i.test(originalName);
    const extFromName = hasExt ? originalName.split(".").pop()!.toLowerCase() : "";
    const extFromMime = mimeToExt[file.type] || "jpg";
    const ext = (extFromName || extFromMime).toLowerCase();

    const filename = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // ✅ Pass the File/Blob directly to `put` — no Buffer conversions needed
    //    If you run locally outside Vercel, set BLOB_READ_WRITE_TOKEN in .env.local
    const { url } = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || `image/${ext}`,
      // token: process.env.BLOB_READ_WRITE_TOKEN, // <- uncomment if needed locally
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    // Log the full error for Vercel logs; return a clean message to client
    console.error("UPLOAD ERROR:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
