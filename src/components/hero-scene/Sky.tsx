'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEAD_BG  = new THREE.Color('#1a1a2e');
const LIVE_BG  = new THREE.Color('#87ceeb');
const DEAD_FOG = new THREE.Color('#2a2535');
const LIVE_FOG = new THREE.Color('#c2e8f5');

export function Sky({ progress }: { progress: number }) {
  const { scene, invalidate } = useThree();

  useEffect(() => {
    scene.background = DEAD_BG.clone().lerp(LIVE_BG, progress);
    scene.fog = new THREE.FogExp2(DEAD_FOG.clone().lerp(LIVE_FOG, progress), 0.032 - progress * 0.02);
    invalidate();
  }, [scene, progress, invalidate]);

  const sunRise    = Math.max(0, (progress - 0.15) / 0.6);
  const cloudFade  = Math.max(0, (progress - 0.4)  / 0.35);
  const sunWarm    = new THREE.Color('#ff6600').lerp(new THREE.Color('#fff8d0'), sunRise);

  return (
    <>
      {/* Sun */}
      <mesh position={[11, 15, -22]}>
        <sphereGeometry args={[1.6, 20, 20]} />
        <meshStandardMaterial
          color={sunWarm}
          emissive={sunWarm}
          emissiveIntensity={sunRise * 2.5}
          roughness={0}
        />
      </mesh>

      {/* Clouds — 10 puffs staggered across the sky */}
      {Array.from({ length: 10 }, (_, i) => {
        const s = i * 3.14;
        return (
          <mesh
            key={i}
            position={[
              -14 + i * 3.1 + Math.sin(s * 0.7) * 2.5,
              10.5 + Math.sin(s * 0.4) * 1.8,
              -6  - Math.abs(Math.cos(s * 0.9)) * 7,
            ]}
            scale={[1.8 + Math.sin(s) * 0.6, 0.55, 1.1 + Math.cos(s * 0.5) * 0.3]}
            rotation-y={s * 0.25}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              color="#f0f8ff"
              roughness={1}
              transparent
              opacity={cloudFade * 0.82}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
}
