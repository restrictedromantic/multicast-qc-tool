const BACKEND = 'https://multicastqctool-production.up.railway.app';

async function proxy(req, res, method) {
  const url = `${BACKEND}/projects/`;
  const headers = {};
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers['accept']) headers['accept'] = req.headers['accept'];

  let body = undefined;
  if (method !== 'GET' && method !== 'HEAD' && req.body != null) {
    body = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? JSON.stringify(req.body) : req.body;
  }

  const resp = await fetch(url, { method, headers, body });
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
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET') {
    const listUrl = `${BACKEND}/projects`;
    try {
      const resp = await fetch(listUrl, { method: 'GET' });
      const data = await resp.text();
      res.status(resp.status);
      res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
      res.send(data);
    } catch (e) {
      res.status(502).json({ detail: 'Proxy error: ' + (e.message || String(e)) });
    }
    return;
  }
  if (method === 'POST') {
    try {
      await proxy(req, res, 'POST');
    } catch (e) {
      res.status(502).json({ detail: 'Proxy error: ' + (e.message || String(e)) });
    }
    return;
  }
  res.status(405).json({ detail: 'Method Not Allowed' });
}
