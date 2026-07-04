'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { terrainY } from './noise';

const dummy = new THREE.Object3D();

// ─── Dead Shrubs ────────────────────────────────────────────────────────────

const SHRUB_COUNT = 40;
const SHRUB_DATA = Array.from({ length: SHRUB_COUNT }, (_, i) => ({
  x: (Math.random() - 0.3) * 22,
  z: (Math.random() - 0.3) * 16,
  ry: Math.random() * Math.PI * 2,
  s:  0.35 + (i % 6) * 0.08,
}));

function DeadShrubs({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const scale = Math.max(0, 1 - progressRef.current * 2.8);
    SHRUB_DATA.forEach((s, i) => {
      dummy.position.set(s.x, terrainY(s.x, s.z) + 0.05, s.z);
      dummy.rotation.set(0, s.ry, 0);
      dummy.scale.setScalar(scale * s.s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SHRUB_COUNT]} castShadow>
      <coneGeometry args={[0.38, 1.0, 4, 1]} />
      <meshStandardMaterial color="#4a3828" roughness={1} />
    </instancedMesh>
  );
}

// ─── Trees ──────────────────────────────────────────────────────────────────

const TREE_COUNT = 30;
const TREE_DATA = Array.from({ length: TREE_COUNT }, (_, i) => ({
  x:      (Math.random() - 0.4) * 24 + 1,
  z:      (Math.random() - 0.35) * 18,
  delay:  i / TREE_COUNT,
  trunkH: 1.8 + Math.random() * 2.8,
  folR:   1.2 + Math.random() * 1.1,
}));

function Trees({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const trunkRef   = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    if (!trunkRef.current || !foliageRef.current) return;
    const p = progressRef.current;
    TREE_DATA.forEach((t, i) => {
      const tp = Math.max(0, Math.min(1, (p - 0.22 - t.delay * 0.28) / 0.32));
      const gy = terrainY(t.x, t.z);

      // Trunk — grows upward
      dummy.position.set(t.x, gy + (t.trunkH * tp) / 2, t.z);
      dummy.scale.set(tp * 0.16, tp * t.trunkH, tp * 0.16);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      // Foliage — pops on top
      dummy.position.set(t.x, gy + t.trunkH * tp + t.folR * tp * 0.4, t.z);
      dummy.scale.setScalar(t.folR * tp);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      foliageRef.current!.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate   = true;
    foliageRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, TREE_COUNT]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 7]} />
        <meshStandardMaterial color="#5c3d1e" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, TREE_COUNT]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2a6638" roughness={0.85} />
      </instancedMesh>
    </>
  );
}

// ─── Grass ──────────────────────────────────────────────────────────────────

const GRASS_COUNT = 320;
const GRASS_DATA = Array.from({ length: GRASS_COUNT }, () => ({
  x:  (Math.random() - 0.5) * 30,
  z:  (Math.random() - 0.5) * 24,
  ry: Math.random() * Math.PI,
  rx: -Math.PI / 2 + (Math.random() - 0.5) * 0.8,
  s:  0.8 + Math.random() * 0.7,
}));

function Grass({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const gp = Math.max(0, (progressRef.current - 0.3) / 0.45);
    GRASS_DATA.forEach((g, i) => {
      const local = Math.max(0, gp - (i / GRASS_COUNT) * 0.35) * g.s;
      dummy.position.set(g.x, terrainY(g.x, g.z) + local * 0.18, g.z);
      dummy.rotation.set(g.rx, g.ry, 0);
      dummy.scale.set(local * 0.13, local * 0.55, local * 0.06);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, GRASS_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color="#4a8c3f" roughness={1} side={THREE.DoubleSide} transparent opacity={0.88} />
    </instancedMesh>
  );
}

// ─── Flowers ────────────────────────────────────────────────────────────────

const FLOWER_COLORS = ['#ffeb3b', '#ce93d8', '#ffffff', '#ff8a65', '#80deea'];
const FLOWER_COUNT  = 80;
const FLOWER_DATA   = Array.from({ length: FLOWER_COUNT }, (_, i) => ({
  x:     (Math.random() - 0.5) * 22,
  z:     (Math.random() - 0.5) * 16,
  color: new THREE.Color(FLOWER_COLORS[i % FLOWER_COLORS.length]),
  ry:    Math.random() * Math.PI * 2,
  s:     0.12 + Math.random() * 0.12,
}));

function Flowers({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!ref.current) return;
    FLOWER_DATA.forEach((f, i) => ref.current!.setColorAt(i, f.color));
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const fp = Math.max(0, (progressRef.current - 0.62) / 0.28);
    FLOWER_DATA.forEach((f, i) => {
      const local = Math.max(0, fp - (i / FLOWER_COUNT) * 0.45);
      dummy.position.set(f.x, terrainY(f.x, f.z) + local * 0.25, f.z);
      dummy.rotation.set(0, f.ry, 0);
      dummy.scale.setScalar(local * f.s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FLOWER_COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial vertexColors roughness={0.5} />
    </instancedMesh>
  );
}

// ─── Export ─────────────────────────────────────────────────────────────────

export function Vegetation({ progress }: { progress: number }) {
  const progressRef = useRef(progress);
  progressRef.current = progress;

  return (
    <>
      <DeadShrubs progressRef={progressRef} />
      <Trees       progressRef={progressRef} />
      <Grass       progressRef={progressRef} />
      <Flowers     progressRef={progressRef} />
    </>
  );
}
