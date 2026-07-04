'use client';

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Sky } from './Sky';
import { Terrain } from './Terrain';
import { DataCenter } from './DataCenter';
import { Vegetation } from './Vegetation';

export function Scene({ progress }: { progress: number }) {
  const ambientIntensity = 0.25 + progress * 1.1;
  const dirIntensity     = 0.4  + progress * 1.8;
  const ambientColor     = new THREE.Color().setHSL(0.08, 0.4, 0.3).lerp(new THREE.Color('#ffffff'), progress);
  const dirColor         = new THREE.Color('#ff7733').lerp(new THREE.Color('#fff5e0'), progress);

  return (
    <Canvas
      camera={{ position: [3, 7, 17], fov: 52, near: 0.1, far: 150 }}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9 + progress * 0.4,
      }}
      frameloop="always"
    >
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight
        position={[10, 14, -8]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-8, 6, 10]}
        intensity={progress * 0.4}
        color="#99ccff"
      />

      <Sky        progress={progress} />
      <Terrain    progress={progress} />
      <DataCenter progress={progress} />
      <Vegetation progress={progress} />

      <EffectComposer>
        <Bloom
          intensity={0.4 + progress * 1.2}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette offset={0.25} darkness={0.55 - progress * 0.25} />
      </EffectComposer>
    </Canvas>
  );
}
