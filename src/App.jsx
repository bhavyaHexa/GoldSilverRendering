import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Environment } from '@react-three/drei';
import * as THREE from "three/webgpu";
import { color, float } from 'three/tsl';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';

// Local Imports
import { Model } from './Model';
import { TSLEffects } from './TSLEffects';
import { RotateModelWrapper } from './RotateModelWrapper';

// 1. Dedicated Ground Component using TSL for WebGPU
function Ground() {
  const material = new MeshPhysicalNodeMaterial({
    colorNode: color('#6e0e0e'),
    roughnessNode: float(0.88),
    metalnessNode: float(0),
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    emissi veNode: color('#ffffff'),

  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -4, 0]} // Adjusted slightly below your model group's -5
      receiveShadow
    >
      {/* Plane geometry 10x10 as requested */}
      <planeGeometry args={[50, 50, 50]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function App() {
  const controlsRef = useRef();

  // 1. URL-based routing logic
  const [modelPath, setModelPath] = React.useState(() => {
    const path = window.location.pathname.slice(1).replace('.glb', '');
    return path ? `/${path}.glb` : '/7.glb';
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.slice(1).replace('.glb', '');
      setModelPath(path ? `/${path}.glb` : '/7.glb');
    };

    window.addEventListener('popstate', handleLocationChange);
    // Also listen for custom events if navigation happens via script
    window.addEventListener('pushstate', handleLocationChange);
    window.addEventListener('replacestate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
      window.removeEventListener('replacestate', handleLocationChange);
    };
  }, []);

  return (
    <div style={{
      background: ' #ffffff', width: '100%', height: '100%'
    }}>

      <Canvas
        style={{ background: '#ffffff' }}
        camera={{ position: [0, 0, 30], fov: 60 }}
        gl={async ({ canvas }) => {
          const renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: false,
            alpha: true,
            requiredLimits: { maxColorAttachmentBytesPerSample: 128 }
          });


          await renderer.init();

          renderer.toneMapping = THREE.NoToneMapping;
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.setClearColor(0x000000, 0);
          return renderer;
        }}
      >


        <Suspense fallback={null}>
          <Environment
            files={"/env/env_metal_001_d01c4504e0.hdr"}
            environmentIntensity={0.9}
          />

          <RotateModelWrapper minPitch={-0.2} maxPitch={1}>
            <group rotation={[1.42, Math.PI, 0]} position={[0, 0, -5]}>
              <Model modelPath={modelPath} />
            </group>

            {/* 2. Added the Ground here to rotate with the wrapper if needed, 
              or move outside if you want the floor static */}
            {/* <Ground /> */}
          </RotateModelWrapper>
        </Suspense>

        <CameraControls
          ref={controlsRef}
          makeDefault
          azimuthRotateSpeed={0}
          polarRotateSpeed={0}
          minDistance={0}
          maxDistance={50}
        />

        <TSLEffects />
      </Canvas>

    </div>
  );
}