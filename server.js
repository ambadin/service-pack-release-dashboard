require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 4000;

// CORS is restricted to an explicit allow-list. The SPA and this API are
// served same-origin by design, so ALLOWED_ORIGINS is unset (cross-origin
// access disabled) unless a specific split-origin deployment needs it.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const buildAuthHeader = (pat) => {
  if (!pat) return undefined;
  const token = Buffer.from(`:${pat}`).toString('base64');
  return `Basic ${token}`;
};

const mockTasks = [
  { id: 101, title: 'Investigate crash on startup', assignedTo: 'Alice Johnson', state: 'In Progress', tags: ['bug', 'high-priority'], url: '#' },
  { id: 102, title: 'Add telemetry for feature X', assignedTo: 'Bob Smith', state: 'To Do', tags: ['enhancement'], url: '#' },
  { id: 103, title: 'Refactor authentication module', assignedTo: 'Charlie Doe', state: 'In Progress', tags: ['refactor'], url: '#' },
  { id: 104, title: 'Write unit tests for Y', assignedTo: 'Alice Johnson', state: 'To Do', url: '#' },
  { id: 105, title: 'Update release notes', assignedTo: 'Unassigned', state: 'To Do', url: '#' },
];

const releaseList = [
  { id: 1, title: 'Service Pack 1', status: 'Completed', plannedDate: '2023-01-15' },
  { id: 2, title: 'Service Pack 2', status: 'In Progress', plannedDate: '2023-03-20' },
  { id: 3, title: 'Service Pack 3', status: 'Pending', plannedDate: '2023-06-10' },
  { id: 4, title: 'Service Pack 4', status: 'Completed', plannedDate: '2023-09-05' },
  { id: 5, title: 'Service Pack 5', status: 'In Progress', plannedDate: '2023-12-01' },
];

// Container/platform health probe (Podman healthcheck, nginx upstream checks).
// Deliberately unauthenticated and dependency-free so it reflects process liveness only.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', liveTfsConfigured: !!process.env.TFS_URL && !!process.env.TFS_PAT });
});

app.get('/api/releases', (req, res) => {
  res.json(releaseList);
});

app.get('/api/tasks', async (req, res) => {
  const tfsUrl = process.env.TFS_URL;
  const project = process.env.TFS_PROJECT;
  const pat = process.env.TFS_PAT;

  if (!tfsUrl || !project || !pat) {
    console.warn('TFS not configured, returning mock tasks');
    return res.json(mockTasks);
  }

  try {
    const iteration = process.env.TFS_ITERATION || 'PI-28\\PI-28 Iteration 2';
    const queryParts = [
      `[System.TeamProject] = '${project}'`,
      `[System.IterationPath] = '${iteration}'`,
      `[System.WorkItemType] = 'Task'`,
    ];
    const wiql = {
      query: `Select [System.Id], [System.Title], [System.State], [System.AssignedTo] From WorkItems Where ${queryParts.join(' AND ')} Order By [System.ChangedDate] Desc`,
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: buildAuthHeader(pat),
    };

    const wiqlResponse = await axios.post(`${tfsUrl.replace(/\/+$/, '')}/_apis/wit/wiql?api-version=6.0`, wiql, { headers });
    const ids = (wiqlResponse.data.workItems || []).map((item) => item.id);

    if (!ids.length) {
      return res.json([]);
    }

    const workitemsResponse = await axios.get(`${tfsUrl.replace(/\/+$/, '')}/_apis/wit/workitems?ids=${ids.join(',')}&api-version=6.0`, { headers });
    const tasks = (workitemsResponse.data.value || []).map((wi) => ({
      id: wi.id,
      title: wi.fields['System.Title'],
      assignedTo: (wi.fields['System.AssignedTo'] && wi.fields['System.AssignedTo'].displayName) || 'Unassigned',
      state: wi.fields['System.State'] || '',
      tags: wi.fields['System.Tags'] ? wi.fields['System.Tags'].split(';').map((tag) => tag.trim()) : [],
      url: wi._links?.html?.href,
    }));

    return res.json(tasks);
  } catch (error) {
    console.error('Error fetching TFS tasks:', error?.message || error);
    return res.status(500).json({ error: 'Failed to fetch tasks from TFS/Azure DevOps', detail: error?.message || error });
  }
});

