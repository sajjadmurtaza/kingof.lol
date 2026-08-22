import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Manage Your Product — KINGOF",
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
