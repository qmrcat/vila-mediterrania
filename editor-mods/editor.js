import { loadShapes, missingShapes, loadPersonalShapes, applyDrafts, personalShapes, shapeBounds } from './shapes.js';
import { SHAPES, SHAPE_HINTS, SHAPE_NAMES, UNIT } from './constants.js';
import {
  TEMPLATES, defaultParams, validateDraft, loadDrafts, saveDrafts,
  geometriesFile, starterDrafts, SHAPE_ID_PATTERN,
} from './personal-shapes.js';
import {
  newMod, newPart, validateMod, reviewMod, footprint, smallestPlot, SIZES,
  loadCollection, saveCollection, uniqueId, num, REQUIRES_MOD_API, setExtraShapes,
  MATERIAL_DEFAULTS, hasMaterial,
} from './format.js';
import { createViewport } from './viewport.js';

// Quan una peça nova neix a sobre d'una altra, no la veus. Per això les peces
// noves es deixen en una zona d'espera a l'est de la parcel·la, on es veuen
// soles i des d'on les portes a lloc amb les fletxes.
const STAGE_GAP = .25;
import { moduleCode, modJson, registerSnippets, runtimeSnippets, moduleFile, download } from './exporters.js';
import { starterMods } from './starters.js';
import { bindAi } from './ai-panel.js';
import {
  loadLibrary, saveLibrary, validateBlock, blockId, uniqueBlockName,
  normalizeParts, rotateParts, spinParts, partSpan, starterBlocks,
} from './library.js';

const $ = selector => document.querySelector(selector);
const deg = radians => Math.round(radians * 180 / Math.PI * 10) / 10;
const rad = degrees => num(degrees) * Math.PI / 180;

const BASE_PALETTE = ['#f2eee3', '#d4cab3', '#cbbd9d', '#b6aa91', '#b87850', '#a2553d',
  '#72563b', '#567043', '#4f6b3f', '#45636a', '#1c565b', '#d7b867'];

let mods = [], mod = null, selected = null, dirty = false, bounds = null, takenIds = [];
let picked = new Set(), blocks = [], drafts = [];
const undoStack = [];
let viewport = null;

// L'arrencada es crida al final del fitxer: així totes les declaracions
// lèxiques d'aquest mòdul ja estan inicialitzades quan es dibuixa la primera
// vegada.
async function start() {
  await loadShapes();
  if (missingShapes.length) console.warn('Formes no trobades als mòduls del joc:', missingShapes.join(', '));
  const registry = await loadPersonalShapes();
  drafts = loadDrafts(localStorage);
  if (!drafts.length) drafts = starterDrafts();
  refreshShapes();

  mods = loadCollection(localStorage);
  if (!mods.length) mods = starterMods();
  // El taller torna on eres: obre l'últim mod que hi havia obert, i el primer
  // de la col·lecció només si aquell ja no hi és.
  mod = structuredClone(mods.find(m => m.id === lastModId()) ?? mods[0]);
  blocks = loadLibrary(localStorage);
  if (!blocks.length) blocks = starterBlocks();

  buildSizeChecks();
  fillSelect($('#shape-template'), Object.entries(TEMPLATES).map(([id, item]) => [id, item.name]));
  $('#shapes-state').textContent = registry.ok
    ? `El joc té ${registry.count} forma${registry.count === 1 ? '' : 'es'} personal${registry.count === 1 ? '' : 's'} registrada${registry.count === 1 ? '' : 'es'}.`
    : `No s’ha pogut llegir el registre de formes: ${registry.message}`;
  viewport = createViewport($('#canvas'), {
    onPick: (index, mode, alone) => select(index, mode, alone),
    onDrag: (phase, payload, alone, vertical) => drag(phase, payload, alone, vertical),
    onResize: (phase, payload) => stretch(phase, payload),
  });

  bindMeta();
  bindParts();
  bindInspector();
  bindRepeat();
  bindAlign();
  bindResize();
  bindOutput();
  bindViews();
  bindKeys();
  bindLibrary();
  bindShapes();
  bindFolds();
  bindAi(aiBridge());
  refreshCollection();
  renderLibrary();
  renderShapes();
  render();
  viewport.frame(mod);
  probeGame();
}

// ——— utilitats ———
function fillSelect(element, pairs) {
  element.replaceChildren(...pairs.map(([value, label]) => {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; return option;
  }));
}

function buildSizeChecks() {
  $('#mod-sizes').replaceChildren(...SIZES.map(({ size, label }) => {
    const wrap = document.createElement('label');
    wrap.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = String(size);
    input.addEventListener('change', () => {
      const chosen = [...$('#mod-sizes').querySelectorAll('input:checked')].map(i => Number(i.value));
      if (!chosen.length) { input.checked = true; toast('Un mod ha de declarar almenys una mida.'); return; }
      change(() => {
        mod.sizes = chosen.sort((a, b) => a - b);
        if (!mod.sizes.includes(mod.previewSize)) mod.previewSize = mod.sizes[0];
      });
    });
    wrap.append(input, document.createTextNode(` ${label}`));
    return wrap;
  }));
}

/** Llegeix el joc de la carpeta de sobre per avisar d'identificadors ocupats. */
async function probeGame() {
  const badge = $('#api-note');
  try {
    const [{ LANDMARK_TYPES, TREE_SPECIES }, content, version] = await Promise.all([
      import('../model.js'),
      import('../personal-content.js'),
      fetch('../version.json').then(r => r.json()).catch(() => null),
    ]);
    takenIds = [...Object.keys(LANDMARK_TYPES), ...TREE_SPECIES.map(t => t.id)];
    const api = content.MOD_API_VERSION;
    badge.textContent = `API de mods ${api}${version ? ` · joc v${version.version}` : ''}`;
    badge.className = api === REQUIRES_MOD_API ? 'api ok' : 'api bad';
    if (api !== REQUIRES_MOD_API) toast(`Aquest taller escriu per a l'API ${REQUIRES_MOD_API} i el joc ofereix la ${api}.`);
    renderNotes();
  } catch {
    badge.textContent = 'joc no detectat';
    badge.className = 'api bad';
  }
}

// ——— on estàvem ———
const LAST_MOD_KEY = 'vila-mediterrania-last-mod-1';

const lastModId = () => {
  try { return localStorage.getItem(LAST_MOD_KEY) ?? ''; }
  catch { return ''; }
};

/** Amb una cadena buida, el pròxim cop s'obrirà el primer de la col·lecció. */
const rememberMod = id => {
  try { localStorage.setItem(LAST_MOD_KEY, id ?? ''); }
  catch { /* sense recordar-ho: no és res greu */ }
};

let toastTimer = 0;
function toast(message) {
  const element = $('#toast');
  element.textContent = message; element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 2600);
}

function change(mutate) {
  undoStack.push(JSON.stringify(mod));
  if (undoStack.length > 80) undoStack.shift();
  mutate();
  dirty = true;
  render();
}

const pickedList = () => [...picked].filter(index => index < mod.parts.length).sort((a, b) => a - b);

function setPicked(indices) {
  picked = new Set(indices);
  selected = indices.length ? indices[0] : null;
}

/** Les peces del mateix grup que index (o només ella si no en té). */
function groupOf(index) {
  const group = mod.parts[index]?.group;
  if (!group) return [index];
  return mod.parts.flatMap((part, i) => (part.group === group ? [i] : []));
}

/** Amb alone (Alt+clic) es tria la peça sola encara que sigui d'un grup. */
function select(index, mode = 'single', alone = false) {
  if (index === null || index === undefined) { setPicked([]); render(); return; }
  const members = alone ? [index] : groupOf(index);
  if (mode === 'toggle') {
    if (picked.has(index) && picked.size > members.length) {
      for (const i of members) picked.delete(i);
      if (!picked.has(selected)) selected = pickedList()[0] ?? null;
    } else { for (const i of members) picked.add(i); selected = index; }
  } else if (mode === 'range' && selected !== null) {
    const [from, to] = selected < index ? [selected, index] : [index, selected];
    for (let i = from; i <= to; i++) for (const k of alone ? [i] : groupOf(i)) picked.add(k);
    selected = index;
  } else { setPicked(members); selected = index; }
  render();
}

function nextGroupId() {
  const used = mod.parts.map(part => Number(String(part.group ?? '').slice(1)) || 0);
  return `g${Math.max(0, ...used) + 1}`;
}

