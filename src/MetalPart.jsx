import React, { useMemo, useEffect } from "react";
// Note: If you ever want to use nodes like color() or float(), import them like this:
// import { color, float } from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { useControls } from "leva";

export function MetalPart({ nodes }) {
  const { goldColor, metalness, roughness, clearcoat, clearcoatRoughness } = useControls("Gold Material", {
    goldColor: { value: "#c9c9c9", label: "Color" },
    metalness: { value: 1.0, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },

    // New Controls for "Shininess/Polish"
    clearcoat: { value: 1.0, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.03, min: 0, max: 1, step: 0.01 },
  });

  // Create Leva-controlled material exactly once
  const metalMaterial = useMemo(
    () =>
      new MeshPhysicalNodeMaterial({
        envMapIntensity: 1,
      }),
    []
  );

  // Create the static material for Metal_White_26
  const blackMetalMaterial = useMemo(() => {
    const mat = new MeshPhysicalNodeMaterial();

    // FIX: Use standard .set() to avoid needing to import TSL nodes
    mat.color.set("#4b4b4b"); // Note: #e80000 is red. Use #4b4b4b or #000000 if you want black/dark grey!

    // You can set standard properties directly instead of using float()
    mat.metalness = 1.0;
    mat.roughness = 0.0; 

    mat.clearcoat = 1.0;
    mat.clearcoatRoughness = 0.1;


    return mat;
  }, []);

  // Update properties efficiently without recreating the material object
  useEffect(() => {
    metalMaterial.color.set(goldColor);
    metalMaterial.metalness = metalness;
    metalMaterial.roughness = roughness;

    metalMaterial.clearcoat = clearcoat;
    metalMaterial.clearcoatRoughness = clearcoatRoughness;

    metalMaterial.needsUpdate = true;
  }, [goldColor, metalness, roughness, clearcoat, clearcoatRoughness, metalMaterial]);

  return (
    <>
      {Object.values(nodes).map((node) => {
        // Only process meshes that start with "M"
        if (!node.isMesh || !node.name.startsWith("M")) return null;

        // Default to the Leva-controlled material
        let targetMaterial = metalMaterial;

        // Override material for specific mesh
        if (node.name === "Metal_White_26") {
          targetMaterial = blackMetalMaterial;
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
    </>
  );
}