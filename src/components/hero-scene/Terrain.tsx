'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { terrainY } from './noise';

const DEAD_COLOR = new THREE.Color('#5c4a2a');
const LIVE_COLOR = new THREE.Color('#3d7a44');

export function Terrain({ progress }: { progress: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 64, 110, 110);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainY(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.color.copy(DEAD_COLOR).lerp(LIVE_COLOR, progress);
    matRef.current.needsUpdate = true;
  }, [progress]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial ref={matRef} roughness={0.92} metalness={0} />
    </mesh>
  );
}
