const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "BrandLinks";
const PARTITION = "2026";
const PIN = "2027";

module.exports = async function (context, req) {
  const pin = req.headers["x-edit-pin"];
  if (pin !== PIN) {
    context.res = { status: 401, body: { error: "Invalid PIN." } };
    return;
  }

  const incoming = req.body;
  if (!Array.isArray(incoming)) {
    context.res = { status: 400, body: { error: "Expected an array of brand link records." } };
    return;
  }

  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);
    try { await client.createTable(); } catch (e) { /* already exists, ignore */ }

    for (const b of incoming) {
      if (!b.id) continue;
      await client.upsertEntity({
        partitionKey: PARTITION,
        rowKey: String(b.id),
        label1: b.label1 || "",
        url1: b.url1 || "",
        label2: b.label2 || "",
        url2: b.url2 || "",
        label3: b.label3 || "",
        url3: b.url3 || ""
      }, "Replace");
    }

    context.res = { status: 200, body: { saved: incoming.length } };
  } catch (err) {
    context.log.error("saveBrandLinks error:", err.message);
    context.res = { status: 500, body: { error: "Save failed.", detail: err.message } };
  }
};
