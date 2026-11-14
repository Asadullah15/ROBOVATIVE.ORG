/* ==========================================================================
   ROBOVATIVE — immersive 3D world
   --------------------------------------------------------------------------
   A single WebGL canvas sits behind the page. Scrolling flies the camera
   down a corridor of "stations", one per section, each with its own set
   piece built from procedural geometry (no external models to download).

   The page keeps scrolling normally, so all content stays real HTML:
   selectable, searchable and reachable by keyboard and screen readers.
   ========================================================================== */
import * as THREE from "three";

/* ---- Brand palette (matches the CSS tokens) ---- */
const C = {
  bg:     0x05070A,
  orange: 0xFF8A00,
  pink:   0xFF2D8D,
  purple: 0x7C5CFF,
  steel:  0x8FA3BF,
  white:  0xFFFFFF,
};

/* Distance between scene stations along -Z. */
const GAP = 60;
/* A set piece only updates while the camera is within this many units. */
const ACTIVE_RANGE = GAP * 1.35;

const isMobile = matchMedia("(max-width:860px)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   Small helpers
   ========================================================================== */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

function edgeMesh(geo, color, opacity = 0.55) {
  const edges = new THREE.EdgesGeometry(geo, 25);
  return new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function glassMat(color, opacity = 0.14) {
  return new THREE.MeshStandardMaterial({
    color, transparent: true, opacity,
    roughness: 0.35, metalness: 0.6,
    depthWrite: false,
  });
}

function glowMat(color, opacity = 0.9) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
}

/* ==========================================================================
   Set pieces
   Each owns a THREE.Group placed at its station. `update` receives:
     dt    seconds since last frame
     t     total elapsed seconds
     near  0..1 — how close the camera is (1 = centred on this station)
   ========================================================================== */
class SetPiece {
  constructor(index) {
    this.group = new THREE.Group();
    this.group.position.z = -index * GAP;
    this.build();
  }
  build() {}
  update() {}
  /* Fade the whole piece as the camera approaches and leaves. */
  setNear(near) {
    this.group.visible = near > 0.001;
    this.group.traverse((o) => {
      if (o.material && o.material.transparent && o.userData.baseOpacity != null) {
        o.material.opacity = o.userData.baseOpacity * near;
      }
    });
  }
  /* Call once after build so setNear has a baseline to scale from. */
  cacheOpacity() {
    this.group.traverse((o) => {
      if (o.material && o.material.transparent) {
        o.userData.baseOpacity = o.material.opacity;
      }
    });
  }
}

/* ---- 1. HOME — the robot ----
   Articulated: the head and eyes track the cursor, the arms swing on their
   own rhythm and periodically wave, it breathes, blinks, and its chest core
   pulses. Built as nested groups so each joint rotates about its own pivot. */
class RobotPiece extends SetPiece {
  build() {
    const g = this.group;
    // Sits right of centre on desktop so the headline column stays clear.
    g.position.x = isMobile ? 0 : 9;
    g.position.y = isMobile ? 2 : 0;

    /* --- torso (the root everything hangs from) --- */
    this.torso = new THREE.Group();
    g.add(this.torso);

    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4.6, 5), glassMat(C.steel, 0.08));
    body.position.y = -7.8;
    body.add(edgeMesh(body.geometry, C.pink, 0.45));
    this.torso.add(body);

    // Chest core — the robot's "heartbeat".
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), glowMat(C.pink, 0.8));
    this.core.position.set(0, -7.4, 2.6);
    this.torso.add(this.core);
    this.coreHalo = new THREE.Mesh(new THREE.SphereGeometry(1.9, 20, 20), glowMat(C.pink, 0.16));
    this.coreHalo.position.copy(this.core.position);
    this.torso.add(this.coreHalo);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 2.2, 16), glassMat(C.steel, 0.12));
    neck.position.y = -4.3;
    neck.add(edgeMesh(neck.geometry, C.steel, 0.3));
    this.torso.add(neck);

    /* --- head group: pivots at the neck so it turns, not slides --- */
    this.headPivot = new THREE.Group();
    this.headPivot.position.y = -3.2;
    this.torso.add(this.headPivot);

    const head = new THREE.Mesh(new THREE.BoxGeometry(7, 6.4, 6), glassMat(C.steel, 0.1));
    head.position.y = 3.2;
    head.add(edgeMesh(head.geometry, C.orange, 0.7));
    this.headPivot.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.9, 0.4), glassMat(C.purple, 0.22));
    visor.position.set(0, 3.9, 3.05);
    visor.add(edgeMesh(visor.geometry, C.purple, 0.5));
    this.headPivot.add(visor);

    this.eyes = [];
    for (const x of [-1.6, 1.6]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 20), glowMat(C.orange, 0.95));
      eye.position.set(x, 3.9, 3.25);
      this.headPivot.add(eye);
      this.eyes.push(eye);
    }

    // Antenna with a blinking tip.
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), glowMat(C.steel, 0.5));
    stalk.position.set(0, 7.5, 0);
    this.headPivot.add(stalk);
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 14), glowMat(C.pink, 1));
    this.beacon.position.set(0, 8.8, 0);
    this.headPivot.add(this.beacon);

    /* --- arms: shoulder pivot -> upper arm -> elbow pivot -> forearm --- */
    this.arms = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 5.4, -6.4, 0);
      this.torso.add(shoulder);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4, 1.3), glassMat(C.steel, 0.12));
      upper.position.y = -2;
      upper.add(edgeMesh(upper.geometry, side < 0 ? C.orange : C.pink, 0.6));
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -4;
      shoulder.add(elbow);

      const fore = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.4, 1.1), glassMat(C.steel, 0.12));
      fore.position.y = -1.7;
      fore.add(edgeMesh(fore.geometry, side < 0 ? C.orange : C.pink, 0.6));
      elbow.add(fore);

      const hand = new THREE.Mesh(new THREE.OctahedronGeometry(0.62), glowMat(C.orange, 0.7));
      hand.position.y = -3.6;
      elbow.add(hand);

      this.arms.push({ shoulder, elbow, hand, side });
    }

    /* --- scanning rings --- */
    this.rings = [];
    for (let i = 0; i < 4; i++) {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(9 + i * 2.4, 0.045, 8, 96),
        glowMat(i % 2 ? C.pink : C.orange, 0.32 - i * 0.055)
      );
      r.rotation.x = Math.PI / 2;
      r.position.y = -3 + i * 0.7;
      g.add(r);
      this.rings.push(r);
    }

    this.blinkAt = 2.5;      // seconds until the next blink
    this.waveAt = 6;         // seconds until the next wave
    this.waving = 0;         // 0..1 progress through a wave
    this.cacheOpacity();
  }

  update(dt, t, near, ctx) {
    const mx = ctx ? ctx.mouse.x : 0;
    const my = ctx ? ctx.mouse.y : 0;

    /* Head tracks the cursor, with a slow idle sway underneath. */
    this.headPivot.rotation.y = lerp(this.headPivot.rotation.y, mx * 0.55 + Math.sin(t * 0.3) * 0.12, 0.07);
    this.headPivot.rotation.x = lerp(this.headPivot.rotation.x, -my * 0.3 + Math.sin(t * 0.45) * 0.04, 0.07);
    this.headPivot.rotation.z = lerp(this.headPivot.rotation.z, mx * 0.1, 0.05);

    /* Whole body leans slightly toward the cursor and breathes. */
    this.torso.rotation.y = lerp(this.torso.rotation.y, mx * 0.3, 0.04);
    this.torso.position.y = Math.sin(t * 1.1) * 0.35;          // float
    this.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;        // breathe

    /* Blink: squash the eyes briefly at irregular intervals. */
    this.blinkAt -= dt;
    let lid = 1;
    if (this.blinkAt < 0.16) lid = Math.abs(this.blinkAt / 0.16);
    if (this.blinkAt < 0) { this.blinkAt = 2 + Math.random() * 4; }
    const pulse = 0.75 + Math.sin(t * 2.1) * 0.25;
    this.eyes.forEach((e) => {
      e.scale.y = Math.max(0.06, lid);
      e.material.opacity = pulse * near;
    });

    /* Beacon blinks on its own faster rhythm. */
    this.beacon.material.opacity = (Math.sin(t * 4.2) > 0.3 ? 1 : 0.15) * near;

    /* Chest core pulses and tumbles. */
    const beat = 1 + Math.sin(t * 2.6) * 0.14;
    this.core.scale.setScalar(beat);
    this.core.rotation.x += dt * 0.6;
    this.core.rotation.y += dt * 0.4;
    this.coreHalo.scale.setScalar(1 + Math.sin(t * 2.6 + 0.4) * 0.22);
    this.coreHalo.material.opacity = (0.1 + Math.sin(t * 2.6) * 0.07) * near;

    /* Arms swing; every so often the right arm raises into a wave. */
    this.waveAt -= dt;
    if (this.waveAt < 0) { this.waving = 0.0001; this.waveAt = 9 + Math.random() * 7; }
    if (this.waving > 0) {
      this.waving += dt * 0.5;
      if (this.waving >= 1) this.waving = 0;
    }
    const w = this.waving > 0 ? Math.sin(this.waving * Math.PI) : 0;

    this.arms.forEach(({ shoulder, elbow, hand, side }) => {
      const phase = t * 1.2 + (side > 0 ? Math.PI : 0);
      const isWaveArm = side > 0;
      const swing = Math.sin(phase) * 0.18;

      shoulder.rotation.x = swing;
      shoulder.rotation.z = side * (0.12 + Math.sin(phase * 0.7) * 0.06)
                          - (isWaveArm ? w * 2.3 : 0);
      elbow.rotation.x = -0.25 + Math.sin(phase + 0.6) * 0.14
                       - (isWaveArm ? w * 0.9 : 0);
      elbow.rotation.z = isWaveArm ? Math.sin(t * 9) * w * 0.5 : 0;
      hand.rotation.y += dt * 1.1;
      hand.material.opacity = (0.55 + Math.sin(t * 3 + side) * 0.2) * near;
    });

    /* Rings spin at different rates and tilt with the cursor. */
    this.rings.forEach((r, i) => {
      r.rotation.z += dt * (0.22 + i * 0.1) * (i % 2 ? -1 : 1);
      r.rotation.x = Math.PI / 2 + my * 0.12;
      r.scale.setScalar(1 + Math.sin(t * 1.4 + i * 0.8) * 0.03);
    });
  }
}

