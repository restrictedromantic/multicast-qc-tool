const BACKEND = 'https://multicastqctool-production.up.railway.app';

export default async function handler(req, res) {
  const path = req.query.path || [];
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const url = `${BACKEND}/${pathStr}`;
  const forwardHeaders = { ...req.headers };
  delete forwardHeaders.host;
  delete forwardHeaders.connection;

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
    body = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : req.body;
  }

  try {
    const resp = await fetch(url, {
      method: req.method,
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
