import { useGLTF } from "@react-three/drei";
import { MetalPart } from "./MetalPart";
// import { DiamondPart } from "./DiamondPart";

export function Model({ modelPath = "/7.glb" }) {
  const { nodes } = useGLTF(modelPath);

  return (
    <group>
      <MetalPart nodes={nodes} />
      {/* <DiamondPart nodes={nodes} /> */}
    </group>
  );
}

useGLTF.preload("/7.glb");