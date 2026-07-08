# EC Sales / Events Calendar 2026

Fork of the EC PR Calendar 2026, with the PR Events tab removed. 3 tabs:
Campaign Directory, This Week, This Month.

## Azure resources (reuse existing account)
- Storage account: `ecmapstorage`
- Resource group: `ec-maps`
- Table: `SalesEventsCampaigns` (new — partition key `2026`)
- Edit PIN: `2027`

## Deploy steps
1. Create a new GitHub repo (e.g. `-ec-sales-events-calendar-2026-`) and push this folder.
2. In Azure Portal, create a new Static Web App, connect it to the new repo.
   - **Important:** when Azure auto-generates the GitHub Actions workflow file,
     open it and confirm:
     ```yaml
     app_location: "/"
     api_location: "api"
     output_location: ""
     skip_app_build: true
     ```
     Azure sometimes defaults `api_location` to `""` — if so, `/api/*` routes
     will 404 until you fix it.
3. In the Static Web App's **Configuration → Environment variables**, add
   `AZURE_STORAGE_CONNECTION_STRING` using **Advanced edit** (raw value, not
   the simple key/value field) to avoid parsing issues.
4. Seed the table:
   ```bash
   npm install @azure/data-tables node-fetch@2
   AZURE_STORAGE_CONNECTION_STRING="<connection string>" node seed.js
   ```
   This pulls the current 33 campaigns live from the PR Calendar's public
   `getCampaigns` endpoint and writes them into `SalesEventsCampaigns`.
5. Visit the new site, click Edit, enter PIN `2027`, confirm campaigns show
   up and edits save.

## Notes
- `node_modules` must never be committed — already in `.gitignore`.
- Branch must be `main`, not `master`.
- `@azure/data-tables` lives in `api/package.json` only (Azure Functions
  install their own deps at build/deploy time).
