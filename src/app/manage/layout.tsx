import type { Metadata } from "next";
import enApp from "@/i18n/locales/en/app.json";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: enApp.meta.manageTitle,
    description: enApp.meta.manageDesc,
    robots: { index: false, follow: false },
  };
}

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
