import { redirect } from "@/i18n/navigation";

export default async function NewListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/products", locale });
}
