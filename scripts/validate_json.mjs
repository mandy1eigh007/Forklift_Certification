#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";

const files = ["docs/STATE.json", "run-of-show/public/content/outline.json"];
let hasError = false;

for (const file of files) {
  const absPath = path.resolve(file);
  try {
    const raw = readFileSync(absPath, "utf8");
    JSON.parse(raw);
    console.log(`OK: ${file}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ERROR: ${file}: ${message}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}
