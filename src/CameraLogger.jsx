import { useThree, useFrame } from '@react-three/fiber'

export function CameraLogger() {
  const { camera } = useThree()

  useFrame(() => {
    console.log(
      'Position:',
      camera.position.x.toFixed(3),
      camera.position.y.toFixed(3),
      camera.position.z.toFixed(3)
    )

    console.log(
      'Rotation:',
      camera.rotation.x.toFixed(3),
      camera.rotation.y.toFixed(3),
      camera.rotation.z.toFixed(3)
    )
  })

  return null
}
