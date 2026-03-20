import { useThree, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function LockedModelWrapper({ children, enabled = true }) {
  const ref = useRef()
  const { camera } = useThree()

  const invQuat = new THREE.Quaternion()

  useFrame(() => {
    if (!enabled || !ref.current) return

    // Inverse camera rotation
    invQuat.copy(camera.quaternion).invert()

    // Apply to model wrapper
    ref.current.quaternion.copy(invQuat)
  })

  return <group ref={ref}>{children}</group>
}