/** Un grup d'una sola peça ja no és un grup. */
function pruneGroups() {
  const sizes = new Map();
  for (const part of mod.parts) if (part.group) sizes.set(part.group, (sizes.get(part.group) ?? 0) + 1);
  for (const part of mod.parts) if (part.group && sizes.get(part.group) < 2) delete part.group;
}

const current = () => (selected === null ? null : mod.parts[selected]);

// ——— dibuix de la interfície ———
function render() {
  const options = {
    heights: $('#show-heights').checked,
    neighbours: $('#show-neighbours').checked,
    axes: $('#show-axes').checked,
    handles: $('#show-handles').checked,
  };
  picked = new Set(pickedList());
  if (selected === null || selected >= mod.parts.length || !picked.has(selected)) selected = pickedList()[0] ?? null;
  bounds = viewport.update(mod, pickedList(), options);
  if (mod.autoHeight) mod.height = bounds ? Math.max(Math.round(bounds.maxH * 100) / 100, .1) : 1;

  if (document.activeElement !== $('#mod-name')) $('#mod-name').value = mod.name;
  if (document.activeElement !== $('#mod-id')) $('#mod-id').value = mod.id;
  $('#mod-category').value = mod.category;
  for (const input of $('#mod-sizes').querySelectorAll('input')) input.checked = mod.sizes.includes(Number(input.value));
  fillSelect($('#mod-preview-size'), mod.sizes.map(size => [size, `${footprint(size).label} cel·les`]));
  $('#mod-preview-size').value = String(mod.previewSize);
  if (document.activeElement !== $('#mod-height')) $('#mod-height').value = mod.height.toFixed(2);
  $('#mod-height').disabled = mod.autoHeight;
  $('#mod-auto-height').checked = mod.autoHeight;
  if (document.activeElement !== $('#mod-help')) $('#mod-help').value = mod.help;
  $('#collection').value = mods.some(m => m.id === mod.id) ? mod.id : '';

  renderParts();
  renderResize();
  renderInspector();
  renderReadout();
  renderNotes();
  renderOutput();
  document.title = `${mod.name}${dirty ? ' •' : ''} · Taller de mods`;
}

function renderParts() {
  $('#part-count').textContent = mod.parts.length ? `${mod.parts.length} peces` : '';
  const list = $('#parts');
  list.replaceChildren(...mod.parts.map((part, index) => {
    const item = document.createElement('li');
    item.setAttribute('aria-selected', String(picked.has(index)));
    if (index === selected) item.classList.add('primary');
    item.tabIndex = 0;
    const swatch = document.createElement('span');
    swatch.className = 'swatch'; swatch.style.background = part.color;
    const shape = document.createElement('span');
    shape.className = 'shape';
    shape.textContent = part.name || part.shape;
    if (part.name) { shape.title = part.shape; shape.classList.add('named'); }
    const where = document.createElement('span');
    where.className = 'where';
    where.textContent = `${part.u.toFixed(2)} ${part.h.toFixed(2)} ${part.v.toFixed(2)}`;
    const eye = document.createElement('button');
    eye.type = 'button'; eye.className = 'eye';
    eye.textContent = part.hidden ? '◌' : '●';
    eye.title = part.hidden ? 'Torna-la a mostrar' : 'Amaga-la de la vista';
    eye.setAttribute('aria-label', eye.title);
    eye.addEventListener('click', event => {
      event.stopPropagation();
      change(() => { mod.parts[index].hidden = part.hidden ? undefined : true; });
    });
    item.classList.toggle('hidden-part', !!part.hidden);
    item.append(swatch, shape);
    if (part.group) {
      const tag = document.createElement('span');
      tag.className = 'group'; tag.textContent = part.group.toUpperCase();
      tag.title = `Grup ${part.group.slice(1)} · Alt+clic tria només aquesta peça`;
      item.append(tag);
    }
    item.append(where, eye);
    const how = event => (event.ctrlKey || event.metaKey ? 'toggle' : event.shiftKey ? 'range' : 'single');
    item.addEventListener('click', event => select(index, how(event), event.altKey));
    item.addEventListener('keydown', event => { if (event.key === 'Enter') select(index, how(event), event.altKey); });
    return item;
  }));
  const chosen = list.children[selected];
  if (chosen) chosen.scrollIntoView({ block: 'nearest' });
  for (const id of ['#duplicate-part', '#mirror-part', '#rotate-part', '#ground-part', '#hide-part', '#up-part', '#down-part', '#delete-part'])
    $(id).disabled = !picked.size;
  $('#select-all').disabled = !mod.parts.length;
  $('#group-part').disabled = picked.size < 2;
  $('#ungroup-part').disabled = !pickedList().some(index => mod.parts[index].group);
  const buried = hiddenCount();
  $('#show-all').disabled = !buried;
  $('#show-all').textContent = buried ? `Mostra-les totes (${buried})` : 'Mostra-les totes';
  if (picked.size) {
    const list = pickedList();
    $('#hide-part').textContent = list.every(index => mod.parts[index].hidden) ? 'Mostra' : 'Amaga';
  }
  const spreadable = picked.size > 1 ? pickedBlocks().length : 0;
  $('#align').hidden = spreadable < 2;
  for (const button of $('#align').querySelectorAll('button[data-align$=":spread"]')) button.disabled = spreadable < 3;
  $('#repeat').hidden = picked.size !== 1;
  $('#block-save').disabled = !mod.parts.length;
  $('#selection-count').textContent = picked.size > 1 ? `${picked.size} seleccionades` : '';
}

function renderInspector() {
  const part = current();
  $('#inspector-empty').hidden = !!part;
  $('#inspector-fields').hidden = !part;
  if (!part) return;
  if (document.activeElement !== $('#part-name')) $('#part-name').value = part.name ?? '';
  $('#part-name').placeholder = picked.size > 1 ? `${picked.size} peces seleccionades` : part.shape;
  renderSizeClipboard();
  $('#part-shape').value = part.shape;
  $('#shape-hint').textContent = shapeHint(part.shape);
  $('#part-color').value = part.color;
  if (document.activeElement !== $('#part-color-hex')) $('#part-color-hex').value = part.color;
  for (const key of ['u', 'h', 'v', 'sx', 'sy', 'sz']) {
    const input = $(`#part-${key}`);
    if (document.activeElement !== input) input.value = part[key];
  }
  for (const key of ['ry', 'rx', 'rz']) {
    const input = $(`#part-${key}`);
    if (document.activeElement !== input) input.value = deg(part[key]);
  }
  for (const [key, id] of MATERIAL_FIELDS) {
    const input = $(id);
    if (document.activeElement !== input) input.value = part[key] ?? MATERIAL_DEFAULTS[key];
  }
  $('#part-double-side').checked = part.doubleSide === true;
  const used = [...new Set(mod.parts.map(p => p.color))];
  $('#palette').replaceChildren(...[...used, ...BASE_PALETTE.filter(c => !used.includes(c))].slice(0, 24).map(color => {
    const button = document.createElement('button');
    button.type = 'button'; button.style.background = color; button.title = color;
    button.addEventListener('click', () => change(() => { for (const i of pickedList()) mod.parts[i].color = color; }));
    return button;
  }));
}

function renderReadout() {
  const { width, depth } = smallestPlot(mod);
  const limits = `${(width * UNIT).toFixed(2)} × ${(depth * UNIT).toFixed(2)}`;
  const size = bounds
    ? `${(bounds.maxU - bounds.minU).toFixed(2)} × ${(bounds.maxV - bounds.minV).toFixed(2)}`
    : '—';
  $('#readout').innerHTML = '';
  for (const [label, value] of [
    ['Cap dins', `${width} × ${depth} cel·les · ${limits}`],
    ['Ocupa', size],
    ['Alçada real', bounds ? bounds.maxH.toFixed(2) : '—'],
    ['Materials', String(new Set(mod.parts.map(p => p.color)).size)],
  ]) {
    const span = document.createElement('span');
    span.innerHTML = `${label} <b></b>`;
    span.querySelector('b').textContent = value;
    $('#readout').append(span);
  }
}

function renderNotes() {
  const notes = reviewMod(mod, bounds, takenIds, pendingShapes());
  $('#notes').replaceChildren(...notes.map(note => {
    const item = document.createElement('li');
    item.className = note.level; item.textContent = note.text;
    const guilty = note.find ? offenders(note.find) : [];
    if (guilty.length) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'find';
      button.textContent = `Selecciona-les (${guilty.length})`;
      button.title = 'Tria les peces del problema i porta-les a la llista';
      button.addEventListener('click', () => {
        setPicked(guilty);
        render();
        toast(`${guilty.length} peç${guilty.length === 1 ? 'a seleccionada' : 'es seleccionades'}.`);
      });
      item.append(' ', button);
    }
    return item;
  }));
}

