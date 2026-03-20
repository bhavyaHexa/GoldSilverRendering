// diamondShader.jsx
import * as THREE from "three/webgpu";

// Export this function so it can be imported
export function createDiamondMaterial(envMap) {
  const mat = new THREE.MeshPhysicalNodeMaterial({
    color: "0xffffff",
    metalness: 0.0,
    roughness: 0.0,
    ior: 2.417,        // Real diamond IOR
    transmission: 1.0,    // Fully transparent
    thickness: 2.0,       // Simulate light bouncing inside
    envMap: envMap,     // HDR map
    envMapIntensity: 3.0,   
    clearcoat: 1.0 ,
    clearcoatRoughness: 0.0
   
  });

  // Optional dispersion (rainbow fire)
  mat.dispersion = 0.07;

  return mat;
}
