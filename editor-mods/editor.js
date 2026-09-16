import { loadShapes, missingShapes, loadPersonalShapes, applyDrafts, personalShapes } from './shapes.js';
import { SHAPES, SHAPE_HINTS, SHAPE_NAMES, UNIT } from './constants.js';
import {
  TEMPLATES, defaultParams, validateDraft, loadDrafts, saveDrafts,
  geometriesFile, starterDrafts, SHAPE_ID_PATTERN,
} from './personal-shapes.js';
import {
  newMod, newPart, validateMod, reviewMod, footprint, smallestPlot, SIZES,
  loadCollection, saveCollection, uniqueId, num, REQUIRES_MOD_API, setExtraShapes,
} from './format.js';
import { createViewport } from './viewport.js';
import { moduleCode, modJson, registerSnippets, runtimeSnippets, moduleFile, download } from './exporters.js';
import { starterMods } from './starters.js';
import {
  loadLibrary, saveLibrary, validateBlock, blockId, uniqueBlockName,
  normalizeParts, rotateParts, starterBlocks,
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
  mod = structuredClone(mods[0]);
  blocks = loadLibrary(localStorage);
  if (!blocks.length) blocks = starterBlocks();

  buildSizeChecks();
  fillSelect($('#shape-template'), Object.entries(TEMPLATES).map(([id, item]) => [id, item.name]));
  $('#shapes-state').textContent = registry.ok
    ? `El joc té ${registry.count} forma${registry.count === 1 ? '' : 'es'} personal${registry.count === 1 ? '' : 's'} registrada${registry.count === 1 ? '' : 'es'}.`
    : `No s’ha pogut llegir el registre de formes: ${registry.message}`;
  viewport = createViewport($('#canvas'), { onPick: (index, mode) => select(index, mode) });

  bindMeta();
  bindParts();
  bindInspector();
  bindRepeat();
  bindOutput();
  bindViews();
  bindKeys();
  bindLibrary();
  bindShapes();
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

function select(index, mode = 'single') {
  if (index === null || index === undefined) { setPicked([]); render(); return; }
  if (mode === 'toggle') {
    if (picked.has(index) && picked.size > 1) {
      picked.delete(index);
      if (selected === index) selected = pickedList()[0] ?? null;
    } else { picked.add(index); selected = index; }
  } else if (mode === 'range' && selected !== null) {
    const [from, to] = selected < index ? [selected, index] : [index, selected];
    for (let i = from; i <= to; i++) picked.add(i);
    selected = index;
  } else setPicked([index]);
  render();
}

const current = () => (selected === null ? null : mod.parts[selected]);

// ——— dibuix de la interfície ———
function render() {
  const options = {
    heights: $('#show-heights').checked,
    neighbours: $('#show-neighbours').checked,
    axes: $('#show-axes').checked,
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
    shape.className = 'shape'; shape.textContent = part.shape;
    const where = document.createElement('span');
    where.className = 'where';
    where.textContent = `${part.u.toFixed(2)} ${part.h.toFixed(2)} ${part.v.toFixed(2)}`;
    item.append(swatch, shape, where);
    const how = event => (event.ctrlKey || event.metaKey ? 'toggle' : event.shiftKey ? 'range' : 'single');
    item.addEventListener('click', event => select(index, how(event)));
    item.addEventListener('keydown', event => { if (event.key === 'Enter') select(index, how(event)); });
    return item;
  }));
  const chosen = list.children[selected];
  if (chosen) chosen.scrollIntoView({ block: 'nearest' });
  for (const id of ['#duplicate-part', '#mirror-part', '#rotate-part', '#up-part', '#down-part', '#delete-part'])
    $(id).disabled = !picked.size;
  $('#repeat').hidden = picked.size !== 1;
  $('#block-save').disabled = !mod.parts.length;
  $('#selection-count').textContent = picked.size > 1 ? `${picked.size} seleccionades` : '';
}

function renderInspector() {
  const part = current();
  $('#inspector-empty').hidden = !!part;
  $('#inspector-fields').hidden = !part;
  if (!part) return;
  $('#part-shape').value = part.shape;
  $('#shape-hint').textContent = SHAPE_HINTS[part.shape] ?? '';
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
    return item;
  }));
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
    selected = null; dirty = true; render(); viewport.frame(mod);
  });
  $('#save-mod').addEventListener('click', () => save(false));
  $('#copy-mod').addEventListener('click', () => save(true));
  $('#delete-mod').addEventListener('click', () => {
    const index = mods.findIndex(m => m.id === mod.id);
    if (index < 0) { toast('Aquest mod encara no és a la col·lecció.'); return; }
    if (!confirm(`Vols treure «${mod.name}» de la col·lecció del navegador?`)) return;
    mods.splice(index, 1);
    saveCollection(localStorage, mods);
    refreshCollection();
    toast('Mod eliminat de la col·lecció.');
  });
  $('#collection').addEventListener('change', event => {
    const found = mods.find(m => m.id === event.target.value);
    if (!found || !confirmDiscard()) { $('#collection').value = mod.id; return; }
    mod = structuredClone(found); selected = null; dirty = false;
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

// ——— peces ———
function bindParts() {
  $('#add-part').addEventListener('click', () => change(() => {
    const model = current();
    mod.parts.push(model ? { ...model, h: model.h + model.sy } : newPart());
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
  $('#up-part').addEventListener('click', () => move(-1));
  $('#down-part').addEventListener('click', () => move(1));
  $('#delete-part').addEventListener('click', () => {
    const list = pickedList();
    if (!list.length) return;
    change(() => {
      for (const index of [...list].reverse()) mod.parts.splice(index, 1);
      setPicked(mod.parts.length ? [Math.min(list[0], mod.parts.length - 1)] : []);
    });
  });
}

/** Duplica la selecció aplicant-hi una transformació, i selecciona les còpies. */
function stamp(transform) {
  const list = pickedList();
  if (!list.length) return;
  const copies = list.map(index => transform(mod.parts[index]));
  const at = list[list.length - 1] + 1;
  change(() => {
    mod.parts.splice(at, 0, ...copies);
    setPicked(copies.map((_, k) => at + k));
  });
}

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
function bindInspector() {
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

function fillShapeSelect() {
  const select = $('#part-shape');
  if (!select) return;
  const chosen = select.value;
  const groups = [
    ['Formes del joc', SHAPES.map(id => [id, `${id} - ${SHAPE_NAMES[id] ?? id}`])],
    ['Formes personals instal·lades', personalShapes.map(id => [id, id])],
    ['Formes del taller, pendents d’instal·lar', pendingShapes().map(id => [id, id])],
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
    const at = mod.parts.length;
    change(() => {
      mod.parts.push(...block.parts.map(part => ({ ...part })));
      setPicked(block.parts.map((_, k) => at + k));
    });
    toast(`«${block.name}» inserida al centre. Mou-la amb les fletxes.`);
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

// ——— vistes ———
function bindViews() {
  const angles = { south: [0, 1.15], east: [Math.PI / 2, 1.15], north: [Math.PI, 1.15], west: [-Math.PI / 2, 1.15], top: [0, .12] };
  for (const button of document.querySelectorAll('[data-view]'))
    button.addEventListener('click', () => viewport.look(...angles[button.dataset.view]));
  $('#frame').addEventListener('click', () => viewport.frame(mod));
  $('#show-axes').addEventListener('change', render);
  $('#show-heights').addEventListener('change', render);
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
    if (typing || !picked.size) return;
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
  });
}

start();
