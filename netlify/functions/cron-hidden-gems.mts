import type { Config } from "@netlify/functions";

async function pingCron(path: string) {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;

  if (!base || !secret) {
    console.error("cron-hidden-gems: missing URL or CRON_SECRET");
    return;
  }

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!res.ok) {
    console.error(`cron-hidden-gems: ${path} returned ${res.status}`);
  }
}

const runHiddenGemsCron = async () => {
  await pingCron("/api/cron/hidden-gems");
};

export default runHiddenGemsCron;

export const config: Config = {
  schedule: "0 6 * * *",
};
