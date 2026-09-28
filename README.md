# Service Pack Release Dashboard

This project is a dashboard application designed to display the status and planning of service pack releases. It provides an intuitive interface for users to view and manage release information.

## Features

- **Dashboard Layout**: A main dashboard that aggregates all service pack releases.
- **Release Cards**: Each release is represented by a card displaying its title, status, and planned release date.
- **Status Badges**: Visual indicators for the status of each release, color-coded for easy identification.
- **Data Management**: Custom hooks to fetch and manage release data efficiently.

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

## Container image (Podman/Docker)

The app is packaged as a single OCI image: a multi-stage build compiles the Vite/React SPA,
then a slim `node:22-alpine` runtime serves `dist/` and the Express API/TFS-Windchill proxy
(`server.js`) from one non-root process. See [`docker/Containerfile`](docker/Containerfile).

### Build and run locally with Podman

```powershell
cd service-pack-release-dashboard
copy docker\.env.example docker\.env   # then edit docker\.env with your TFS/Windchill values

podman build -f docker/Containerfile -t service-pack-release-dashboard:local .
podman run -d --name spr-dashboard -p 127.0.0.1:8080:8080 --env-file docker/.env service-pack-release-dashboard:local

# open http://localhost:8080/
podman logs -f spr-dashboard
```

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

See [`docker/.env.example`](docker/.env.example). All integrations (TFS/Azure DevOps, Windchill)
are optional — the dashboard falls back to mock data when unset. `NODE_EXTRA_CA_CERTS` is
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
- No persistent volumes are required (no database).
- Health path: `/health`.

Publish the image to the approved registry, then follow the platform's onboarding steps to
allocate ports and register the application definition.

## Project Structure

- `src/components`: Contains reusable components such as `Dashboard`, `ReleaseCard`, and `StatusBadge`.
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