// 3D barber pole for the home hero. Loaded as a module; the CSS pole stays visible if WebGL or the CDN fails.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const stage = document.querySelector('.pole-stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 12.5);

  // Stripe texture: navy / cream / brass diagonal bands
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#F5EFE6'; g.fillRect(0, 0, 256, 256);
  const band = (color, offset) => {
    g.fillStyle = color;
    for (let k = -2; k < 3; k++) {
      g.beginPath();
      const o = offset + k * 256;
      g.moveTo(o, 0); g.lineTo(o + 64, 0); g.lineTo(o + 64 + 256, 256); g.lineTo(o + 256, 256);
      g.fill();
    }
  };
  band('#14213D', 0);
  band('#B08D57', 128);
  const stripes = new THREE.CanvasTexture(c);
  stripes.colorSpace = THREE.SRGBColorSpace;
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
  stripes.repeat.set(1, 2.2);
  stripes.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const pole = new THREE.Group();
  scene.add(pole);

  const brass = new THREE.MeshStandardMaterial({ color: 0xB08D57, metalness: 0.9, roughness: 0.28 });
  const H = 4.2, R = 0.55;

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.45, metalness: 0.05 })
  );
  pole.add(core);

  // Glass sleeve
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.12, R + 0.12, H, 64, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.22, clearcoat: 1 })
  );
  pole.add(glass);

  // Brass caps, rings and finial
  const capGeo = new THREE.CylinderGeometry(R + 0.22, R + 0.22, 0.35, 64);
  const ringGeo = new THREE.TorusGeometry(R + 0.2, 0.06, 16, 64);
  [1, -1].forEach((s) => {
    const cap = new THREE.Mesh(capGeo, brass);
    cap.position.y = s * (H / 2 + 0.17);
    pole.add(cap);
    const ring = new THREE.Mesh(ringGeo, brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = s * (H / 2 + 0.38);
    pole.add(ring);
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R + 0.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), brass);
  dome.position.y = H / 2 + 0.38;
  pole.add(dome);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), brass);
  knob.position.y = H / 2 + 1.08;
  pole.add(knob);
  const base = new THREE.Mesh(new THREE.ConeGeometry(R + 0.2, 0.5, 64), brass);
  base.rotation.x = Math.PI;
  base.position.y = -(H / 2 + 0.62);
  pole.add(base);

  // Wall bracket
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), brass);
  arm.position.set(0, 1.2, -0.95);
  pole.add(arm);

  // Lighting: warm key, cool harbour rim
  scene.add(new THREE.HemisphereLight(0xfff2dd, 0x14213D, 0.9));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa2d6, 1.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xB08D57, 8, 12);
  fill.position.set(-2, -2, 3);
  scene.add(fill);

  pole.rotation.z = -0.08;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = stage;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole pole in frame on narrow/short stages
    camera.position.z = h < 420 ? 14 : 12.5; // pole is ~6.6 units tall incl. finial and base
    camera.updateProjectionMatrix();
    if (reduceMotion) renderer.render(scene, camera); // no loop running, so redraw on resize
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // Gentle pointer parallax
  let tx = 0, ty = 0;
  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 0.5;
    ty = (e.clientY / innerHeight - 0.5) * 0.25;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  const frame = () => {
    const t = clock.getElapsedTime();
    stripes.offset.y = -t * 0.18;           // the classic "endless climb"
    pole.rotation.y += (tx - pole.rotation.y) * 0.05;
    pole.rotation.x += (ty - pole.rotation.x) * 0.05;
    pole.position.y = Math.sin(t * 0.8) * 0.06;
    renderer.render(scene, camera);
  };

  stage.classList.add('is-3d');
  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    renderer.setAnimationLoop(() => { if (visible) frame(); });
  }
} catch (err) {
  console.warn('3D pole unavailable, using CSS fallback.', err);
}
