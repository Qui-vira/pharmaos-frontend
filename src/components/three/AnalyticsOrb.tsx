'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Orb({ color = '#16c05e' }: { color?: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <Sphere ref={ref} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={color}
        roughness={0.1}
        metalness={0.8}
        distort={0.3}
        speed={2}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

export default function AnalyticsOrb({
  className = '',
  color = '#16c05e',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-3, -3, 2]} intensity={0.3} color={color} />
        <Orb color={color} />
      </Canvas>
    </div>
  );
}
