import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Environment } from '@react-three/drei';
import * as THREE from "three/webgpu";

// Local Imports
import { Model } from './Model';
import { TSLEffects } from './TSLEffects';
import { RotateModelWrapper } from './RotateModelWrapper';


export default function App() {
  const controlsRef = useRef();

  // 1. URL-based routing logic
  const [modelPath, setModelPath] = useState(() => {
    const path = window.location.pathname.slice(1).replace('.glb', '');
    return path ? `/${path}.glb` : '/7.glb';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.slice(1).replace('.glb', '');
      setModelPath(path ? `/${path}.glb` : '/7.glb');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate', handleLocationChange);
    window.addEventListener('replacestate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
      window.removeEventListener('replacestate', handleLocationChange);
    };
  }, []);

  return (
    <div style={{ background: '#ffffff', width: '100vw', height: '100vh' }}>
      <Canvas
        // Lower FOV (12) flattens the spheres like Image 2
        // Higher Z position (85) compensates for the zoom to keep the ring in frame
        camera={{
          position: [0, 10, 100],
          fov: 12,
          near: 0.1,
          far: 1000
        }}
        gl={async ({ canvas }) => {
          const renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: true, // Switched to true for smoother jewelry edges
            alpha: true,
            requiredLimits: { maxColorAttachmentBytesPerSample: 128 }
          });

          await renderer.init();

          renderer.toneMapping = THREE.NoToneMapping;
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.setClearColor(0xffffff, 1);

          return renderer;
        }}
      >
        <Suspense fallback={null}>
          <Environment
            files={"/env/env_metal_001_d01c4504e0.hdr"}
            environmentIntensity={0.9}
          />

          <color attach="background" args={[0xffffff]} />

          <RotateModelWrapper minPitch={-0.2} maxPitch={1.5}>
            <group rotation={[1.42, Math.PI, 0]} position={[0, 0, -5]}>
              <Model modelPath={modelPath} />
            </group>

            <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[50, 50, 50]} />
              <meshPhysicalMaterial color={"#ffffff"} />
            </mesh>
          </RotateModelWrapper>


        </Suspense>



        <TSLEffects />

      </Canvas>
    </div>
  );
}