/** On arriba una peça en cada eix, comptant girs i formes no centrades. */
function reach(part) {
  const span = partSpan(part, shapeBounds(part.shape));
  const axis = key => ({ min: part[key] + span[key].offset - span[key].half, max: part[key] + span[key].offset + span[key].half });
  return { u: axis('u'), h: axis('h'), v: axis('v') };
}

/** Les peces culpables d'un avís, per poder-les triar d'un clic. */
function offenders(kind) {
  const { width, depth } = smallestPlot(mod);
  const limitU = width * UNIT / 2, limitV = depth * UNIT / 2, margin = .001;
  return mod.parts.flatMap((part, index) => {
    if (kind === 'material') return hasMaterial(part) ? [index] : [];
    const box = reach(part);
    const guilty = kind === 'below'
      ? box.h.min < -margin
      : kind === 'outside' && (box.u.max > limitU + margin || box.u.min < -limitU - margin
        || box.v.max > limitV + margin || box.v.min < -limitV - margin);
    return guilty ? [index] : [];
  });
}

function renderOutput() {
  const mode = $('#output').value;
  const blocks = {
    module: () => moduleCode(mod),
    json: () => modJson(mod),
    register: () => registerSnippets(mod).map(s => `// ${s.file}\n${s.code}\n// ${s.note}`).join('\n\n'),
    runtime: () => runtimeSnippets().map(s => `// ${s.file}\n${s.code}\n// ${s.note}`).join('\n\n'),
    shapes: () => geometriesFile(drafts),
  };
  $('#code').textContent = blocks[mode]();
  $('#output-note').textContent = {
    module: `Desa’l com a mods-personals/${moduleFile(mod)}.`,
    json: 'Enganxa’l dins de l’array JSON_MODS de mods-personals/json-mods-data.js.',
    register: 'Dues entrades a mods-personals i el joc ja el mostra.',
    runtime: 'Es connecta una sola vegada; després només toques json-mods-data.js.',
    shapes: drafts.length
      ? 'Desa’l com a mods-personals/geometries.js i recarrega el joc.'
      : 'Encara no has creat cap forma al taller.',
  }[mode];
}

// ——— metadades ———
function bindMeta() {
  $('#mod-name').addEventListener('input', event => { mod.name = event.target.value; dirty = true; });
  $('#mod-id').addEventListener('change', event => {
    const value = event.target.value.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) { toast('L’identificador ha de començar per una lletra i no pot tenir espais ni accents.'); event.target.value = mod.id; return; }
    change(() => { mod.id = value; });
  });
  $('#mod-category').addEventListener('change', event => change(() => { mod.category = event.target.value; }));
  $('#mod-preview-size').addEventListener('change', event => change(() => { mod.previewSize = Number(event.target.value); }));
  $('#mod-help').addEventListener('input', event => { mod.help = event.target.value; dirty = true; renderNotes(); renderOutput(); });
  $('#mod-auto-height').addEventListener('change', event => change(() => { mod.autoHeight = event.target.checked; }));
  $('#mod-height').addEventListener('change', event => change(() => { mod.height = Math.max(num(event.target.value, 1), .1); }));

  $('#new-mod').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    mod = newMod({ id: uniqueId([...mods, ...takenIds.map(id => ({ id }))], 'modNou'), name: 'Mod nou', parts: [] });
    selected = null; dirty = true; rememberMod('');
    render(); viewport.frame(mod);
  });
  $('#save-mod').addEventListener('click', () => save(false));
  $('#copy-mod').addEventListener('click', () => save(true));
  $('#delete-mod').addEventListener('click', () => {
    const index = mods.findIndex(m => m.id === mod.id);
    if (index < 0) { toast('Aquest mod encara no és a la col·lecció.'); return; }
    if (!confirm(`Vols treure «${mod.name}» de la col·lecció del navegador?`)) return;
    mods.splice(index, 1);
    saveCollection(localStorage, mods);
    if (lastModId() === mod.id) rememberMod('');
    refreshCollection();
    toast('Mod eliminat de la col·lecció.');
  });
  $('#collection').addEventListener('change', event => {
    const found = mods.find(m => m.id === event.target.value);
    if (!found || !confirmDiscard()) { $('#collection').value = mod.id; return; }
    mod = structuredClone(found); selected = null; dirty = false;
    rememberMod(mod.id);
    render(); viewport.frame(mod);
  });
  $('#import-mod').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', importFile);
  $('#export-all').addEventListener('click', () => {
    if (!mods.length) { toast('La col·lecció és buida.'); return; }
    download('vila-mods.json', JSON.stringify(mods, null, 2));
  });
  addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
}

const confirmDiscard = () => !dirty || confirm('Hi ha canvis sense desar. Els vols descartar?');

function save(asCopy) {
  let candidate;
  try { candidate = validateMod(mod); }
  catch (error) { toast(error.message); return; }
  if (asCopy) {
    candidate.id = uniqueId(mods, candidate.id);
    candidate.name = `${candidate.name} (còpia)`;
  }
  const index = mods.findIndex(m => m.id === candidate.id);
  if (index >= 0) mods[index] = candidate; else mods.push(candidate);
  try { saveCollection(localStorage, mods); }
  catch { toast('El navegador no ha pogut desar. Exporta el JSON per no perdre la feina.'); return; }
  mod = structuredClone(candidate); dirty = false;
  rememberMod(mod.id);
  refreshCollection(); render();
  toast(asCopy ? 'Còpia desada al navegador.' : 'Mod desat al navegador.');
}

function refreshCollection() {
  fillSelect($('#collection'), mods.map(m => [m.id, `${m.name} · ${m.id}`]));
  $('#collection').value = mods.some(m => m.id === mod.id) ? mod.id : '';
}

function importFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 2_000_000) { toast('El fitxer passa de 2 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const incoming = (Array.isArray(data) ? data : [data]).map(validateMod);
      for (const item of incoming) { item.id = uniqueId(mods, item.id); mods.push(item); }
      saveCollection(localStorage, mods);
      refreshCollection();
      toast(`${incoming.length} mod${incoming.length === 1 ? '' : 's'} afegits a la col·lecció.`);
    } catch (error) { toast(error.message ?? 'El fitxer no s’ha pogut llegir.'); }
  };
  reader.readAsText(file);
}

// ——— canviar el mod de mida ———

/**
 * Escala el mod sencer d'una parcel·la a una altra. El factor és el més petit
 * dels dos costats, perquè les peces creixin totes igual: escalar l'amplada i
 * la fondària per separat deformaria les teulades i els arcs.
 */
const resizeFactor = target => {
  const from = smallestPlot(mod), to = footprint(target);
  return Math.min(to.width / from.width, to.depth / from.depth);
};

function renderResize() {
  const select = $('#resize-target');
  if (select.dataset.mod !== mod.id) {
    select.value = String(smallestPlot(mod).size);
    select.dataset.mod = mod.id;
  }
  const from = smallestPlot(mod), to = footprint(Number(select.value));
  const factor = resizeFactor(Number(select.value));
  const shown = factor.toFixed(2).replace('.', ',');
  $('#resize-note').textContent = !mod.parts.length
    ? 'Encara no hi ha cap peça per escalar.'
    : factor === 1
      ? `De ${from.label} a ${to.label}: la geometria es queda com és.`
      : `De ${from.label} a ${to.label}: posicions, mides i alçada × ${shown}.`;
  $('#resize-run').disabled = !mod.parts.length;
}

function bindResize() {
  fillSelect($('#resize-target'), SIZES.map(s => [s.size, `${s.label} cel·les`]));
  $('#resize-target').addEventListener('change', renderResize);
  $('#resize-run').addEventListener('click', resizeMod);
}

