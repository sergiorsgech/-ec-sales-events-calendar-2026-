const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "Promos";
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
    context.res = { status: 400, body: { error: "Expected an array of promos." } };
    return;
  }

  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);
    try { await client.createTable(); } catch (e) { /* already exists, ignore */ }

    // 1. Delete everything currently in the partition
    const existing = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${PARTITION}'` }
    });
    for await (const e of existing) {
      await client.deleteEntity(e.partitionKey, e.rowKey);
    }

    // 2. Write the new set
    for (const p of incoming) {
      if (!p.id) continue;
      await client.createEntity({
        partitionKey: PARTITION,
        rowKey: String(p.id),
        title: p.title || "",
        description: p.description || "",
        price: p.price || "",
        categories: p.categories || "",
        important: p.important || "",
        spots: p.spots || "",
        imageUrl: p.imageUrl || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        label1: p.label1 || "",
        url1: p.url1 || "",
        label2: p.label2 || "",
        url2: p.url2 || "",
        label3: p.label3 || "",
        url3: p.url3 || ""
      });
    }

    context.res = { status: 200, body: { saved: incoming.length } };
  } catch (err) {
    context.log.error("savePromos error:", err.message);
    context.res = { status: 500, body: { error: "Save failed.", detail: err.message } };
  }
};
