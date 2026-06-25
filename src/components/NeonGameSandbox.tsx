import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface NeonGameSandboxProps {
  scenarioId: number;
  onExit: () => void;
  initialMessage?: string;
  position?: "baseline" | "kitchen";
}

const COURT_WIDTH = 20;
const COURT_LENGTH = 44;
const NET_Z = 0;
const PLAYER_BASELINE_Z = COURT_LENGTH / 2; // 22
const OPPONENT_KITCHEN_Z = -7;
const GRAVITY = 30; // units/sec^2

const audioSrc =
  "https://assets.mixkit.co/active_storage/sfx/2104/2104-preview.mp3"; // Crisp table tennis hit

function Clouds() {
  return (
    <group>
      <mesh position={[-30, 20, -50]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-25, 18, -48]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-35, 17, -49]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      <mesh position={[40, 22, -60]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[33, 20, -58]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[45, 19, -62]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

  function Court() {
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  // Court outer bounds
  const outerBounds = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_WIDTH / 2, 0, -COURT_LENGTH / 2),
      new THREE.Vector3(COURT_WIDTH / 2, 0, -COURT_LENGTH / 2),
      new THREE.Vector3(COURT_WIDTH / 2, 0, COURT_LENGTH / 2),
      new THREE.Vector3(-COURT_WIDTH / 2, 0, COURT_LENGTH / 2),
      new THREE.Vector3(-COURT_WIDTH / 2, 0, -COURT_LENGTH / 2),
    ]);
    return geo;
  }, []);

  // Net line
  const netLine = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_WIDTH / 2, 0, 0),
      new THREE.Vector3(COURT_WIDTH / 2, 0, 0),
    ]);
  }, []);

  // Kitchen lines
  const kitchenFar = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_WIDTH / 2, 0, -7),
      new THREE.Vector3(COURT_WIDTH / 2, 0, -7),
    ]);
  }, []);

  const kitchenNear = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_WIDTH / 2, 0, 7),
      new THREE.Vector3(COURT_WIDTH / 2, 0, 7),
    ]);
  }, []);

  // Center lines
  const centerFar = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -COURT_LENGTH / 2),
      new THREE.Vector3(0, 0, -7),
    ]);
  }, []);

  const centerNear = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 7),
      new THREE.Vector3(0, 0, COURT_LENGTH / 2),
    ]);
  }, []);

  return (
    <group>
      {/* Grass/Park Background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#8FD065" roughness={0.9} />
      </mesh>
      {/* Outer court floor (slate) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[COURT_WIDTH + 8, COURT_LENGTH + 12]} />
        <meshStandardMaterial color="#F7B5B6" roughness={0.8} />
      </mesh>
      {/* Inner court floor (cream) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[COURT_WIDTH, COURT_LENGTH]} />
        <meshStandardMaterial color="#F7B733" roughness={0.8} />
      </mesh>
      {/* Kitchen floor (peach/yellow) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[COURT_WIDTH, 14]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>

            {/* Thick Solid Court Lines */}
      <group position={[0, 0.01, 0]}>
        {/* Outer bounds */}
        <mesh position={[0, 0, -COURT_LENGTH/2]}><boxGeometry args={[COURT_WIDTH + 0.2, 0.05, 0.2]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0, COURT_LENGTH/2]}><boxGeometry args={[COURT_WIDTH + 0.2, 0.05, 0.2]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[-COURT_WIDTH/2, 0, 0]}><boxGeometry args={[0.2, 0.05, COURT_LENGTH]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[COURT_WIDTH/2, 0, 0]}><boxGeometry args={[0.2, 0.05, COURT_LENGTH]} /><meshBasicMaterial color="#ffffff" /></mesh>
        {/* Net line */}
        <mesh position={[0, 0, 0]}><boxGeometry args={[COURT_WIDTH + 0.2, 0.05, 0.2]} /><meshBasicMaterial color="#ffffff" /></mesh>
        {/* Kitchen lines */}
        <mesh position={[0, 0, -7]}><boxGeometry args={[COURT_WIDTH + 0.2, 0.05, 0.2]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0, 7]}><boxGeometry args={[COURT_WIDTH + 0.2, 0.05, 0.2]} /><meshBasicMaterial color="#ffffff" /></mesh>
        {/* Center lines */}
        <mesh position={[0, 0, -COURT_LENGTH/4 - 3.5]}><boxGeometry args={[0.2, 0.05, COURT_LENGTH/2 - 7]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0, COURT_LENGTH/4 + 3.5]}><boxGeometry args={[0.2, 0.05, COURT_LENGTH/2 - 7]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>

      {/* Actual Pickleball Lines */}
      <primitive object={new THREE.Line(outerBounds, lineMaterial)} />
      <primitive
        object={
          new THREE.Line(
            netLine,
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              opacity: 0.5,
              transparent: true,
            })
          )
        }
      />
      <primitive object={new THREE.Line(kitchenFar, lineMaterial)} />
      <primitive object={new THREE.Line(kitchenNear, lineMaterial)} />
      <primitive object={new THREE.Line(centerFar, lineMaterial)} />
      <primitive object={new THREE.Line(centerNear, lineMaterial)} />

      {/* Net vertical visual */}
      <group position={[0, 1.5, 0]}>
        {/* Main mesh for netting */}
        <mesh>
          <planeGeometry args={[COURT_WIDTH, 3, 40, 6]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
        {/* Solid translucent backer for the netting */}
        <mesh>
          <planeGeometry args={[COURT_WIDTH, 3]} />
          <meshBasicMaterial
            color="#000000"
            side={THREE.DoubleSide}
            transparent
            opacity={0.15}
          />
        </mesh>
        {/* Top tape */}
      <mesh position={[0, 1.45, 0]}>
        <planeGeometry args={[COURT_WIDTH, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
    </group>

    {/* Simple Audience/Park Trees */}
    {[ -20, 20 ].map((x) => (
      <group key={x}>
        {[-15, 0, 15].map((z) => (
          <group key={z} position={[x, 0, z]}>
            <mesh position={[0, 2, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 4]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0, 5, 0]}>
              <sphereGeometry args={[3]} />
              <meshStandardMaterial color="#2d5a27" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    ))}
    {/* Audience Benches */}
    <group position={[COURT_WIDTH / 2 + 6, 0.5, 0]}>
      <mesh rotation={[0, 0, 0]}>
         <boxGeometry args={[2, 1, 10]} />
         <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
    <group position={[-COURT_WIDTH / 2 - 6, 0.5, 0]}>
      <mesh rotation={[0, 0, 0]}>
         <boxGeometry args={[2, 1, 10]} />
         <meshStandardMaterial color="#888888" />
      </mesh>
    </group>

  </group>
);
}

function PaddleShape({
  faceColor,
  faceEmissive,
  handleColor = "#333333",
  tilt = -0.2,
  label = "",
}: {
  faceColor: string;
  faceEmissive: string;
  handleColor?: string;
  tilt?: number;
  label?: string;
}) {
  return (
    <group rotation={[tilt, 0, 0]}>
      {/* Paddle Face (Oval) */}
      <mesh
        position={[0, 0.6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1.2, 1, 1.4]}
      >
        <cylinderGeometry args={[1, 1, 0.15, 32]} />
        <meshStandardMaterial
          color={faceColor}
          emissive={faceEmissive}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
        <meshStandardMaterial color={handleColor} roughness={0.8} />
      </mesh>

      {/* Text Label */}
      {label && (
        <Text
          position={[0, 1.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.8}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="white"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function TrajectoryLine({ start, end, color, arcHeight = 3 }: { start: [number, number, number], end: [number, number, number], color: string, arcHeight?: number }) {
  const lineObj = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = start[0] + (end[0] - start[0]) * t;
        const z = start[2] + (end[2] - start[2]) * t;
        const y = start[1] + (end[1] - start[1]) * t + Math.sin(t * Math.PI) * arcHeight;
        pts.push(new THREE.Vector3(x, y, z));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.8 }));
    line.computeLineDistances();
    return line;
  }, [start, end, color, arcHeight]);

  return <primitive object={lineObj} />;
}

function GameEngine({
  scoreProp: totalHitsProp,
  setScoreProp: setTotalHits,
  matchState,
  setFeedback,
  playOpponent,
  playBounce,
  playPop,
  playOut,
  paddleXRef,
  paddleZRef,
  pointerStateRef,
  scenarioId,
  onFault,
}: {
  scoreProp: React.MutableRefObject<number>;
  setScoreProp: React.Dispatch<React.SetStateAction<number>>;
  matchState: MatchState;
  setFeedback: (f: string) => void;
  playOpponent: () => void;
  playBounce: () => void;
  playPop: () => void;
  playOut: () => void;
  paddleXRef: React.MutableRefObject<number>;
  paddleZRef: React.MutableRefObject<number>;
  pointerStateRef: React.MutableRefObject<{isDown: boolean; startTime: number; released: boolean; pressDuration: number}>;
  scenarioId: number;
  onFault: (wonByMe: boolean) => void;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const paddleRef = useRef<THREE.Group>(null);
  const partnerRef = useRef<THREE.Group>(null);
  const oppLeftRef = useRef<THREE.Group>(null);
  const oppRightRef = useRef<THREE.Group>(null);
  
  const entities = {
    me: { ref: paddleRef, role: "ME", color: "#1A4B29", defaultPos: [COURT_WIDTH/4, 0.5, PLAYER_BASELINE_Z + 1] },
    partner: { ref: partnerRef, role: "PARTNER", color: "#1A4B29", defaultPos: [-COURT_WIDTH/4, 0.5, PLAYER_BASELINE_Z + 1] },
    oppLeft: { ref: oppLeftRef, role: "RECEIVER", color: "#A2998B", defaultPos: [-COURT_WIDTH/4, 0.5, -PLAYER_BASELINE_Z - 1] },
    oppRight: { ref: oppRightRef, role: "OPPONENT", color: "#A2998B", defaultPos: [COURT_WIDTH/4, 0.5, OPPONENT_KITCHEN_Z - 1] }
  };

  type TurnPhase = "aiming" | "flying_to_oppLeft" | "flying_to_partner" | "flying_to_oppRight" | "catching" | "caught" | "missed";
  
  const [phase, setPhase] = useState<TurnPhase>("aiming");
  const [targetPoint, setTargetPoint] = useState<{x: number, z: number}>({ x: 0, z: -10 });
  const [myPos, setMyPos] = useState({ x: entities.me.defaultPos[0], z: entities.me.defaultPos[2] });
  const [charge, setCharge] = useState(0);
  
  const anim = useRef({
    startX: 0, startZ: 0,
    endX: 0, endZ: 0,
    progress: 0,
    duration: 1.5,
    arcHeight: 3,
  });

  const setAnimTo = (fromRef: any, toRef: any) => {
    const startX = fromRef.current.position.x;
    const startZ = fromRef.current.position.z;
    const isBotOutHit = Math.random() < 0.1; 
    let endX = toRef.current.position.x + (Math.random() - 0.5) * (isBotOutHit ? 15 : 4);
    let endZ = toRef.current.position.z + (Math.random() - 0.5) * (isBotOutHit ? 15 : 4);
    if (!isBotOutHit) {
      endX = Math.max(-COURT_WIDTH/2 + 0.5, Math.min(COURT_WIDTH/2 - 0.5, endX));
      endZ = Math.max(-COURT_LENGTH/2 + 0.5, Math.min(COURT_LENGTH/2 - 0.5, endZ));
    }
    anim.current = {
       startX, startZ, endX, endZ, progress: 0, duration: 1.2, arcHeight: 2.5
    };
  };

  useFrame((_, delta) => {
    if (!ballRef.current) return;
    
    let chargePercent = 0;
    if (pointerStateRef.current.isDown) {
      chargePercent = (performance.now() - pointerStateRef.current.startTime) / 1200;
    } else if (pointerStateRef.current.released) {
      chargePercent = pointerStateRef.current.pressDuration / 1200;
    }
    chargePercent = Math.min(1, Math.max(0, chargePercent));
    setCharge(chargePercent);

    if (phase === "aiming") {
      const isRed = chargePercent > 0.8;
      let targetX = paddleXRef.current * 1.5;
      let targetZ = isRed ? -COURT_LENGTH/2 - 2 - Math.random() * 5 : -Math.max(3, Math.abs(paddleZRef.current) + 5);

      setTargetPoint({ x: targetX, z: targetZ });
      ballRef.current.position.set(myPos.x, 1.0, myPos.z - 0.5);
      
      if (pointerStateRef.current.released) {
         pointerStateRef.current.released = false;
         setPhase("flying_to_oppLeft");
         anim.current = {
            startX: myPos.x, startZ: myPos.z - 0.5,
            endX: targetX, endZ: targetZ,
            progress: 0, duration: isRed ? 0.8 : 1.2, arcHeight: isRed ? 1.5 : 2.5
         };
         playPop();
         setFeedback("SERVED!");
         setTimeout(()=>setFeedback(""), 800);
      }
    } else if (phase === "catching") {
      setMyPos({ x: paddleXRef.current, z: paddleZRef.current });
      
      if (pointerStateRef.current.released) {
         pointerStateRef.current.released = false;
         const dist = Math.sqrt(Math.pow(myPos.x - targetPoint.x, 2) + Math.pow(myPos.z - targetPoint.z, 2));
         if (dist < 4.0) {
           setPhase("flying_to_oppLeft");
           setFeedback("GOOD JOB!");
           playPop();
           if ('speechSynthesis' in window) {
             const phrases = ['Great catch!', 'Perfect sweet spot!', 'Nice touch!', 'Beautiful shot!'];
             const utter = new SpeechSynthesisUtterance(phrases[Math.floor(Math.random() * phrases.length)]);
             utter.rate = 1.2; utter.pitch = 1.1; window.speechSynthesis.speak(utter);
           }
           setTotalHits(h => h + 1);
           
           const isRed = chargePercent > 0.8;
           let targetX = paddleXRef.current * 1.5;
           let targetZ = isRed ? -COURT_LENGTH/2 - 2 - Math.random() * 5 : -Math.max(3, Math.abs(paddleZRef.current) + 5);
           setTargetPoint({ x: targetX, z: targetZ });
           
           anim.current = {
               startX: ballRef.current!.position.x, 
               startZ: ballRef.current!.position.z,
               endX: targetX,
               endZ: targetZ,
               progress: 0, 
               duration: isRed ? 0.8 : (1.5 - chargePercent * 0.5), 
               arcHeight: isRed ? 1.5 : (2.5 - chargePercent * 1.0)
           };
           
           setTimeout(()=>setFeedback(""), 800);
         } else {
           setPhase("missed");
           setFeedback("MISS!");
           if ('speechSynthesis' in window) {
             const utter = new SpeechSynthesisUtterance("Nice try.");
             utter.rate = 1.2; utter.pitch = 1.1; window.speechSynthesis.speak(utter);
           }
           setTotalHits(0);
           setTimeout(() => {
             setPhase("aiming");
             setFeedback("");
             onFault(false);
           }, 1500);
         }
      }
    }

    if (paddleRef.current) paddleRef.current.position.set(myPos.x, 0.5, myPos.z);
    
    const moveBot = (ref: any, defaultPos: number[], isTarget: boolean, targetX: number, targetZ: number) => {
        if (!ref.current) return;
        const tx = isTarget ? targetX : defaultPos[0];
        const tz = isTarget ? targetZ - 1 : defaultPos[2];
        ref.current.position.x += (tx - ref.current.position.x) * 0.05;
        ref.current.position.z += (tz - ref.current.position.z) * 0.05;
    };
    
    moveBot(oppLeftRef, entities.oppLeft.defaultPos, phase === "flying_to_oppLeft", anim.current.endX, anim.current.endZ);
    moveBot(partnerRef, entities.partner.defaultPos, phase === "flying_to_partner", anim.current.endX, anim.current.endZ);
    moveBot(oppRightRef, entities.oppRight.defaultPos, phase === "flying_to_oppRight", anim.current.endX, anim.current.endZ);
    
    if (phase.startsWith("flying_")) {
       anim.current.progress += delta / anim.current.duration;
       if (anim.current.progress > 1) anim.current.progress = 1;
       
       const a = anim.current;
       const x = a.startX + (a.endX - a.startX) * a.progress;
       const z = a.startZ + (a.endZ - a.startZ) * a.progress;
       const y = 1.0 + Math.sin(a.progress * Math.PI) * a.arcHeight;
       ballRef.current.position.set(x, y, z);
       
       if (a.progress >= 1.0) {
           const isOut = a.endX < -COURT_WIDTH/2 || a.endX > COURT_WIDTH/2 || a.endZ < -COURT_LENGTH/2 || a.endZ > COURT_LENGTH/2;
           if (isOut) {
              setPhase("missed");
              setFeedback("OUT!");
              playOut();
              if ('speechSynthesis' in window) {
                  const outPhrases = ["Out!", "Fault!"];
                  const utter = new SpeechSynthesisUtterance(outPhrases[Math.floor(Math.random() * outPhrases.length)]);
                  utter.rate = 1.2; utter.pitch = 1.1; window.speechSynthesis.speak(utter);
              }
              setTotalHits(h => Math.max(0, h - 10));
              setTimeout(() => {
                 setPhase("aiming");
                 setFeedback("");
                 onFault(false);
              }, 1500);
           } else {
             if (phase === "flying_to_oppLeft") {
                playPop();
                setPhase("flying_to_partner");
                setAnimTo(entities.oppLeft.ref, entities.partner.ref);
             } else if (phase === "flying_to_partner") {
                playPop();
                setPhase("flying_to_oppRight");
                setAnimTo(entities.partner.ref, entities.oppRight.ref);
             } else if (phase === "flying_to_oppRight") {
                playPop();
                setPhase("catching");
                const isOutHit = Math.random() < 0.1;
                let endX = COURT_WIDTH/4 + (Math.random() - 0.5) * (isOutHit ? 25 : 8);
                let endZ = PLAYER_BASELINE_Z - 5 + (Math.random() - 0.5) * (isOutHit ? 25 : 10);
                if (!isOutHit) {
                  endX = Math.max(-COURT_WIDTH/2 + 0.5, Math.min(COURT_WIDTH/2 - 0.5, endX));
                  endZ = Math.max(0, Math.min(COURT_LENGTH/2 - 0.5, endZ));
                }
                setTargetPoint({ x: endX, z: endZ });
                anim.current = {
                   startX: entities.oppRight.ref.current!.position.x,
                   startZ: entities.oppRight.ref.current!.position.z,
                   endX, endZ,
                   progress: 0, duration: 1.5, arcHeight: 3
                };
             }
           }
        }
    } else if (phase === "catching" || phase === "missed" || phase === "caught") {
       anim.current.progress += delta / anim.current.duration;
       const prog = Math.min(anim.current.progress, 1);
       if (prog < 1) {
         const a = anim.current;
         const x = a.startX + (a.endX - a.startX) * prog;
         const z = a.startZ + (a.endZ - a.startZ) * prog;
         const y = 1.0 + Math.sin(prog * Math.PI) * a.arcHeight;
         ballRef.current.position.set(x, y, z);
       } else {
         ballRef.current.position.y = 0.5;
       }
    }
  });

  return (
    <>
      <group ref={oppLeftRef} position={entities.oppLeft.defaultPos as any}>
        <PaddleShape faceColor={entities.oppLeft.color} faceEmissive={entities.oppLeft.color} tilt={0.2} label={entities.oppLeft.role} />
      </group>
      <group ref={oppRightRef} position={entities.oppRight.defaultPos as any}>
        <PaddleShape faceColor={entities.oppRight.color} faceEmissive={entities.oppRight.color} tilt={0.2} label={entities.oppRight.role} />
      </group>
      <group ref={paddleRef} position={entities.me.defaultPos as any}>
        <PaddleShape faceColor={entities.me.color} faceEmissive={entities.me.color} tilt={-0.2} label={entities.me.role} />
      </group>
      <group ref={partnerRef} position={entities.partner.defaultPos as any}>
        <PaddleShape faceColor={entities.partner.color} faceEmissive={entities.partner.color} tilt={-0.2} label={entities.partner.role} />
      </group>

      <mesh ref={ballRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#E9FF66" emissive="#E9FF66" emissiveIntensity={0.8} />
      </mesh>

      
      {(() => {
         // Show during aiming and any airborne phase!
         const isAirborne = phase.startsWith("flying_") || phase === "catching" || phase === "caught" || phase === "missed";
         
         const startPos: [number, number, number] = isAirborne ? [anim.current.startX, 1.0, anim.current.startZ] : [myPos.x, 1.0, myPos.z - 0.5];
         const endPos: [number, number, number] = isAirborne ? [anim.current.endX, 0, anim.current.endZ] : [targetPoint.x, 0, targetPoint.z];
         
         const targetIsOut = endPos[0] < -COURT_WIDTH/2 || endPos[0] > COURT_WIDTH/2 || endPos[2] < -COURT_LENGTH/2 || endPos[2] > COURT_LENGTH/2;
         const inOutColor = targetIsOut ? "#FF3333" : "#33FF33";

         return (
            <>
              {(phase === "aiming" || isAirborne) && (
                 <TrajectoryLine start={startPos} end={endPos} color={inOutColor} arcHeight={isAirborne ? anim.current.arcHeight : 3.0} />
              )}
              {(phase === "aiming" || isAirborne) && (
                 <mesh position={[endPos[0], 0.05, endPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[isAirborne ? Math.max(0.2, 1.5 - anim.current.progress * 1.3) : 1.5, isAirborne ? Math.max(0.5, 2.0 - anim.current.progress * 1.5) : 2.0, 32]} />
                    <meshBasicMaterial color={inOutColor} transparent opacity={0.8} />
                 </mesh>
              )}
            </>
         );
      })()}
      
      {/* Tap to serve UI overlay inside 3D or HTML */}
      {phase === "aiming" && charge === 0 && (
        <Html position={[myPos.x, 2.0, myPos.z]} center>
          <div className="bg-black/80 font-bold text-white px-4 py-2 rounded pointer-events-none animate-pulse whitespace-nowrap border border-white/50">
             HOLD TO SERVE
          </div>
        </Html>
      )}
      
      {/* Power Bar */}
      {(phase === "aiming" || phase === "catching") && charge > 0 && (
        <Html position={[myPos.x + 2, 0.5, myPos.z]} center zIndexRange={[100, 0]}>
          <div className="w-8 h-32 bg-black/50 border-2 border-white/50 rounded flex flex-col justify-end overflow-hidden transform translate-y-[-50%] ring-4 ring-black/20 text-xs font-bold text-white relative">
             <div className="absolute inset-0 z-10 flex flex-col justify-between py-1 opacity-50">
                <span className="text-center">-</span>
                <span className="text-center">-</span>
                <span className="text-center">-</span>
             </div>
             <div 
               className="w-full transition-all duration-75 relative z-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
               style={{ 
                  height: `${charge * 100}%`,
                  backgroundColor: charge > 0.8 ? '#FF3333' : charge > 0.4 ? '#33FF33' : '#FFFF33'
               }}
             />
          </div>
        </Html>
      )}

    </>
  );
}

function CameraRig({
  cameraView
}: {
  cameraView: "tv" | "bird";
}) {
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  useFrame((state) => {
    let targetPos = new THREE.Vector3(0, 18, PLAYER_BASELINE_Z + 15);
    let targetLook = new THREE.Vector3(0, -6, 0);

    if (cameraView === "bird") {
      targetPos.set(0, 45, 0);
      targetLook.set(0, 0, 0);
    }

    const speed = 0.05;
    state.camera.position.lerp(targetPos, speed);
    lookAtTarget.current.lerp(targetLook, speed);
    state.camera.lookAt(lookAtTarget.current);
  });
  return null;
}

export type MatchState = {
  myScore: number;
  oppScore: number;
  serverNumber: 1 | 2;
  isMyServe: boolean;
};

export default function NeonGameSandbox({
  scenarioId,
  onExit,
  initialMessage,
  position = "baseline",
}: NeonGameSandboxProps) {
  const [cameraView, setCameraView] = useState<"tv" | "bird">("tv");
  const [totalHits, setTotalHits] = useState(0);
  const [matchState, setMatchState] = useState<MatchState>({
    myScore: 0,
    oppScore: 0,
    serverNumber: 2,
    isMyServe: true,
  });
  const [feedback, setFeedback] = useState("");

  const totalHitsRef = useRef(0);
  const paddleXRef = useRef(COURT_WIDTH / 4);
  const paddleZRef = useRef(PLAYER_BASELINE_Z + 2);
  const pointerStateRef = useRef<{isDown: boolean; startTime: number; released: boolean; pressDuration: number}>({isDown: false, startTime: 0, released: false, pressDuration: 0});
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

    const playProceduralSound = (type: 'hit' | 'bounce' | 'out') => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'hit') {
      // Pickleball paddle hit pop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(1.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      // Noise burst
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 2000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start(ctx.currentTime);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'out') {
      // dull 'thud' or disappointment sound effect
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Bounce hollow thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  };

  const speak = (val: string) => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(val);
      utter.rate = 1.2;
      utter.pitch = 1.1;
      window.speechSynthesis.speak(utter);
    }
  };

  const playOpponent = () => playProceduralSound('hit');
  const playBounce = () => playProceduralSound('bounce');
  const playPop = () => playProceduralSound('hit');


  const handlePointerDown = (e: React.PointerEvent) => {
    initAudio();
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    pointerStateRef.current.isDown = true;
    pointerStateRef.current.startTime = performance.now();
    pointerStateRef.current.released = false;
    pointerStateRef.current.pressDuration = 0;
  };

    const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStateRef.current.isDown) {
      pointerStateRef.current.isDown = false;
      pointerStateRef.current.released = true;
      pointerStateRef.current.pressDuration = performance.now() - pointerStateRef.current.startTime;
    }
    pointerStartRef.current = null;
  };

  const handleRallyOver = (wonRally: boolean) => {};

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = Math.max(
      -1,
      Math.min(1, (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)),
    );
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    paddleXRef.current = x * (COURT_WIDTH / 2 + 2);

    if (pointerStateRef.current.isDown && pointerStartRef.current) {
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            pointerStateRef.current.startTime = performance.now();
            pointerStartRef.current.x = e.clientX;
            pointerStartRef.current.y = e.clientY;
        }
    }

    if (scenarioId === 1) {
      // Level 1: sliding deeply outside baseline
      // Allow moving up to 10 feet behind the baseline
      const zProgress = Math.max(0, Math.min(1, (y - 0.4) / 0.6));
      paddleZRef.current = 7 + zProgress * (PLAYER_BASELINE_Z + 10 - 7);
    } else if (scenarioId === 2) {
      // Level 2: Locked at kitchen
      paddleZRef.current = 7;
    } else {
      // Level 3: Dynamic
      const zProgress = Math.max(0, Math.min(1, (y - 0.4) / 0.6));
      paddleZRef.current = 7 + zProgress * (PLAYER_BASELINE_Z + 10 - 7);
    }
  };

  

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F6EFE9] flex flex-col items-center justify-center font-sans select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <div className="flex items-center justify-between p-4 bg-transparent z-40 absolute top-0 w-full pointer-events-none">
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="text-[#1A4B29] hover:text-[#13371e] p-2 pointer-events-auto transition-colors"
        >
          <ArrowLeft size={28} />
        </button>
        {true && (
          <div className="flex gap-4">
            <div className="text-center font-bold bg-white/80 px-6 py-1.5 rounded-full border border-[#A2998B] shadow-sm pointer-events-auto">
              <div className="text-[10px] text-[#978E81] uppercase tracking-widest leading-tight">
                {matchState.isMyServe ? "Serving" : "Receiving"}
              </div>
              <div className="text-sm text-[#1A4B29] font-mono tracking-widest">
                {matchState.isMyServe 
                  ? `${matchState.myScore} - ${matchState.oppScore} - ${matchState.serverNumber}`
                  : `${matchState.oppScore} - ${matchState.myScore} - ${matchState.serverNumber}`
                }
              </div>
            </div>
          </div>
        )}
        <div className="w-12"></div>
      </div>

      {feedback && (
        <div className="absolute bottom-[10%] left-0 right-0 z-50 pointer-events-none flex justify-center">
          <div className="bg-white/95 px-6 py-3 border-2 border-[#1A4B29] rounded-full shadow-lg">
            <p className="text-[#1A4B29] font-black text-sm tracking-widest uppercase">
              {feedback}
            </p>
          </div>
        </div>
      )}

      {/* 3D Canvas rendering the Game Box */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas shadows={{ type: THREE.PCFShadowMap }}>
          <color attach="background" args={["#87CEEB"]} />
          <Clouds />
          <Suspense fallback={null}>
            <PerspectiveCamera
              makeDefault
              position={[0, 8, PLAYER_BASELINE_Z + 12]}
              fov={55}
            />
            <CameraRig cameraView={cameraView} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[20, 30, 20]} intensity={1.5} castShadow />

            <Court />
            <GameEngine
              scenarioId={scenarioId}
              scoreProp={totalHitsRef}
              setScoreProp={setTotalHits}
              matchState={matchState}
              setFeedback={setFeedback}
              playOpponent={playOpponent}
              playBounce={playBounce}
              playPop={playPop}
              playOut={() => playProceduralSound('out')}
              paddleXRef={paddleXRef}
              paddleZRef={paddleZRef}
              pointerStateRef={pointerStateRef}
              onFault={handleRallyOver}
            />
          </Suspense>
        </Canvas>
      </div>



      
    </div>
  );
}