function resizeMod() {
  if (!mod.parts.length) { toast('Encara no hi ha cap peça per escalar.'); return; }
  const target = Number($('#resize-target').value);
  const from = smallestPlot(mod), to = footprint(target);
  const factor = resizeFactor(target);
  const tidy = value => Math.round(value * 1000) / 1000;
  change(() => {
    for (const part of mod.parts)
      for (const key of ['u', 'h', 'v', 'sx', 'sy', 'sz']) part[key] = tidy(part[key] * factor);
    mod.sizes = [target];
    mod.previewSize = target;
    // Amb «mesura-la sola» l'alçada es refà tota sola en dibuixar.
    if (!mod.autoHeight) mod.height = Math.max(tidy(mod.height * factor), .1);
  });
  viewport.frame(mod);
  toast(factor === 1
    ? `Mod declarat per a ${to.label} cel·les.`
    : `Mod escalat de ${from.label} a ${to.label}, × ${factor.toFixed(2).replace('.', ',')}.`);
}

// ——— peces ———
function bindParts() {
  $('#add-part').addEventListener('click', () => change(() => {
    const model = current();
    const born = model ? { ...model, h: model.h + model.sy, name: '', group: undefined } : newPart();
    mod.parts.push(...stageEast([born]));
    setPicked([mod.parts.length - 1]);
  }));
  $('#duplicate-part').addEventListener('click', () => stamp(part => ({ ...part })));
  $('#mirror-part').addEventListener('click', () =>
    stamp(part => ({ ...part, u: -part.u, ry: -part.ry, rz: -part.rz })));
  $('#rotate-part').addEventListener('click', () => {
    const list = pickedList();
    if (!list.length) return;
    // rotateParts gira el grup sencer al voltant del seu centre en planta.
    const spun = rotateParts(list.map(index => mod.parts[index]), 1);
    change(() => { list.forEach((index, k) => { mod.parts[index] = spun[k]; }); });
  });
  $('#select-all').addEventListener('click', selectAll);
  $('#group-part').addEventListener('click', groupPicked);
  $('#ungroup-part').addEventListener('click', ungroupPicked);
  $('#ground-part').addEventListener('click', groundPicked);
  $('#up-part').addEventListener('click', () => move(-1));
  $('#down-part').addEventListener('click', () => move(1));
  $('#hide-part').addEventListener('click', () => {
    const list = pickedList();
    if (!list.length) return;
    // Si n'hi ha alguna de visible, s'amaguen totes; si ja ho estan, es mostren.
    const hide = list.some(index => !mod.parts[index].hidden);
    change(() => { for (const index of list) mod.parts[index].hidden = hide || undefined; });
  });
  $('#show-all').addEventListener('click', () => {
    if (!hiddenCount()) { toast('No hi ha cap peça amagada.'); return; }
    change(() => { for (const part of mod.parts) delete part.hidden; });
  });
  $('#delete-part').addEventListener('click', () => {
    const list = pickedList();
    if (!list.length) return;
    change(() => {
      for (const index of [...list].reverse()) mod.parts.splice(index, 1);
      pruneGroups();
      setPicked(mod.parts.length ? [Math.min(list[0], mod.parts.length - 1)] : []);
    });
  });
}

/**
 * Totes les peces que es veuen. Les amagades queden fora a posta: les has
 * apartades per treballar amb la resta, i no s'han de moure d'amagat.
 */
function selectAll() {
  const visible = mod.parts.flatMap((part, index) => (part.hidden ? [] : [index]));
  if (!visible.length) {
    toast(mod.parts.length ? 'Totes les peces estan amagades.' : 'Encara no hi ha cap peça.');
    return;
  }
  setPicked(visible);
  render();
  const hidden = mod.parts.length - visible.length;
  toast(`${visible.length} peç${visible.length === 1 ? 'a seleccionada' : 'es seleccionades'}`
    + `${hidden ? ` · ${hidden} amagad${hidden === 1 ? 'a' : 'es'}, fora de la selecció` : ''}.`);
}

function groupPicked() {
  const list = pickedList();
  if (list.length < 2) { toast('Selecciona almenys dues peces per agrupar-les.'); return; }
  const group = nextGroupId();
  change(() => { for (const index of list) mod.parts[index].group = group; pruneGroups(); });
  toast(`${list.length} peces agrupades (${group.toUpperCase()}).`);
}

function ungroupPicked() {
  const list = pickedList();
  if (!list.some(index => mod.parts[index].group)) { toast('La selecció no té cap grup.'); return; }
  change(() => { for (const index of list) delete mod.parts[index].group; pruneGroups(); });
  toast('Grup desfet.');
}

/** Duplica la selecció aplicant-hi una transformació, i selecciona les còpies. */
function stamp(transform) {
  const list = pickedList();
  if (!list.length) return;
  // Les còpies formen grups nous, paral·lels als originals.
  const renamed = new Map();
  let next = Number(nextGroupId().slice(1));
  const copies = stageEast(list.map(index => {
    const copy = transform(mod.parts[index]);
    if (copy.group) {
      if (!renamed.has(copy.group)) renamed.set(copy.group, `g${next++}`);
      copy.group = renamed.get(copy.group);
    }
    return copy;
  }));
  const at = list[list.length - 1] + 1;
  change(() => {
    mod.parts.splice(at, 0, ...copies);
    setPicked(copies.map((_, k) => at + k));
  });
}

/**
 * Desplaça un grup de peces cap a l'est fins a treure'l de la parcel·la,
 * conservant-ne la disposició interna. Si la casella d'espera està desmarcada,
 * les deixa on eren.
 */
function stageEast(parts) {
  if (!$('#stage-new').checked || !parts.length) return parts;
  const { width } = smallestPlot(mod);
  const edge = width * UNIT / 2;
  // Radi generós: una peça girada ocupa més que la seva mida en un sol eix.
  const reach = Math.max(...parts.map(p => Math.max(Math.abs(p.sx), Math.abs(p.sy), Math.abs(p.sz)))) / 2;
  const west = Math.min(...parts.map(p => p.u));
  // Si ja són fora, no les allunyem més.
  if (west - reach > edge) return parts;
  const shift = edge + STAGE_GAP + reach - west;
  return parts.map(p => ({ ...p, u: p.u + shift }));
}

/** Les peces que ara mateix estan amagades. */
const hiddenCount = () => mod.parts.filter(part => part.hidden).length;

function move(step) {
  const list = pickedList();
  if (!list.length) return;
  const block = list.map(index => mod.parts[index]);
  const rest = mod.parts.filter((_, index) => !picked.has(index));
  const at = Math.min(Math.max(list[0] + step, 0), rest.length);
  change(() => {
    rest.splice(at, 0, ...block);
    mod.parts = rest;
    setPicked(block.map((_, k) => at + k));
  });
}

// ——— inspector ———
const MATERIAL_FIELDS = [['opacity', '#part-opacity'], ['roughness', '#part-roughness'], ['metalness', '#part-metalness']];

/**
 * Els camps de material només es desen quan s'aparten del valor de sèrie: una
 * peça normal continua exportant-se amb el color sol, com sempre.
 */
function paintPicked(key, value) {
  const list = pickedList();
  if (!list.length) return;
  change(() => {
    for (const index of list) {
      if (value === MATERIAL_DEFAULTS[key]) delete mod.parts[index][key];
      else mod.parts[index][key] = value;
    }
  });
}

function bindInspector() {
  for (const [key, id] of MATERIAL_FIELDS) {
    $(id).addEventListener('change', event => {
      const value = Math.min(Math.max(num(event.target.value, MATERIAL_DEFAULTS[key]), 0), 1);
      paintPicked(key, Math.round(value * 1000) / 1000);
    });
  }
  $('#part-double-side').addEventListener('change', event => paintPicked('doubleSide', event.target.checked || false));
  $('#copy-size').addEventListener('click', copySize);
  $('#paste-size').addEventListener('click', pasteSize);
  $('#part-name').addEventListener('change', event => {
    const value = event.target.value.trim().slice(0, 40);
    change(() => {
      // Amb diverses seleccionades, el nom es numera per no repetir-lo.
      const list = pickedList();
      list.forEach((index, k) => {
        mod.parts[index].name = !value ? undefined
          : list.length > 1 ? `${value} ${k + 1}` : value;
      });
    });
  });
  $('#part-shape').addEventListener('change', event => change(() => {
    for (const i of pickedList()) mod.parts[i].shape = event.target.value;
  }));
  $('#part-color').addEventListener('input', event => change(() => {
    for (const i of pickedList()) mod.parts[i].color = event.target.value.toLowerCase();
  }));
  $('#part-color-hex').addEventListener('change', event => {
    const value = event.target.value.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(value)) { toast('El color ha de ser hexadecimal, per exemple #cbbd9d.'); return; }
    change(() => { for (const i of pickedList()) mod.parts[i].color = value; });
  });
  for (const key of ['u', 'h', 'v', 'sx', 'sy', 'sz'])
    $(`#part-${key}`).addEventListener('input', event => liveEdit(key, num(event.target.value)));
  for (const key of ['ry', 'rx', 'rz'])
    $(`#part-${key}`).addEventListener('input', event => liveEdit(key, rad(event.target.value)));
}

