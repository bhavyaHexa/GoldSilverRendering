import React from 'react';
import { useGLTF } from '@react-three/drei';
import { MetalPart } from "./MetalPart";
import { DiamondPart } from "./DiamondPart";

export function Ring({ modelPath = "/7.glb"}) {
  const { nodes } = useGLTF(modelPath);

  return (
    // STEP 1: Main Placement Group (Adjust these numbers for your final scene angle)
    // I updated the first value to -1.42 to account for the flip we do inside.
    <group rotation={[4.56, 0, 0]} position={[0, 0, -5]}>
      
      {/* STEP 2: The "Correction" Group.
          By putting BOTH Metal and Diamonds inside here, they stay aligned.
          The [Math.PI, 0, 0] flips the whole ring so the text is right-side up.
      */}
      <group rotation={[Math.PI, 0, 0]}>
        <MetalPart nodes={nodes} />
      </group>
      <group rotation={[Math.PI, 0, 0]}>

        {/* <DiamondPart nodes={nodes} /> */}

        </group>

    </group>
  );
}

useGLTF.preload("/7.glb");