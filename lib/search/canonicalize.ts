const TRACKING = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "ref",
  "ref_src",
  "mc_cid",
  "mc_eid",
  "si",
  "feature",
]);

export function hostOf(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return "";
  }
}

export function canonicalizeUrl(urlStr: string): string {
  try {
    const trimmed = urlStr.trim();
    const parsed = new URL(trimmed);
    const scheme = parsed.protocol.toLowerCase(); // e.g. "https:"
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }

    let hostAndPort = host;
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      hostAndPort = `${host}:${parsed.port}`;
    }

    const path = parsed.pathname.replace(/\/+$/, "") || "/";

    const filteredParams: [string, string][] = [];
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.startsWith("utm_") && !TRACKING.has(lowerKey)) {
        filteredParams.push([key, val]);
      }
    });

    filteredParams.sort((a, b) => {
      const keyCmp = a[0].localeCompare(b[0]);
      if (keyCmp !== 0) return keyCmp;
      return a[1].localeCompare(b[1]);
    });

    const queryString = filteredParams
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const queryPart = queryString ? `?${queryString}` : "";
    return `${scheme}//${hostAndPort}${path}${queryPart}`;
  } catch {
    return urlStr.trim();
  }
}