// Els camps numèrics es mouen molt: no omplen l'historial fins que perds el focus.
let editing = null;
function liveEdit(key, value) {
  const part = current();
  if (!part) return;
  if (editing !== key) { undoStack.push(JSON.stringify(mod)); editing = key; }
  part[key] = value; dirty = true; render();
}
document.addEventListener('focusout', () => { editing = null; });

// ——— arrossegar amb el ratolí ———

// Mentre dura l'arrossegament no s'apunta res a l'historial: hi va una sola
// entrada al final, perquè un Ctrl+Z desfaci tot el moviment i no l'últim píxel.
let dragged = null;

const SNAP = .005;
const MIN_SIZE = .01;
const snap = value => Math.round(value / SNAP) * SNAP;

const dragMode = vertical => (vertical
  ? 'Movent en alçada (h). Deixa anar Majúscules per moure-la en planta.'
  : 'Movent en planta (u · v). Prem Majúscules per pujar-la o baixar-la.');

function drag(phase, payload, alone, vertical) {
  if (phase === 'start') {
    const index = payload;
    if (mod.parts[index]?.hidden) return false;
    if (!picked.has(index) || alone) select(index, 'single', alone);
    // Diu en quin mode s'ha agafat, perquè no hi hagi dubte de què farà.
    toast(dragMode(vertical));
    dragged = {
      before: JSON.stringify(mod),
      from: pickedList().map(i => ({ i, u: mod.parts[i].u, h: mod.parts[i].h, v: mod.parts[i].v })),
    };
    return true;
  }
  if (!dragged) return true;
  if (phase === 'mode') { toast(dragMode(vertical)); return true; }
  if (phase === 'move') {
    for (const start of dragged.from) {
      const part = mod.parts[start.i];
      part.u = snap(start.u + payload.du);
      part.h = snap(start.h + payload.dh);
      part.v = snap(start.v + payload.dv);
    }
    dirty = true;
    render();
    return true;
  }
  if (phase === 'end') {
    undoStack.push(dragged.before);
    if (undoStack.length > 80) undoStack.shift();
    dirty = true;
  } else {
    mod = JSON.parse(dragged.before);
    render();
  }
  dragged = null;
  return true;
}

// ——— estirar per les nanses ———

// La cara que agafes es mou i la de davant es queda on era, com si estiressis
// la peça. Amb Majúscules creixen les dues alhora i el centre no es mou.
let stretched = null;

function stretch(phase, payload) {
  if (phase === 'start') {
    if (payload.kind === 'group') {
      const list = pickedList();
      if (list.length < 2) return false;
      stretched = {
        before: JSON.stringify(mod), kind: 'group',
        extent: payload.extent, anchor: payload.anchor, centre: payload.centre,
        from: list.map(i => ({ i, ...pose(mod.parts[i]) })),
      };
      toast('Escalant la selecció. Les proporcions de dins no canvien.');
      return true;
    }
    const part = mod.parts[payload.index];
    if (!part || part.hidden) return false;
    stretched = {
      before: JSON.stringify(mod),
      index: payload.index, key: payload.key, per: payload.per, mid: payload.both,
      size: part[payload.key], u: part.u, h: part.h, v: part.v,
    };
    return true;
  }
  if (!stretched) return true;
  if (phase === 'move' && stretched.kind === 'group') {
    scaleSelection(payload);
    return true;
  }
  if (phase === 'move') {
    const part = mod.parts[stretched.index];
    if (!part) return true;
    const wanted = stretched.size + payload.grow * (payload.both ? 2 : 1);
    const size = Math.max(snap(wanted), MIN_SIZE);
    const growth = size - stretched.size;
    // Amb Majúscules la forma creix a banda i banda del seu centre; sense,
    // la cara oposada a la nansa es queda clavada on era.
    const per = payload.both ? stretched.mid : stretched.per;
    part[stretched.key] = size;
    part.u = snap(stretched.u + per.du * growth);
    part.h = snap(stretched.h + per.dh * growth);
    part.v = snap(stretched.v + per.dv * growth);
    dirty = true;
    render();
    return true;
  }
  if (phase === 'end') {
    undoStack.push(stretched.before);
    if (undoStack.length > 80) undoStack.shift();
    dirty = true;
  } else {
    mod = JSON.parse(stretched.before);
    render();
  }
  stretched = null;
  return true;
}

/** Les sis xifres que situen i dimensionen una peça. */
const pose = part => ({
  u: part.u, h: part.h, v: part.v, sx: part.sx, sy: part.sy, sz: part.sz,
});

/**
 * Escala la selecció sencera per un sol factor, ancorada a la cara de davant
 * de la que estires —o al centre, amb Majúscules. Com que posicions i mides es
 * multipliquen pel mateix número, el conjunt no es deforma per dins.
 */
function scaleSelection(payload) {
  const { extent, anchor, centre } = stretched;
  const grown = extent + payload.grow * (payload.both ? 2 : 1);
  const factor = Math.max(grown / extent, .02);
  const base = payload.both ? centre : anchor;
  const tidy = value => Math.round(value * 1e4) / 1e4;
  for (const start of stretched.from) {
    const part = mod.parts[start.i];
    if (!part) continue;
    part.u = tidy(base.u + (start.u - base.u) * factor);
    part.h = tidy(base.h + (start.h - base.h) * factor);
    part.v = tidy(base.v + (start.v - base.v) * factor);
    part.sx = Math.max(tidy(start.sx * factor), MIN_SIZE);
    part.sy = Math.max(tidy(start.sy * factor), MIN_SIZE);
    part.sz = Math.max(tidy(start.sz * factor), MIN_SIZE);
  }
  dirty = true;
  render();
}

// ——— porta-retalls de mides ———

// Només les tres mides: ni posició, ni color, ni girs. Viu mentre la pestanya
// és oberta, i s'enganxa amb un botó a posta, per no xocar amb Ctrl+C i Ctrl+V,
// que copien i enganxen peces senceres.
let sizeClip = null;

const sizeLabel = size => [size.sx, size.sy, size.sz].map(v => v.toFixed(2).replace('.', ',')).join(' × ');

function renderSizeClipboard() {
  $('#paste-size').disabled = !sizeClip || !picked.size;
  $('#paste-size').title = sizeClip
    ? `Posa ${sizeLabel(sizeClip)} a la selecció`
    : 'Abans has de copiar les mides d’una peça';
  $('#size-note').textContent = sizeClip ? `Mides desades: ${sizeLabel(sizeClip)}.` : '';
}

function copySize() {
  const part = current();
  if (!part) return;
  sizeClip = { sx: part.sx, sy: part.sy, sz: part.sz };
  renderSizeClipboard();
  toast(`Mides copiades: ${sizeLabel(sizeClip)}.`);
}

function pasteSize() {
  const list = pickedList();
  if (!sizeClip) { toast('Abans copia les mides d’una peça.'); return; }
  if (!list.length) { toast('Selecciona la peça que ha de rebre les mides.'); return; }
  change(() => {
    for (const index of list) Object.assign(mod.parts[index], sizeClip);
  });
  toast(`${sizeLabel(sizeClip)} a ${list.length} peç${list.length === 1 ? 'a' : 'es'}.`);
}

// ——— porta-retalls ———

const CLIPBOARD_KEY = 'vila-mediterrania-clipboard-1';
let clipboard = [];

/**
 * Les peces passen per validateBlock abans d'entrar: el porta-retalls viu al
 * localStorage per poder copiar d'una pestanya a l'altra, i el que ve de fora
 * no es creu mai. Els grups es tornen a posar a mà, perquè la biblioteca no els
 * coneix.
 */
function readClipboard() {
  const raw = clipboard.length ? clipboard : (() => {
    try { return JSON.parse(localStorage.getItem(CLIPBOARD_KEY)) ?? []; } catch { return []; }
  })();
  if (!Array.isArray(raw) || !raw.length) return [];
  try {
    const clean = validateBlock({ name: 'Porta-retalls', parts: raw }).parts;
    return clean.map((part, k) => {
      const group = String(raw[k]?.group ?? '');
      const name = String(raw[k]?.name ?? '').trim();
      return { ...part, ...(/^g\d{1,4}$/.test(group) ? { group } : {}), ...(name ? { name: name.slice(0, 40) } : {}) };
    });
  } catch { return []; }
}

