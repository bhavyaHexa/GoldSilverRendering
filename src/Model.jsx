import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
// Import Node-based materials for WebGPU
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { useControls } from 'leva';
import { color, uniform, mix, texture } from 'three/tsl';

export const Model = () => {
  const { metalColor, aoIntensity } = useControls({
    metalColor: '#c9c9c9', 

    // '#e9c58b'
    aoIntensity: { value: 1.2, min: 0, max: 5, step: 0.1 },
  });

  const { nodes } = useGLTF('/7.glb');

  // --- TSL Metal Material ---
  const metalMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();
    
    // Using TSL uniforms so changes in Leva reflect instantly in the shader
    mat.colorNode = color(metalColor);
    mat.metalnessNode = uniform(1);
    mat.roughnessNode = uniform(0); 
    
    return mat;
  }, [metalColor]);

  // --- TSL Diamond Material ---
  const diamondMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();
    
    mat.colorNode = color('#ffffff');
    mat.transmissionNode = uniform(1); // Enable glass behavior
    mat.thicknessNode = uniform(1.5);
    mat.iorNode = uniform(2.4);
    mat.roughnessNode = uniform(0);
    
    // Emissive TSL Node for Bloom
    mat.emissiveNode = color('#ffffff').mul(uniform(0.6));
    
    return mat;
  }, []);

  return (
    <group>
      {Object.values(nodes).map((node) => {
        if (!node.isMesh) return null;

        // Metal logic
        if (node.name.startsWith('M')) {
          // If the model has an AO map, we hook it into the TSL graph
          if (node.material?.aoMap) {
            metalMaterial.aoMap = node.material.aoMap;
            metalMaterial.aoMapIntensity = aoIntensity;
          }

          return (
            <mesh 
              key={node.uuid} 
              geometry={node.geometry} 
              material={metalMaterial} 
              castShadow 
              receiveShadow 
            />
          );
        }

        // Diamond logic
        if (node.name.startsWith('D')) {
          return (
            <mesh 
              key={node.uuid} 
              geometry={node.geometry} 
              material={diamondMaterial} 
              position={node.position}
              rotation={node.rotation}
              scale={node.scale}
            />
          );
        }

        return null;
      })}
    </group>
  );
};