/* ---- 2. ABOUT — a slowly turning knowledge ring ---- */
class RingPiece extends SetPiece {
  build() {
    this.shells = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(
        new THREE.TorusKnotGeometry(7 - i * 1.8, 0.09, 180, 8, 2, 3),
        glowMat([C.orange, C.pink, C.purple][i], 0.5 - i * 0.1)
      );
      s.rotation.set(Math.random(), Math.random(), 0);
      this.group.add(s);
      this.shells.push(s);
    }
    this.cacheOpacity();
  }
  update(dt) {
    this.shells.forEach((s, i) => {
      s.rotation.y += dt * (0.12 + i * 0.05);
      s.rotation.x += dt * 0.04;
    });
  }
}

/* ---- 3. SERVICES — six modules in orbit ---- */
class OrbitPiece extends SetPiece {
  build() {
    this.mods = [];
    const shapes = [
      new THREE.IcosahedronGeometry(1.5),
      new THREE.BoxGeometry(2.3, 2.3, 2.3),
      new THREE.OctahedronGeometry(1.7),
      new THREE.TetrahedronGeometry(1.9),
      new THREE.DodecahedronGeometry(1.6),
      new THREE.TorusGeometry(1.2, 0.42, 10, 28),
    ];
    shapes.forEach((geo, i) => {
      const hub = new THREE.Group();
      const color = [C.orange, C.pink, C.purple][i % 3];
      const m = new THREE.Mesh(geo, glassMat(color, 0.16));
      m.add(edgeMesh(geo, color, 0.75));
      m.position.x = 10;
      hub.add(m);
      hub.rotation.y = (i / shapes.length) * Math.PI * 2;
      hub.rotation.z = Math.sin(i) * 0.2;
      this.group.add(hub);
      this.mods.push({ hub, m, speed: 0.1 + (i % 3) * 0.035 });
    });

    const core = new THREE.Mesh(new THREE.SphereGeometry(2.1, 28, 28), glowMat(C.orange, 0.22));
    this.group.add(core);
    this.cacheOpacity();
  }
  update(dt) {
    this.mods.forEach(({ hub, m, speed }) => {
      hub.rotation.y += dt * speed;
      m.rotation.x += dt * 0.5;
      m.rotation.y += dt * 0.35;
    });
  }
}

