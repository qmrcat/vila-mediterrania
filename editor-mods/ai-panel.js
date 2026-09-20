// El panell «Genera des de fotografies». És l'única part d'aquesta funció que
// toca el DOM; la resta (contracte, proveïdors, orquestració) són fitxers purs.
//
// Es connecta al taller amb bindAi(), que rep del taller el que necessita en
// comptes d'anar-ho a buscar: així el panell no depèn de l'estat intern de
// l'editor i es pot treure sense deixar rastre.
import { PROVIDERS, DEFAULT_MODEL } from './ai-providers.js';
import { generateMod, shrinkImage, totalUsage, previewPrompt } from './ai-generate.js';
import { SIZES } from './format.js';

const KEY_STORE = 'vila-mediterrania-ai-key-1';
const PREF_STORE = 'vila-mediterrania-ai-prefs-1';
const MAX_PHOTOS = 4;

// Un nom per defecte per a cada foto, per ordre. La primera és la façana
// perquè és la cara que el joc dibuixa cap al sud.
const DEFAULT_LABELS = ['Façana principal', 'Lateral', 'Tres quarts', 'Detall'];

export function bindAi({ $, fillSelect, toast, onMod, renderMod, context }) {
  let photos = [];          // {media_type, data, preview, name}
  let proxyProviders = [];
  let running = null;       // AbortController mentre genera

  const prefs = (() => {
    try { return JSON.parse(localStorage.getItem(PREF_STORE)) ?? {}; } catch { return {}; }
  })();
  const savePrefs = () => {
    try { localStorage.setItem(PREF_STORE, JSON.stringify(prefs)); } catch { /* sense desar */ }
  };

  const provider = () => $('#ai-provider').value;
  const usesProxy = () => proxyProviders.includes(provider());

  // ——— muntatge ———
  fillSelect($('#ai-provider'), Object.entries(PROVIDERS).map(([id, item]) => [id, item.name]));
  fillSelect($('#ai-size'), SIZES.map(s => [s.size, `${s.label} cel·les`]));
  if (prefs.provider && PROVIDERS[prefs.provider]) $('#ai-provider').value = prefs.provider;
  if (prefs.size) $('#ai-size').value = String(prefs.size);
  if (prefs.rounds !== undefined) $('#ai-rounds').value = String(prefs.rounds);
  if (prefs.category) $('#ai-category').value = prefs.category;

  function refreshModels() {
    const id = provider();
    fillSelect($('#ai-model'), PROVIDERS[id].models);
    const wanted = prefs.models?.[id] ?? DEFAULT_MODEL[id];
    if ([...$('#ai-model').options].some(option => option.value === wanted)) $('#ai-model').value = wanted;
  }

  function refreshMode() {
    const id = provider();
    const proxy = usesProxy();
    $('#ai-key-field').hidden = proxy;
    $('#ai-key-warning').hidden = proxy;
    $('#ai-state').textContent = proxy
      ? `La clau de ${PROVIDERS[id].name} viu al servidor: no surt del teu ordinador.`
      : proxyProviders.length
        ? `El servidor té clau per a ${proxyProviders.map(p => PROVIDERS[p].name).join(' i ')}, però no per a ${PROVIDERS[id].name}. Posa-la aquí sota o canvia de proveïdor.`
        : `Sense clau al servidor. Posa ${PROVIDERS[id].envVar} abans d’arrencar el joc, o escriu-la aquí sota.`;
    if (!proxy) {
      try { $('#ai-key').value = localStorage.getItem(`${KEY_STORE}:${id}`) ?? ''; } catch { /* sense desar */ }
      $('#ai-key').placeholder = PROVIDERS[id].keyHint;
    }
  }

  /** Pregunta al servidor quines claus té. No en revela cap. */
  async function probeProxy() {
    try {
      const response = await fetch('/api/ai/status');
      if (!response.ok) throw new Error();
      proxyProviders = (await response.json()).providers ?? [];
    } catch { proxyProviders = []; }
    refreshMode();
  }

  // ——— fotografies ———
  function renderThumbs() {
    $('#ai-thumbs').replaceChildren(...photos.map((photo, index) => {
      const figure = document.createElement('figure');

      const shot = document.createElement('div');
      shot.className = 'shot';
      const image = document.createElement('img');
      image.src = photo.preview; image.alt = photo.label ?? `Fotografia ${index + 1}`;
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×';
      remove.className = 'drop-photo';
      remove.title = 'Treu aquesta fotografia';
      remove.addEventListener('click', () => { photos.splice(index, 1); renderThumbs(); });
      shot.append(image, remove);

      const said = document.createElement('label');
      said.className = 'said';
      const which = document.createElement('span');
      which.className = 'which';
      which.textContent = photo.label;
      const note = document.createElement('input');
      note.type = 'text'; note.maxLength = 200; note.value = photo.note ?? '';
      note.placeholder = index === 0
        ? 'Què s’hi ha de mirar? p. ex. «el campanar és a l’esquerra»'
        : 'Indicació per a aquesta foto (opcional)';
      note.addEventListener('input', () => { photo.note = note.value; });
      said.append(which, note);

      figure.append(shot, said);
      return figure;
    }));
    $('#ai-drop').hidden = photos.length >= MAX_PHOTOS;
  }

  async function addFiles(list) {
    const files = [...list].filter(file => file.type.startsWith('image/'));
    if (!files.length) { toast('Això no són imatges.'); return; }
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) toast(`Només en caben ${MAX_PHOTOS}: agafo les ${room} primeres.`);
    for (const file of files.slice(0, room)) {
      try {
        photos.push({
          ...await shrinkImage(file),
          name: file.name,
          label: DEFAULT_LABELS[photos.length] ?? `Fotografia ${photos.length + 1}`,
          note: '',
        });
      }
      catch { toast(`No s’ha pogut llegir ${file.name}.`); }
    }
    renderThumbs();
  }

  const drop = $('#ai-drop');
  drop.addEventListener('click', () => $('#ai-file').click());
  drop.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('#ai-file').click(); }
  });
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', event => {
    event.preventDefault(); drop.classList.remove('over');
    addFiles(event.dataTransfer.files);
  });
  $('#ai-file').addEventListener('change', event => { addFiles(event.target.files); event.target.value = ''; });

  // ——— preferències ———
  $('#ai-provider').addEventListener('change', () => {
    prefs.provider = provider(); savePrefs(); refreshModels(); refreshMode();
  });
  $('#ai-model').addEventListener('change', () => {
    prefs.models = { ...prefs.models, [provider()]: $('#ai-model').value }; savePrefs();
  });
  $('#ai-size').addEventListener('change', () => { prefs.size = Number($('#ai-size').value); savePrefs(); });
  $('#ai-rounds').addEventListener('change', () => { prefs.rounds = Number($('#ai-rounds').value); savePrefs(); });
  $('#ai-category').addEventListener('change', () => { prefs.category = $('#ai-category').value; savePrefs(); });
  $('#ai-key').addEventListener('change', event => {
    const value = event.target.value.trim();
    try {
      if (value) localStorage.setItem(`${KEY_STORE}:${provider()}`, value);
      else localStorage.removeItem(`${KEY_STORE}:${provider()}`);
    } catch { toast('El navegador no ha pogut desar la clau.'); }
  });

  // ——— què s'enviarà ———

  /** Les dades de la petició, tal com les rebrà el generador. */
  const request = () => ({
    photos: photos.map(({ media_type, data, label, note }) => ({ media_type, data, label, note })),
    brief: $('#ai-brief').value,
    sizes: [Number($('#ai-size').value)],
    category: $('#ai-category').value,
    ...context(),
  });

  $('#ai-preview').addEventListener('click', () => {
    if (!photos.length) { toast('Afegeix almenys una fotografia.'); return; }
    const { text, system } = previewPrompt(request());
    $('#ai-dialog-text').textContent = text;
    $('#ai-dialog-note').textContent =
      `Les regles del joc ocupen ${Math.round(system.length / 1000)} k caràcters i es generen a partir de `
      + `constants.js i format.js: no les has de mantenir tu. Les fotografies van amb el seu nom i la `
      + `indicació que hi hagis escrit. En les rondes de correcció s'hi afegeixen les vistes del teu model.`;
    $('#ai-dialog').showModal();
  });

  $('#ai-dialog-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#ai-dialog-text').textContent); toast('Copiat al porta-retalls.'); }
    catch { toast('El navegador no ha deixat copiar. Selecciona el text a mà.'); }
  });

  $('#ai-dialog-download').addEventListener('click', () => {
    const blob = new Blob([$('#ai-dialog-text').textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'prompt-vila.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // ——— generació ———
  function busy(state, message = '') {
    $('#ai-run').disabled = state;
    $('#ai-cancel').hidden = !state;
    $('#ai-progress').textContent = message;
    $('#ai-progress').classList.toggle('busy', state);
  }

  $('#ai-cancel').addEventListener('click', () => running?.abort());

  $('#ai-run').addEventListener('click', async () => {
    if (!photos.length) { toast('Afegeix almenys una fotografia.'); return; }
    const mode = usesProxy() ? 'proxy' : 'direct';
    const apiKey = mode === 'direct' ? $('#ai-key').value.trim() : null;
    if (mode === 'direct' && !apiKey) { toast('Escriu la clau de l’API o configura-la al servidor.'); return; }

    running = new AbortController();
    busy(true, 'Preparant…');
    const started = Date.now();
    try {
      const { mod, notes, usage } = await generateMod({
        ...request(),
        provider: provider(), model: $('#ai-model').value,
        apiKey, mode,
        rounds: Number($('#ai-rounds').value),
        render: renderMod,
        signal: running.signal,
        onStep: message => busy(true, message),
      });

      onMod(mod);
      const seconds = Math.round((Date.now() - started) / 1000);
      const cost = totalUsage(usage);
      const errors = notes.filter(note => note.level === 'error').length;
      busy(false, `${mod.parts.length} peces en ${seconds} s · ${cost.calls} crides`
        + (cost.input ? ` · ${(cost.input / 1000).toFixed(1)}k dins, ${(cost.output / 1000).toFixed(1)}k fora` : ''));
      toast(errors
        ? `Generat, però amb ${errors} avís${errors === 1 ? '' : 'os'} a resoldre.`
        : `«${mod.name}» generat amb ${mod.parts.length} peces.`);
    } catch (error) {
      busy(false, '');
      if (error.name === 'AbortError') toast('Generació aturada.');
      else toast(error.message);
    } finally { running = null; }
  });

  refreshModels();
  probeProxy();
  renderThumbs();
}
