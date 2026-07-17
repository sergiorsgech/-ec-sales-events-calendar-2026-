const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "Promos";
const PARTITION = "2026";

module.exports = async function (context, req) {
  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);
    try { await client.createTable(); } catch (e) { /* already exists, ignore */ }

    const items = [];
    const entities = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${PARTITION}'` }
    });

    for await (const e of entities) {
      items.push({
        id: e.rowKey,
        title: e.title || "",
        description: e.description || "",
        price: e.price || "",
        categories: e.categories || "",
        important: e.important || "",
        spots: e.spots || "",
        imageUrl: e.imageUrl || "",
        startDate: e.startDate || "",
        endDate: e.endDate || "",
        label1: e.label1 || "",
        url1: e.url1 || "",
        label2: e.label2 || "",
        url2: e.url2 || "",
        label3: e.label3 || "",
        url3: e.url3 || ""
      });
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: items
    };
  } catch (err) {
    context.log.error("getPromos error:", err.message);
    context.res = {
      status: 500,
      body: { error: "Could not load promos.", detail: err.message }
    };
  }
};