/* ---- 4. LAB — benches receding into fog ---- */
class LabPiece extends SetPiece {
  build() {
    for (let i = 0; i < 7; i++) {
      const z = -i * 7;
      for (const x of [-11, 11]) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 4.4), glassMat(C.steel, 0.1));
        bench.position.set(x, -4 + Math.sin(i) * 0.3, z);
        this.group.add(bench, (() => {
          const e = edgeMesh(bench.geometry, i % 2 ? C.pink : C.orange, 0.45);
          e.position.copy(bench.position); return e;
        })());

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), glowMat(C.orange, 0.8));
        lamp.position.set(x, 1.6, z);
        this.group.add(lamp);
      }
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.group.rotation.y = Math.sin(t * 0.14) * 0.1;
  }
}

/* ---- 5. SOLUTIONS — three pillars ---- */
class PillarPiece extends SetPiece {
  build() {
    this.pillars = [];
    [-9, 0, 9].forEach((x, i) => {
      const h = 13 - Math.abs(i - 1) * 3;
      const geo = new THREE.CylinderGeometry(1.9, 2.3, h, 6);
      const color = [C.orange, C.pink, C.purple][i];
      const p = new THREE.Mesh(geo, glassMat(color, 0.13));
      p.position.set(x, 0, 0);
      p.add(edgeMesh(geo, color, 0.7));
      this.group.add(p);

      const cap = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.07, 8, 32), glowMat(color, 0.75));
      cap.rotation.x = Math.PI / 2;
      cap.position.set(x, h / 2 + 0.6, 0);
      this.group.add(cap);
      this.pillars.push({ p, cap, i });
    });
    this.cacheOpacity();
  }
  update(dt, t) {
    this.pillars.forEach(({ p, cap, i }) => {
      p.rotation.y += dt * 0.12;
      cap.position.y += Math.sin(t * 1.1 + i) * dt * 0.5;
      cap.rotation.z += dt * 0.4;
    });
  }
}

