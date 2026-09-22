// La vista 3D. Dibuixa cada peça com una malla independent (això és un editor,
// no el joc: aquí no cal instanciar res) i hi afegeix les guies de la parcel·la.
import * as THREE from '../vendor/three.module.min.js';
import { geometries } from './shapes.js';
import { UNIT, FLOOR_HEIGHT, TERRAIN_STEP } from './constants.js';
import { footprint } from './format.js';

const LINE_PLOT = 0x1c565b, LINE_CELL = 0x8fa2a0, LINE_FLOOR = 0xb0553a, LINE_STEP = 0xc9bca0;
const LINE_SOUTH = 0xb0553a, LINE_AXIS = 0x1c565b;

export function createViewport(canvas, { onPick, onDrag, onResize }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);

  const sky = new THREE.HemisphereLight(0xf3ead6, 0x6f7f6a, 1.5);
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.1);
  sun.position.set(4.5, 7.5, 3.2); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 30 });
sun.shadow.camera.updateProjectionMatrix();
  scene.add(sky, sun);

  // El terra es torna translúcid quan el mod té peces enterrades: així es veuen
  // sense haver de moure res ni posar la càmera sota terra.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xcdc3ab, roughness: 1, transparent: false, opacity: 1 }));
  ground.position.y = -.002; ground.receiveShadow = true; scene.add(ground);

  const guides = new THREE.Group(); scene.add(guides);
  const handles = new THREE.Group(); scene.add(handles);
  const ghosts = new THREE.Group(); scene.add(ghosts);
  const parts = new THREE.Group(); scene.add(parts);

  // Les lletres dels eixos són HTML damunt del llenç: així es llegeixen sempre
  // a la mida justa i agafen els colors del tema.
  const overlay = document.createElement('div');
  overlay.className = 'labels';
  canvas.parentElement.append(overlay);
  const labels = [];

  function setLabels(items) {
    labels.length = 0;
    overlay.replaceChildren(...items.map(({ text, at, tone }) => {
      const element = document.createElement('span');
      element.textContent = text;
      if (tone) element.classList.add(tone);
      labels.push({ element, point: new THREE.Vector3(...at) });
      return element;
    }));
  }

  const projected = new THREE.Vector3();
  function placeLabels() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    for (const label of labels) {
      projected.copy(label.point).project(camera);
      const behind = projected.z > 1;
      label.element.style.visibility = behind ? 'hidden' : '';
      if (behind) continue;
      label.element.style.transform =
        `translate(-50%,-50%) translate(${(projected.x * .5 + .5) * width}px,${(-projected.y * .5 + .5) * height}px)`;
    }
  }

  // Una nansa per cara: es dibuixen sense provar la profunditat perquè les tres
  // de darrere també es puguin agafar sense haver de girar la vista.
  const HANDLE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
  const HANDLE_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xa8802f, depthTest: false, transparent: true, opacity: .5,
  });
  const AXES = [['sx', 'x'], ['sy', 'y'], ['sz', 'z']];
  const _quat = new THREE.Quaternion(), _euler = new THREE.Euler(), _scale = new THREE.Vector3();
  const _local = new THREE.Vector3(), _w0 = new THREE.Vector3();

  /**
   * Les nanses viuen als eixos propis de la peça, no als del món: si la peça
   * està girada, estirar-la cap a «la dreta» la fa créixer cap on mira ella.
   */
  function buildHandles(mod, chosen, options) {
    handles.clear();
    if (!onResize || options.handles === false || !chosen.length) return;
    // Una peça s'estira cara per cara; una selecció, sencera i proporcionada.
    if (chosen.length > 1) { buildBoxHandles(); return; }
    const part = mod.parts[chosen[0]];
    if (!part || part.hidden) return;
    const mesh = parts.children.find(item => item.userData.index === chosen[0]);
    if (!mesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    _quat.setFromEuler(_euler.set(part.rx, part.ry, part.rz));
    _scale.set(part.sx, part.sy, part.sz);
    box.getCenter(_mid);
    for (const [key, axis] of AXES) {
      // On són les dues cares dins de la geometria sense escalar. Ni totes les
      // formes del joc van de −0,5 a 0,5, ni les peces buides personals, que
      // van de 0 a 1 en alçada.
      const span = box.max[axis] - box.min[axis];
      if (!(span > 1e-6)) continue;
      for (const sign of [1, -1]) {
        const face = sign > 0 ? box.max[axis] : box.min[axis];
        const opposite = sign > 0 ? box.min[axis] : box.max[axis];
        const handle = new THREE.Mesh(HANDLE_GEOMETRY, HANDLE_MATERIAL);
        handle.renderOrder = 3;
        _local.copy(_mid)[axis] = face;
        handle.position.copy(_local).multiply(_scale).applyQuaternion(_quat)
          .add(new THREE.Vector3(part.u, part.h, part.v));
        const dir = new THREE.Vector3(0, 0, 0);
        dir[axis] = 1;
        dir.applyQuaternion(_quat);
        // Per cada unitat de mida guanyada, quant s'ha de moure la peça perquè
        // la cara de davant no es bellugui —o, amb Majúscules, el centre.
        const per = { du: -dir.x * opposite, dh: -dir.y * opposite, dv: -dir.z * opposite };
        const fromMid = { du: -dir.x * _mid[axis], dh: -dir.y * _mid[axis], dv: -dir.z * _mid[axis] };
        handle.userData = { key, sign, span, dir, per, both: fromMid, index: chosen[0] };
        handles.add(handle);
      }
    }
    sizeHandles();
  }

  /**
   * Les nanses de la capsa que envolta la selecció. Estirar-ne una escala tot
   * el conjunt pel mateix factor, amb la cara de davant clavada, de manera que
   * les proporcions de dins no canvien.
   */
  const _span = new THREE.Vector3(), _mid = new THREE.Vector3();
  function buildBoxHandles() {
    if (!selection.visible) return;
    const box = selection.box;
    box.getSize(_span); box.getCenter(_mid);
    for (const axis of ['x', 'y', 'z']) {
      const extent = _span[axis];
      if (!(extent > 1e-6)) continue;
      for (const sign of [1, -1]) {
        const handle = new THREE.Mesh(HANDLE_GEOMETRY, HANDLE_MATERIAL);
        handle.renderOrder = 3;
        handle.position.copy(_mid)[axis] = sign > 0 ? box.max[axis] : box.min[axis];
        const anchor = _mid.clone();
        anchor[axis] = sign > 0 ? box.min[axis] : box.max[axis];
        const dir = new THREE.Vector3(0, 0, 0); dir[axis] = 1;
        handle.userData = {
          group: true, sign, dir, extent,
          anchor: { u: anchor.x, h: anchor.y, v: anchor.z },
          centre: { u: _mid.x, h: _mid.y, v: _mid.z },
        };
        handles.add(handle);
      }
    }
    sizeHandles();
  }

  const sizeHandles = () => {
    const size = Math.max(orbit.radius * .011, .014);
    for (const handle of handles.children) handle.scale.setScalar(size);
  };

  const selection = new THREE.Box3Helper(new THREE.Box3(), 0xa8802f);
  selection.visible = false; scene.add(selection);

  // Els materials de part(), tal com els fa el joc a part-materials.js: una
  // peça amb opacitat per sota d'1 es dibuixa transparent i no escriu fondària.
  const materials = new Map();
  const material = (part, shape) => {
    const opacity = part.opacity ?? 1, roughness = part.roughness ?? .92;
    const metalness = part.metalness ?? 0;
    const twoSided = part.doubleSide === true || shape === 'fan';
    const id = `${part.color}:${opacity}:${roughness}:${metalness}:${twoSided}`;
    if (!materials.has(id)) materials.set(id, new THREE.MeshStandardMaterial({
      color: part.color, opacity, roughness, metalness,
      transparent: opacity < 1, depthWrite: !(opacity < 1),
      side: twoSided ? THREE.DoubleSide : THREE.FrontSide,
    }));
    return materials.get(id);
  };

  // ——— càmera orbital pròpia (el joc no porta OrbitControls) ———
  const orbit = { theta: .55, phi: 1.05, radius: 6.5, target: new THREE.Vector3(0, .8, 0) };
  function place() {
    orbit.phi = Math.min(Math.max(orbit.phi, .08), Math.PI / 2 - .02);
    orbit.radius = Math.min(Math.max(orbit.radius, 1.4), 40);
    camera.position.set(
      orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      orbit.target.y + orbit.radius * Math.cos(orbit.phi),
      orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta));
    camera.lookAt(orbit.target);
  }

  // ——— arrossegar peces ———
  // Moure una peça demana Alt + botó dret: amb el botó esquerre sol n'hi havia
  // prou amb un pols per desplaçar-la sense voler.
  //
  // El ratolí es mou en dues dimensions i la peça en tres, així que cal decidir
  // sobre quin pla llisca: l'horitzontal que passa pel punt agafat, o un de
  // vertical encarat a la càmera quan també es prem Majúscules.
  const _normal = new THREE.Vector3(), _point = new THREE.Vector3();

  /** El pla on llisca la peça: horitzontal, o vertical i encarat a la càmera. */
  function dragPlane(vertical, point) {
    const plane = new THREE.Plane();
    if (vertical) {
      _normal.subVectors(camera.position, point); _normal.y = 0;
      if (_normal.lengthSq() < 1e-9) _normal.set(0, 0, 1);
      return plane.setFromNormalAndCoplanarPoint(_normal.normalize(), point);
    }
    return plane.setFromNormalAndCoplanarPoint(_normal.set(0, 1, 0), point);
  }

  /**
   * L'arrossegament es fa a trams: cada cop que prems o deixes anar Majúscules
   * en comença un de nou, amb el pla que toca, des d'on és ara el punt agafat.
   * base és el que s'havia mogut abans del tram; last, el total fins ara.
   */
  function grab(event) {
    if (!onDrag) return null;
    const hit = trace(event);
    if (!hit) return null;
    if (onDrag('start', hit.object.userData.index, false, event.shiftKey) === false) return null;
    const zero = { du: 0, dh: 0, dv: 0 };
    return {
      x: event.clientX, y: event.clientY, part: true,
      vertical: event.shiftKey, plane: dragPlane(event.shiftKey, hit.point),
      from: hit.point.clone(), base: { ...zero }, last: { ...zero },
    };
  }

  /** Majúscules ha canviat a mig arrossegament: nou tram des del punt actual. */
  function switchPlane(vertical) {
    const { from, base, last } = dragging;
    from.x += last.du - base.du; from.y += last.dh - base.dh; from.z += last.dv - base.dv;
    dragging.base = { ...last };
    dragging.vertical = vertical;
    dragging.plane = dragPlane(vertical, from);
    onDrag('mode', null, false, vertical);
  }

  function grabHandle(event) {
    if (!onResize || !handles.children.length) return null;
    aim(event);
    const hit = ray.intersectObjects(handles.children, false)[0];
    if (!hit) return null;
    const data = hit.object.userData;
    if (data.group) {
      const { sign, dir, extent, anchor, centre } = data;
      if (onResize('start', { kind: 'group', extent, anchor, centre }) === false) return null;
      return {
        x: event.clientX, y: event.clientY, resize: true, group: true,
        sign, dir: dir.clone(), from: hit.object.position.clone(),
      };
    }
    const { key, sign, span, dir, per, both, index } = data;
    const from = hit.object.position.clone();
    if (onResize('start', { index, key, per, both }) === false) return null;
    return { x: event.clientX, y: event.clientY, resize: true, sign, span, dir: dir.clone(), from };
  }

  /**
   * Quant ha lliscat el punter al llarg de l'eix de la nansa: el punt de la
   * recta de l'eix més proper al raig del ratolí. Null si el mires de cantell.
   */
  function alongAxis(event, from, dir) {
    aim(event);
    const r = ray.ray.direction;
    _w0.subVectors(ray.ray.origin, from);
    const b = r.dot(dir), rw = r.dot(_w0), dw = dir.dot(_w0);
    const denom = 1 - b * b;
    if (Math.abs(denom) < 1e-6) return null;
    return (dw - b * rw) / denom;
  }

  /** On cau el punter sobre el pla de l'arrossegament. Null si hi és paral·lel. */
  function onPlane(event, plane) {
    aim(event);
    return ray.ray.intersectPlane(plane, _point) ? _point : null;
  }

  let dragging = null, moved = 0;
  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture(event.pointerId);
    moved = 0;
    if (event.button === 2) rightDown = performance.now();
    const stretching = event.button === 0 && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    // AltGr, als teclats catalans i castellans, arriba com a Ctrl+Alt: també val.
    const holding = event.button === 2 && event.altKey;
    dragging = (stretching ? grabHandle(event) : null)
      ?? (holding ? grab(event) : null)
      // Alt + botó dret és per moure peces: si no n'agafa cap, no gira la càmera.
      ?? (holding ? { x: event.clientX, y: event.clientY, idle: true }
        : { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 1 });
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging || dragging.idle) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    dragging.x = event.clientX; dragging.y = event.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (dragging.resize) {
      const slid = alongAxis(event, dragging.from, dragging.dir);
      if (slid === null || moved < 3) return;
      onResize('move', dragging.group
        ? { grow: dragging.sign * slid, both: event.shiftKey }
        : { grow: dragging.sign * slid / dragging.span, both: event.shiftKey });
    } else if (dragging.part) {
      if (event.shiftKey !== dragging.vertical) switchPlane(event.shiftKey);
      const point = onPlane(event, dragging.plane);
      if (!point || moved < 3) return;
      const { from, base } = dragging;
      dragging.last = dragging.vertical
        ? { du: base.du, dh: base.dh + point.y - from.y, dv: base.dv }
        : { du: base.du + point.x - from.x, dh: base.dh, dv: base.dv + point.z - from.z };
      onDrag('move', dragging.last);
    } else if (dragging.pan) {
      const scale = orbit.radius * .0022;
      orbit.target.x -= (dx * Math.cos(orbit.theta) - dy * Math.sin(orbit.theta) * Math.cos(orbit.phi)) * scale;
      orbit.target.z += (dx * Math.sin(orbit.theta) + dy * Math.cos(orbit.theta) * Math.cos(orbit.phi)) * scale;
      orbit.target.y += dy * Math.sin(orbit.phi) * scale;
    } else {
      orbit.theta -= dx * .008; orbit.phi -= dy * .006;
    }
    place();
  });
  canvas.addEventListener('pointerup', event => {
    // Un clic net sobre una peça no l'ha de moure: desfà l'arrossegament.
    if (dragging?.resize) onResize(moved < 6 ? 'cancel' : 'end');
    else if (dragging?.part) onDrag(moved < 6 ? 'cancel' : 'end');
    else if (dragging && moved < 6 && event.button === 0) pick(event);
    dragging = null;
  });
  canvas.addEventListener('pointercancel', () => {
    if (dragging?.resize) onResize('cancel');
    else if (dragging?.part) onDrag('cancel');
    dragging = null;
  });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    orbit.radius *= event.deltaY > 0 ? 1.1 : 1 / 1.1;
    place();
  }, { passive: false });
  // El menú del botó dret mai no ha de sortir sobre la vista. No n'hi ha prou
  // amb el llenç: les etiquetes dels eixos i els botons de càmera hi són a
  // sobre, i en deixar anar el botó fora de la vista —cosa fàcil mentre
  // arrossegues— el menú sortiria on hagi caigut el punter.
  const stage = canvas.parentElement ?? canvas;
  stage.addEventListener('contextmenu', event => event.preventDefault());

  let rightDown = 0;
  addEventListener('contextmenu', event => {
    if (!dragging && performance.now() - rightDown > 600) return;
    event.preventDefault();
    rightDown = 0;
  }, true);

  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function aim(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
  }

  /** La peça visible més propera sota el punter, si n'hi ha cap. */
  function trace(event) {
    aim(event);
    return ray.intersectObjects(parts.children.filter(mesh => mesh.visible), false)[0] ?? null;
  }

  function pick(event) {
    const hit = trace(event);
    onPick(hit ? hit.object.userData.index : null, event.ctrlKey || event.metaKey ? 'toggle' : 'single', event.altKey);
  }

  function line(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .85 }));
  }

  function buildGuides(mod, options) {
    guides.clear(); ghosts.clear();
    const { width, depth } = footprint(mod.previewSize);
    const hw = width * UNIT / 2, hd = depth * UNIT / 2;
    guides.add(line([[-hw, .002, -hd], [hw, .002, -hd], [hw, .002, hd], [-hw, .002, hd], [-hw, .002, -hd]], LINE_PLOT));
    for (let i = 1; i < width; i++) guides.add(line([[-hw + i * UNIT, .002, -hd], [-hw + i * UNIT, .002, hd]], LINE_CELL));
    for (let i = 1; i < depth; i++) guides.add(line([[-hw, .002, -hd + i * UNIT], [hw, .002, -hd + i * UNIT]], LINE_CELL));

    if (options.heights) {
      const top = Math.max(mod.height, 1) + .4;
      for (let y = TERRAIN_STEP; y < top; y += TERRAIN_STEP)
        guides.add(line([[-hw, y, -hd], [-hw - .18, y, -hd]], LINE_STEP));
      for (let y = FLOOR_HEIGHT; y < top; y += FLOOR_HEIGHT)
        guides.add(line([[-hw, y, -hd], [-hw, y, hd], [hw, y, hd]], LINE_FLOOR));
      guides.add(line([[-hw, 0, -hd], [-hw, top, -hd]], LINE_FLOOR));
    }
    if (options.neighbours) {
      const shell = new THREE.MeshStandardMaterial({ color: 0xe6dcc6, transparent: true, opacity: .32, roughness: 1 });
      for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const w = dx ? UNIT : width * UNIT, d = dz ? UNIT : depth * UNIT;
        const box = new THREE.Mesh(new THREE.BoxGeometry(w, FLOOR_HEIGHT * 2, d), shell);
        box.position.set(dx * (hw + (dx ? UNIT / 2 : 0)), FLOOR_HEIGHT, dz * (hd + (dz ? UNIT / 2 : 0)));
        ghosts.add(box);
      }
    }
    if (!options.axes) { setLabels([]); return; }

    // L'aresta de la façana, doblada i en to de teula perquè es distingeixi.
    guides.add(line([[-hw, .006, hd], [hw, .006, hd]], LINE_SOUTH));
    guides.add(line([[-hw, .012, hd], [hw, .012, hd]], LINE_SOUTH));

    const top = Math.max(mod.height, 1) + .4;
    const arrow = (from, to, side, color) => {
      guides.add(line([from, to], color));
      guides.add(line([side[0], to, side[1]], color));
    };
    arrow([0, .01, 0], [hw + .42, .01, 0], [[hw + .30, .01, -.07], [hw + .30, .01, .07]], LINE_AXIS);
    arrow([0, .01, 0], [0, .01, hd + .42], [[-.07, .01, hd + .30], [.07, .01, hd + .30]], LINE_SOUTH);
    arrow([-hw, 0, -hd], [-hw, top + .18, -hd],
      [[-hw - .06, top + .06, -hd], [-hw + .06, top + .06, -hd]], LINE_FLOOR);

    setLabels([
      { text: '+u  est', at: [hw + .62, .01, 0] },
      { text: '−u  oest', at: [-hw - .62, .01, 0] },
      { text: '+v  sud · façana', at: [0, .01, hd + .66], tone: 'south' },
      { text: '−v  nord', at: [0, .01, -hd - .40] },
      { text: '+h', at: [-hw - .16, top + .22, -hd], tone: 'height' },
      { text: '0,0', at: [.16, .01, -.16] },
    ]);
  }

  function buildParts(mod, chosen) {
    parts.clear();
    mod.parts.forEach((part, index) => {
      const mesh = new THREE.Mesh(geometries[part.shape] ?? geometries.box, material(part, part.shape));
      mesh.position.set(part.u, part.h, part.v);
      mesh.rotation.set(part.rx, part.ry, part.rz);
      mesh.scale.set(part.sx || .001, part.sy || .001, part.sz || .001);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.index = index;
      // Una peça amagada no es dibuixa ni es pot clicar, però la malla existeix
      // igualment perquè les mesures del mod no depenguin del que estiguis mirant.
      mesh.visible = !part.hidden;
      parts.add(mesh);
    });
    const box = new THREE.Box3();
    let any = false;
    const byIndex = new Map(parts.children.map(mesh => [mesh.userData.index, mesh]));
    for (const index of chosen) {
      const mesh = byIndex.get(index);
      if (!mesh) continue;
      box.expandByObject(mesh);
      any = true;
    }
    selection.visible = any;
    if (any) selection.box.copy(box);
  }

  /**
   * Les mesures es calculen a mà des de la geometria de cada malla, sense passar
   * per setFromObject(): així una peça amagada continua comptant i l'alçada
   * declarada no canvia pel fet d'amagar-ne una.
   */
  const _box = new THREE.Box3(), _total = new THREE.Box3();
  function measure(mod) {
    if (!mod.parts.length) return null;
    _total.makeEmpty();
    for (const mesh of parts.children) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      mesh.updateMatrixWorld(true);
      _box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
      _total.union(_box);
    }
    if (_total.isEmpty()) return null;
    return {
      minU: _total.min.x, maxU: _total.max.x,
      minH: _total.min.y, maxH: _total.max.y,
      minV: _total.min.z, maxV: _total.max.z,
    };
  }

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  let request = 0;
  function loop() { request = requestAnimationFrame(loop); placeLabels(); sizeHandles(); renderer.render(scene, camera); }
  place(); resize(); loop();

  return {
    update(mod, chosen, options) {
      buildGuides(mod, options);
      buildParts(mod, chosen);
      buildHandles(mod, chosen, options);
      const measured = measure(mod);
      const buried = !!measured && measured.minH < -.001;
      ground.material.opacity = buried ? .35 : 1;
      ground.material.transparent = buried;
      ground.receiveShadow = !buried;
      return measured;
    },
    frame(mod) {
      const { width, depth } = footprint(mod.previewSize);
      orbit.target.set(0, Math.max(mod.height, 1) * .42, 0);
      orbit.radius = Math.max(width, depth) * UNIT * 1.6 + Math.max(mod.height, 1) * 1.1 + 1.6;
      orbit.theta = .55; orbit.phi = 1.05; place();
    },
    look(theta, phi) { orbit.theta = theta; orbit.phi = phi; place(); },
    snapshot() { renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
    dispose() { cancelAnimationFrame(request); overlay.remove(); renderer.dispose(); },
  };
}
