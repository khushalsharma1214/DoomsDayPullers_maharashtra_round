import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface StadiumSceneProps {
  scrollProgress: number;
  theme: "dark" | "light";
  selectedMatch: {
    team1: string;
    team2: string;
    name1: string;
    name2: string;
    stadium: string;
    city: string;
    date: string;
    time: string;
    price: number;
  };
  selectedTicketTier?: string;
  onImpactTrigger?: (impacted: boolean) => void;
}

/* ==========================================================================
   1. 3D STADIUM SCOREBOARD / SIGHTSCREEN (POSITIONED RIGHT BEHIND THE STUMPS)
   ========================================================================== */
function StadiumScoreboardBehindStumps({
  selectedMatch,
  isLight,
}: {
  selectedMatch: StadiumSceneProps["selectedMatch"];
  isLight: boolean;
}) {
  return (
    // Positioned directly behind the stumps (z = -4.8, y = 1.85) in direct line of sight
    <group position={[0, 1.85, -4.8]}>
      {/* Ground Support Steel Legs */}
      <mesh position={[-2.1, -1.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 8]} />
        <meshStandardMaterial color={isLight ? "#64748b" : "#1e293b"} metalness={0.8} />
      </mesh>
      <mesh position={[2.1, -1.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 8]} />
        <meshStandardMaterial color={isLight ? "#64748b" : "#1e293b"} metalness={0.8} />
      </mesh>

      {/* Industrial Outer Enclosure Frame */}
      <mesh>
        <boxGeometry args={[4.8, 2.3, 0.16]} />
        <meshStandardMaterial
          color={isLight ? "#0f172a" : "#0a192f"}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Glowing Neon Bezel Edge */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[4.66, 2.16]} />
        <meshBasicMaterial color={isLight ? "#0284c7" : "#00e5ff"} />
      </mesh>

      {/* High-Contrast Screen Background (Never merges with dark sky) */}
      <mesh position={[0, 0, 0.095]}>
        <planeGeometry args={[4.52, 2.02]} />
        <meshBasicMaterial color={isLight ? "#ffffff" : "#0f2b48"} />
      </mesh>

      {/* Dedicated Spot Light illuminating the board */}
      <pointLight
        position={[0, 0, 1.0]}
        intensity={isLight ? 12 : 20}
        distance={6}
        color={isLight ? "#e0f2fe" : "#38bdf8"}
      />

      {/* Sightscreen Top Tag */}
      <Text
        position={[0, 0.8, 0.11]}
        fontSize={0.11}
        color={isLight ? "#0284c7" : "#00e5ff"}
        anchorX="center"
        letterSpacing={0.15}
      >
        ● CRICTIX ARENA SIGHTSCREEN ●
      </Text>

      {/* Main Dynamic Match Clash (MI VS CSK / RCB VS KKR / IND VS AUS) */}
      <Text
        position={[0, 0.38, 0.11]}
        fontSize={0.34}
        color={isLight ? "#000000" : "#ffffff"}
        anchorX="center"
        letterSpacing={0.06}
      >
        {`${selectedMatch.team1}  VS  ${selectedMatch.team2}`}
      </Text>

      {/* Team Full Names */}
      <Text
        position={[0, 0.0, 0.11]}
        fontSize={0.14}
        color={isLight ? "#1e293b" : "#94a3b8"}
        anchorX="center"
      >
        {`${selectedMatch.name1} • ${selectedMatch.name2}`}
      </Text>

      {/* Stadium Venue */}
      <Text
        position={[0, -0.36, 0.11]}
        fontSize={0.13}
        color={isLight ? "#b45309" : "#fbbf24"}
        anchorX="center"
      >
        {`${selectedMatch.stadium} • ${selectedMatch.city}`}
      </Text>

      {/* Date & Live Status */}
      <Text
        position={[0, -0.72, 0.11]}
        fontSize={0.12}
        color={isLight ? "#0f172a" : "#38bdf8"}
        anchorX="center"
      >
        {`${selectedMatch.date} • ${selectedMatch.time} | ACTIVE DISPATCH`}
      </Text>
    </group>
  );
}

/* ==========================================================================
   2. FULL 3D STADIUM ARCHITECTURE
   ========================================================================== */
