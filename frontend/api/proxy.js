/**
 * Single proxy for /api/projects/:path* (e.g. GET /api/projects/:id, GET /api/projects/:id/artists).
 * Vercel rewrites send these to /api/proxy and pass the path via query (e.g. path=uuid or path=uuid/artists).
 * This avoids relying on [[...path]] dynamic routes, which don't work in Vite projects on Vercel.
 */
const BACKEND = 'https://multicastqctool-production.up.railway.app';

export default async function handler(req, res) {
  const path = req.query.path;
  const pathStr = typeof path === 'string' ? path : Array.isArray(path) ? path.join('/') : '';
  if (!pathStr) {
    res.status(404).json({ detail: 'Not found' });
    return;
  }
  const url = `${BACKEND}/projects/${pathStr}`;
  const method = (req.method || 'GET').toUpperCase();
  const forwardHeaders = { Accept: 'application/json' };
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];
  let body;
  if (method !== 'GET' && method !== 'HEAD' && req.body != null) {
    body = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : req.body;
  }

  try {
    const resp = await fetch(url, { method, headers: forwardHeaders, body });
    const data = await resp.text();
    res.status(resp.status);
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
    if (resp.status === 404) res.setHeader('X-Backend-404', 'true');
    res.send(data);
  } catch (e) {
    res.status(502).json({ detail: 'Proxy error: ' + (e.message || String(e)) });
  }
}
