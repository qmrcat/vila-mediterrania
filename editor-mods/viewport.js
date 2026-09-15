// La vista 3D. Dibuixa cada peça com una malla independent (això és un editor,
// no el joc: aquí no cal instanciar res) i hi afegeix les guies de la parcel·la.
import * as THREE from '../vendor/three.module.min.js';
import { geometries } from './shapes.js';
import { UNIT, FLOOR_HEIGHT, TERRAIN_STEP } from './constants.js';
import { footprint } from './format.js';

const LINE_PLOT = 0x1c565b, LINE_CELL = 0x8fa2a0, LINE_FLOOR = 0xb0553a, LINE_STEP = 0xc9bca0;

export function createViewport(canvas, { onPick }) {
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

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xcdc3ab, roughness: 1 }));
  ground.position.y = -.002; ground.receiveShadow = true; scene.add(ground);

  const guides = new THREE.Group(); scene.add(guides);
  const ghosts = new THREE.Group(); scene.add(ghosts);
  const parts = new THREE.Group(); scene.add(parts);

  const selection = new THREE.Box3Helper(new THREE.Box3(), 0xa8802f);
  selection.visible = false; scene.add(selection);

  const materials = new Map();
  const material = (color, shape) => {
    const id = `${color}:${shape === 'fan'}`;
    if (!materials.has(id)) materials.set(id, new THREE.MeshStandardMaterial({
      color, roughness: .92, metalness: 0, side: shape === 'fan' ? THREE.DoubleSide : THREE.FrontSide,
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

  let dragging = null, moved = 0;
  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture(event.pointerId);
    dragging = { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 1 };
    moved = 0;
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    dragging.x = event.clientX; dragging.y = event.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (dragging.pan) {
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
    if (dragging && moved < 6) pick(event);
    dragging = null;
  });
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    orbit.radius *= event.deltaY > 0 ? 1.1 : 1 / 1.1;
    place();
  }, { passive: false });
  canvas.addEventListener('contextmenu', event => event.preventDefault());

  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(parts.children, false)[0];
    onPick(hit ? hit.object.userData.index : null, event.ctrlKey || event.metaKey ? 'toggle' : 'single');
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
    const compass = [[0, hd + .34, 'sud'], [0, -hd - .34, 'nord']];
    for (const [u, v] of compass) guides.add(line([[u - .12, .004, v], [u + .12, .004, v], [u, .004, v > 0 ? v + .2 : v - .2], [u - .12, .004, v]], LINE_PLOT));
  }

  function buildParts(mod, chosen) {
    parts.clear();
    mod.parts.forEach((part, index) => {
      const mesh = new THREE.Mesh(geometries[part.shape] ?? geometries.box, material(part.color, part.shape));
      mesh.position.set(part.u, part.h, part.v);
      mesh.rotation.set(part.rx, part.ry, part.rz);
      mesh.scale.set(part.sx || .001, part.sy || .001, part.sz || .001);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.index = index;
      parts.add(mesh);
    });
    const box = new THREE.Box3();
    let any = false;
    for (const index of chosen) {
      const mesh = parts.children[index];
      if (!mesh) continue;
      box.expandByObject(mesh);
      any = true;
    }
    selection.visible = any;
    if (any) selection.box.copy(box);
  }

  function measure(mod) {
    if (!mod.parts.length) return null;
    const box = new THREE.Box3().setFromObject(parts);
    return { minU: box.min.x, maxU: box.max.x, minH: box.min.y, maxH: box.max.y, minV: box.min.z, maxV: box.max.z };
  }

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  let request = 0;
  function loop() { request = requestAnimationFrame(loop); renderer.render(scene, camera); }
  place(); resize(); loop();

  return {
    update(mod, chosen, options) { buildGuides(mod, options); buildParts(mod, chosen); return measure(mod); },
    frame(mod) {
      const { width, depth } = footprint(mod.previewSize);
      orbit.target.set(0, Math.max(mod.height, 1) * .42, 0);
      orbit.radius = Math.max(width, depth) * UNIT * 1.6 + Math.max(mod.height, 1) * 1.1 + 1.6;
      orbit.theta = .55; orbit.phi = 1.05; place();
    },
    look(theta, phi) { orbit.theta = theta; orbit.phi = phi; place(); },
    snapshot() { renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
    dispose() { cancelAnimationFrame(request); renderer.dispose(); },
  };
}
