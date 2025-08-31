
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EnhancedWarehouseSphere = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Main sphere rotation
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.1;
      sphereRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
    
    // Inner sphere counter-rotation
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.y = -time * 0.15;
      innerSphereRef.current.rotation.z = Math.cos(time * 0.08) * 0.05;
    }

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.05;
    }
  });

  // Create particle geometry
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 2 + Math.random() * 0.5;
    const phi = Math.acos(-1 + (2 * i) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;
    
    positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
    positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
    positions[i3 + 2] = radius * Math.cos(phi);
  }

  return (
    <group>
      {/* Main wireframe sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial 
          color="#FF6B35" 
          wireframe={true}
          transparent={true}
          opacity={0.4}
        />
      </mesh>
      
      {/* Inner glowing sphere */}
      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshBasicMaterial 
          color="#1E3A8A" 
          wireframe={true}
          transparent={true}
          opacity={0.2}
        />
      </mesh>

      {/* Floating particles inside */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#10B981"
          size={0.02}
          transparent={true}
          opacity={0.6}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};

const WarehouseSphere = () => {
  return (
    <div className="absolute inset-0 opacity-40">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#FF6B35" />
        <pointLight position={[-10, -10, 10]} intensity={0.3} color="#1E3A8A" />
        <EnhancedWarehouseSphere />
      </Canvas>
    </div>
  );
};

export default WarehouseSphere;
