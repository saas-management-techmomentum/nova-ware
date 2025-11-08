
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SimpleRotatingSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshBasicMaterial 
        color="#8b5cf6" 
        wireframe={true}
        transparent={true}
        opacity={0.6}
      />
    </mesh>
  );
};

const WarehouseSphere = () => {
  return (
    <div className="absolute inset-0 opacity-30">
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <SimpleRotatingSphere />
      </Canvas>
    </div>
  );
};

export default WarehouseSphere;
