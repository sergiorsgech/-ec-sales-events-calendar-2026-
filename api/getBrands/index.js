const { TableClient } = require("@azure/data-tables");

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING;
const TABLE = "Brands";
const PARTITION = "2026";

const DEFAULTS = [
  { id: "elclasificado",   name: "El Clasificado",     color: "#1A1A1A" },
  { id: "elclasificadocom",name: "Elclasificado.com",  color: "#F5A623" },
  { id: "masclientes",     name: "Mas Clientes",       color: "#6ABF1E" },
  { id: "quinceanera",     name: "Quinceañera",        color: "#E91E8C" },
  { id: "ssdn",            name: "SSdN",               color: "#0288D1" },
  { id: "buenprovecho",    name: "Buen Provecho",      color: "#E65100" },
  { id: "vivela",          name: "Vívela",             color: "#D81B60" },
  { id: "abogadomall",     name: "AbogadoMall",        color: "#1B3A6B" },
  { id: "empleoslatino",   name: "Empleos Latino",     color: "#00897B" }
];

module.exports = async function (context, req) {
  try {
    const client = TableClient.fromConnectionString(CONN, TABLE);
    try { await client.createTable(); } catch (e) { /* already exists, ignore */ }

    const items = [];
    const entities = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${PARTITION}'` }
    });
    for await (const e of entities) {
      items.push({ id: e.rowKey, name: e.name || "", color: e.color || "#555555" });
    }

    if (items.length === 0) {
      for (const b of DEFAULTS) {
        await client.createEntity({ partitionKey: PARTITION, rowKey: b.id, name: b.name, color: b.color });
        items.push(b);
      }
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: items
    };
  } catch (err) {
    context.log.error("getBrands error:", err.message);
    context.res = {
      status: 500,
      body: { error: "Could not load brands.", detail: err.message }
    };
  }
};
