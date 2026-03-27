import React, { useMemo, useEffect } from "react";
import * as THREE from "three/webgpu";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { useControls } from "leva";

export function DiamondPart({ nodes }) {
  const { diamondColor, ior, transmission, thickness, roughness } =
    useControls("Diamond Material", {
      diamondColor: { value: "#ffffff", label: "Color" },
      ior: { value: 2.417, min: 1, max: 3, step: 0.01 },
      transmission: { value: 1.0, min: 0, max: 1, step: 0.01 },
      thickness: { value: 1.0, min: 0, max: 5, step: 0.1 },
      roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    });

  const diamondMaterial = useMemo(
    () => new MeshPhysicalNodeMaterial({
      transparent: true,
      depthWrite: false, // Better for transmission
    }),
    []
  );

  useEffect(() => {
    diamondMaterial.color.set(diamondColor);
    diamondMaterial.ior = ior;
    diamondMaterial.transmission = transmission;
    diamondMaterial.thickness = thickness;
    diamondMaterial.roughness = roughness;
  }, [diamondColor, ior, transmission, thickness, roughness, diamondMaterial]);

  return (
    <>
      {Object.values(nodes).map((node) => {
        // Filters for mesh names starting with 'D'
        if (!node.isMesh || !node.name.startsWith("D")) return null;

        return (
          <mesh
            key={node.uuid}
            geometry={node.geometry}
            material={diamondMaterial}
            castShadow
          />
        );
      })}
    </>
  );
}