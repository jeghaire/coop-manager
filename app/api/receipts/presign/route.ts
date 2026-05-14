import { getSession } from "@/app/lib/auth-helpers";
import { buildReceiptKey, generatePresignUrl } from "@/app/lib/s3-upload";
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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ext?: string; type?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ext = (body.ext ?? "").toLowerCase();
  const type = body.type ?? "";
  const size = body.size ?? 0;

  if (!VALID_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Invalid file extension." }, { status: 400 });
  }

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
  }

  if (size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
  }

  try {
    const key = buildReceiptKey(ext);
    const url = await generatePresignUrl(key, type);
    return NextResponse.json({ url, key });
  } catch {
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
