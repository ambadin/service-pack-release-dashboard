require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const httpntlm = require('httpntlm');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
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

const WINDCHILL_DOC_URL =
  process.env.WINDCHILL_DOC_URL ||
  'https://www.windchill.plm.philips.com/Windchill/servlet/AttachmentsDownloadDirectionServlet?oid=OR:wt.doc.WTDocument:11855432544&oid=OR:wt.content.ApplicationData:11855441831&role=PRIMARY';

const openFileWithDefaultApp = (filePath) => {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', filePath], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [filePath], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' }).unref();
  }
};

app.get('/api/open-windchill-doc', async (req, res) => {
  const user = process.env.WINDCHILL_USER;
  const password = process.env.WINDCHILL_PASSWORD;

  if (!user || !password) {
    return res.status(400).json({
      error:
        'Windchill credentials are not configured. Set WINDCHILL_USER and WINDCHILL_PASSWORD in your .env file.',
    });
  }

  try {
    const response = await axios.get(WINDCHILL_DOC_URL, {
      responseType: 'arraybuffer',
      auth: { username: user, password },
    });

    let fileName = 'windchill-document.xlsx';
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].trim());
      }
    }

    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, Buffer.from(response.data));
    openFileWithDefaultApp(filePath);

    return res.json({ status: 'ok', opened: filePath });
  } catch (error) {
    console.error('Error downloading Windchill document:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to download or open the Windchill document',
      detail: error?.message || String(error),
    });
  }
});

// ── Windchill download helper (NTLM only) ────────────────────────────────
// Performs a full NTLM handshake. Supports 'user' and 'DOMAIN\user' formats.
// Never logs credentials.
const ntlmGet = (opts) =>
  new Promise((resolve, reject) =>
    httpntlm.get(opts, (err, res) => (err ? reject(err) : resolve(res)))
  );

const downloadWindchill = async (url, rawUsername, password) => {
  let domain = '';
  let username = rawUsername;
  if (rawUsername.includes('\\')) {
    [domain, username] = rawUsername.split('\\', 2);
  }
  const res = await ntlmGet({ url, username, password, workstation: '', domain });
  return { status: res.statusCode, headers: res.headers, body: res.body };
};

// Download the product list from Windchill and return it as base64 for
// inline rendering in the dashboard.
// Credentials come from the POST body (UI modal) or .env as a silent fallback.
// NOTE: credentials are NEVER logged.
app.post('/api/windchill-product-list', async (req, res) => {
  const rawUsername = req.body?.username || process.env.WINDCHILL_USER;
  const password = req.body?.password || process.env.WINDCHILL_PASSWORD;

  if (!rawUsername || !password) {
    return res.status(400).json({ error: 'Windchill credentials are required.' });
  }

  try {
    const response = await downloadWindchill(WINDCHILL_DOC_URL, rawUsername, password);

    if (response.status === 401 || response.status === 403) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your Windchill username and password.' });
    }
    if (response.status === 301 || response.status === 302) {
      return res.status(401).json({ error: 'Authentication failed — Windchill redirected to a login page. Check your credentials.' });
    }
    if (response.status !== 200) {
      return res.status(502).json({ error: `Windchill returned HTTP ${response.status}.` });
    }

    const contentType = (response.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('text/html')) {
      return res.status(401).json({ error: 'Authentication failed — received a login page instead of the document. Check your credentials.' });
    }

    let fileName = 'IB System Release Versions.xlsx';
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) fileName = decodeURIComponent(match[1].trim());
    }

    return res.json({
      fileName,
      dataBase64: response.body.toString('base64'),
      source: 'windchill',
    });
  } catch (error) {
    // Log only the error code/type, never the credentials
    console.error('Windchill product list error:', error?.code || error?.message || 'unknown');
    return res.status(500).json({
      error: 'Could not reach Windchill. Check your network connection and VPN.',
      detail: error?.code || error?.message,
    });
  }
});

// Return the newest matching spreadsheet from the user's Downloads folder as
// base64, so the freshly downloaded Windchill file can be shown directly.
app.get('/api/product-list', (req, res) => {
  const since = Number(req.query.since) || 0;
  const downloadsDir = path.join(os.homedir(), 'Downloads');

  try {
    if (!fs.existsSync(downloadsDir)) {
      return res.status(404).json({ error: 'Downloads folder not found.' });
    }

    const all = fs
      .readdirSync(downloadsDir)
      .filter((name) => /\.(xlsx|xls|csv)$/i.test(name))
      .filter((name) => !/^~\$/.test(name))
      .map((name) => {
        const full = path.join(downloadsDir, name);
        return { name, full, mtime: fs.statSync(full).mtimeMs };
      })
      .filter((f) => (since ? f.mtime >= since : true))
      .sort((a, b) => b.mtime - a.mtime);

    // Prefer the Windchill product list file by name; fall back to newest sheet.
    const preferred = all.filter((f) => /IB System Release Versions/i.test(f.name));
    const chosen = (preferred.length ? preferred : all)[0];

    if (!chosen) {
      return res.status(204).end();
    }

    const data = fs.readFileSync(chosen.full);
    return res.json({
      fileName: chosen.name,
      dataBase64: data.toString('base64'),
    });
  } catch (error) {
    console.error('Error reading product list file:', error?.message || error);
    return res.status(500).json({ error: 'Failed to read the downloaded file', detail: error?.message || String(error) });
  }
});

app.get('/api/service-pack-xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'service-pack-planning.xlsx');
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'service-pack-planning.xlsx not found on server.' });
    }
    const data = fs.readFileSync(filePath);
    return res.json({
      fileName: 'service-pack-planning.xlsx',
      dataBase64: data.toString('base64'),
    });
  } catch (error) {
    console.error('Error reading service-pack-planning.xlsx:', error?.message || error);
    return res.status(500).json({ error: 'Failed to read service-pack-planning.xlsx', detail: error?.message || String(error) });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Dashboard server running on http://localhost:${port}`);
});
