const BACKEND = 'https://multicastqctool-production.up.railway.app';

export default async function handler(req, res) {
  const path = req.query.path || [];
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const method = (req.method || 'GET').toUpperCase();
  // Only POST /projects needs trailing slash (FastAPI create). Others (e.g. /scripts/:id/upload) must not get it or redirect drops body.
  const needsTrailingSlash = method === 'POST' && pathStr === 'projects';
  const url = `${BACKEND}/${pathStr}${needsTrailingSlash ? '/' : ''}`;

  const forwardHeaders = {};
  if (req.headers['content-type']) forwardHeaders['content-type'] = req.headers['content-type'];
  if (req.headers['accept']) forwardHeaders['accept'] = req.headers['accept'];

  let body = undefined;
  if (method !== 'GET' && method !== 'HEAD' && req.body != null) {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    // Keep multipart/form-data raw so file uploads work
    if (ct.includes('multipart/form-data')) {
      body = req.body;
    } else {
      body = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : req.body;
    }
  }

  try {
    const resp = await fetch(url, {
      method,
      headers: forwardHeaders,
      body,
    });
    const data = await resp.text();
    res.status(resp.status);
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        res.json(JSON.parse(data));
      } catch {
        res.setHeader('Content-Type', 'text/plain').send(data);
      }
    } else {
      res.setHeader('Content-Type', ct || 'text/plain').send(data);
    }
  } catch (e) {
    res.status(502).json({ detail: 'Proxy error: ' + (e.message || String(e)) });
  }
}
