import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from "three/webgpu";

// Local Imports
import { Ring } from './Ring';
import { TSLEffects } from './TSLEffects';
import { RotateModelWrapper } from './RotateModelWrapper';

export default function App() {
  return (
    <div style={{ background: '#ffffff', width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position:[0,5,100],
          fov: 12,
          near: 0.1,
          far: 1000
        }}
        gl={async ({ canvas }) => {
          const renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: true,
            alpha: true,
            requiredLimits: { maxColorAttachmentBytesPerSample: 128 }
          });
          await renderer.init();
          return renderer;
        }}
      >
        <color attach="background" args={['#ffffff']} />

        <Suspense fallback={null}>
          {/* Global Lighting */}
          <Environment 
            files="/env/env_metal_001_d01c4504e0.hdr" 
            environmentIntensity={0.9} 
          />

                <color attach="background" args={['#ffffff']} />

          <RotateModelWrapper minPitch={-0.2} maxPitch={1.5}>
            {/* The 3D Model Logic */}
            <Ring />

            {/* Floor Plane */}
            <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[50 , 50 , 50]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </RotateModelWrapper>

          {/* Post-processing / TSL Effects */}
          <TSLEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}