/* ---- 6. TRAINING — stacked curriculum panels ---- */
class PanelPiece extends SetPiece {
  build() {
    this.panels = [];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BoxGeometry(13, 0.22, 8);
      const color = i % 2 ? C.pink : C.orange;
      const p = new THREE.Mesh(geo, glassMat(color, 0.1));
      p.position.y = 7 - i * 2.8;
      p.rotation.y = i * 0.16;
      p.add(edgeMesh(geo, color, 0.6));
      this.group.add(p);
      this.panels.push(p);
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.panels.forEach((p, i) => {
      p.rotation.y += dt * 0.07;
      p.position.y += Math.sin(t * 0.9 + i * 0.7) * dt * 0.35;
    });
  }
}

/* ---- 7. PROTOTYPING — a print building up layer by layer ---- */
class PrinterPiece extends SetPiece {
  build() {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 14), glassMat(C.steel, 0.12));
    bed.position.y = -7;
    bed.add(edgeMesh(bed.geometry, C.steel, 0.4));
    this.group.add(bed);

    this.layers = [];
    for (let i = 0; i < 22; i++) {
      const r = 4.2 - Math.abs(i - 11) * 0.18;
      const geo = new THREE.TorusGeometry(r, 0.11, 6, 40);
      const l = new THREE.Mesh(geo, glowMat(i % 3 === 0 ? C.pink : C.orange, 0.7));
      l.rotation.x = Math.PI / 2;
      l.position.y = -6.7 + i * 0.52;
      this.group.add(l);
      this.layers.push(l);
    }

    this.nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 12), glowMat(C.purple, 0.85));
    this.nozzle.rotation.x = Math.PI;
    this.group.add(this.nozzle);
    this.cacheOpacity();
  }
  update(dt, t, near) {
    // Layers appear in sequence on a loop, like a print in progress.
    const cycle = (t * 0.32) % 1.25;
    this.layers.forEach((l, i) => {
      const on = cycle > i / this.layers.length;
      l.material.opacity = (on ? 0.7 : 0.05) * near;
      l.rotation.z += dt * 0.25;
    });
    const top = clamp(cycle, 0, 1) * this.layers.length;
    this.nozzle.position.set(Math.cos(t * 2) * 3, -6.2 + top * 0.52, Math.sin(t * 2) * 3);
  }
}

