import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

const TARGET_EXTENSIONS = new Set([".js", ".d.ts"]);
const KNOWN_SPECIFIER_EXTENSIONS = [".js", ".mjs", ".cjs", ".json", ".css", ".svg", ".png", ".jpg", ".jpeg", ".woff2"];

walk(distDir);

function walk(path) {
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!shouldProcessFile(fullPath)) {
      continue;
    }
    const source = readFileSync(fullPath, "utf8");
    const rewritten = rewriteImports(source);
    if (rewritten !== source) {
      writeFileSync(fullPath, rewritten, "utf8");
    }
  }
}

function shouldProcessFile(path) {
  if (path.endsWith(".d.ts")) return true;
  return TARGET_EXTENSIONS.has(extname(path));
}

function rewriteImports(source) {
  const fromPattern = /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g;
  const dynamicPattern = /(import\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g;

  const withFrom = source.replace(fromPattern, (_, prefix, specifier, suffix) => {
    return `${prefix}${normalizeSpecifier(specifier)}${suffix}`;
  });

  return withFrom.replace(dynamicPattern, (_, prefix, specifier, suffix) => {
    return `${prefix}${normalizeSpecifier(specifier)}${suffix}`;
  });
}

function normalizeSpecifier(specifier) {
  if (specifier.endsWith("/")) return `${specifier}index.js`;
  if (hasKnownExtension(specifier)) return specifier;
  return `${specifier}.js`;
}

function hasKnownExtension(specifier) {
  return KNOWN_SPECIFIER_EXTENSIONS.some((extension) => specifier.endsWith(extension));
}

