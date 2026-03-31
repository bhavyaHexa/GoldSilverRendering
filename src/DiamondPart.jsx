import React from "react";
import { useControls } from "leva";
// 1. Import your custom Refraction Material wrapper
import * as THREE from "three/tsl"

import { useEnvironment } from "@react-three/drei";

import RefractionMaterial from "./materials/RefractionMaterial/RefractionMaterial"; // Adjust this path to where your file is!
import { MeshBasicNodeMaterial } from "three/webgpu";

export function DiamondPart({ nodes }) {
  // Your Leva controls mapped to your new material's available props
  const { ior, bounces, aberrationStrength, color, highlightColor, highlightTolerance } = useControls("Diamonds", {
    color: "#ffffff",
    ior: { value: 2.40, min: 1, max: 3, step: 0.01 },
    bounces: { value: 3, min: 1, max: 8, step: 1 },
    aberrationStrength: { value: 0.013, min: 0, max: 0.1, step: 0.001 },
    highlightColor: "#ff00ff",
    highlightTolerance: { value: 0.85, min: 0, max: 1, step: 0.01 },
  });
  const envMap =useEnvironment({ files: "/env/gem.hdr" });
  console.log(envMap);


const mat = new MeshBasicNodeMaterial()
mat.color.set(color);

  
  
  return (
    <>
      {Object.values(nodes).map((node) => {
        // Match all meshes starting with "R" (e.g., "Round")
        if (!node.isMesh || !node.name.startsWith("R")) return null;
        
        const isDiamond = true; 

        console.log(node.material)

        return (
          <mesh
            key={node.uuid} 
            material={isDiamond ? undefined : node.material }// Don't forget to uncomment your key for React lists!
            geometry={node.geometry}
            position={node.position}
            rotation={node.rotation}
            scale={node.scale}
            castShadow
            receiveShadow
          >
            {/* 2. Drop your custom material here as a child of the mesh! */}
            {isDiamond && (
                            <RefractionMaterial 
                                geometry={node.geometry}
                                envMap={envMap}
                                bounces={3} 
                                ior={2.4} 
                                fresnel={1} 
                                aberrationStrength={0.013} 
                                reflectivity={2.5}
                                opacity={1.0}
                                color={color}
                                // envRotation={diamondEnvRotation}
                                highlightColor={highlightColor}
                                highlightTolerance={highlightTolerance}
                            />
                        )}
          </mesh>
        );
      })}
    </>
  );
}