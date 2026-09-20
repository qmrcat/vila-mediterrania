/**
 * Passarel·la per al generador de mods des de fotografies.
 *
 * El navegador crida POST /api/ai i aquest fitxer reenvia la petició al
 * proveïdor afegint-hi la clau, que viu en una variable d'entorn i no arriba
 * mai a la pàgina.
 *
 * Posa la clau abans d'arrencar el joc:
 *
 *   Windows (PowerShell)   $env:ANTHROPIC_API_KEY="sk-ant-..."
 *                          node server.mjs
 *   macOS i Linux          ANTHROPIC_API_KEY="sk-ant-..." node server.mjs
 *
 * També s'accepta OPENAI_API_KEY. Si no n'hi ha cap, la passarel·la respon que
 * no està configurada i el taller ofereix el mode de clau al navegador.
 *
 * El servidor del joc només escolta a 127.0.0.1, de manera que això no obre res
 * cap enfora. Tot i així, aquest fitxer només deixa passar les dues adreces
 * conegudes i limita la mida del cos.
 */
const TARGETS = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    envVar: 'ANTHROPIC_API_KEY',
    headers: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
  },
  openai: {
    url: 'https://api.openai.com/v1/responses',
    envVar: 'OPENAI_API_KEY',
    headers: key => ({ Authorization: `Bearer ${key}` }),
  },
};

const MAX_BODY = 24 * 1024 * 1024;   // les fotografies ja venen reduïdes
const TIMEOUT = 240_000;

const send = (res, status, payload) => {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store' });
  res.end(body);
};

const fail = (res, status, message) => send(res, status, { error: { message } });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('La petició és massa gran. Fes servir menys fotografies.')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Quins proveïdors tenen clau ara mateix. No revela mai la clau. */
export const availableProviders = () =>
  Object.entries(TARGETS).filter(([, target]) => (process.env[target.envVar] ?? '').trim()).map(([id]) => id);

/**
 * Embolcalla el gestor de fitxers del joc. Si la petició no és per a la
 * passarel·la, la deixa passar tal com estava.
 */
export function withAiProxy(handler) {
  return async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname !== '/api/ai' && pathname !== '/api/ai/status') return handler(req, res);

    if (pathname === '/api/ai/status') {
      if (req.method !== 'GET') return fail(res, 405, 'Fes servir GET.');
      return send(res, 200, { providers: availableProviders() });
    }
    if (req.method !== 'POST') return fail(res, 405, 'Fes servir POST.');

    try {
      const raw = await readBody(req);
      let payload;
      try { payload = JSON.parse(raw.toString('utf8')); }
      catch { return fail(res, 400, 'El cos de la petició no és JSON.'); }

      const target = TARGETS[payload?.provider];
      if (!target) return fail(res, 400, 'Proveïdor desconegut.');
      if (!payload?.body || typeof payload.body !== 'object') return fail(res, 400, 'Falta el cos de la petició.');

      const key = (process.env[target.envVar] ?? '').trim();
      if (!key) return fail(res, 503,
        `No hi ha cap clau a ${target.envVar}. Posa-la abans d'arrencar el joc, o fes servir la clau del navegador al taller.`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      let upstream;
      try {
        upstream = await fetch(target.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...target.headers(key) },
          body: JSON.stringify(payload.body),
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        if (error.name === 'AbortError') return fail(res, 504, 'El proveïdor ha trigat massa a respondre.');
        return fail(res, 502, `No s'ha pogut arribar al proveïdor: ${error.message}`);
      }
      clearTimeout(timer);

      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Content-Length': body.length, 'Cache-Control': 'no-store',
      });
      res.end(body);
    } catch (error) {
      if (!res.headersSent) fail(res, 400, error.message);
    }
  };
}
