import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three/webgpu";
import {
  pass,
  mrt,
  output,
  diffuseColor,
  normalView,
  velocity,
  directionToColor,
  vec4,
  vec3,
  metalness,
  roughness,
} from "three/tsl";

import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { traa } from "three/addons/tsl/display/TRAANode.js";
import { useControls } from "leva";

export function TSLEffects() {
  const { gl, scene, camera } = useThree();
  const postRef = useRef(null);
  const [ready, setReady] = useState(false);

  const {
    mode,
    strength,
    radius,
    thickness,
    enableTRAA,
    enableSSGI,
    enableSSR,
    maxBrightness,
    reflectionStrength,
  } = useControls("Post Effects", {
    enableSSGI: true,
    enableSSR: true,
    enableTRAA: true,
    mode: {
      value: "Combined",
      options: ["Combined", "GI Only", "Reflections Only", "AO Only"],
    },
    strength: { value: 1.0, min: 0, max: 5 },
    reflectionStrength: { value: 1.0, min: 0, max: 1.0 },
    radius: { value: 0.5, min: 0.01, max: 2.0 },
    thickness: { value: 0.1, min: 0.01, max: 1.0 },
    maxBrightness: { value: 2.0, min: 0.5, max: 10.0 },
  });

  useEffect(() => {
    if (!gl.isWebGPURenderer) {
      console.warn("TSLEffects requires WebGPURenderer");
      return;
    }

    const post = new THREE.PostProcessing(gl);
    const scenePass = pass(scene, camera);
    scenePass.jitter = true;

    scenePass.setMRT(
      mrt({
        output,
        diffuseColor,
        normal: directionToColor(normalView),
        velocity,
        pbr: vec4(metalness, roughness, 0, 0),
      })
    );

    const colorNode = scenePass.getTextureNode("output");
    const diffuseNode = scenePass.getTextureNode("diffuseColor");
    const depthNode = scenePass.getTextureNode("depth");
    const velocityNode = scenePass.getTextureNode("velocity");
    const normalTex = scenePass.getTextureNode("normal");
    const pbrTex = scenePass.getTextureNode("pbr");

    const metalnessNode = 1.0;
    const roughnessNode = 0.0;

    // const clampedColorNode = colorNode.rgb.min(maxBrightness);

    const giPass = ssgi(colorNode, depthNode, normalTex, camera);
    const ssrPass = ssr(
      colorNode,
      depthNode,
      normalTex,
      metalnessNode,
      roughnessNode,
      camera
    );

  // Apply your strength and logic to the RESULT of the passes instead
    const indirectLight = giPass.rgb.mul(strength).min(maxBrightness); 
    const reflections = ssrPass.rgb.mul(reflectionStrength).min(maxBrightness);
// Composite logic
    let combined = colorNode.rgb.mul(giPass.a); // multiply by AO
    if (enableSSGI) combined = combined.add(diffuseNode.rgb.mul(indirectLight));
    if (enableSSR) combined = combined.add(reflections);

    let finalNode;
    switch (mode) {
      case "GI Only":
        finalNode = vec4(indirectLight, 1.0);
        break;
      case "Reflections Only":
        finalNode = vec4(reflections, 1.0);
        break;
      case "AO Only":
        finalNode = vec4(vec3(giPass.a), 1.0);
        break;
      default:
        finalNode = vec4(combined, colorNode.a);
    }

    const traaPass = traa(finalNode, depthNode, velocityNode, camera);
    post.outputNode = enableTRAA ? traaPass : finalNode;

    postRef.current = post;
    setReady(true);

    return () => {
      post.dispose();
      setReady(false);
    };
  }, [
    gl,
    scene,
    camera,
    mode,
    enableTRAA,
    enableSSGI,
    enableSSR,
    strength,
    maxBrightness,
    reflectionStrength,
  ]);

  useFrame(() => {
    if (ready && postRef.current) {
      postRef.current.render();
    }
  }, 1);

  return null;
}
