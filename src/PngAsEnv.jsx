import * as THREE from "three";
import { useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function EnvMap({
  url = "/env/download.png",
  intensity = 1.2,
  rotation = 0,
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  const { scene } = useThree();

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

  scene.environmentRotation = new THREE.Euler(0 , -Math.PI/2 , 0)
    scene.environment = texture;
    scene.background = texture;

    scene.environmentIntensity = intensity;

    return () => {
      texture.dispose();
    };
  }, [texture, scene, intensity, rotation]);

  return null;
}
