// Adaptadors dels dos proveïdors. Tots dos accepten dues maneres de funcionar:
//
//   passarel·la  la clau viu al servidor, en una variable d'entorn, i el
//                navegador crida /api/ai. La clau no arriba mai a la pàgina.
//   directa      la clau viu al localStorage d'aquest navegador i la crida va
//                directament al proveïdor. Còmode, però qualsevol que obri les
//                eines de desenvolupament d'aquesta pàgina la pot llegir.
//
// Fitxer sense DOM: només construeix peticions i llegeix respostes.

export const PROVIDERS = {
  claude: {
    name: 'Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      ['claude-opus-5', 'Opus 5 · el que mira millor'],
      ['claude-sonnet-5', 'Sonnet 5 · més ràpid i barat'],
    ],
    keyHint: 'Comença per sk-ant-',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    envVar: 'ANTHROPIC_API_KEY',
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/responses',
    models: [
      ['gpt-6-astra', 'GPT-6 Astra · el que mira millor'],
      ['gpt-5.6-sol', 'GPT-5.6 Sol · equilibrat'],
      ['gpt-5.6-terra', 'GPT-5.6 Terra · més barat'],
    ],
    keyHint: 'Comença per sk-',
    keyUrl: 'https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
  },
};

export const DEFAULT_MODEL = { claude: 'claude-opus-5', openai: 'gpt-6-astra' };

/**
 * Un torn de conversa, en el format neutre del taller:
 *   {role:'user'|'assistant', text:string, images:[{media_type, data, label, note}]}
 * Les imatges són base64 sense el prefix data:.
 *
 * label i note són opcionals. Quan n'hi ha, s'emet un bloc de text just ABANS
 * de la imatge: sense això el model rep cinc imatges seguides sense saber quina
 * és quina, i les indicacions que hagis escrit per a una foto concreta es
 * perdrien entre les altres.
 */
export const imageCaption = image => [image.label, image.note?.trim()].filter(Boolean).join(' — ');

function claudeBody(model, system, turns, maxTokens) {
  return {
    model, max_tokens: maxTokens, system,
    messages: turns.map(turn => ({
      role: turn.role,
      content: [
        ...(turn.images ?? []).flatMap(image => {
          const caption = imageCaption(image);
          return [
            ...(caption ? [{ type: 'text', text: caption }] : []),
            { type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } },
          ];
        }),
        { type: 'text', text: turn.text },
      ],
    })),
  };
}

function openaiBody(model, system, turns, maxTokens) {
  return {
    model, max_output_tokens: maxTokens, instructions: system,
    input: turns.map(turn => ({
      role: turn.role,
      content: [
        ...(turn.images ?? []).flatMap(image => {
          const caption = imageCaption(image);
          return [
            ...(caption ? [{ type: 'input_text', text: caption }] : []),
            { type: 'input_image', image_url: `data:${image.media_type};base64,${image.data}` },
          ];
        }),
        { type: turn.role === 'assistant' ? 'output_text' : 'input_text', text: turn.text },
      ],
    })),
  };
}

const claudeText = data => (data?.content ?? [])
  .filter(block => block.type === 'text').map(block => block.text).join('');

const openaiText = data => {
  if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
  return (data?.output ?? [])
    .flatMap(item => item.content ?? [])
    .filter(block => block.type === 'output_text')
    .map(block => block.text).join('');
};

/** Missatge d'error llegible a partir del cos que torna el proveïdor. */
function describeError(status, data, raw) {
  const message = data?.error?.message ?? data?.message ?? raw?.slice(0, 300) ?? '';
  if (status === 401) return 'La clau no és vàlida o ha caducat.';
  if (status === 403) return `El proveïdor ha refusat la petició. ${message}`;
  if (status === 429) return 'Has arribat al límit de peticions. Espera un moment i torna-ho a provar.';
  if (status === 400 && /model/i.test(message)) return `El model no existeix o el teu compte no hi té accés. ${message}`;
  if (status >= 500) return `El proveïdor té un problema (${status}). Torna-ho a provar d'aquí una estona.`;
  return message || `Error ${status}.`;
}

/**
 * Fa la crida i torna el text de la resposta.
 * mode: 'proxy' (per defecte) o 'direct'.
 */
export async function callModel({
  provider, model, system, turns, apiKey = null, mode = 'proxy',
  maxTokens = 16000, signal = null,
}) {
  const definition = PROVIDERS[provider];
  if (!definition) throw new Error(`Proveïdor desconegut: ${provider}`);
  const body = provider === 'claude'
    ? claudeBody(model, system, turns, maxTokens)
    : openaiBody(model, system, turns, maxTokens);

  let response;
  if (mode === 'direct') {
    if (!apiKey) throw new Error('Falta la clau de l’API.');
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'claude') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      // Sense això, el navegador no deixa cridar l'API des d'una pàgina.
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    response = await fetch(definition.endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal });
  } else {
    response = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, body }), signal,
    });
  }

  const raw = await response.text();
  let data = null;
  try { data = JSON.parse(raw); } catch { /* el cos no era JSON */ }
  if (!response.ok) {
    if (mode === 'proxy' && response.status === 404)
      throw new Error('La passarel·la no respon. Comprova que el joc corre amb «node server.mjs» i que hi tens ai-proxy.mjs.');
    if (mode === 'proxy' && response.status === 503)
      throw new Error(data?.error?.message ?? 'La passarel·la no té cap clau configurada.');
    throw new Error(describeError(response.status, data, raw));
  }
  const text = provider === 'claude' ? claudeText(data) : openaiText(data);
  if (!text.trim()) throw new Error('El model ha tornat una resposta buida.');
  return {
    text,
    usage: data?.usage ?? null,
    stopped: data?.stop_reason === 'max_tokens' || data?.incomplete_details?.reason === 'max_output_tokens',
  };
}

/** Extreu l'objecte JSON d'una resposta, encara que vingui amb text al voltant. */
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start < 0) throw new Error('La resposta no conté cap objecte JSON.');
  // Busca la clau que tanca comptant claus, saltant-se les que van dins d'un text.
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const char = candidate[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      try { return JSON.parse(candidate.slice(start, i + 1)); }
      catch (error) { throw new Error(`El JSON de la resposta està malmès: ${error.message}`); }
    }
  }
  throw new Error('El JSON de la resposta s’ha tallat abans d’acabar. Prova amb menys peces o un model amb més sortida.');
}
