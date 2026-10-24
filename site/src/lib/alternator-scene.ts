import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type AlternatorScene = { update: (progress: number) => void; dispose: () => void };
type Part = { group: THREE.Group; closed: number; opened: number; anchor: THREE.Vector3 };
const clamp = THREE.MathUtils.clamp;
const blend = (value: number, start: number, end: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

/** A purpose-built illustrative model. All dimensions are visual, not service specifications. */
export function createAlternatorScene(
  host: HTMLElement,
  labels: HTMLElement[],
  onFailure: () => void,
): AlternatorScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 80);
  camera.position.set(6.5, 3.8, 11);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xf0f5ff, 2.7);
  key.position.set(2, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff3544, 4.5);
  rim.position.set(-4, 1, -4);
  scene.add(rim, new THREE.HemisphereLight(0xe8edf8, 0x27131a, 0.5));
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-3, -1, 5);
  scene.add(fill);

  const material = (color: number, metalness: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const alloy = material(0x8c929b, 0.88, 0.3);
  const bright = material(0xd9dce1, 0.95, 0.19);
  const steel = material(0x454a53, 0.87, 0.31);
  const dark = material(0x191c22, 0.65, 0.36);
  const copper = material(0xc57338, 0.88, 0.24);
  const copperLight = material(0xe4a065, 0.84, 0.24);
  const plastic = material(0x14191e, 0.1, 0.43);
  const board = material(0x263c34, 0.3, 0.5);
  const materials = [alloy, bright, steel, dark, copper, copperLight, plastic, board];
  const rawGeometries = new Set<THREE.BufferGeometry>();
  const bakedGeometries: THREE.BufferGeometry[] = [];

  function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
    rawGeometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    group.add(object);
    return object;
  }
  function cylinder(group: THREE.Group, radius: number, depth: number, z: number, mat = alloy, x = 0, y = 0, segments = 64) {
    const object = mesh(group, new THREE.CylinderGeometry(radius, radius, depth, segments), mat, x, y, z);
    object.rotation.x = Math.PI / 2;
    return object;
  }
  function ring(group: THREE.Group, outer: number, inner: number, depth: number, z: number, mat = alloy) {
    const points = [[inner, -depth / 2], [outer - 0.018, -depth / 2], [outer, -depth / 2 + 0.018], [outer, depth / 2 - 0.018], [outer - 0.018, depth / 2], [inner, depth / 2], [inner, -depth / 2]];
    const geometry = new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(r, h)), 64);
    const object = mesh(group, geometry, mat, 0, 0, z);
    object.rotation.x = Math.PI / 2;
    return object;
  }
  function box(group: THREE.Group, size: [number, number, number], mat: THREE.Material, x: number, y: number, z: number) {
    return mesh(group, new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.14), mat, x, y, z);
  }
  function bolt(group: THREE.Group, x: number, y: number, z: number, length = 0.13) {
    cylinder(group, 0.085, 0.055, z, bright, x, y, 6);
    cylinder(group, 0.043, length, z - length / 2, steel, x, y, 16);
    const washer = mesh(group, new THREE.TorusGeometry(0.075, 0.014, 6, 18), steel, x, y, z - 0.025);
    return washer;
  }
  function housing(front: boolean) {
    const g = new THREE.Group();
    const direction = front ? 1 : -1;
    ring(g, 1.15, 1.025, 0.14, -direction * 0.21);
    ring(g, 1.115, 0.96, 0.13, direction * 0.05);
    ring(g, 0.91, 0.75, 0.12, direction * 0.38);
    ring(g, 0.37, 0.16, 0.22, direction * 0.39, bright);
    ring(g, 0.27, 0.15, 0.05, direction * 0.51, dark);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      const rib = box(g, [0.095, 0.2, 0.59], alloy, Math.cos(a) * 1.025, Math.sin(a) * 1.025, 0.015);
      rib.rotation.z = a;
      rib.rotation.y = direction * 0.28;
      const spoke = box(g, [0.62, 0.09, 0.12], alloy, Math.cos(a) * 0.61, Math.sin(a) * 0.61, direction * 0.38);
      spoke.rotation.z = a + 0.18;
      const fin = box(g, [0.07, 0.13, 0.19], bright, Math.cos(a) * 1.13, Math.sin(a) * 1.13, -direction * 0.1);
      fin.rotation.z = a;
    }
    for (const a of [0.72, 2.7, 4.8]) {
      const x = Math.cos(a) * 1.19, y = Math.sin(a) * 1.19;
      const tab = box(g, [0.44, 0.29, 0.36], alloy, x, y, -0.02);
      tab.rotation.z = a;
      cylinder(g, 0.14, 0.38, -0.02, alloy, Math.cos(a) * 1.4, Math.sin(a) * 1.4);
      cylinder(g, 0.073, 0.385, -0.02, dark, Math.cos(a) * 1.4, Math.sin(a) * 1.4);
      bolt(g, Math.cos(a) * 1.08, Math.sin(a) * 1.08, direction * 0.22);
    }
    return g;
  }

  const rear = housing(false);
  // Connector and insulating terminal on the rear casing.
  box(rear, [0.37, 0.26, 0.26], plastic, 0.37, 0.57, -0.48);
  box(rear, [0.23, 0.14, 0.04], dark, 0.37, 0.57, -0.63);
  cylinder(rear, 0.075, 0.26, -0.48, copperLight, -0.38, 0.5);
  cylinder(rear, 0.12, 0.06, -0.51, bright, -0.38, 0.5, 6);

  const rectifier = new THREE.Group();
  ring(rectifier, 0.84, 0.4, 0.1, 0, steel);
  ring(rectifier, 0.77, 0.48, 0.035, 0.075, board);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const heatSink = box(rectifier, [0.25, 0.035, 0.21], alloy, Math.cos(a) * 0.73, Math.sin(a) * 0.73, -0.07);
    heatSink.rotation.z = a;
    if (i % 2 === 0) {
      cylinder(rectifier, 0.095, 0.12, 0.13, plastic, Math.cos(a) * 0.62, Math.sin(a) * 0.62, 18);
      cylinder(rectifier, 0.03, 0.05, 0.21, copperLight, Math.cos(a) * 0.62, Math.sin(a) * 0.62, 10);
    }
  }
  box(rectifier, [0.3, 0.28, 0.2], plastic, 0.1, -0.33, 0.13);
  bolt(rectifier, -0.5, -0.36, 0.14);
  bolt(rectifier, 0.45, 0.42, 0.14);

  const stator = new THREE.Group();
  ring(stator, 1.105, 0.79, 0.58, 0, steel);
  for (let i = 0; i < 18; i++) ring(stator, 1.115, 1.095, 0.009, -0.27 + i * 0.032, dark);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    const tooth = box(stator, [0.22, 0.07, 0.53], steel, Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0);
    tooth.rotation.z = a;
    for (let j = 0; j < 5; j++) {
      const winding = mesh(stator, new THREE.TorusGeometry(0.235 + j * 0.012, 0.016, 6, 24), j % 2 ? copper : copperLight);
      winding.rotation.set(Math.PI / 2, 0, 0);
      winding.scale.set(0.72, 1.65, 1);
      const holder = new THREE.Group();
      holder.add(winding);
      holder.position.set(Math.cos(a) * 0.91, Math.sin(a) * 0.91, 0);
      holder.rotation.z = a + Math.PI / 2;
      stator.add(holder);
    }
  }
  const rotor = new THREE.Group();
  cylinder(rotor, 0.13, 2.25, 0.25, bright);
  cylinder(rotor, 0.49, 0.48, 0, copper);
  for (let i = 0; i < 12; i++) ring(rotor, 0.51, 0.48, 0.025, -0.22 + i * 0.04, copperLight);
  for (const side of [-1, 1]) {
    cylinder(rotor, 0.64, 0.1, side * 0.29, steel);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + (side === 1 ? Math.PI / 6 : 0);
      const claw = new THREE.Shape();
      claw.moveTo(-0.17, -0.26); claw.lineTo(0.17, -0.26); claw.lineTo(0.065, 0.26); claw.lineTo(-0.065, 0.26); claw.closePath();
      const shape = new THREE.ExtrudeGeometry(claw, { depth: 0.12, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.02, bevelSegments: 2, steps: 1 });
      const finger = mesh(rotor, shape, alloy, Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0);
      finger.rotation.set(Math.PI / 2, 0, a - Math.PI / 2);
      // Orient the tapered fingers along the rotor shaft.
      const holder = new THREE.Group();
      rotor.remove(finger);
      finger.position.set(0, 0.56, 0);
      finger.rotation.set(side * Math.PI / 2, 0, 0);
      holder.rotation.z = a;
      holder.add(finger);
      rotor.add(holder);
    }
  }
  ring(rotor, 0.22, 0.13, 0.13, -0.73, copper);
  ring(rotor, 0.22, 0.13, 0.13, -0.91, copper);
  ring(rotor, 0.21, 0.13, 0.06, -0.82, plastic);
  ring(rotor, 0.25, 0.13, 0.17, 0.7, steel);
  const front = housing(true);
  // Internal centrifugal fan visible through the housing vents.
  ring(front, 0.7, 0.2, 0.035, -0.27, steel);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const blade = box(front, [0.31, 0.035, 0.13], bright, Math.cos(a) * 0.56, Math.sin(a) * 0.56, -0.25);
    blade.rotation.z = a + 0.5;
  }
  const pulley = new THREE.Group();
  ring(pulley, 0.52, 0.13, 0.38, 0, dark);
  for (let i = 0; i < 6; i++) ring(pulley, 0.58, 0.49, 0.035, -0.18 + i * 0.072, steel);
  ring(pulley, 0.52, 0.27, 0.04, 0.23, dark);
  ring(pulley, 0.27, 0.14, 0.06, 0.26, bright);
  cylinder(pulley, 0.17, 0.11, 0.31, bright, 0, 0, 6);
  cylinder(pulley, 0.072, 0.005, 0.37, dark, 0, 0, 6);

  const assembly = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.rotation.y = Math.PI / 2;
  assembly.add(pivot);
  scene.add(assembly);
  const parts: Part[] = [
    { group: rear, closed: -0.76, opened: -4.9, anchor: new THREE.Vector3(0, 1.25, 0) },
    { group: rectifier, closed: -0.56, opened: -3.3, anchor: new THREE.Vector3(0, -0.9, 0) },
    { group: stator, closed: 0, opened: -1.6, anchor: new THREE.Vector3(0, 1.15, 0) },
    { group: rotor, closed: 0, opened: 0.65, anchor: new THREE.Vector3(0, -0.7, 0) },
    { group: front, closed: 0.76, opened: 2.9, anchor: new THREE.Vector3(0, 1.25, 0) },
    { group: pulley, closed: 1.55, opened: 4.75, anchor: new THREE.Vector3(0, -0.7, 0) },
  ];
  // Bake static meshes by material: the hundreds of individual coils and fins
  // become a small number of draw calls while each assembly stays movable.
  for (const part of parts) {
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    part.group.updateMatrixWorld(true);
    part.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const mat = object.material as THREE.Material;
      const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
      const list = buckets.get(mat) ?? [];
      list.push(geometry);
      buckets.set(mat, list);
    });
    part.group.clear();
    for (const [mat, geometries] of buckets) {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach(item => item.dispose());
      if (geometry) { bakedGeometries.push(geometry); part.group.add(new THREE.Mesh(geometry, mat)); }
    }
    pivot.add(part.group);
  }
  rawGeometries.forEach(geometry => geometry.dispose());

  const axisMaterial = new THREE.LineDashedMaterial({ color: 0xc9a4aa, transparent: true, opacity: 0, dashSize: 0.07, gapSize: 0.1 });
  const axisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -5.8), new THREE.Vector3(0, 0, 5.7)]);
  const axis = new THREE.Line(axisGeometry, axisMaterial);
  axis.computeLineDistances();
  pivot.add(axis);
  let progress = 0, width = 1, height = 1, disposed = false;
  const projected = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  camera.updateMatrixWorld();
  cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
  cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);

  function draw() {
    if (disposed || document.hidden) return;
    const open = blend(progress, 0.12, 0.87);
    const mobile = width <= 960;
    const aspect = width / height;
    const frameHeight = mobile ? 7.4 : 6.4;
    camera.left = -frameHeight * aspect / 2;
    camera.right = frameHeight * aspect / 2;
    camera.top = frameHeight / 2;
    camera.bottom = -frameHeight / 2;
    camera.updateProjectionMatrix();
    // Keep the assembly beside the desktop copy and below it on phones.
    // The entire hero moves with the page throughout the animation.
    const mobileScale = Math.min(1, frameHeight * aspect / 11.1);
    const initialScale = Math.min(1.35, frameHeight * aspect * 0.46 / 3.4);
    // Interpolate the visible span so partially opened parts also fit a phone.
    const mobileFit = 1 / THREE.MathUtils.lerp(1 / 0.8, 1 / mobileScale, open);
    const desktopScale = Math.min(1, frameHeight * aspect * 0.5 / 11.6);
    const desktopFit = 1 / THREE.MathUtils.lerp(1 / initialScale, 1 / desktopScale, open);
    assembly.scale.setScalar(mobile ? mobileFit : desktopFit);
    assembly.position.copy(cameraRight).multiplyScalar(mobile ? 0 : frameHeight * aspect * 0.25);
    // CSS reserves the final 320px of the mobile hero for the model.
    assembly.position.addScaledVector(cameraUp, mobile ? -frameHeight / 2 + frameHeight * 160 / height : 0.05);
    assembly.rotation.set(0, -0.15 * (1 - open), mobile ? -0.16 * (1 - open) : -0.06 * (1 - open));
    parts.forEach((part, index) => {
      const separation = blend(progress, 0.1 + (5 - index) * 0.02, 0.8 + (5 - index) * 0.015);
      part.group.position.z = THREE.MathUtils.lerp(part.closed, part.opened, separation);
    });
    axisMaterial.opacity = open * 0.25;
    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
    parts.forEach((part, index) => {
      const label = labels[index];
      if (!label) return;
      projected.copy(part.anchor).applyMatrix4(part.group.matrixWorld).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
    });
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const handleContextLost = (event: Event) => { event.preventDefault(); onFailure(); };
  renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
  document.addEventListener("visibilitychange", draw);
  resize();
  return {
    update(value) { progress = value; draw(); },
    dispose() {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", draw);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      bakedGeometries.forEach(geometry => geometry.dispose());
      materials.forEach(mat => mat.dispose());
      axisGeometry.dispose();
      axisMaterial.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
