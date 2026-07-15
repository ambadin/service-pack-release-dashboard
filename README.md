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