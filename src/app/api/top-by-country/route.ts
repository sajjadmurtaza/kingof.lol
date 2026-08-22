import { NextResponse } from "next/server";
import {
  getTopProductsByCountry,
  getCountryMeta,
  getAllCountries,
} from "@/domains/leaderboard/queries";
import { getRequestCountryCode } from "@/lib/request-country";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase();

  if (!country) {
    const detected = getRequestCountryCode(request);

    return NextResponse.json({
      detectedCountry: detected,
      countries: getAllCountries(),
    });
  }

  const meta = getCountryMeta(country);
  if (!meta) {
    return NextResponse.json(
      { error: "Unsupported country code" },
      { status: 400 },
    );
  }

  try {
    const topProducts = await getTopProductsByCountry(country, 3);
    return NextResponse.json({
      code: country,
      flag: meta.flag,
      name: meta.name,
      products: topProducts,
    });
  } catch {
    return NextResponse.json({
      code: country,
      flag: meta.flag,
      name: meta.name,
      products: [],
    });
  }
}
