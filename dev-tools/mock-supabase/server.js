/* ===========================================================================
 *  MOCK SUPABASE  (development / preview only - never deploy this)
 * ---------------------------------------------------------------------------
 *  Implements just enough of the Supabase HTTP API for this website to run
 *  without a real Supabase project: password login, the three content tables
 *  and file storage. Data is kept in ./data so it survives restarts.
 *
 *  Run:  npm run mock
 *  Then point .env.local at it:
 *      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
 * =========================================================================*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.MOCK_PORT || 54321);
const DATA_DIR = path.join(__dirname, 'data');
const FILES_DIR = path.join(DATA_DIR, 'files');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(FILES_DIR, { recursive: true });

const ADMIN_EMAIL = process.env.MOCK_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.MOCK_ADMIN_PASSWORD || 'birthday123';

const EMPTY_SETTINGS = {
  id: 1,
  friend_name: '', birthday_date: '',
  intro_title: '', intro_message: '', intro_emoticon: '',
  intro_button_label: 'Next!! ^w^', intro_media_url: null, intro_media_alt: '',
  accent_color: '#2563eb',
  memories_heading: 'Memories 📸', memories_subheading: '',
  song_heading: 'A Song Just For You',
  letter_heading: 'A Letter for You 💌', letter_card_url: null, letter_card_alt: '',
  letter_card_caption: 'Happy Birthday!', letter_greeting: '', letter_text: '',
  letter_signature: '',
  finale_text: '', finale_emojis: '💙 🎂 💙',
  finale_celebrate_label: 'Celebrate 🎉', finale_start_over_label: 'Start Over 💙',
  footer_text: '', background_audio_url: null,
};
const EMPTY_SONG = {
  id: 1, title: '', artist: '', source_type: 'none', source_url: '', personal_message: '',
};

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { settings: [{ ...EMPTY_SETTINGS }], song: [{ ...EMPTY_SONG }], memories: [] };
  }
}
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
let db = load();

const sessions = new Map(); // access_token -> email

function json(res, code, body, extra = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'access-control-expose-headers': '*',
    ...extra,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function bearer(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/** Mirrors the row level security rules: writes require an admin session. */
function isAdmin(req) {
  const token = bearer(req);
  if (!token) return false;
  const email = sessions.get(token);
  return Boolean(email) && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function userFor(req) {
  const token = bearer(req);
  const email = token ? sessions.get(token) : null;
  if (!email) return null;
  return {
    id: crypto.createHash('sha1').update(email).digest('hex').slice(0, 32),
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
}

function makeSession(email) {
  const access_token = 'mock-' + crypto.randomBytes(24).toString('hex');
  sessions.set(access_token, email);
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-' + crypto.randomBytes(12).toString('hex'),
    user: { ...userFor({ headers: { authorization: `Bearer ${access_token}` } }) },
  };
}

/* --------------------------------------------------------- query parsing --- */
// Supports the subset supabase-js sends: eq.<value>, order, select
function parseFilters(url) {
  const filters = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;
    const m = String(value).match(/^([a-z]+)\.(.*)$/);
    if (!m) continue;
    filters.push({ column: key, op: m[1], value: m[2] });
  }
  return filters;
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every((f) => {
      const cell = row[f.column];
      switch (f.op) {
        case 'eq':
          return String(cell) === f.value;
        case 'neq':
          return String(cell) !== f.value;
        case 'is':
          return f.value === 'null' ? cell === null || cell === undefined : String(cell) === f.value;
        case 'in':
          return f.value.replace(/[()]/g, '').split(',').includes(String(cell));
        default:
          return true;
      }
    }),
  );
}

function applyOrder(rows, url) {
  const specs = url.searchParams.getAll('order');
  if (!specs.length) return rows;
  const parsed = specs.flatMap((s) =>
    s.split(',').map((part) => {
      const [col, ...mods] = part.split('.');
      return { col, asc: !mods.includes('desc') };
    }),
  );
  return [...rows].sort((a, b) => {
    for (const { col, asc } of parsed) {
      const av = a[col];
      const bv = b[col];
      if (av === bv) continue;
      const cmp = av > bv ? 1 : -1;
      return asc ? cmp : -cmp;
    }
    return 0;
  });
}


/* supabase-js posts browser uploads as multipart/form-data. Real Supabase
   parses that for us; here we have to pull the file part out ourselves. */