function copyPicked() {
  const list = pickedList();
  if (!list.length) { toast('No hi ha res seleccionat.'); return; }
  clipboard = list.map(index => structuredClone(mod.parts[index]));
  try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(clipboard)); }
  catch { /* el porta-retalls viu a la pestanya i prou */ }
  toast(`${list.length} peç${list.length === 1 ? 'a copiada' : 'es copiades'}.`);
}

function pastePicked() {
  const source = readClipboard();
  if (!source.length) { toast('El porta-retalls és buit.'); return; }
  if (mod.parts.length + source.length > 2000) { toast('Un mod no pot passar de 2000 peces.'); return; }
  const renamed = new Map();
  let next = Number(nextGroupId().slice(1));
  const copies = stageEast(source.map(part => {
    const copy = { ...part };
    if (copy.group) {
      if (!renamed.has(copy.group)) renamed.set(copy.group, `g${next++}`);
      copy.group = renamed.get(copy.group);
    }
    return copy;
  }));
  const at = mod.parts.length;
  change(() => {
    mod.parts.push(...copies);
    setPicked(copies.map((_, k) => at + k));
  });
  toast(`${copies.length} peç${copies.length === 1 ? 'a enganxada' : 'es enganxades'}.`);
}

// ——— alinear i distribuir ———

/**
 * La selecció, vista com a blocs: un grup és un sol bloc i es mou sencer,
 * perquè alinear-ne les peces per separat el desmuntaria.
 */
function pickedBlocks() {
  const byGroup = new Map();
  const blocks = [];
  for (const index of pickedList()) {
    const group = mod.parts[index].group;
    if (!group) { blocks.push([index]); continue; }
    if (!byGroup.has(group)) { const block = []; byGroup.set(group, block); blocks.push(block); }
    byGroup.get(group).push(index);
  }
  return blocks;
}

/** De quant a quant arriba un bloc en un eix. */
function blockSpan(block, axis) {
  let min = Infinity, max = -Infinity;
  for (const index of block) {
    const part = mod.parts[index];
    const { half, offset } = partSpan(part, shapeBounds(part.shape))[axis];
    // offset: les formes que no estan centrades no arriben igual als dos costats.
    min = Math.min(min, part[axis] + offset - half);
    max = Math.max(max, part[axis] + offset + half);
  }
  return { min, max, mid: (min + max) / 2 };
}

/** Mou cada bloc el que li toca, d'una tirada per poder-ho desfer d'un sol cop. */
function shiftBlocks(axis, deltas, message) {
  const moved = deltas.filter(delta => Math.abs(delta) > 1e-9).length;
  if (!moved) { toast('Ja hi eren.'); return; }
  change(() => {
    pickedBlocks().forEach((block, k) => {
      for (const index of block) {
        const part = mod.parts[index];
        part[axis] = Math.round((part[axis] + deltas[k]) * 1e6) / 1e6;
      }
    });
  });
  toast(message(moved));
}

/**
 * Seu la selecció a terra. Cada grup baixa sencer, com a l'alineació, i les
 * formes que no estan centrades es mesuren per on arriben de debò.
 */
function groundPicked() {
  const blocks = pickedBlocks();
  if (!blocks.length) { toast('Selecciona alguna peça.'); return; }
  const deltas = blocks.map(block => -blockSpan(block, 'h').min);
  shiftBlocks('h', deltas, moved => `${moved} bloc${moved === 1 ? '' : 's'} a terra, amb la base a 0.`);
}

function alignPicked(axis, edge) {
  const blocks = pickedBlocks();
  if (blocks.length < 2) { toast('Selecciona almenys dos blocs per alinear-los.'); return; }
  const spans = blocks.map(block => blockSpan(block, axis));
  const target = edge === 'min' ? Math.min(...spans.map(s => s.min))
    : edge === 'max' ? Math.max(...spans.map(s => s.max))
      : (Math.min(...spans.map(s => s.min)) + Math.max(...spans.map(s => s.max))) / 2;
  const deltas = spans.map(span => target - span[edge === 'mid' ? 'mid' : edge]);
  shiftBlocks(axis, deltas, moved => `${moved} bloc${moved === 1 ? '' : 's'} alineat${moved === 1 ? '' : 's'} en ${axis}.`);
}

/** Reparteix els blocs de l'un a l'altre extrem, a distàncies iguals de centre a centre. */
function spreadPicked(axis) {
  const blocks = pickedBlocks();
  if (blocks.length < 3) { toast('En calen tres o més per repartir-los.'); return; }
  const spans = blocks.map((block, k) => ({ k, ...blockSpan(block, axis) }));
  const order = [...spans].sort((a, b) => a.mid - b.mid);
  const first = order[0].mid, step = (order[order.length - 1].mid - first) / (order.length - 1);
  const deltas = new Array(blocks.length).fill(0);
  order.forEach((span, i) => { deltas[span.k] = first + i * step - span.mid; });
  shiftBlocks(axis, deltas, () => `${blocks.length} blocs repartits en ${axis}.`);
}

function bindAlign() {
  for (const button of $('#align').querySelectorAll('button[data-align]')) {
    const [axis, what] = button.dataset.align.split(':');
    button.addEventListener('click', () => (what === 'spread' ? spreadPicked(axis) : alignPicked(axis, what)));
  }
}

// ——— repeticions ———
function bindRepeat() {
  const sync = () => {
    const ring = $('#repeat-mode').value === 'ring';
    $('#repeat-ring').hidden = !ring;
    $('#repeat-line').hidden = ring;
  };
  $('#repeat-mode').addEventListener('change', sync); sync();
  $('#repeat-run').addEventListener('click', () => {
    const part = current();
    if (!part) return;
    const count = Math.min(Math.max(Math.round(num($('#repeat-count').value, 1)), 1), 60);
    change(() => {
      const copies = [];
      if ($('#repeat-mode').value === 'ring') {
        const radius = num($('#repeat-radius').value), face = $('#repeat-face').checked;
        for (let i = 1; i <= count; i++) {
          const angle = (i * 2 * Math.PI) / (count + 1);
          copies.push({ ...part, u: Math.sin(angle) * radius, v: Math.cos(angle) * radius, ry: face ? part.ry + angle : part.ry });
        }
      } else {
        const du = num($('#repeat-du').value), dh = num($('#repeat-dh').value), dv = num($('#repeat-dv').value);
        for (let i = 1; i <= count; i++) copies.push({ ...part, u: part.u + du * i, h: part.h + dh * i, v: part.v + dv * i });
      }
      mod.parts.splice(selected + 1, 0, ...copies);
    });
    toast(`${count} còpies afegides.`);
  });
}

// ——— sortida ———
function bindOutput() {
  $('#output').addEventListener('change', renderOutput);
  $('#copy-code').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#code').textContent); toast('Copiat al porta-retalls.'); }
    catch { toast('El navegador no ha deixat copiar. Selecciona el text a mà.'); }
  });
  $('#download-code').addEventListener('click', () => {
    const mode = $('#output').value;
    const name = mode === 'module' ? moduleFile(mod)
      : mode === 'json' ? `${mod.id}.mod.json`
        : mode === 'shapes' ? 'geometries.js'
        : `${mod.id}-retalls.txt`;
    download(name, $('#code').textContent);
  });
}

// ——— formes personals ———

/** Reconstrueix el catàleg de formes: oficials, les del joc i les del taller. */
function refreshShapes() {
  const applied = applyDrafts(drafts);
  setExtraShapes([...personalShapes, ...applied]);
  fillShapeSelect();
}

const pendingShapes = () => drafts.map(draft => draft.id).filter(id => !personalShapes.includes(id));

/**
 * El que el model d'IA ha de saber d'una forma personal: com es diu, què ocupa
 * i on té el punt d'inserció. Surt de mesurar la geometria, no de cap llista
 * escrita a mà, així que val per a qualsevol forma que registris.
 */
function shapeNote(id) {
  const box = shapeBounds(id);
  const [low, high] = [box.min[1], box.max[1]];
  return {
    id,
    label: readableShape(id),
    size: [0, 1, 2].map(i => box.max[i] - box.min[i]),
    low,
    base: Math.abs(low) < 1e-6 ? 'bottom' : Math.abs(low + high) < 1e-6 ? 'centre' : 'other',
  };
}

