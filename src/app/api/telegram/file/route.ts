import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Telegram is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId")?.trim();

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  const metaResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_id: fileId }),
  });

  if (!metaResponse.ok) {
    return NextResponse.json({ error: "Could not resolve Telegram file metadata." }, { status: 502 });
  }

  const metaPayload = (await metaResponse.json()) as {
    result?: {
      file_path?: string;
    };
  };

  const filePath = metaPayload.result?.file_path;
  if (!filePath) {
    return NextResponse.json({ error: "Telegram file path not found." }, { status: 404 });
  }

  const fileResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
  if (!fileResponse.ok || !fileResponse.body) {
    return NextResponse.json({ error: "Could not download Telegram file." }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = fileResponse.headers.get("content-type");
  const contentLength = fileResponse.headers.get("content-length");
  const acceptRanges = fileResponse.headers.get("accept-ranges");

  headers.set("Cache-Control", "public, max-age=60");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

  return new Response(fileResponse.body, { status: 200, headers });
}