/* ---- 8. PROJECTS — a drifting card grid ---- */
class CardGridPiece extends SetPiece {
  build() {
    this.cards = [];
    let n = 0;
    for (let row = -1; row <= 1; row++) {
      for (let col = -2; col <= 2; col++) {
        const geo = new THREE.BoxGeometry(5.2, 3.4, 0.18);
        const color = [C.orange, C.pink, C.purple][n % 3];
        const c = new THREE.Mesh(geo, glassMat(color, 0.12));
        c.position.set(col * 6.4, row * 4.6, Math.sin(n) * 2.4);
        c.add(edgeMesh(geo, color, 0.65));
        this.group.add(c);
        this.cards.push({ c, seed: n });
        n++;
      }
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.cards.forEach(({ c, seed }) => {
      c.rotation.y = Math.sin(t * 0.5 + seed) * 0.3;
      c.rotation.x = Math.cos(t * 0.37 + seed) * 0.12;
      c.position.y += Math.sin(t * 0.8 + seed * 1.3) * dt * 0.5;
    });
  }
}

/* ---- 9. GALLERY — planes sweeping through an arc ---- */
class ArcPiece extends SetPiece {
  build() {
    this.planes = [];
    const N = 14;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const geo = new THREE.PlaneGeometry(4.4, 3);
      const color = [C.orange, C.pink, C.purple][i % 3];
      const p = new THREE.Mesh(geo, glassMat(color, 0.14));
      p.position.set(Math.cos(a) * 13, Math.sin(a * 2) * 3.4, Math.sin(a) * 13);
      p.lookAt(0, 0, 0);
      p.add(edgeMesh(geo, color, 0.6));
      this.group.add(p);
      this.planes.push(p);
    }
    this.cacheOpacity();
  }
  update(dt) { this.group.rotation.y += dt * 0.11; }
}

