import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const distDemoDir = join(distDir, "demo");
const sourceDemoDir = join(rootDir, "demo");

mkdirSync(distDemoDir, { recursive: true });

copyFile(join(sourceDemoDir, "index.html"), join(distDemoDir, "index.html"));
copyFile(join(sourceDemoDir, "styles.css"), join(distDemoDir, "styles.css"));

const sourceTvPath = join(sourceDemoDir, "assets", "charting_library");
const destTvPath = join(distDemoDir, "assets", "charting_library");

if (!existsSync(sourceTvPath)) {
  throw new Error(
    "Missing TradingView assets at demo/assets/charting_library. Place private Charting Library files there before build.",
  );
}

rmSync(destTvPath, { recursive: true, force: true });
mkdirSync(join(distDemoDir, "assets"), { recursive: true });
cpSync(sourceTvPath, destTvPath, { recursive: true });

function copyFile(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Missing file: ${from}`);
  }
  cpSync(from, to);
}
