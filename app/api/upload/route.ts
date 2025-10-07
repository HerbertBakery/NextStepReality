import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();

    const filename = `listings/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { url } = await put(filename, buffer, {
      access: "public", // public URL
      addRandomSuffix: false,
      contentType: file.type || "image/jpeg",
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("UPLOAD ERROR:", e?.message || e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