function StadiumArchitecture({ isLight }: { isLight: boolean }) {
  const towerPositions = useMemo(
    () => [
      [-11, 6, -9],
      [11, 6, -9],
      [-11, 6, 9],
      [11, 6, 9],
    ],
    []
  );

  return (
    <group>
      {/* Outer Stadium Concrete Shell */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[11.5, 12.2, 2.4, 64, 1, true]} />
        <meshStandardMaterial
          color={isLight ? "#cbd5e1" : "#0a0f1d"}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Seating Tier 1 - Lower Bowl */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[7.2, 8.6, 64]} />
        <meshStandardMaterial
          color={isLight ? "#94a3b8" : "#111827"}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Seating Tier 2 - Club Deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
        <ringGeometry args={[8.6, 9.8, 64]} />
        <meshStandardMaterial
          color={isLight ? "#64748b" : "#1e293b"}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Seating Tier 3 - Upper Grandstand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <ringGeometry args={[9.8, 11.2, 64]} />
        <meshStandardMaterial
          color={isLight ? "#475569" : "#0f172a"}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Illuminated Stand Ribbon Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.61, 0]}>
        <ringGeometry args={[8.58, 8.64, 64]} />
        <meshBasicMaterial
          color={isLight ? "#0284c7" : "#00e5ff"}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.21, 0]}>
        <ringGeometry args={[9.78, 9.84, 64]} />
        <meshBasicMaterial
          color={isLight ? "#0284c7" : "#38bdf8"}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof Canopy Overhang */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.2, 0]}>
        <ringGeometry args={[10.4, 12.0, 64]} />
        <meshStandardMaterial
          color={isLight ? "#f1f5f9" : "#020617"}
          metalness={0.8}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4 Steel Lattice Floodlight Towers */}
      {towerPositions.map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.28, 12, 8]} />
            <meshStandardMaterial color={isLight ? "#64748b" : "#1e293b"} metalness={0.8} />
          </mesh>
          <group position={[0, 6, 0]}>
            <mesh>
              <boxGeometry args={[1.8, 0.9, 0.35]} />
              <meshStandardMaterial color="#020617" />
            </mesh>
            <mesh position={[0, 0, 0.19]}>
              <planeGeometry args={[1.6, 0.7]} />
              <meshBasicMaterial color="#e0f2fe" />
            </mesh>
            <pointLight
              intensity={isLight ? 20 : 40}
              distance={28}
              color={idx % 2 === 0 ? "#bae6fd" : "#ffffff"}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   3. OUTFIELD & 22-YARD TURF PITCH
   ========================================================================== */
function OutfieldAndPitch({ isLight }: { isLight: boolean }) {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Grass Outfield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.0, 80]} />
        <meshStandardMaterial color={isLight ? "#15803d" : "#064e3b"} roughness={0.9} />
      </mesh>

      {/* Radial Lawn Stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[3.4, 5.4, 80]} />
        <meshStandardMaterial color={isLight ? "#16a34a" : "#047857"} roughness={0.88} />
      </mesh>

      {/* White Boundary Rope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <torusGeometry args={[6.8, 0.04, 16, 80]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* LED Perimeter Ribbon Board */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[6.95, 6.95, 0.16, 80, 1, true]} />
        <meshBasicMaterial color={isLight ? "#0284c7" : "#00e5ff"} side={THREE.DoubleSide} />
      </mesh>

      {/* 22-Yard Turf Pitch */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.05, 7.5]} />
        <meshStandardMaterial color={isLight ? "#d4b07b" : "#b79358"} roughness={0.88} />
      </mesh>

      {/* Creases */}
      <mesh position={[0, 0.06, -2.1]}>
        <boxGeometry args={[1.7, 0.015, 0.05]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.06, 2.1]}>
        <boxGeometry args={[1.7, 0.015, 0.05]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Pitch Impact Bullseye Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.06, 0.065, 0.8]}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. SCROLL-DRIVEN BALL (DEAD AT REST WHEN IDLE, MOVES ONLY ON SCROLL)
   ========================================================================== */
