# Service Pack Release Dashboard

This project is a dashboard application designed to display the status and planning of service pack releases. It provides an intuitive interface for users to view and manage release information.

## Features

- **Dashboard Layout**: A main dashboard that aggregates all service pack releases.
- **Release Cards**: Each release is represented by a card displaying its title, status, and planned release date.
- **Status Badges**: Visual indicators for the status of each release, color-coded for easy identification.
- **Data Management**: Custom hooks to fetch and manage release data efficiently.
- **Quarterly Status**: One tab with a Q1–Q4 sub-tab strip; each quarter shows a chart (X = OS version,
  Y = week) of the planned schedule per milestone phase, plus the full detailed status table below.
  When the live planning sheet includes an "Actual" column (see below), an additional Actual marker
  is plotted per product — green if on time or early, red if later than the planned InCenter release
  week.

## Getting Started

To get started with the project, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd service-pack-release-dashboard
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Application**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000` (or the specified port) to view the dashboard.

## Taskboard (TFS / Azure DevOps) integration

This project includes a Taskboard view that can query a TFS/Azure DevOps sprint (Wiql).

Configuration (recommended):

- Create a `.env` file in the project root and set the following values:

```bash
TFS_URL="https://tfsemea1.ta.philips.com/tfs/TPC_Region26/DXR"
TFS_PAT="<your-personal-access-token>"
TFS_PROJECT="DXR"
TFS_ITERATION="PI-28\\PI-28 Iteration 2"
```

Notes:
- Browser requests to an on-prem TFS may be blocked by CORS or require Windows Integrated Authentication (NTLM). This project provides a server-side proxy in `server.js` to forward requests to TFS/Azure DevOps using your PAT.
- If `TFS_URL` or `TFS_PAT` are not provided, the dashboard will use mock task data for local development.

Run the app and open the Dashboard to see the Taskboard under the releases section. For local development with live TFS data, run `npm install`, `npm run build`, and `npm run server`. Alternatively, use `npm run dev` during development and keep the server proxy on port 4000.

## Quarterly Status and the planning workbook source

`GET /api/service-pack-xlsx` serves `service-pack-planning.xlsx`, which backs both the Quarterly
Status charts/tables and the SP 2026 Plan view. By default it serves the bundled snapshot in this
repo. Set `SP_PLANNING_XLSX_PATH` to read live from the internal network share instead — see
[`docker/README-deploy.md`](docker/README-deploy.md) section "Planning workbook source" for the
exact path, the Linux CIFS-mount requirement for containerized deployments, and the graceful
fallback behavior if the share is temporarily unreachable.

The chart's phase columns and the optional trailing "Actual" column are discovered from each
quarter sheet's own header row (not hardcoded), since the live sheet's schema currently differs
across quarters (Q1/Q2 have no Actual column yet; Q3/Q4 do).

## SP Guideline PDF source

`GET /api/sp-guideline-pdf` serves the PDF shown under the SP Guideline tab, using the same
live-source-with-fallback pattern: set `SP_GUIDELINE_PDF_PATH` to read live from the internal
network share, or leave it unset to serve the bundled copy in `public/`. See
[`docker/README-deploy.md`](docker/README-deploy.md) section "Planning workbook source" for the
exact path and the Linux CIFS-mount requirement (same share as the planning workbook).

## IB System Versions source

`GET /api/ib-system-versions-xlsx` serves `ib-system-release-versions.xlsx`, which backs the
IB System Versions tab (one sub-tab per sheet: `Win10 1607`, `Win10 1809`, `Win10 2021`).
Same live-source-with-fallback pattern: set `IB_SYSTEM_VERSIONS_XLSX_PATH` to read the live
workbook from the network share, or leave it unset to serve the bundled copy in this repo.
Columns are read from each sheet's own header row, so the three sheets may keep their slightly
different header names.

## Container image (Podman/Docker)

Release **1.3.0** includes the refreshed dashboard, compact quarterly charts, and the
IB System Versions view with distinct AS-version counts for each OS tab. Export the
image as `service-pack-release-dashboard-1.3.0.tar`; keep the runtime `.env` separate.
See the deployment guide below for build, export, and load commands.

The app is packaged as a single OCI image: a multi-stage build compiles the Vite/React SPA,
then a slim `node:22-alpine` runtime serves `dist/` and the Express API/TFS proxy
(`server.js`) from one non-root process. See [`docker/Containerfile`](docker/Containerfile).

### Build and run locally with Podman

```powershell
cd service-pack-release-dashboard
copy docker\.env.example docker\.env   # then edit docker\.env with your TFS values (optional)

podman build --format docker -f docker/Containerfile -t service-pack-release-dashboard:local .
podman run -d --name spr-dashboard -p 127.0.0.1:8080:8080 --env-file docker/.env service-pack-release-dashboard:local

# open http://localhost:8080/
podman logs -f spr-dashboard
```

> Use `--format docker`: Podman defaults to OCI image format, which silently drops the
> `HEALTHCHECK` instruction. Docker format preserves it.

Or with Podman Compose (also usable from Podman Desktop):

```powershell
cd docker
podman compose -f docker-compose.standalone.yml up -d --build
```

### Build/push helper scripts

`docker/build-push.ps1` (Windows) and `docker/build-push.sh` (Linux/CI) auto-detect Podman or
Docker, build the image with OCI labels, and optionally push to Artifactory:

```powershell
.\docker\build-push.ps1 -DryRun          # preview the command
.\docker\build-push.ps1                  # local build only
.\docker\build-push.ps1 -Push -Latest    # build + push (requires podman/docker login)
```

### Environment variables

See [`docker/.env.example`](docker/.env.example). The TFS/Azure DevOps integration is
optional — the dashboard falls back to mock data when unset. `NODE_EXTRA_CA_CERTS` is
pre-set for environments with corporate TLS interception; mount the certificate as a read-only
volume rather than baking it into the image (see the commented volume line in
`docker/docker-compose.standalone.yml`).

### Health check

`GET /health` returns `{"status":"ok"}` and is used by the container `HEALTHCHECK` and by the
per-port hosting platform's deployment health probe.

### Deploying to the shared Linux/Podman/Cockpit server

This image is compatible with the internal per-port application platform (rootless Podman,
host-nginx TLS termination, one public HTTPS port per app). It expects:

- Container listens on a single port (`PORT`, default `8080`).
- No persistent volumes required by default; a read-only CIFS-mount volume is only needed if
  `SP_PLANNING_XLSX_PATH` is configured to read the live planning workbook (see above).
- Health path: `/health`.

Publish the image to the approved registry, then follow the platform's onboarding steps to
allocate ports and register the application definition. For the full hardened production
walkthrough (secret mounting, corporate CA decision, CORS, nginx reverse-proxy config, image
export), see [`docker/README-deploy.md`](docker/README-deploy.md).

## Project Structure

- `src/components`: Contains reusable components such as `Dashboard`, `ReleaseCard`, and `StatusBadge`,
  plus `QuarterlyStatus`/`QuarterlyScheduleChart` (Q1–Q4 sub-tabs, chart, and status table) and
  `ServicePackXlsxView` (the shared xlsx fetch/parse used by both the chart and status tables).
- `src/pages`: Contains the main page component `DashboardPage`.
- `src/data`: Contains the data structure for service pack releases.
- `src/hooks`: Contains custom hooks for managing release data.
- `src/styles`: Contains CSS styles for the application.
- `src/App.tsx`: Main application component.
- `src/main.tsx`: Entry point of the application.
- `public/index.html`: Main HTML template.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.