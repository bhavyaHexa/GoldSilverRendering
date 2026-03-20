import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Environment } from '@react-three/drei';
import * as THREE from "three/webgpu";

// Local Imports
import { Model } from './Model'; 
import { TSLEffects } from './TSLEffects'; 
import { RotateModelWrapper } from './RotateModelWrapper';

export default function App() {
  const controlsRef = useRef();

  
  // This ensures that as soon as the component loads, 
  // the camera is placed exactly at Z=25 looking at the center.
  // useEffect(() => {
  //   if (controlsRef.current) {
  //     // setLookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ, transition?)
  //     controlsRef.current.setLookAt(0, 0, 25, 0, 0, 0, false);
  //   }
  // }, []);

  return (
    <Canvas 
      // Set the initial R3F camera position
      camera={{ position: [0, 0, 30], fov: 60 }}
      gl={async ({ canvas }) => {
        const renderer = new THREE.WebGPURenderer({ 
          canvas, 
          antialias: false, 
          alpha: true,
          requiredLimits: { maxColorAttachmentBytesPerSample: 128 }
        });
        await renderer.init();
        return renderer;
      }}
    >
      <color attach="background" args={['white']} />

      <Suspense fallback={null}>
        <Environment files={"/env/env_metal_001_d01c4504e0.hdr"} /> 

        <RotateModelWrapper 
          minPitch={-0.2} 
          maxPitch={1.5}
        >
          <group rotation={[1.42, Math.PI, 0]} position={[0 , 0 ,-5]}>
            <Model />
          </group>

          {/* <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]}/>
            <meshBasicMaterial color={0xffffff}/>
          </mesh> */}
        </RotateModelWrapper>
      </Suspense>

      <CameraControls
        ref={controlsRef}
        makeDefault
        azimuthRotateSpeed={0}
        polarRotateSpeed={0}
        // Optional: constrain zooming so they stay near that Z=25 sweet spot
        minDistance={0}
        maxDistance={50}
      />

      <TSLEffects /> 
    </Canvas>
  );
}