function ScrollDrivenBowlingBall({
  scrollProgress,
  isLight,
}: {
  scrollProgress: number;
  isLight: boolean;
}) {
  const ballRef = useRef<THREE.Group>(null);
  const middleStumpRef = useRef<THREE.Mesh>(null);
  const offStumpRef = useRef<THREE.Mesh>(null);
  const legStumpRef = useRef<THREE.Mesh>(null);
  const leftBailRef = useRef<THREE.Mesh>(null);
  const rightBailRef = useRef<THREE.Mesh>(null);

  // Delivery bounds: 0.00 to 0.18
  const deliveryT = Math.min(1, Math.max(0, scrollProgress / 0.18));
  const isImpacted = deliveryT >= 0.94;
  const shatterT = Math.max(0, (deliveryT - 0.94) / 0.06);

  useFrame(() => {
    if (ballRef.current) {
      if (deliveryT < 0.65) {
        // Flight Phase A: Bowler release to pitch bounce
        const t = deliveryT / 0.65;
        ballRef.current.position.x = THREE.MathUtils.lerp(0.35, 0.06, t);
        ballRef.current.position.y = THREE.MathUtils.lerp(2.1, 0.1, t * t);
        ballRef.current.position.z = THREE.MathUtils.lerp(7.5, 0.8, t);
      } else if (deliveryT < 0.94) {
        // Flight Phase B: Bounce off turf to smash middle stump
        const t = (deliveryT - 0.65) / 0.29;
        ballRef.current.position.x = THREE.MathUtils.lerp(0.06, 0.0, t);
        ballRef.current.position.y = THREE.MathUtils.lerp(0.1, 0.72, Math.sin(t * Math.PI * 0.5));
        ballRef.current.position.z = THREE.MathUtils.lerp(0.8, -2.5, t);
      } else {
        // Post-impact deflection
        const t = shatterT;
        ballRef.current.position.x = t * 0.35;
        ballRef.current.position.y = 0.72 + Math.sin(t * Math.PI) * 0.6;
        ballRef.current.position.z = -2.5 - t * 3.0;
      }

      // BALL POSITION & SPIN ARE STRICTLY DRIVEN BY SCROLLPROGRESS (FREEZES WHEN IDLE)
      ballRef.current.rotation.x = scrollProgress * 55;
      ballRef.current.rotation.y = scrollProgress * 30;
    }

    // Stumps reaction
    if (middleStumpRef.current && offStumpRef.current && legStumpRef.current) {
      if (!isImpacted) {
        middleStumpRef.current.position.set(0, 0.68, -2.5);
        middleStumpRef.current.rotation.set(0, 0, 0);

        offStumpRef.current.position.set(0.18, 0.68, -2.5);
        offStumpRef.current.rotation.set(0, 0, 0);

        legStumpRef.current.position.set(-0.18, 0.68, -2.5);
        legStumpRef.current.rotation.set(0, 0, 0);
      } else {
        middleStumpRef.current.position.z = -2.5 - shatterT * 2.2;
        middleStumpRef.current.position.y = 0.68 + shatterT * 0.35;
        middleStumpRef.current.rotation.x = -shatterT * 1.6;

        offStumpRef.current.position.x = 0.18 + shatterT * 1.1;
        offStumpRef.current.position.z = -2.5 - shatterT * 1.3;
        offStumpRef.current.rotation.z = -shatterT * 1.4;

        legStumpRef.current.rotation.z = shatterT * 0.35;
      }
    }

    // Bails reaction
    if (leftBailRef.current && rightBailRef.current) {
      if (!isImpacted) {
        leftBailRef.current.position.set(-0.09, 1.32, -2.5);
        leftBailRef.current.rotation.set(0, 0, 0);
        rightBailRef.current.position.set(0.09, 1.32, -2.5);
        rightBailRef.current.rotation.set(0, 0, 0);
      } else {
        leftBailRef.current.position.x = -0.09 - shatterT * 1.4;
        leftBailRef.current.position.y = 1.32 + shatterT * 2.6;
        leftBailRef.current.position.z = -2.5 - shatterT * 1.1;
        leftBailRef.current.rotation.x = shatterT * 4.0;

        rightBailRef.current.position.x = 0.09 + shatterT * 1.8;
        rightBailRef.current.position.y = 1.32 + shatterT * 2.9;
        rightBailRef.current.position.z = -2.5 - shatterT * 0.8;
        rightBailRef.current.rotation.y = shatterT * 5.0;
      }
    }
  });

  return (
    <group>
      {/* THE RED CRICKET BALL */}
      <group ref={ballRef} position={[0.35, 2.1, 7.5]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 48, 48]} />
          <meshStandardMaterial color="#dc2626" roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.222, 0.011, 16, 48]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* 3 WOODEN STUMPS */}
      <mesh ref={middleStumpRef} position={[0, 0.68, -2.5]}>
        <cylinderGeometry args={[0.024, 0.026, 1.25, 16]} />
        <meshStandardMaterial color={isLight ? "#fde047" : "#ca8a04"} roughness={0.4} />
      </mesh>
      <mesh ref={offStumpRef} position={[0.18, 0.68, -2.5]}>
        <cylinderGeometry args={[0.024, 0.026, 1.25, 16]} />
        <meshStandardMaterial color={isLight ? "#fde047" : "#ca8a04"} roughness={0.4} />
      </mesh>
      <mesh ref={legStumpRef} position={[-0.18, 0.68, -2.5]}>
        <cylinderGeometry args={[0.024, 0.026, 1.25, 16]} />
        <meshStandardMaterial color={isLight ? "#fde047" : "#ca8a04"} roughness={0.4} />
      </mesh>

      {/* LED ZING BAILS */}
      <mesh ref={leftBailRef} position={[-0.09, 1.32, -2.5]}>
        <boxGeometry args={[0.15, 0.026, 0.026]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
      </mesh>
      <mesh ref={rightBailRef} position={[0.09, 1.32, -2.5]}>
        <boxGeometry args={[0.15, 0.026, 0.026]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
      </mesh>

      {/* BOWLING END STUMPS */}
      <group position={[0, 0.68, 2.5]}>
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.026, 1.25, 16]} />
            <meshStandardMaterial color={isLight ? "#fde047" : "#ca8a04"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   5. MASTER SCENE EXPORT WITH DIRECT STUMPS & SIGHTSCREEN FRAMING
   ========================================================================== */
export default function StadiumScene({
  scrollProgress,
  theme,
  selectedMatch,
  onImpactTrigger,
}: StadiumSceneProps) {
  const isLight = theme === "light";
  const impactedRef = useRef(false);

  useFrame(({ camera, pointer }) => {
    const p = Math.max(0, Math.min(1, scrollProgress));

    // Impact event: triggers when ball hits the stumps (around p >= 0.16)
    if (p >= 0.16 && !impactedRef.current) {
      impactedRef.current = true;
      onImpactTrigger?.(true);
    } else if (p < 0.10 && impactedRef.current) {
      impactedRef.current = false;
      onImpactTrigger?.(false);
    }

    // Smooth camera path framing the delivery, the stumps and the sightscreen
    let targetX = 0;
    let targetY = 2.2;
    let targetZ = 9.8;
    let lookAtX = 0;
    let lookAtY = 1.0;
    let lookAtZ = -2.5;

    if (p < 0.2) {
      // Phase 1: Track behind delivery down to the wickets and sightscreen
      const t = p / 0.2;
      targetX = THREE.MathUtils.lerp(0.6, -1.2, t);
      targetY = THREE.MathUtils.lerp(2.2, 1.35, t);
      targetZ = THREE.MathUtils.lerp(9.5, 1.4, t);
      lookAtX = 0;
      lookAtY = 0.9;
      lookAtZ = -3.2;
    } else if (p < 0.6) {
      // Phase 2: Pull up to frame the pitch, stumps and the sightscreen board behind it
      const t = (p - 0.2) / 0.4;
      targetX = THREE.MathUtils.lerp(-1.2, 3.8, t);
      targetY = THREE.MathUtils.lerp(1.35, 3.2, t);
      targetZ = THREE.MathUtils.lerp(1.4, 4.2, t);
      lookAtX = 0;
      lookAtY = 1.2;
      lookAtZ = -3.5;
    } else {
      // Phase 3: Elevated spectator viewpoint
      const t = (p - 0.6) / 0.4;
      targetX = THREE.MathUtils.lerp(3.8, 0, t);
      targetY = THREE.MathUtils.lerp(3.2, 2.8, t);
      targetZ = THREE.MathUtils.lerp(4.2, 2.2, t);
      lookAtX = 0;
      lookAtY = 1.6;
      lookAtZ = -4.5;
    }

    targetX += pointer.x * 0.18;
    targetY += -pointer.y * 0.12;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    camera.lookAt(lookAtX, lookAtY, lookAtZ);
  });

  return (
    <>
      <fog attach="fog" args={[isLight ? "#f8fafc" : "#030712", 6, 38]} />

      <ambientLight intensity={isLight ? 0.95 : 0.55} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={isLight ? 2.5 : 2.8}
        color={isLight ? "#ffffff" : "#e0f2fe"}
      />
      <directionalLight
        position={[-10, 12, -8]}
        intensity={1.4}
        color={isLight ? "#93c5fd" : "#38bdf8"}
      />

      <pointLight position={[0, 2, -2.5]} intensity={14} color="#ef4444" distance={10} />
      <pointLight position={[0, 3, 2]} intensity={10} color={isLight ? "#0284c7" : "#00e5ff"} distance={12} />

      {/* FULL 3D STADIUM & OUTFIELD */}
      <StadiumArchitecture isLight={isLight} />
      <OutfieldAndPitch isLight={isLight} />

      {/* 3D SCOREBOARD / SIGHTSCREEN RIGHT BEHIND THE STUMPS */}
      <StadiumScoreboardBehindStumps selectedMatch={selectedMatch} isLight={isLight} />

      {/* SCROLL-DRIVEN BALL & EXPLODING STUMPS */}
      <ScrollDrivenBowlingBall scrollProgress={scrollProgress} isLight={isLight} />
    </>
  );
}