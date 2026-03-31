import { useRef, useState, useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  pass, mrt, output, diffuseColor, normalView, velocity,
  directionToColor, uniform, mix, acesFilmicToneMapping,
  vec3, vec4, float
} from "three/tsl";
import { useControls } from "leva";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";

export function TSLEffects() {
  const { gl, scene, camera, set } = useThree();

  const postRef = useRef(null);
  const [ready, setReady] = useState(false);

  /* ---------------- UI ---------------- */

  const config = useControls("Post Processing", {
    enabledSSGI: true,
    enabledSSR: true,
    enabledAO: true,
    debugVelocity: false,

    pixelRatio: { value: 1, min: 1, max: 2 },
    ssaaFactor: { value: 1.7, min: 1.0, max: 2.5, step: 0.1 },

    exposure: { value: 1.1, min: 0.1, max: 2.0 },

    aoRadius: { value: 0.2, min: 0.01, max: 1.0 },
    aoIntensity: { value: 0.6, min: 0, max: 2.0 },
    aoPower: { value: 1.8, min: 1.0, max: 4.0 },

    giIntensity: { value: 0.12, min: 0, max: 1 },
    ssrIntensity: { value: 0.6, min: 0, max: 5 }
  });

  /* ---------------- UNIFORMS ---------------- */

  const u = useMemo(() => ({
    ssgiEnabled: uniform(1),
    ssrEnabled: uniform(1),
    aoEnabled: uniform(1),
    debugVelocity: uniform(0),

    aoIntensity: uniform(0.6),
    aoRadius: uniform(0.2),
    aoPower: uniform(1.8),

    giIntensity: uniform(0.12),
    ssrIntensity: uniform(0.6),
    exposure: uniform(1.1),
  }), []);

  /* ---------------- PIPELINE SETUP ---------------- */

  useEffect(() => {
    if (!(gl instanceof THREE.WebGPURenderer)) return;

    gl.autoRender = false;

    const post = new THREE.RenderPipeline(gl);
    const scenePass = pass(scene, camera);

    scenePass.setMRT(mrt({
      output,
      diffuseColor,
      normal: directionToColor(normalView),
      velocity
    }));
    scenePass.keepVelocity = true;

    const colorNode = scenePass.getTextureNode("output");
    const depthNode = scenePass.getTextureNode("depth");
    const normalTex = scenePass.getTextureNode("normal");
    const velocityNode = scenePass.getTextureNode("velocity");

    /* ---------- GTAO ---------- */

    const aoPass = ao(depthNode, normalTex, camera);
    aoPass.radius = u.aoRadius;
    aoPass.bias = 0.2;
    aoPass.denoiseEnabled = true;
    aoPass.denoiseRadius = 6;

    const aoFactor = mix(
      float(1.0),
      aoPass.x.pow(u.aoPower),
      u.aoEnabled.mul(u.aoIntensity)
    );

    const baseLit = mix(
      colorNode.rgb,
      colorNode.rgb.mul(aoFactor),
      float(0.5)
    );

    /* ---------- SSGI ---------- */

    const giPass = ssgi(colorNode, depthNode, normalTex, camera);
    giPass.useTemporalFiltering = true;

    /* ---------- SSR ---------- */

    const ssrPass = ssr(colorNode, depthNode, normalTex, 1.0, 0.0, camera);

    /* ---------- FINAL COMPOSITION ---------- */

    const composition = baseLit
      .add(giPass.mul(u.giIntensity.mul(float(0.35))).mul(u.ssgiEnabled))
      .add(ssrPass.mul(u.ssrIntensity).mul(u.ssrEnabled));

    const toned = acesFilmicToneMapping(composition, u.exposure);
    const finalRGB = depthNode.lessThan(float(1.0)).select(toned, vec3(1.0));

    post.outputNode = u.debugVelocity.select(
      vec4(velocityNode.xyz, 1.0),
      vec4(finalRGB, 1.0)
    );

    postRef.current = post;
    setReady(true);

    return () => post.dispose();
  }, [gl, scene, camera, u]);

  /* ---------------- UPDATE UNIFORMS + SSAA ---------------- */

  useEffect(() => {
    if (!ready) return;

    u.ssgiEnabled.value = config.enabledSSGI ? 1 : 0;
    u.ssrEnabled.value = config.enabledSSR ? 1 : 0;
    u.aoEnabled.value = config.enabledAO ? 1 : 0;
    u.debugVelocity.value = config.debugVelocity ? 1 : 0;

    u.aoIntensity.value = config.aoIntensity;
    u.aoRadius.value = config.aoRadius;
    u.aoPower.value = config.aoPower;
    u.giIntensity.value = config.giIntensity;
    u.ssrIntensity.value = config.ssrIntensity;
    u.exposure.value = config.exposure;

    /* ⭐ TRUE SSAA */
    const ssaaDPR = config.pixelRatio * config.ssaaFactor;
    set({ dpr: ssaaDPR });

  }, [config, ready, u, set]);

  /* ---------------- MANUAL RENDER LOOP ---------------- */

  useFrame(async () => {
    if (!ready || !postRef.current) return;
    await postRef.current.renderAsync();
  }, 1);

  return null;
}
