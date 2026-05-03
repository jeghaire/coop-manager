import { requireAuth } from "@/app/lib/auth-helpers";
import { buildReceiptKey, generatePresignUrl } from "@/app/lib/s3";
import { NextRequest, NextResponse } from "next/server";

const VALID_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "pdf", "heic", "heif", "webp"]);
const VALID_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "image/heic",
  "image/heif",
]);

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  void session;

  const { searchParams } = new URL(request.url);
  const ext = searchParams.get("ext")?.toLowerCase() ?? "";
  const type = searchParams.get("type") ?? "";

  if (!VALID_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Invalid file extension." }, { status: 400 });
  }

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
  }

  try {
    const key = buildReceiptKey(ext);
    const url = await generatePresignUrl(key, type);
    return NextResponse.json({ url, key });
  } catch {
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
