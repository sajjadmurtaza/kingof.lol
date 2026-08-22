import type { SupportedLocale } from "./config";

export const MESSAGE_NAMESPACES = ["common", "app"] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export type AppMessages = Record<MessageNamespace, Record<string, unknown>>;

const catalog: Record<
  SupportedLocale,
  {
    common: () => Promise<{ default: Record<string, unknown> }>;
    app: () => Promise<{ default: Record<string, unknown> }>;
  }
> = {
  en: {
    common: () => import("./locales/en/common.json"),
    app: () => import("./locales/en/app.json"),
  },
  zh: {
    common: () => import("./locales/zh/common.json"),
    app: () => import("./locales/zh/app.json"),
  },
  es: {
    common: () => import("./locales/es/common.json"),
    app: () => import("./locales/es/app.json"),
  },
  ar: {
    common: () => import("./locales/ar/common.json"),
    app: () => import("./locales/ar/app.json"),
  },
  hi: {
    common: () => import("./locales/hi/common.json"),
    app: () => import("./locales/hi/app.json"),
  },
  fr: {
    common: () => import("./locales/fr/common.json"),
    app: () => import("./locales/fr/app.json"),
  },
  de: {
    common: () => import("./locales/de/common.json"),
    app: () => import("./locales/de/app.json"),
  },
  ja: {
    common: () => import("./locales/ja/common.json"),
    app: () => import("./locales/ja/app.json"),
  },
  ko: {
    common: () => import("./locales/ko/common.json"),
    app: () => import("./locales/ko/app.json"),
  },
  pt: {
    common: () => import("./locales/pt/common.json"),
    app: () => import("./locales/pt/app.json"),
  },
};

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function loadMessages(locale: SupportedLocale): Promise<AppMessages> {
  const [enCommon, enApp, localeCommon, localeApp] = await Promise.all([
    catalog.en.common(),
    catalog.en.app(),
    catalog[locale].common(),
    catalog[locale].app(),
  ]);

  if (locale === "en") {
    return { common: enCommon.default, app: enApp.default };
  }

  return {
    common: deepMerge(enCommon.default, localeCommon.default) as Record<string, unknown>,
    app: deepMerge(enApp.default, localeApp.default) as Record<string, unknown>,
  };
}