function extractUploadBody(req, raw) {
  const ct = req.headers['content-type'] || '';
  const m = ct.match(/multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m) return raw;
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim());

  const parts = [];
  let pos = raw.indexOf(boundary);
  while (pos !== -1) {
    const start = pos + boundary.length;
    const next = raw.indexOf(boundary, start);
    if (next === -1) break;
    parts.push(raw.subarray(start, next));
    pos = next;
  }

  let best = null;
  for (const part of parts) {
    const sep = part.indexOf('\r\n\r\n');
    if (sep === -1) continue;
    const headers = part.subarray(0, sep).toString('latin1');
    let body = part.subarray(sep + 4);
    // strip the trailing CRLF that precedes the next boundary
    if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
      body = body.subarray(0, body.length - 2);
    }
    const isFile = /filename="/i.test(headers);
    if (isFile) return body;
    if (!best || body.length > best.length) best = body;
  }
  return best || raw;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = url.pathname;

  if (req.method === 'OPTIONS') return json(res, 204, {});

  /* ------------------------------------------------------------- health --- */
  if (p === '/health') return json(res, 200, { ok: true });

  /* --------------------------------------------------------------- auth --- */
  if (p === '/auth/v1/token') {
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    if (
      String(body.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      body.password === ADMIN_PASSWORD
    ) {
      return json(res, 200, makeSession(ADMIN_EMAIL));
    }
    // Any other account: valid login, but not an admin (mirrors real life).
    if (body.email && body.password === ADMIN_PASSWORD) {
      return json(res, 200, makeSession(String(body.email)));
    }
    return json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
  }

  if (p === '/auth/v1/user' && req.method === 'GET') {
    const user = userFor(req);
    if (!user) return json(res, 401, { message: 'invalid claim: missing sub claim' });
    return json(res, 200, user);
  }

  if (p === '/auth/v1/logout') {
    const token = bearer(req);
    if (token) sessions.delete(token);
    return json(res, 204, {});
  }

  /* ---------------------------------------------------------------- rpc --- */
  if (p === '/rest/v1/rpc/is_admin') {
    return json(res, 200, isAdmin(req));
  }

  /* ---------------------------------------------------------- rest tables -- */
  const tableMatch = p.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (tableMatch) {
    const table = tableMatch[1];
    if (!db[table]) return json(res, 404, { message: `relation "${table}" does not exist` });

    const single =
      (req.headers.accept || '').includes('application/vnd.pgrst.object') ||
      (req.headers.accept || '').includes('vnd.pgrst.object');

    if (req.method === 'GET') {
      let rows = applyFilters(db[table], parseFilters(url));
      rows = applyOrder(rows, url);
      if (single) return json(res, 200, rows[0] ?? null);
      return json(res, 200, rows);
    }

    if (!isAdmin(req)) {
      // Exactly what row level security returns to a non-admin.
      return json(res, 403, {
        code: '42501',
        message: `new row violates row-level security policy for table "${table}"`,
      });
    }

    const body = (await readBody(req)).toString();
    const payload = body ? JSON.parse(body) : {};

    if (req.method === 'POST') {
      const incoming = Array.isArray(payload) ? payload : [payload];
      const created = incoming.map((row) => {
        const base =
          table === 'memories'
            ? {
                id: crypto.randomUUID(),
                media_type: 'image',
                media_url: '',
                poster_url: null,
                storage_path: null,
                poster_path: null,
                alt_text: '',
                caption: '',
                location: '',
                memory_date: '',
                autoplay_muted: false,
                sort_order: 0,
                created_at: new Date().toISOString(),
              }
            : {};
        return { ...base, ...row };
      });
      db[table].push(...created);
      save(db);
      return json(res, 201, created);
    }

    if (req.method === 'PATCH') {
      const targets = applyFilters(db[table], parseFilters(url));
      targets.forEach((row) => Object.assign(row, payload));
      save(db);
      return json(res, 200, targets);
    }

    if (req.method === 'DELETE') {
      const targets = applyFilters(db[table], parseFilters(url));
      const ids = new Set(targets.map((t) => t.id));
      db[table] = db[table].filter((r) => !ids.has(r.id));
      save(db);
      return json(res, 200, targets);
    }
  }

  /* ------------------------------------------------------------- storage -- */
  const publicMatch = p.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicMatch && req.method === 'GET') {
    const file = path.join(FILES_DIR, publicMatch[1], publicMatch[2]);
    if (!file.startsWith(FILES_DIR) || !fs.existsSync(file)) {
      res.writeHead(404, { 'access-control-allow-origin': '*' });
      return res.end('not found');
    }
    const types = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
      '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4', '.wav': 'audio/wav',
    };
    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': body.length,
      'accept-ranges': 'bytes',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=31536000',
    });
    return res.end(body);
  }

  const objMatch = p.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
  if (objMatch && (req.method === 'POST' || req.method === 'PUT')) {
    if (!isAdmin(req)) return json(res, 403, { message: 'new row violates row-level security policy' });
    const [, bucket, key] = objMatch;
    const target = path.join(FILES_DIR, bucket, key);
    if (!target.startsWith(FILES_DIR)) return json(res, 400, { message: 'bad path' });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, extractUploadBody(req, await readBody(req)));
    return json(res, 200, { Key: `${bucket}/${key}` });
  }

  if (p.startsWith('/storage/v1/object/') && req.method === 'DELETE') {
    if (!isAdmin(req)) return json(res, 403, { message: 'row-level security' });
    const body = (await readBody(req)).toString();
    let prefixes = [];
    try {
      prefixes = JSON.parse(body).prefixes || [];
    } catch {
      /* ignore */
    }
    const bucket = p.split('/')[4] || 'media';
    prefixes.forEach((key) => {
      const target = path.join(FILES_DIR, bucket, key);
      if (target.startsWith(FILES_DIR) && fs.existsSync(target)) fs.unlinkSync(target);
    });
    return json(res, 200, prefixes.map((k) => ({ name: k })));
  }

  json(res, 404, { message: `mock supabase: no route for ${req.method} ${p}` });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock supabase listening on http://127.0.0.1:${PORT}`);
  console.log(`admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
