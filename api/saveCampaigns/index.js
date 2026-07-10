const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "SalesEventsCampaigns";
const PARTITION = "2026";
const PIN = "2027";

module.exports = async function (context, req) {
  // PIN check — sent in the x-edit-pin header
  const pin = req.headers["x-edit-pin"];
  if (pin !== PIN) {
    context.res = { status: 401, body: { error: "Invalid PIN." } };
    return;
  }

  const incoming = req.body;
  if (!Array.isArray(incoming)) {
    context.res = { status: 400, body: { error: "Expected an array of campaigns." } };
    return;
  }

  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);

    // 1. Delete everything currently in the partition
    const existing = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${PARTITION}'` }
    });
    for await (const e of existing) {
      await client.deleteEntity(e.partitionKey, e.rowKey);
    }

    // 2. Write the new set
    for (const c of incoming) {
      if (!c.id) continue;
      await client.createEntity({
        partitionKey: PARTITION,
        rowKey: String(c.id),
        label: c.label || "",
        cat: c.cat || "",
        event: c.event || "",
        dl: c.dl || "",
        lg: c.lg != null ? Number(c.lg) : 4,
        print: c.print === true,
        ticketUrl: c.ticketUrl || "",
        showTicket: c.showTicket === true
      });
    }

    context.res = { status: 200, body: { saved: incoming.length } };
  } catch (err) {
    context.log.error("saveCampaigns error:", err.message);
    context.res = { status: 500, body: { error: "Save failed.", detail: err.message } };
  }
};
