import React from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import { Environment } from '@react-three/drei';

export const Env = () => {
    // 1. Load the texture
    const hdrDay = useLoader(RGBELoader, '/hdr/canary_wharf_1k.hdr');

    // 2. Set mapping so it wraps around the sphere correctly
    hdrDay.mapping = THREE.EquirectangularReflectionMapping;

    return (
        <Environment map={hdrDay}>
            {/* Custom Background Sphere */}
            <mesh scale={10}>
                <sphereGeometry args={[100, 32, 32]} />
                <meshBasicMaterial
                    transparent
                    opacity={1}
                    map={hdrDay}
                    side={THREE.BackSide}
                    toneMapped={false}
                    color={new THREE.Color(2, 2, 2)}
                />
            </mesh>
        </Environment>
    );
};