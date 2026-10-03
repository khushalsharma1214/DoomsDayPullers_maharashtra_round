import { useFrame } from "@react-three/fiber";
import { Environment, Float, Text } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function StadiumRing({
  radius,
  y,
  thickness,
}: {
  radius: number;
  y: number;
  thickness: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial
        color="#172033"
        metalness={0.5}
        roughness={0.45}
      />
    </mesh>
  );
}

function StadiumLights() {
  const lights = [
    [-7, 4, -6],
    [7, 4, -6],
    [-7, 4, 6],
    [7, 4, 6],
  ];

  return (
    <>
      {lights.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.13, 7, 12]} />
            <meshStandardMaterial color="#374151" />
          </mesh>

          <pointLight
            intensity={18}
            distance={16}
            color={index % 2 === 0 ? "#60a5fa" : "#a78bfa"}
          />
        </group>
      ))}
    </>
  );
}

function CricketBall() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.015;

    ref.current.position.y =
      2.2 + Math.sin(clock.elapsedTime * 1.5) * 0.25;
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.4}
      floatIntensity={0.8}
    >
      <mesh ref={ref} position={[3.8, 2.2, 1]}>
        <sphereGeometry args={[0.65, 48, 48]} />

        <meshStandardMaterial
          color="#dc2626"
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>
    </Float>
  );
}

function Pitch() {
  return (
    <group>

      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.2, 0.12, 4.8]} />

        <meshStandardMaterial
          color="#b9975b"
          roughness={0.9}
        />
      </mesh>

      {/* Creases */}

      <mesh position={[0, 0.25, 1.85]}>
        <boxGeometry args={[1.55, 0.025, 0.035]} />

        <meshBasicMaterial color="white" />
      </mesh>

      <mesh position={[0, 0.25, -1.85]}>
        <boxGeometry args={[1.55, 0.025, 0.035]} />

        <meshBasicMaterial color="white" />
      </mesh>

    </group>
  );
}

function Field() {
  return (
    <group>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <circleGeometry args={[6.3, 80]} />

        <meshStandardMaterial
          color="#064e3b"
          roughness={0.95}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <circleGeometry args={[5.1, 80]} />

        <meshStandardMaterial
          color="#047857"
          roughness={0.95}
        />
      </mesh>

      <Pitch />

    </group>
  );
}

function StadiumStructure() {
  return (
    <group>

      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[8.2, 8.7, 1.6, 64]} />

        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      <StadiumRing
        radius={7}
        y={-0.15}
        thickness={0.65}
      />

      <StadiumRing
        radius={8}
        y={0.25}
        thickness={0.45}
      />

      <StadiumRing
        radius={9}
        y={0.75}
        thickness={0.35}
      />

      <StadiumRing
        radius={10}
        y={1.15}
        thickness={0.22}
      />

    </group>
  );
}

function Ticket3D() {
  return (
    <Float
      speed={1}
      rotationIntensity={0.5}
      floatIntensity={1}
    >
      <group
        position={[-3.8, 1.5, 1]}
        rotation={[0, 0.3, -0.15]}
      >

        <mesh>
          <boxGeometry args={[3.2, 1.7, 0.08]} />

          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.3}
          />
        </mesh>

        <Text
          position={[-1.15, 0.45, 0.07]}
          fontSize={0.23}
          color="#111827"
          anchorX="left"
        >
          CRICTIX
        </Text>

        <Text
          position={[-1.15, 0.05, 0.07]}
          fontSize={0.17}
          color="#2563eb"
          anchorX="left"
        >
          MI  VS  CSK
        </Text>

        <Text
          position={[-1.15, -0.35, 0.07]}
          fontSize={0.11}
          color="#64748b"
          anchorX="left"
        >
          WANKHEDE • 12 OCT
        </Text>

        <Text
          position={[0.75, -0.48, 0.07]}
          fontSize={0.13}
          color="#111827"
        >
          A-24
        </Text>

      </group>
    </Float>
  );
}

export default function StadiumScene() {
  useFrame(({ camera }) => {

    const scroll =
      window.scrollY /
      Math.max(
        document.documentElement.scrollHeight -
          window.innerHeight,
        1
      );

    /*
      Scroll drives the camera.
      0     = outside stadium
      0.25  = stadium
      0.50  = field
      0.75  = close view
      1     = ticket
    */

    const targetZ = 15 - scroll * 9;
    const targetY = 4 - scroll * 2.8;

    camera.position.z +=
      (targetZ - camera.position.z) * 0.035;

    camera.position.y +=
      (targetY - camera.position.y) * 0.035;

    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.4} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={3}
      />

      <pointLight
        position={[-5, 5, 4]}
        intensity={12}
        color="#2563eb"
      />

      <pointLight
        position={[5, 4, -4]}
        intensity={10}
        color="#7c3aed"
      />

      <StadiumStructure />

      <Field />

      <StadiumLights />

      <CricketBall />

      <Ticket3D />

      <Environment preset="night" />

      <gridHelper
        args={[40, 40, "#111827", "#070a10"]}
        position={[0, -1.8, 0]}
      />
    </>
  );
}