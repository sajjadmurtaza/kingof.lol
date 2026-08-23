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

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

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

/** Site favicons — transparent PNGs from favicon.svg */
const SITE_ICON_MANIFEST = [
  {
    svg: "favicon.svg",
    outputs: [
      { file: "apple-icon.png", width: 180 },
      { file: "icon-192.png", width: 192 },
      { file: "icon-512.png", width: 512 },
    ],
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

  const expectedBrandFiles = new Set(
    MANIFEST.flatMap((entry) => entry.outputs.map((out) => out.file)),
  );
  for (const file of await readdir(pngDir)) {
    if (!expectedBrandFiles.has(file)) {
      await unlink(join(pngDir, file));
      console.log(`✗ removed stale ${file}`);
    }
  }

  async function exportSvg(svgPath, outputs, outputDir, transparent = true) {
    const svg = await readFile(svgPath);

    for (const out of outputs) {
      const height = out.height ?? out.width;
      const outputPath = join(outputDir, out.file);
      const background = transparent ? TRANSPARENT : { r: 10, g: 10, b: 10, alpha: 1 };

      await sharp(svg, { density: 300 })
        .resize(out.width, height, { fit: "contain", background })
        .png()
        .toFile(outputPath);

      console.log(`✓ ${out.file} (${out.width}×${height})`);
    }
  }

  for (const entry of MANIFEST) {
    await exportSvg(join(svgDir, entry.svg), entry.outputs, pngDir);
  }

  const publicDir = join(root, "public");
  const appDir = join(root, "src/app");
  for (const entry of SITE_ICON_MANIFEST) {
    await exportSvg(join(svgDir, entry.svg), entry.outputs, publicDir);
    const appleIcon = entry.outputs.find((out) => out.file === "apple-icon.png");
    if (appleIcon) {
      const source = join(publicDir, appleIcon.file);
      const target = join(appDir, appleIcon.file);
      await sharp(await readFile(source))
        .png()
        .toFile(target);
      console.log(`✓ src/app/${appleIcon.file} (from ${appleIcon.file})`);
    }
  }

  console.log(`\nDone — brand PNGs in public/brand/png/, site icons in public/ + src/app/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
