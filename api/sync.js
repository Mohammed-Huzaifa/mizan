// Mizan cloud sync: one JSON document in Upstash Redis (Vercel Marketplace, free tier).
// The first passcode that saves data becomes the only passcode that can read or write it.
// Keys are prefixed "mizan:" so the same Upstash database can be shared with other apps.
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  const r = await fetch(URL_, {method: 'POST', headers: {Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json'}, body: JSON.stringify(cmd)});
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const hash = k => crypto.createHash('sha256').update('mizan:' + k).digest('hex');
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const wait = ms => new Promise(r => setTimeout(r, ms));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({error: 'storage-not-connected'});
  const key = String(req.headers['x-mizan-key'] || '');
  if (key.length < 6) return res.status(400).json({error: 'passcode-too-short'});

  try {
    const auth = await redis('GET', 'mizan:auth');
    if (auth && !same(auth, hash(key))) { await wait(1000); return res.status(401).json({error: 'wrong-passcode'}); }

    if (req.method === 'GET') {
      const raw = auth && await redis('GET', 'mizan:data');
      return raw ? res.status(200).json(JSON.parse(raw)) : res.status(404).json({error: 'empty'});
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !body.data || !Array.isArray(body.data.habits) || typeof body.data.log !== 'object') return res.status(400).json({error: 'bad-data'});
      const raw = await redis('GET', 'mizan:data');
      const cur = raw ? JSON.parse(raw) : {rev: 0};
      if ((body.base || 0) !== cur.rev) return res.status(409).json(cur);   // another device saved first
      if (!auth) await redis('SET', 'mizan:auth', hash(key), 'NX');
      const next = {rev: cur.rev + 1, data: body.data, savedAt: Date.now()};
      if (raw) await redis('SET', 'mizan:data:prev', raw);                 // one-step safety copy
      await redis('SET', 'mizan:data', JSON.stringify(next));
      return res.status(200).json({rev: next.rev});
    }

    if (req.method === 'DELETE') {
      if (auth) { const raw = await redis('GET', 'mizan:data'); if (raw) await redis('SET', 'mizan:data:prev', raw); await redis('DEL', 'mizan:data'); }
      return res.status(200).json({ok: true});
    }

    return res.status(405).json({error: 'method'});
  } catch (e) {
    return res.status(502).json({error: 'storage-error'});
  }
};