/** marcRectangularBuit → «marc rectangular buit». */
const readableShape = id => id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

/**
 * Les formes del joc porten la pista escrita; de les personals, el taller en
 * mesura la geometria i diu com són i on tenen el punt d'inserció, que no
 * sempre és al centre.
 */
function shapeHint(id) {
  if (SHAPE_HINTS[id]) return SHAPE_HINTS[id];
  const box = shapeBounds(id);
  const size = [0, 1, 2].map(i => (box.max[i] - box.min[i]).toFixed(2).replace('.', ',')).join(' × ');
  const [low, high] = [box.min[1], box.max[1]];
  const where = Math.abs(low) < 1e-6 ? 'el punt d’inserció és a la base'
    : Math.abs(low + high) < 1e-6 ? 'està centrada en alçada'
      : `la base queda ${(-low).toFixed(2).replace('.', ',')} per damunt del punt d’inserció`;
  const family = personalShapes.includes(id) ? 'Forma personal instal·lada' : 'Forma del taller, pendent d’instal·lar';
  return `${family} · ${size} abans d’escalar, i ${where}.`;
}

function fillShapeSelect() {
  const select = $('#part-shape');
  if (!select) return;
  const chosen = select.value;
  const groups = [
    ['Formes del joc', SHAPES.map(id => [id, `${id} - ${SHAPE_NAMES[id] ?? id}`])],
    ['Formes personals instal·lades', personalShapes.map(id => [id, `${id} - ${readableShape(id)}`])],
    ['Formes del taller, pendents d’instal·lar', pendingShapes().map(id => [id, `${id} - ${readableShape(id)}`])],
  ];
  select.replaceChildren(...groups.filter(([, items]) => items.length).map(([label, items]) => {
    const group = document.createElement('optgroup');
    group.label = label;
    group.append(...items.map(([value, text]) => {
      const option = document.createElement('option');
      option.value = value; option.textContent = text; return option;
    }));
    return group;
  }));
  if ([...select.options].some(option => option.value === chosen)) select.value = chosen;
}

const currentDraft = () => drafts.find(draft => draft.id === $('#shape-list').value) ?? null;

function renderShapes() {
  const chosen = $('#shape-list').value;
  fillSelect($('#shape-list'), drafts.map(draft => [draft.id, `${draft.id} · ${TEMPLATES[draft.template].name}`]));
  if (drafts.some(draft => draft.id === chosen)) $('#shape-list').value = chosen;
  const draft = currentDraft();
  $('#shape-empty').hidden = !!drafts.length;
  for (const id of ['#shape-apply', '#shape-rename', '#shape-delete']) $(id).disabled = !draft;
  $('#shape-note').textContent = draft ? TEMPLATES[draft.template].note : '';
  $('#shape-params').replaceChildren(...(draft ? TEMPLATES[draft.template].fields : []).map(field => {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = field.label;
    const input = document.createElement('input');
    input.type = 'number'; input.min = field.min; input.max = field.max;
    input.step = field.step; input.value = draft.params[field.key];
    input.addEventListener('input', () => {
      draft.params = TEMPLATES[draft.template].clean({ ...draft.params, [field.key]: input.value });
      persistDrafts(); refreshShapes(); render();
    });
    label.append(caption, input);
    return label;
  }));
}

function persistDrafts() {
  try { saveDrafts(localStorage, drafts); }
  catch { toast('El navegador no ha pogut desar les formes. Exporta el fitxer per no perdre-les.'); }
}

function bindShapes() {
  $('#shape-create').addEventListener('click', () => {
    const id = $('#shape-name').value.trim();
    if (!SHAPE_ID_PATTERN.test(id)) { toast('El nom ha de començar per minúscula i només pot tenir lletres i xifres.'); return; }
    if (SHAPES.includes(id)) { toast(`«${id}» ja és una forma del joc.`); return; }
    if (drafts.some(draft => draft.id === id) || personalShapes.includes(id)) { toast(`Ja hi ha una forma que es diu «${id}».`); return; }
    const template = $('#shape-template').value;
    drafts.push(validateDraft({ id, template, params: defaultParams(template) }));
    persistDrafts(); refreshShapes(); renderShapes();
    $('#shape-list').value = id; $('#shape-name').value = '';
    renderShapes(); render();
    toast(`Forma «${id}» creada. Recorda instal·lar-la al joc abans de publicar el mod.`);
  });

  $('#shape-list').addEventListener('change', renderShapes);

  $('#shape-apply').addEventListener('click', () => {
    const draft = currentDraft();
    if (!draft || !picked.size) { toast('Selecciona abans alguna peça del mod.'); return; }
    change(() => { for (const index of pickedList()) mod.parts[index].shape = draft.id; });
  });

  $('#shape-rename').addEventListener('click', () => {
    const draft = currentDraft();
    if (!draft) return;
    const name = prompt('Nom nou de la forma:', draft.id);
    if (name === null) return;
    const id = name.trim();
    if (!SHAPE_ID_PATTERN.test(id) || SHAPES.includes(id) || personalShapes.includes(id)
      || drafts.some(item => item.id === id)) { toast('Aquest nom no es pot fer servir.'); return; }
    const old = draft.id;
    draft.id = id;
    for (const part of mod.parts) if (part.shape === old) part.shape = id;
    persistDrafts(); refreshShapes(); renderShapes(); render();
  });

  $('#shape-delete').addEventListener('click', () => {
    const draft = currentDraft();
    if (!draft) return;
    const used = mod.parts.some(part => part.shape === draft.id);
    if (!confirm(used
      ? `«${draft.id}» s’està fent servir en aquest mod. La vols eliminar igualment?`
      : `Vols eliminar la forma «${draft.id}»?`)) return;
    drafts = drafts.filter(item => item.id !== draft.id);
    persistDrafts(); refreshShapes(); renderShapes(); render();
  });
}

// ——— generador des de fotografies ———

/**
 * El que el panell necessita del taller. Li passem funcions en comptes de
 * l'estat, així el panell no toca res del taller directament.
 */
function aiBridge() {
  return {
    $, fillSelect, toast,

    // Dades que canvien: es demanen a cada generació, no es capturen una vegada.
    context: () => ({
      personalShapes: [...personalShapes],
      shapeNotes: personalShapes.map(shapeNote),
      takenIds,
      example: mods.find(item => item.id === 'casaDePoble') ?? null,
    }),

    /**
     * Renderitza el mod amb el motor del joc i en torna tres vistes i les
     * mesures. És el que permet que el model vegi com li ha quedat.
     */
    renderMod: async candidate => {
      const before = { mod, selected, picked };
      mod = candidate; picked = new Set(); selected = null;
      const measured = viewport.update(mod, [], { heights: false, neighbours: false, axes: false });
      viewport.frame(mod);
      const images = [];
      for (const [theta, phi] of [[0, 1.15], [Math.PI / 2, 1.15], [0, .12]]) {
        viewport.look(theta, phi);
        // Un fotograma de marge perquè la càmera hi arribi abans de la captura.
        await new Promise(resolve => requestAnimationFrame(resolve));
        images.push(viewport.snapshot());
      }
      viewport.look(.55, 1.05);
      mod = before.mod; selected = before.selected; picked = before.picked;
      render();
      return { images, bounds: measured };
    },

    /** El mod generat entra a l'editor com qualsevol altre, i es pot desfer. */
    onMod: candidate => {
      change(() => {
        mod = { ...candidate, id: uniqueId([...mods, ...takenIds.map(id => ({ id }))], candidate.id) };
        setPicked([]);
      });
      viewport.frame(mod);
    },
  };
}

// ——— biblioteca de peces ———
function renderLibrary() {
  const chosen = $('#block-list').value;
  fillSelect($('#block-list'), blocks.map(block => [block.id, `${block.name} · ${block.parts.length}`]));
  if (blocks.some(block => block.id === chosen)) $('#block-list').value = chosen;
  const empty = !blocks.length;
  for (const id of ['#block-insert', '#block-rename', '#block-duplicate', '#block-delete', '#block-export'])
    $(id).disabled = empty;
  $('#block-empty').hidden = !empty;
}

const currentBlock = () => blocks.find(block => block.id === $('#block-list').value) ?? null;

function persistLibrary() {
  try { saveLibrary(localStorage, blocks); }
  catch { toast('El navegador no ha pogut desar la biblioteca. Exporta-la per no perdre-la.'); }
}

