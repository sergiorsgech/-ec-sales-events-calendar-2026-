const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "SalesEventsCampaigns";
const PARTITION = "2026";

module.exports = async function (context, req) {
  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);

    const items = [];
    const entities = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${PARTITION}'` }
    });

    for await (const e of entities) {
      items.push({
        id: e.rowKey,
        label: e.label || "",
        cat: e.cat || "",
        event: e.event || "",
        dl: e.dl || null,
        lg: e.lg != null ? Number(e.lg) : 4,
        print: e.print === true || e.print === "true",
        ticketUrl: e.ticketUrl || null,
        showTicket: e.showTicket === true || e.showTicket === "true",
        magazineUrl: e.magazineUrl || null,
        showMagazine: e.showMagazine === true || e.showMagazine === "true",
        brandIds: e.brandIds || ""
      });
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: items
    };
  } catch (err) {
    context.log.error("getCampaigns error:", err.message);
    context.res = {
      status: 500,
      body: { error: "Could not load campaigns.", detail: err.message }
    };
  }
};
