// L'orquestració: fotografies → JSON → validació → correcció visual.
//
// La part que de debò apuja la qualitat és el cicle: es renderitza l'esbós amb
// el mateix motor del joc, se li tornen les vistes al model al costat de les
// fotografies, i se li demana que ho compari i ho corregeixi.
//
// Res del que torna el model s'executa mai: passa per validateMod(), que és la
// mateixa frontera de seguretat que fa servir la importació de fitxers.
import { callModel, extractJson, imageCaption } from './ai-providers.js';
import { systemPrompt, workedExample, taskPrompt, fixPrompt } from './ai-contract.js';
import { validateMod, reviewMod, setExtraShapes, newMod } from './format.js';

/** Redueix una imatge perquè no engegui una petició de diversos megabytes. */
export async function shrinkImage(file, maxSide = 1024, quality = .82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const url = canvas.toDataURL('image/jpeg', quality);
  return { media_type: 'image/jpeg', data: url.slice(url.indexOf(',') + 1), width, height, preview: url };
}

export const dataUrlToImage = (url, label) => ({
  media_type: url.slice(5, url.indexOf(';')),
  data: url.slice(url.indexOf(',') + 1),
  ...(label ? { label } : {}),
});

const VIEW_LABELS = ['El teu model des del sud (la façana)', 'El teu model des de l’est', 'El teu model des de dalt'];

/** Posa nom a cada fotografia, respectant la indicació que hi hagis escrit. */
const labelPhotos = photos => photos.map((photo, index) => ({
  ...photo,
  label: photo.label ?? `Fotografia ${index + 1}`,
}));

/**
 * Munta els torns de la primera crida. Està separat de generateMod() perquè el
 * panell pugui ensenyar exactament això abans de gastar cap crida.
 */
export function buildTurns({ photos, brief, sizes, category, id, name, example = null }) {
  const turns = [];
  if (example) {
    turns.push({ role: 'user', text: 'Ensenya’m un exemple del format que esperes.' });
    turns.push({ role: 'assistant', text: workedExample(example) });
  }
  turns.push({
    role: 'user',
    text: taskPrompt({ brief, sizes, category, id, name }),
    images: labelPhotos(photos),
  });
  return turns;
}

/** El mateix que s'enviarà, en text pla, per ensenyar-ho o copiar-ho. */
export function previewPrompt(options) {
  const system = systemPrompt({ personalShapes: options.personalShapes ?? [] });
  const turns = buildTurns(options);
  // L'exemple treballat és fix i molt llarg; el marquem perquè es vegi d'un cop
  // d'ull què és contingut teu i què no.
  const exampleTurns = options.example ? 2 : 0;
  const blocks = turns.map((turn, index) => {
    const images = (turn.images ?? []).map(image =>
      `    [imatge · ${Math.round(image.data.length * 3 / 4 / 1024)} kB] ${imageCaption(image) || 'sense indicació'}`);
    const who = turn.role === 'user' ? 'Jo' : 'El model';
    const tag = index < exampleTurns ? ' · exemple fix, sempre el mateix' : '';
    return `### ${who}${tag}\n`
      + (images.length ? images.join('\n') + '\n\n' : '')
      + turn.text;
  });
  const text = `## Regles del joc · system prompt\n`
    + `## Es genera a partir de constants.js i format.js; no el mantens tu.\n\n${system}\n\n`
    + `## La conversa\n\n${blocks.join('\n\n')}\n\n`
    + `## I després\n\n`
    + `Amb les correccions activades, el taller hi afegeix el teu JSON i una crida\n`
    + `nova amb les fotografies i tres vistes del model renderitzat, cadascuna amb\n`
    + `el seu nom.`;
  return { system, turns, text };
}

/**
 * Genera un mod a partir de fotografies.
 *
 * options.render(mod) ha de tornar {images:[dataUrl], bounds} — el taller li
 * passa el seu propi renderitzador, de manera que aquest fitxer no depèn de
 * Three.js ni sap res de la vista 3D.
 */
export async function generateMod({
  photos, brief, sizes, category, id, name,
  provider, model, apiKey, mode,
  rounds = 2, personalShapes = [], takenIds = [], example = null,
  render = null, onStep = () => {}, signal = null,
}) {
  if (!photos.length) throw new Error('Afegeix almenys una fotografia.');
  setExtraShapes(personalShapes);

  const system = systemPrompt({ personalShapes });
  const turns = buildTurns({ photos, brief, sizes, category, id, name, example });
  const labelled = labelPhotos(photos);

  let mod = null, notes = [], bounds = null, usage = [];

  for (let round = 0; round <= rounds; round++) {
    onStep(round === 0
      ? `Demanant el model a ${provider === 'claude' ? 'Claude' : 'OpenAI'}…`
      : `Corregint · ronda ${round} de ${rounds}…`);

    const answer = await callModel({ provider, model, system, turns, apiKey, mode, signal });
    if (answer.usage) usage.push(answer.usage);
    if (answer.stopped) throw new Error('La resposta s’ha tallat per llargada. Demana un edifici més senzill.');

    let candidate;
    try {
      candidate = validateMod({ ...newMod(), ...extractJson(answer.text) });
    } catch (error) {
      // Un JSON invàlid no acaba la feina: se li diu què falla i es reintenta.
      if (round === rounds) throw new Error(`El model no ha tornat un mod vàlid: ${error.message}`);
      turns.push({ role: 'assistant', text: answer.text.slice(0, 4000) });
      turns.push({ role: 'user', text: `Això no s'ha pogut llegir: ${error.message}\nTorna només el JSON, complet i ben format.` });
      continue;
    }
    mod = candidate;

    onStep('Comprovant el model…');
    const drawn = render ? await render(mod) : { images: [], bounds: null };
    bounds = drawn.bounds;
    notes = reviewMod(mod, bounds, takenIds, []);
    const problems = notes.filter(note => note.level === 'error');

    // L'última ronda ja no corregeix, i sense problemes ni vistes no hi ha res
    // a corregir tampoc.
    if (round === rounds) break;
    if (!problems.length && !drawn.images.length) break;

    onStep('Ensenyant-li com ha quedat…');
    turns.push({ role: 'assistant', text: JSON.stringify(mod) });
    turns.push({
      role: 'user',
      text: fixPrompt({ notes, bounds, mod }),
      images: [...labelled, ...drawn.images.map((url, index) => dataUrlToImage(url, VIEW_LABELS[index]))],
    });
  }

  return { mod, notes, bounds, usage };
}

/** Suma els comptadors de les crides, per ensenyar el cost al final. */
export function totalUsage(list) {
  let input = 0, output = 0;
  for (const item of list) {
    input += item.input_tokens ?? item.prompt_tokens ?? item.input_tokens_details?.text_tokens ?? 0;
    output += item.output_tokens ?? item.completion_tokens ?? 0;
  }
  return { input, output, calls: list.length };
}
