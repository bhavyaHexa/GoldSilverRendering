import { useRef, useState, useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  pass, mrt, output, diffuseColor, normalView, velocity,
  directionToColor, uniform, mix, acesFilmicToneMapping, vec3, vec4, float
} from "three/tsl";
import { useControls } from "leva";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { traa } from "three/addons/tsl/display/TRAANode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";

export function TSLEffects() {
  const { gl, scene, camera } = useThree();
  const postRef = useRef(null);
  const [ready, setReady] = useState(false);

  const config = useControls("Post Processing", {
    enabledSSGI: true,
    enabledSSR: true,
    enabledTRAA: true,
    enabledAO: true,
    // Pixel Ratio is your FPS slider. Keep it at 1.0 for performance.
    pixelRatio: { value: 1.0, min: 0.5, max: 1.5 },
    exposure: { value: 1.1, min: 0.1, max: 2.0 },
    // AO Controls
    aoRadius: { value: 0.5, min: 0.01, max: 2.0 }, 
    aoIntensity: { value: 1.0, min: 0, max: 5.0 }, 
    aoPower: { value: 4.5, min: 1.0, max: 8.0 },
    giIntensity: { value: 0.15, min: 0, max: 1 },
    ssrIntensity: { value: 1.0, min: 0, max: 5 }
  });

  const u = useMemo(() => ({
    ssgiEnabled: uniform(1),
    ssrEnabled: uniform(1),
    traaEnabled: uniform(1),
    aoEnabled: uniform(1),
    aoIntensity: uniform(1.0),
    aoRadius: uniform(0.5),
    aoPower: uniform(2.0),
    giIntensity: uniform(0.15),
    ssrIntensity: uniform(1.0),
    exposure: uniform(1.1),
  }), []);

  useEffect(() => {
    if (!(gl instanceof THREE.WebGPURenderer)) return;

    // Performance fix: Cap pixel density
    gl.setPixelRatio(config.pixelRatio);

    const post = new THREE.RenderPipeline(gl);
    const scenePass = pass(scene, camera);

    scenePass.setMRT(mrt({
      output,
      diffuseColor,
      normal: directionToColor(normalView),
      velocity
    }));

    const colorNode = scenePass.getTextureNode("output");
    const depthNode = scenePass.getTextureNode("depth");
    const normalTex = scenePass.getTextureNode("normal");
    const velocityNode = scenePass.getTextureNode("velocity");

    // Initialize Effects
    const giPass = ssgi(colorNode, depthNode, normalTex, camera);
    const ssrPass = ssr(colorNode, depthNode, normalTex, 1.0, 0.0, camera);
    
    // Setup AO with dynamic radius
    const aoPass = ao(depthNode, normalTex, camera); 
    aoPass.radius = u.aoRadius;
    
    // Efficient AO Mixing
    // We apply u.aoPower and u.aoIntensity only if enabled
    const aoResult = aoPass.x.pow(u.aoPower);
    const aoFactor = mix(
        float(1.0), 
        aoResult, 
        u.aoEnabled.mul(u.aoIntensity)
    ).clamp(0, 1);

    // Composite Lighting
    const lightSum = giPass.rgb.mul(u.giIntensity).mul(u.ssgiEnabled)
                      .add(ssrPass.rgb.mul(u.ssrEnabled).mul(u.ssrIntensity));

    const baseColor = colorNode.rgb;
    const shadowed = baseColor.mul(aoFactor);
    const compositionHDR = shadowed.add(lightSum);

    // Tonemapping & Foreground Masking
    const toned = acesFilmicToneMapping(compositionHDR, u.exposure);
    const isForeground = depthNode.lessThan(1.0);
    const finalRGB = isForeground.select(toned, vec3(1.0));

    // Temporal AA
    const traaPass = traa(vec4(finalRGB, 1.0), depthNode, velocityNode, camera);
    
    post.outputNode = u.traaEnabled.select(traaPass, vec4(finalRGB, 1.0));

    postRef.current = post;
    setReady(true);
    return () => post.dispose();
  }, [gl, scene, camera, u, config.pixelRatio]);

  // Sync Leva controls to Uniforms (High Performance update path)
  useEffect(() => {
    if (!ready) return;
    u.ssgiEnabled.value = config.enabledSSGI ? 1 : 0;
    u.ssrEnabled.value = config.enabledSSR ? 1 : 0;
    u.traaEnabled.value = config.enabledTRAA ? 1 : 0;
    u.aoEnabled.value = config.enabledAO ? 1 : 0;
    u.aoIntensity.value = config.aoIntensity;
    u.aoRadius.value = config.aoRadius;
    u.aoPower.value = config.aoPower;
    u.giIntensity.value = config.giIntensity;
    u.ssrIntensity.value = config.ssrIntensity;
    u.exposure.value = config.exposure;
  }, [config, ready, u]);

  useFrame(() => {
    if (ready && postRef.current) {
      postRef.current.renderAsync();
    }
  }, 1);

  return null;
}