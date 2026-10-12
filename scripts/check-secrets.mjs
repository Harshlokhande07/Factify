import fs from "node:fs";
import path from "node:path";

const FORBIDDEN_SECRETS = [
  "BRAVE_API_KEY",
  "SERPER_API_KEY",
  "FACTIFY_SEARCH_URL",
];

const violations = [];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const secret of FORBIDDEN_SECRETS) {
      if (content.includes(secret)) {
        violations.push({ filePath, secret });
      }
    }
  } catch {
    // Ignore unreadable or binary files
  }
}

function scanDir(dir, filterFn) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        scanDir(fullPath, filterFn);
      }
    } else if (entry.isFile()) {
      if (!filterFn || filterFn(fullPath)) {
        checkFile(fullPath);
      }
    }
  }
}

console.log("🔍 Scanning for leaked secret tokens in client code & static build...");

// 1. Scan components/
scanDir("components");

// 2. Scan files with "use client" across app/ and lib/
function isClientFile(filePath) {
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx") && !filePath.endsWith(".js") && !filePath.endsWith(".jsx")) {
    return false;
  }
  try {
    const firstLines = fs.readFileSync(filePath, "utf-8").slice(0, 100);
    return firstLines.includes("use client");
  } catch {
    return false;
  }
}

scanDir("app", (f) => isClientFile(f));
scanDir("lib", (f) => isClientFile(f));

// 3. Scan .next/static if present
if (fs.existsSync(path.join(".next", "static"))) {
  scanDir(path.join(".next", "static"));
}

if (violations.length > 0) {
  console.error("\n❌ FAILED: Secret tokens found in client code or static bundles:");
  for (const v of violations) {
    console.error(`  - ${v.filePath}: contains forbidden reference '${v.secret}'`);
  }
  process.exit(1);
} else {
  console.log("✅ PASSED: No server secrets or backend URL tokens found in client code or static bundles.\n");
  process.exit(0);
}
