import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
// 🔥 FIX: color and float must be imported from three/tsl
import { float, color, vec3 } from 'three/tsl';
import { useControls } from 'leva';

export const Model = ({ modelPath = '/7.glb' }) => {
  const { nodes } = useGLTF(modelPath);

  const { metalColor, aoIntensity, roughnessBias } = useControls("Jewelry Materials", {
    metalColor: '#c9c9c9',
    aoIntensity: { value: 2.5, min: 0, max: 5 },
    roughnessBias: { value: 0.0, min: -0.02, max: 0.1, step: 0.001 },
  });

  // LUXURY SILVER: Ultra low roughness + Clearcoat
  const silverMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();
    // Using vec3 for color can sometimes be more stable in TSL
    mat.colorNode = color(metalColor);
    mat.metalnessNode = float(1.0);
    mat.roughnessNode = float(0.01).add(float(roughnessBias)).clamp(0, 1);
    mat.clearcoatNode = float(1.0);
    mat.clearcoatRoughnessNode = float(0.01);
    mat.specularIntensityNode = float(2.0);
    return mat;
  }, [metalColor, roughnessBias]);

  // BLACK METAL (Metal_White_26): Specifically handles AO
  const blackMetalMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();
    mat.colorNode = color('#4b4b4b');
    mat.metalnessNode = float(1.0);
    mat.roughnessNode = float(0.05);
    // lightIntensityNode handles the 'occlusion' multiplier in WebGPU
    mat.lightIntensityNode = float(aoIntensity);
    return mat;
  }, [aoIntensity]);

  const diamondMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();
    mat.transmissionNode = float(1.0);
    mat.iorNode = float(2.417);
    mat.thicknessNode = float(1.0);
    mat.roughnessNode = float(0.0);
    return mat;
  }, []);

  return (
    <group>
      {Object.values(nodes).map((node) => {
        if (!node.isMesh) return null;

        let targetMaterial = silverMaterial;

        // Specific Logic for Metal_White_26 AO
        if (node.name === 'Metal_White_26') {
          targetMaterial = blackMetalMaterial;
        } else if (node.name.startsWith('D')) {
          targetMaterial = diamondMaterial;
        }

        return (
          <mesh
            key={node.uuid}
            geometry={node.geometry}
            material={targetMaterial}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
};