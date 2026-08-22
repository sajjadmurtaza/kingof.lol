import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const LOCALES = ["en", "zh", "es", "ar", "hi", "fr", "de", "ja", "ko", "pt"];
const NAMESPACES = ["common", "app"];
const BASE_DIR = resolve(__dirname, "../src/i18n/locales");

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

let hasErrors = false;

for (const ns of NAMESPACES) {
  const enPath = join(BASE_DIR, "en", `${ns}.json`);
  if (!existsSync(enPath)) {
    console.error(`Missing base file: ${enPath}`);
    hasErrors = true;
    continue;
  }

  const enData = JSON.parse(readFileSync(enPath, "utf-8"));
  const enKeys = getKeys(enData).sort();

  for (const locale of LOCALES) {
    if (locale === "en") continue;

    const localePath = join(BASE_DIR, locale, `${ns}.json`);
    if (!existsSync(localePath)) {
      console.error(`Missing locale file: ${localePath}`);
      hasErrors = true;
      continue;
    }

    const localeData = JSON.parse(readFileSync(localePath, "utf-8"));
    const localeKeys = getKeys(localeData).sort();

    const missing = enKeys.filter((k) => !localeKeys.includes(k));
    const extra = localeKeys.filter((k) => !enKeys.includes(k));

    if (missing.length > 0) {
      console.error(`[${locale}/${ns}] Missing keys: ${missing.join(", ")}`);
      hasErrors = true;
    }
    if (extra.length > 0) {
      console.warn(`[${locale}/${ns}] Extra keys: ${extra.join(", ")}`);
    }
  }
}

if (hasErrors) {
  console.error("\ni18n validation failed!");
  process.exit(1);
} else {
  console.log("i18n validation passed! All locales have matching keys.");
}