function bindLibrary() {
  $('#block-insert').addEventListener('click', () => {
    const block = currentBlock();
    if (!block) return;
    if (mod.parts.length + block.parts.length > 2000) { toast('Un mod no pot passar de 2000 peces.'); return; }
    // Com les peces noves: si la casella d'espera és marcada, la peça apareix
    // fora de la parcel·la, on es veu sencera i no queda amagada dins del mod.
    const staged = $('#stage-new').checked;
    const group = block.parts.length > 1 ? nextGroupId() : undefined;
    const copies = stageEast(block.parts.map(part => ({ ...part, ...(group ? { group } : {}) })));
    const at = mod.parts.length;
    change(() => {
      mod.parts.push(...copies);
      setPicked(copies.map((_, k) => at + k));
    });
    toast(`«${block.name}» inserida amb ${copies.length} peça${copies.length === 1 ? '' : 'es'}`
      + `${staged ? ' a la zona d’espera de l’est' : ' al centre de la parcel·la'}. Mou-la amb les fletxes.`);
  });

  $('#block-save').addEventListener('click', () => {
    const source = picked.size ? pickedList().map(index => mod.parts[index]) : mod.parts;
    if (!source.length) { toast('No hi ha cap peça per desar.'); return; }
    const suggested = uniqueBlockName(blocks, picked.size ? 'Peça nova' : mod.name);
    const name = prompt('Nom de la peça de biblioteca:', suggested);
    if (name === null) return;
    const clean = name.trim();
    if (!clean) { toast('La peça necessita un nom.'); return; }
    let block;
    try { block = validateBlock({ name: clean, id: blockId(clean), parts: normalizeParts(source) }); }
    catch (error) { toast(error.message); return; }
    const index = blocks.findIndex(item => item.id === block.id);
    if (index >= 0 && !confirm(`Ja hi ha una peça anomenada «${blocks[index].name}». La vols substituir?`)) return;
    if (index >= 0) blocks[index] = block; else blocks.push(block);
    persistLibrary(); renderLibrary();
    $('#block-list').value = block.id;
    toast(`«${block.name}» desada amb ${block.parts.length} elements.`);
  });

  $('#block-rename').addEventListener('click', () => {
    const block = currentBlock();
    if (!block) return;
    const name = prompt('Nom nou:', block.name);
    if (name === null) return;
    const clean = name.trim();
    if (!clean) { toast('La peça necessita un nom.'); return; }
    block.name = clean.slice(0, 40);
    persistLibrary(); renderLibrary();
  });

  $('#block-duplicate').addEventListener('click', () => {
    const block = currentBlock();
    if (!block) return;
    const name = uniqueBlockName(blocks, `${block.name} (còpia)`);
    const copy = validateBlock({ name, id: blockId(name), parts: block.parts });
    blocks.push(copy); persistLibrary(); renderLibrary();
    $('#block-list').value = copy.id;
  });

  $('#block-delete').addEventListener('click', () => {
    const block = currentBlock();
    if (!block) return;
    if (!confirm(`Vols treure «${block.name}» de la biblioteca?`)) return;
    blocks = blocks.filter(item => item.id !== block.id);
    persistLibrary(); renderLibrary();
  });

  $('#block-export').addEventListener('click', () => download('vila-peces.json', JSON.stringify(blocks, null, 2)));
  $('#block-import').addEventListener('click', () => $('#block-file').click());
  $('#block-file').addEventListener('change', event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) { toast('El fitxer passa de 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const incoming = (Array.isArray(data) ? data : [data]).map(validateBlock);
        for (const block of incoming) {
          block.name = uniqueBlockName(blocks, block.name);
          block.id = blockId(block.name);
          blocks.push(block);
        }
        persistLibrary(); renderLibrary();
        toast(`${incoming.length} peça${incoming.length === 1 ? '' : 's'} afegides a la biblioteca.`);
      } catch (error) { toast(error.message ?? 'El fitxer no s’ha pogut llegir.'); }
    };
    reader.readAsText(file);
  });
}

// ——— seccions plegables ———

const FOLD_STORE = 'vila-mediterrania-folds-1';

/**
 * Converteix la capçalera de cada secció en un botó que la plega. Es fa des
 * d'aquí i no a l'HTML perquè funcioni també amb les seccions que s'hi
 * afegeixin més endavant, sense haver de recordar-ho.
 */
function bindFolds() {
  let folded;
  try { folded = new Set(JSON.parse(localStorage.getItem(FOLD_STORE)) ?? []); }
  catch { folded = new Set(); }
  const save = () => {
    try { localStorage.setItem(FOLD_STORE, JSON.stringify([...folded])); } catch { /* sense desar */ }
  };

  for (const section of document.querySelectorAll('.panel section')) {
    const heading = section.querySelector('h2');
    if (!heading || !section.id) continue;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fold';
    button.append(...heading.childNodes);
    heading.append(button);

    const apply = () => {
      const shut = folded.has(section.id);
      section.classList.toggle('folded', shut);
      button.setAttribute('aria-expanded', String(!shut));
    };
    button.addEventListener('click', () => {
      if (folded.has(section.id)) folded.delete(section.id); else folded.add(section.id);
      save(); apply();
    });
    apply();
  }
}

// ——— vistes ———
function bindViews() {
  const angles = { south: [0, 1.15], east: [Math.PI / 2, 1.15], north: [Math.PI, 1.15], west: [-Math.PI / 2, 1.15], top: [0, .12] };
  for (const button of document.querySelectorAll('[data-view]'))
    button.addEventListener('click', () => viewport.look(...angles[button.dataset.view]));
  $('#frame').addEventListener('click', () => viewport.frame(mod));
  $('#show-axes').addEventListener('change', render);
  $('#show-heights').addEventListener('change', render);
  $('#show-handles').addEventListener('change', render);
  $('#show-neighbours').addEventListener('change', render);
}

// ——— teclat ———
function bindKeys() {
  addEventListener('keydown', event => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(false); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      const previous = undoStack.pop();
      if (!previous) { toast('No queda res per desfer.'); return; }
      mod = JSON.parse(previous); dirty = true; render();
      return;
    }
    // Si hi ha text marcat a la pàgina, Ctrl+C és del navegador.
    const marked = () => String(getSelection?.() ?? '').length > 0;
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && !marked()) {
      event.preventDefault(); copyPicked(); return;
    }
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault(); pastePicked(); return;
    }
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault(); selectAll(); return;
    }
    if (!typing && event.key === 'Escape' && picked.size) { setPicked([]); render(); return; }
    if (typing || !picked.size) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
      event.preventDefault();
      if (event.shiftKey) ungroupPicked(); else groupPicked();
      return;
    }
    const step = event.shiftKey ? .005 : .02;
    const nudge = (key, amount) => {
      event.preventDefault();
      change(() => { for (const index of pickedList()) mod.parts[index][key] += amount; });
    };
    if (event.key === 'ArrowLeft') nudge('u', -step);
    else if (event.key === 'ArrowRight') nudge('u', step);
    else if (event.key === 'ArrowUp') nudge('v', -step);
    else if (event.key === 'ArrowDown') nudge('v', step);
    else if (event.key === 'PageUp') nudge('h', step);
    else if (event.key === 'PageDown') nudge('h', -step);
    else if (event.key === 'Delete') { event.preventDefault(); $('#delete-part').click(); }
    else if (!event.ctrlKey && !event.metaKey && !event.altKey && /^[qe]$/i.test(event.key)) {
      event.preventDefault();
      const degrees = (event.shiftKey ? 1 : 15) * (event.key.toLowerCase() === 'q' ? 1 : -1);
      spin(pickedList(), rad(degrees));
    }
  });
}

// Gira les peces al voltant de l'eix vertical. Un grup gira com un bloc al voltant
// del seu centre, i les peces inclinades conserven la inclinació.
function spin(indexes, angle) {
  if (!indexes.length) return;
  const tidy = value => Math.round(value * 1e6) / 1e6;
  const spun = spinParts(indexes.map(index => mod.parts[index]), angle);
  change(() => {
    indexes.forEach((index, k) => {
      const part = spun[k];
      for (const key of ['u', 'v', 'rx', 'ry', 'rz']) part[key] = tidy(part[key]);
      mod.parts[index] = part;
    });
  });
  toast(`Girat ${Math.round(angle * 180 / Math.PI)}°.`);
}

start();