// Source of truth for the planning workbook. Set SP_PLANNING_XLSX_PATH to read
// live from the shared network location instead of the bundled snapshot —
// e.g. on Windows: \\ingbtcpic1vwsfs.code1.emi.philips.com\Bangalore3\Projects\DXR\FSA\Service pack planning sheet\service-pack-planning.xlsx
// On the Linux/Podman deployment this must be a POSIX path to a CIFS/SMB
// mount of that same share (Node cannot resolve a Windows UNC path on
// Linux) — see docker/README-deploy.md "Planning workbook source".
// If unset, or if the configured path is temporarily unreadable (network
// share unavailable), the bundled copy shipped in the repo is served instead
// so the dashboard degrades gracefully rather than failing outright.
const BUNDLED_XLSX_PATH = path.join(__dirname, 'service-pack-planning.xlsx');

app.get('/api/service-pack-xlsx', (req, res) => {
  const externalPath = process.env.SP_PLANNING_XLSX_PATH;
  const candidates = externalPath
    ? [{ filePath: externalPath, source: 'external' }, { filePath: BUNDLED_XLSX_PATH, source: 'bundled-fallback' }]
    : [{ filePath: BUNDLED_XLSX_PATH, source: 'bundled' }];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate.filePath)) continue;
      const data = fs.readFileSync(candidate.filePath);
      if (candidate.source === 'bundled-fallback') {
        console.warn(`SP_PLANNING_XLSX_PATH ("${externalPath}") was unreadable; served the bundled fallback copy instead.`);
      }
      return res.json({
        fileName: path.basename(candidate.filePath),
        dataBase64: data.toString('base64'),
        source: candidate.source,
      });
    } catch (error) {
      console.error(`Error reading planning workbook at "${candidate.filePath}":`, error?.message || error);
      // fall through to the next candidate (bundled fallback, if any)
    }
  }

  return res.status(404).json({ error: 'service-pack-planning.xlsx not found (checked configured source and bundled fallback).' });
});

// Source of truth for the SP Guideline PDF. Set SP_GUIDELINE_PDF_PATH to read
// live from the shared network location instead of the bundled snapshot —
// e.g. on Windows: \\ingbtcpic1vwsfs.code1.emi.philips.com\Bangalore3\Projects\DXR\FSA\Service pack planning sheet\2009001390 Service Pack Guideline_en 1.pdf
// On the Linux/Podman deployment this must be a POSIX path to a CIFS/SMB
// mount of that same share (see docker/README-deploy.md "Planning workbook
// source" for the equivalent xlsx setup). If unset, or if the configured
// path is temporarily unreadable, the bundled copy is served instead.
//
// The bundled fallback lives in dist/, not public/: Vite copies public/'s
// contents into dist/ at build time, and dist/ is the only one of the two
// actually shipped in the container image (the Containerfile never COPYs a
// standalone public/ directory) — so dist/ is the single correct location
// for both native and containerized execution after any build.
const BUNDLED_GUIDELINE_PDF_PATH = path.join(__dirname, 'dist', '2009001390 Service Pack Guideline_en.pdf');

app.get('/api/sp-guideline-pdf', (req, res) => {
  const externalPath = process.env.SP_GUIDELINE_PDF_PATH;
  const candidates = externalPath
    ? [{ filePath: externalPath, source: 'external' }, { filePath: BUNDLED_GUIDELINE_PDF_PATH, source: 'bundled-fallback' }]
    : [{ filePath: BUNDLED_GUIDELINE_PDF_PATH, source: 'bundled' }];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate.filePath)) continue;
      if (candidate.source === 'bundled-fallback') {
        console.warn(`SP_GUIDELINE_PDF_PATH ("${externalPath}") was unreadable; served the bundled fallback copy instead.`);
      }
      res.setHeader('Content-Type', 'application/pdf');
      return res.sendFile(candidate.filePath);
    } catch (error) {
      console.error(`Error reading SP Guideline PDF at "${candidate.filePath}":`, error?.message || error);
      // fall through to the next candidate (bundled fallback, if any)
    }
  }

  return res.status(404).json({ error: 'SP Guideline PDF not found (checked configured source and bundled fallback).' });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Dashboard server running on http://localhost:${port}`);
});
