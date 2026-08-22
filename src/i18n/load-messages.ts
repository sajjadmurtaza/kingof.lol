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

export async function loadMessages(locale: SupportedLocale): Promise<AppMessages> {
  const [common, app] = await Promise.all([catalog[locale].common(), catalog[locale].app()]);
  return { common: common.default, app: app.default };
}
