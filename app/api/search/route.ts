import { NextRequest, NextResponse } from "next/server";
import { SearchRequestInputSchema, SearchResponseSchema } from "@/lib/search/types";

// In-memory rate limiting: 10 requests per minute per IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count += 1;
  return true;
}

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

export async function POST(req: NextRequest) {
  // 1. Rate limiting by IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many search requests. Please wait a moment before trying again.",
        },
      },
      { status: 429 }
    );
  }

  // 2. Body parsing and validation
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid JSON in request body.",
        },
      },
      { status: 400 }
    );
  }

  const parsed = SearchRequestInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Claim must be between 10 and 2000 characters with valid query options.",
        },
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // 3. Demo mode enforcement
  let provider = input.provider || "duckduckgo";
  if (input.demo) {
    provider = "mock";
  }

  // 4. Backend URL check
  const baseUrl = getSearchUrl();
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Search service is currently unavailable. Please verify server configuration.",
        },
      },
      { status: 503 }
    );
  }

  // 5. 20s AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const payload = {
      claim: input.claim,
      provider,
      max_queries: input.max_queries,
      results_per_query: input.results_per_query,
      include_official: input.include_official,
      include_social: input.include_social,
      official_domains: input.official_domains,
      enrich_wayback: input.enrich_wayback,
    };

    const backendRes = await fetch(`${baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    // Error status handling
    if (!backendRes.ok) {
      if (backendRes.status === 400) {
        let detail = "";
        try {
          const errData = await backendRes.json();
          detail = typeof errData?.detail === "string" ? errData.detail : "";
        } catch {
          // ignore
        }

        if (detail.includes("API_KEY is not set") || detail.includes("not set")) {
          return NextResponse.json(
            {
              error: {
                code: "PROVIDER_NOT_CONFIGURED",
                message: "The chosen search provider is not configured with an API key on the backend.",
              },
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error: {
              code: "BAD_REQUEST",
              message: "Search provider rejected the request options.",
            },
          },
          { status: 400 }
        );
      }

      if (backendRes.status === 429) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "The search provider is currently rate limited. Please try again in a few moments.",
            },
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: "BACKEND_UNAVAILABLE",
            message: "Search backend returned an error. Please try again later.",
          },
        },
        { status: 502 }
      );
    }

    // Response size limit (2 MB)
    const text = await backendRes.text();
    if (text.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_RESPONSE",
            message: "Search response exceeded maximum size limit.",
          },
        },
        { status: 502 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "BAD_RESPONSE",
            message: "Search backend returned malformed JSON.",
          },
        },
        { status: 502 }
      );
    }

    // Validate response schema
    const validated = SearchResponseSchema.safeParse(json);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_RESPONSE",
            message: "Search backend returned an unexpected response structure.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(validated.data, { status: 200 });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        {
          error: {
            code: "BACKEND_TIMEOUT",
            message: "The search request timed out. Please try with fewer queries or terms.",
          },
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Could not connect to the search service. Please check that the backend is running.",
        },
      },
      { status: 502 }
    );
  }
}
