import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import {
  pass, mrt, output, diffuseColor, normalView, velocity,
  directionToColor, vec4, float, uniform, toneMapping, mix, vec3, color
} from "three/tsl";
import { useControls } from "leva";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { traa } from "three/addons/tsl/display/TRAANode.js";

export function TSLEffects() {
  const { gl, scene, camera } = useThree();
  const postRef = useRef(null);
  const scenePassRef = useRef(null);
  const [ready, setReady] = useState(false);
  const frameCount = useRef(0);
  const maxFrames = 64;
  const lastCameraMatrix = useRef(new THREE.Matrix4());

  const controls = useControls("Jewelry Polish", {
    exposure: { value: 1.2, min: 0, max: 3 },
    reflectionStrength: { value: 1.5, min: 0, max: 5.0 },
    occlusionPunch: { value: 2.5, min: 1, max: 10 },
  });

  const uExposure = useMemo(() => uniform(1.2), []);
  const uReflStrength = useMemo(() => uniform(1.5), []);
  const uOcclusionPunch = useMemo(() => uniform(2.5), []);

  useEffect(() => {
    if (!gl.isWebGPURenderer) return;

    const post = new THREE.RenderPipeline(gl);
    const scenePass = pass(scene, camera);
    scenePassRef.current = scenePass;
    scenePass.jitter = true;

    scenePass.setMRT(mrt({ output, diffuseColor, normal: directionToColor(normalView), velocity }));

    const colorNode = scenePass.getTextureNode("output");
    const depthNode = scenePass.getTextureNode("depth");
    const normalTex = scenePass.getTextureNode("normal");
    const velocityNode = scenePass.getTextureNode("velocity");

    const giPass = ssgi(colorNode, depthNode, normalTex, camera);
    const ssrPass = ssr(colorNode, depthNode, normalTex, 1.0, 0.0, camera);

    giPass.samples = 16;
    ssrPass.samples = 32;
    ssrPass.thickness = float(0.01);

    // 1. Resolve the jewelry lighting first
    const sharpenedOcclusion = giPass.a.add(0.2).clamp(0, 1).pow(uOcclusionPunch);
    const reflections = ssrPass.rgb.mul(uReflStrength).add(ssrPass.rgb.pow(2.0));
    const jewelryColor = colorNode.rgb.mul(sharpenedOcclusion).add(reflections);

    // 2. Apply Tone Mapping to the jewelry ONLY (before AA)
    const tonedJewelry = toneMapping(THREE.ACESFilmicToneMapping, jewelryColor, uExposure);

    // 3. Create the foreground mask and the background
    const isForeground = depthNode.lessThan(1.0); // Boolean mask
    const whiteBackground = vec3(1.0, 1.0, 1.0); // Pure white

    // 4. CRITICAL FIX: Combine the sharp background and jewelry BEFORE TRAA
    // This prevents the "black halo" or jittering against the alpha edge
    const finalComposite = isForeground.select(tonedJewelry, whiteBackground);

    // 5. Apply TRAA to the entire composed image
    // Reduced temporalAlpha (0.02 - 0.05) is smoother for jewelry
    const traaPass = traa(vec4(finalComposite, 1.0), depthNode, velocityNode, camera);
    traaPass.temporalAlpha = float(0.03);

    // Final Output
    post.outputNode = traaPass.rgb;

    postRef.current = post;
    setReady(true);

    return () => post.dispose();
  }, [gl, scene, camera]);

  useFrame(() => {
    if (ready && postRef.current) {
      gl.toneMapping = THREE.NoToneMapping;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      uExposure.value = controls.exposure;
      uReflStrength.value = controls.reflectionStrength;
      uOcclusionPunch.value = controls.occlusionPunch;

      const cameraMoved = !lastCameraMatrix.current.equals(camera.matrixWorld);
      if (cameraMoved) { frameCount.current = 0; lastCameraMatrix.current.copy(camera.matrixWorld); }

      if (frameCount.current < maxFrames) {
        scenePassRef.current.jitter = true;
        camera.updateProjectionMatrix();
        frameCount.current++;
        postRef.current.render();
      } else {
        scenePassRef.current.jitter = false;
        camera.updateProjectionMatrix();
        postRef.current.render();
      }
    }
  }, 1);

  return null;
}