// Seed script — EC Sales / Events Calendar 2026
//
// Pulls the current 33 EC campaigns straight from the live PR Calendar's
// public getCampaigns endpoint (no PIN needed for GET) and writes them into
// this project's own table: SalesEventsCampaigns / partition "2026".
//
// Run from the repo root:
//   npm install @azure/data-tables node-fetch@2
//   AZURE_STORAGE_CONNECTION_STRING="<connection string>" node seed.js

const { TableClient } = require("@azure/data-tables");
const fetch = require("node-fetch");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "SalesEventsCampaigns";
const PARTITION = "2026";
const SOURCE_URL = "https://green-island-005db690f.7.azurestaticapps.net/api/getCampaigns";

async function main() {
  if (!CONN) {
    console.error("Missing AZURE_STORAGE_CONNECTION_STRING env var.");
    process.exit(1);
  }

  console.log("Fetching live campaign data from the PR Calendar...");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const campaigns = await res.json();
  console.log(`Fetched ${campaigns.length} campaigns.`);

  const client = TableClient.fromConnectionString(CONN, TABLE);
  try {
    await client.createTable();
  } catch (e) {
    // ignore "already exists"
  }

  console.log(`Writing to table "${TABLE}" (partition "${PARTITION}")...`);
  for (const c of campaigns) {
    await client.createEntity({
      partitionKey: PARTITION,
      rowKey: String(c.id),
      label: c.label || "",
      cat: c.cat || "",
      event: c.event || "",
      dl: c.dl || "",
      lg: c.lg != null ? Number(c.lg) : 4,
      print: c.print === true
    });
  }

  console.log(`Done — seeded ${campaigns.length} campaigns.`);
}

main().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
