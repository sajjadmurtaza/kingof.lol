import type { Config } from "@netlify/functions";

async function pingCron(path: string) {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;

  if (!base || !secret) {
    console.error("cron-snapshots: missing URL or CRON_SECRET");
    return;
  }

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!res.ok) {
    console.error(`cron-snapshots: ${path} returned ${res.status}`);
  }
}

const runSnapshotsCron = async () => {
  await pingCron("/api/cron/snapshots");
};

export default runSnapshotsCron;

export const config: Config = {
  schedule: "0 * * * *",
};