/* ---- 10. KITS — stacked crates ---- */
class CratePiece extends SetPiece {
  build() {
    this.crates = [];
    for (let i = 0; i < 9; i++) {
      const s = 2.6 + (i % 3) * 0.5;
      const geo = new THREE.BoxGeometry(s, s, s);
      const color = [C.orange, C.pink, C.purple][i % 3];
      const c = new THREE.Mesh(geo, glassMat(color, 0.13));
      c.position.set((i % 3 - 1) * 6.4, Math.floor(i / 3) * 4 - 4.5, Math.sin(i) * 3);
      c.add(edgeMesh(geo, color, 0.7));
      this.group.add(c);
      this.crates.push({ c, seed: i });
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.crates.forEach(({ c, seed }) => {
      c.rotation.y += dt * (0.15 + seed * 0.012);
      c.rotation.x = Math.sin(t * 0.6 + seed) * 0.16;
    });
  }
}

/* ---- 11. REVIEWS — a constellation of stars ---- */
class StarPiece extends SetPiece {
  build() {
    this.stars = [];
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Group();
      const spikes = 5;
      for (let s = 0; s < spikes; s++) {
        const geo = new THREE.ConeGeometry(0.42, 2.3, 4);
        const m = new THREE.Mesh(geo, glowMat(C.orange, 0.65));
        m.rotation.z = (s / spikes) * Math.PI * 2;
        m.position.set(Math.sin((s / spikes) * Math.PI * 2) * 1.1,
                       Math.cos((s / spikes) * Math.PI * 2) * 1.1, 0);
        star.add(m);
      }
      star.position.set((i - 2) * 6.6, Math.sin(i * 1.4) * 3, Math.cos(i) * 2);
      this.group.add(star);
      this.stars.push({ star, seed: i });
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.stars.forEach(({ star, seed }) => {
      star.rotation.z += dt * 0.3;
      star.position.y += Math.sin(t * 1.2 + seed) * dt * 0.6;
    });
  }
}

/* ---- 12. CONTACT — a converging portal ---- */
class PortalPiece extends SetPiece {
  build() {
    this.rings = [];
    for (let i = 0; i < 14; i++) {
      const geo = new THREE.TorusGeometry(3 + i * 1.15, 0.05, 6, 64);
      const color = i % 2 ? C.pink : C.orange;
      const r = new THREE.Mesh(geo, glowMat(color, 0.55 - i * 0.03));
      r.position.z = -i * 2.4;
      this.group.add(r);
      this.rings.push(r);
    }
    this.cacheOpacity();
  }
  update(dt, t) {
    this.rings.forEach((r, i) => {
      r.rotation.z += dt * (0.1 + i * 0.015);
      r.scale.setScalar(1 + Math.sin(t * 0.9 + i * 0.35) * 0.04);
    });
  }
}

/* Station order — must match the data-scene values in the HTML. */
const STATIONS = [
  ["home",        RobotPiece],
  ["about",       RingPiece],
  ["services",    OrbitPiece],
  ["lab",         LabPiece],
  ["solutions",   PillarPiece],
  ["training",    PanelPiece],
  ["prototyping", PrinterPiece],
  ["projects",    CardGridPiece],
  ["gallery",     ArcPiece],
  ["kits",        CratePiece],
  ["reviews",     StarPiece],
  ["contact",     PortalPiece],
];

/* ==========================================================================
   The world
   ========================================================================== */
class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x030406, GAP * 0.5, GAP * 1.7);

    this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 400);
    this.camera.position.set(0, 0, 26);

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: !isMobile, alpha: true, powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.addLights();
    this.addStarfield();

    this.pieces = STATIONS.map(([key, Piece], i) => {
      const piece = new Piece(i);
      piece.key = key;
      this.scene.add(piece.group);
      return piece;
    });

    this.totalZ = (STATIONS.length - 1) * GAP;
    this.stops = [];        // scroll fraction -> station z, measured from the DOM
    this.scroll = 0;        // eased 0..1
    this.scrollTarget = 0;
    this.mouse = new THREE.Vector2();
    this.mouseEased = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.running = true;

    this.bind();
    this.onResize();
  }

  /* Deliberately dim: the set pieces read as emissive edges glowing in the
     dark rather than lit objects, which keeps the theme properly black. */
  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const key = new THREE.DirectionalLight(C.orange, 1.1);
    key.position.set(6, 8, 10);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(C.pink, 0.8);
    rim.position.set(-8, -4, 6);
    this.scene.add(rim);
    const fill = new THREE.PointLight(C.purple, 45, 90);
    fill.position.set(0, 0, 14);
    this.scene.add(fill);
  }

  /* A drifting particle field that travels with the camera, so the corridor
     between stations never reads as empty. */
  addStarfield() {
    const N = isMobile ? 900 : 2200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 130;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 2] = -Math.random() * (this.totalZ + GAP * 2) + GAP;
      c.setHex([C.orange, C.pink, C.purple, C.steel][(Math.random() * 4) | 0]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 0.75,
      sizeAttenuation: true, depthWrite: false,
    }));
    this.scene.add(this.stars);
  }

  bind() {
    addEventListener("resize", () => this.onResize(), { passive: true });
    addEventListener("scroll", () => this.onScroll(), { passive: true });
    addEventListener("pointermove", (e) => {
      this.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      this.running = !document.hidden;
      if (this.running) { this.clock.getDelta(); this.loop(); }
    });
    this.onScroll();
  }

  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
    this.measure();
  }

  /* Tie each station to where its section actually sits on the page, so the
     camera arrives at a set piece exactly as you reach that section. Section
     heights vary a lot, so evenly spaced stations would drift out of sync. */
  measure() {
    const max = document.documentElement.scrollHeight - innerHeight;
    this.stops = [];
    this.pieces.forEach((p, i) => {
      const el = document.getElementById(p.key);
      if (!el) return;
      const centre = el.offsetTop + el.offsetHeight / 2 - innerHeight / 2;
      this.stops.push({ frac: max > 0 ? clamp(centre / max, 0, 1) : 0, z: -i * GAP });
    });
    this.stops.sort((a, b) => a.frac - b.frac);
  }

  /* Piecewise-linear lookup: scroll fraction -> camera z. */
  zForScroll(s) {
    const st = this.stops;
    if (st.length < 2) return 26 - s * this.totalZ;
    if (s <= st[0].frac) return 26 + (st[0].z - 26) * (st[0].frac ? s / st[0].frac : 1);
    for (let i = 0; i < st.length - 1; i++) {
      const a = st[i], b = st[i + 1];
      if (s <= b.frac) {
        const t = b.frac === a.frac ? 0 : (s - a.frac) / (b.frac - a.frac);
        return lerp(a.z, b.z, t);
      }
    }
    const last = st[st.length - 1];
    return last.z - (s - last.frac) * GAP * 2;
  }

  onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    this.scrollTarget = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    if (reduceMotion) { this.scroll = this.scrollTarget; this.render(0, 0); }
  }

  render(dt, t) {
    // Camera flies down the corridor; mouse adds a gentle parallax.
    this.mouseEased.lerp(this.mouse, 0.05);
    const z = this.zForScroll(this.scroll);
    this.camera.position.set(
      this.mouseEased.x * 5,
      this.mouseEased.y * 3 + Math.sin(this.scroll * Math.PI * 4) * 1.6,
      z
    );
    this.camera.lookAt(this.mouseEased.x * 1.5, this.mouseEased.y * 1.2, z - 20);

    this.stars.position.z = z - 26;
    this.stars.rotation.z = this.scroll * 0.4;

    // Shared per-frame context so set pieces can react to the cursor.
    const ctx = { mouse: this.mouseEased, scroll: this.scroll };

    for (const p of this.pieces) {
      const dist = Math.abs(p.group.position.z - z + 18);
      if (dist > ACTIVE_RANGE) { p.group.visible = false; continue; }
      const near = smooth(1 - clamp(dist / ACTIVE_RANGE, 0, 1));
      p.setNear(near);
      if (near > 0.01) p.update(dt, t, near, ctx);
    }

    this.renderer.render(this.scene, this.camera);
  }

  loop = () => {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.scroll = lerp(this.scroll, this.scrollTarget, reduceMotion ? 1 : 0.07);
    this.render(dt, t);
    requestAnimationFrame(this.loop);
  };

  start() {
    this.clock.start();
    if (reduceMotion) this.render(0, 0);   // one static frame, no loop
    else this.loop();
  }
}

/* ==========================================================================
   Boot
   ========================================================================== */
function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

function boot() {
  const canvas = document.querySelector("#webgl");
  const loader = document.querySelector("#world-loader");
  if (!canvas) return;

  if (!supportsWebGL()) {
    document.body.classList.add("no-webgl");
    loader && loader.remove();
    return;
  }

  try {
    const world = new World(canvas);
    world.start();
    document.body.classList.add("world-ready");
    if (loader) {
      loader.classList.add("done");
      setTimeout(() => loader.remove(), 900);
    }
  } catch (err) {
    // Any WebGL failure falls back to the flat site rather than a blank page.
    console.error("[ROBOVATIVE] 3D world failed, falling back:", err);
    document.body.classList.add("no-webgl");
    loader && loader.remove();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
