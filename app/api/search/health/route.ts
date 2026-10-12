import { NextResponse } from "next/server";

function getSearchUrl(): string | null {
  const url = process.env.FACTIFY_SEARCH_URL || "http://localhost:8000";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url.replace(/\/+$/, "");
    }
  } catch {
    // invalid URL
  }
  return null;
}

export async function GET() {
  const baseUrl = getSearchUrl();
  if (!baseUrl) {
    return NextResponse.json({ available: false }, { status: 200 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ available: false }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({
      available: !!data.ok,
      provider: data.defaultProvider,
      mock: data.defaultProvider === "mock",
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ available: false }, { status: 200 });
  }
}
