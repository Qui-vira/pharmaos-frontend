'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Capsule } from '@react-three/drei';
import * as THREE from 'three';

function Pill({ position, color, scale = 1, speed = 1 }: {
  position: [number, number, number];
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * speed * 0.3) * 0.2;
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <group ref={ref} position={position} scale={scale}>
        <Capsule args={[0.15, 0.5, 8, 16]}>
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.3}
            transparent
            opacity={0.85}
          />
        </Capsule>
      </group>
    </Float>
  );
}

function PillScene() {
  const pills = useMemo(() => [
    { position: [-2, 1, -1] as [number, number, number], color: '#16c05e', scale: 0.8, speed: 1.2 },
    { position: [2, -0.5, -2] as [number, number, number], color: '#4ade83', scale: 0.6, speed: 0.8 },
    { position: [0, 1.5, -1.5] as [number, number, number], color: '#0d9e4a', scale: 1, speed: 1 },
    { position: [-1.5, -1, -0.5] as [number, number, number], color: '#86efb0', scale: 0.5, speed: 1.5 },
    { position: [1.5, 0.5, -1] as [number, number, number], color: '#bbf7d4', scale: 0.7, speed: 0.9 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#16c05e" />
      {pills.map((pill, i) => (
        <Pill key={i} {...pill} />
      ))}
    </>
  );
}

export default function FloatingPills({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <PillScene />
      </Canvas>
    </div>
  );
}
