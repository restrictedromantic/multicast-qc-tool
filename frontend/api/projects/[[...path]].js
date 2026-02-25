const BACKEND = 'https://multicastqctool-production.up.railway.app';

export default async function handler(req, res) {
  const path = req.query.path || [];
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  if (!pathStr) {
    res.status(404).json({ detail: 'Not found' });
    return;
  }
  const url = `${BACKEND}/projects/${pathStr}`;
  const method = (req.method || 'GET').toUpperCase();

  try {
    const resp = await fetch(url, { method });
    const data = await resp.text();
    res.status(resp.status);
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (e) {
    res.status(502).json({ detail: 'Proxy error: ' + (e.message || String(e)) });
  }
}
