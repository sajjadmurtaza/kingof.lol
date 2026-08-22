#!/usr/bin/env node
/**
 * Export PNG brand assets from SVG sources.
 * Usage: npm run brand:export
 */
import { mkdir, readFile, readdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgDir = join(root, "public/brand/svg");
const pngDir = join(root, "public/brand/png");

/** @type {{ svg: string; outputs: { file: string; width: number; height?: number }[] }[]} */
const MANIFEST = [
  {
    svg: "cover.svg",
    outputs: [{ file: "cover.png", width: 1200, height: 630 }],
  },
  {
    svg: "logo-square.svg",
    outputs: [{ file: "logo-square.png", width: 1080 }],
  },
];

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Missing dependency: run `npm install` (sharp is required for brand:export).");
    process.exit(1);
  }

  await mkdir(pngDir, { recursive: true });

  const expectedFiles = new Set(MANIFEST.flatMap((entry) => entry.outputs.map((out) => out.file)));
  for (const file of await readdir(pngDir)) {
    if (!expectedFiles.has(file)) {
      await unlink(join(pngDir, file));
      console.log(`✗ removed stale ${file}`);
    }
  }

  for (const entry of MANIFEST) {
    const inputPath = join(svgDir, entry.svg);
    const svg = await readFile(inputPath);

    for (const out of entry.outputs) {
      const height = out.height ?? out.width;
      const outputPath = join(pngDir, out.file);

      await sharp(svg, { density: 300 })
        .resize(out.width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);

      console.log(`✓ ${out.file} (${out.width}×${height})`);
    }
  }

  console.log(`\nDone — PNGs written to public/brand/png/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
