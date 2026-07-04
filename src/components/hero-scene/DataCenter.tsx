'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { terrainY } from './noise';

const BUILDINGS = [
  { x: -10, z: -8,  w: 3.8, d: 2.8, h: 4.2, g: 0.36 },
  { x: -7,  z: -9.5,w: 2.8, d: 2.2, h: 6.5, g: 0.38 },
  { x: -13, z: -7,  w: 2.2, d: 2.8, h: 5.5, g: 0.33 },
  { x: -10, z: -11, w: 4.5, d: 2.1, h: 2.8, g: 0.40 },
  { x: -14, z: -9.5,w: 1.9, d: 2.2, h: 7.5, g: 0.34 },
  { x: -7.5,z: -6.5,w: 2.1, d: 2.1, h: 3.4, g: 0.42 },
  { x: -12, z: -11.5,w:2.6, d: 1.8, h: 3.8, g: 0.37 },
  { x: -8.5,z: -13, w: 3.0, d: 1.6, h: 2.2, g: 0.39 },
];

function ExhaustParticles({ opacityRef }: { opacityRef: React.RefObject<number> }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7;
      speeds[i]             = 0.01 + Math.random() * 0.02;
    }
    return { positions, speeds };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const op = opacityRef.current ?? 0;
    if (op < 0.01) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < speeds.length; i++) {
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = 0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = op * 0.45;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#999999" transparent opacity={0} depthWrite={false} />
    </points>
  );
}

export function DataCenter({ progress }: { progress: number }) {
  const opacityRef = useRef<number>(1);
  opacityRef.current = Math.max(0, 1 - progress * 2.4);
  const opacity = opacityRef.current;

  return (
    <group>
      {BUILDINGS.map((b, i) => {
        const gy = terrainY(b.x, b.z);
        return (
          <group key={i}>
            <mesh position={[b.x, gy + b.h / 2, b.z]} castShadow>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0, 0, b.g)}
                roughness={0.82}
                metalness={0.3}
                transparent
                opacity={opacity}
                depthWrite={opacity > 0.05}
              />
            </mesh>
            {/* Rooftop antenna */}
            <mesh position={[b.x, gy + b.h + 0.7, b.z]}>
              <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
              <meshStandardMaterial
                color="#666"
                roughness={0.4}
                metalness={0.9}
                transparent
                opacity={opacity}
                depthWrite={opacity > 0.05}
              />
            </mesh>
            {/* AC unit on roof */}
            <mesh position={[b.x + b.w * 0.2, gy + b.h + 0.2, b.z + b.d * 0.1]}>
              <boxGeometry args={[0.7, 0.4, 0.5]} />
              <meshStandardMaterial
                color="#777"
                roughness={0.8}
                metalness={0.5}
                transparent
                opacity={opacity}
                depthWrite={opacity > 0.05}
              />
            </mesh>
          </group>
        );
      })}
      <ExhaustParticles opacityRef={opacityRef} />
    </group>
  );
}
