import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RegionName } from '../types';
import { AlertTriangle } from 'lucide-react';

interface BrainVizProps {
    unlockedRegions: Record<string, boolean>;
    anxiety: number;
    isBreakdown: boolean;
    totalNeurons: number;
    isCyborg?: boolean;
    themeMode: 'light' | 'dark';
}

// --- CONSTANTS ---
const REGION_COLORS: Record<string, string> = {
    [RegionName.Frontal]: '#ef4444',   // Red
    [RegionName.Parietal]: '#f97316',  // Orange
    [RegionName.Temporal]: '#ec4899',  // Pink
    [RegionName.Occipital]: '#3b82f6', // Blue
    [RegionName.Limbic]: '#d946ef',    // Purple
    [RegionName.Cerebellum]: '#14b8a6',// Teal
    [RegionName.Brainstem]: '#64748b'  // Slate
};

// --- UTILS ---

/**
 * Distorts a sphere geometry to look like a brain lobe (wrinkly) or cerebellum (striated).
 */
const generateLobeGeometry = (type: 'lobe' | 'cerebellum' | 'stem') => {
    let geo: THREE.BufferGeometry;
    
    if (type === 'stem') {
        geo = new THREE.CylinderGeometry(0.3, 0.2, 2, 16, 4);
    } else {
        // High segment count for smooth wrinkles
        geo = new THREE.SphereGeometry(1, 64, 64);
    }

    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const axis = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        
        let offset = 0;
        if (type === 'lobe') {
            // Gyri and Sulci approximation using sine waves
            // "Brain Coral" pattern
            const freq = 4.5;
            const noise = Math.sin(v.x * freq) * Math.cos(v.y * freq) * Math.sin(v.z * freq);
            offset = noise * 0.15;
            
            // Secondary finer noise
            offset += Math.sin(v.x * 10 + v.y * 10) * 0.02;
            
            // General shaping (flatten bottom)
            if (v.y < -0.5) offset -= 0.1;
        } else if (type === 'cerebellum') {
            // Horizontal striations
            offset = Math.sin(v.y * 25) * 0.04;
        } else if (type === 'stem') {
            // Slight organic irregularity
            offset = Math.sin(v.y * 5) * 0.02;
        }

        // Apply distortion along normal vector (roughly)
        // For sphere, normal is practically the normalized position
        if (type !== 'stem') {
            const len = v.length();
            v.normalize().multiplyScalar(len + offset);
        } else {
            // For cylinder, expand x/z
            const r = Math.sqrt(v.x*v.x + v.z*v.z);
            if (r > 0) {
                const scale = 1 + offset;
                v.x *= scale;
                v.z *= scale;
            }
        }

        pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
};

// --- COMPONENTS ---

const BrainLobe = ({ 
    position, 
    rotation, 
    scale, 
    color, 
    type, 
    themeMode,
    anxiety 
}: { 
    position: [number, number, number], 
    rotation?: [number, number, number], 
    scale?: [number, number, number], 
    color: string, 
    type: 'lobe' | 'cerebellum' | 'stem',
    themeMode: 'light' | 'dark',
    anxiety: number
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Generate geometry once per component instance
    const geometry = useMemo(() => generateLobeGeometry(type), [type]);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Subtle throbbing with anxiety
        const pulse = 1 + Math.sin(state.clock.elapsedTime * (2 + (anxiety / 50))) * (anxiety / 2000);
        meshRef.current.scale.set(
            (scale?.[0] || 1) * pulse,
            (scale?.[1] || 1) * pulse,
            (scale?.[2] || 1) * pulse
        );
    });

    return (
        <mesh 
            ref={meshRef}
            position={position} 
            rotation={rotation}
            castShadow 
            receiveShadow
        >
            <primitive object={geometry} />
            <meshStandardMaterial 
                color={color}
                roughness={themeMode === 'light' ? 0.4 : 0.2}
                metalness={themeMode === 'light' ? 0.1 : 0.6}
                emissive={color}
                emissiveIntensity={themeMode === 'dark' ? 0.2 + (anxiety/200) : 0}
            />
        </mesh>
    );
};

const BiologicalBrain = ({ unlockedRegions, themeMode, anxiety }: { unlockedRegions: Record<string, boolean>, themeMode: 'light' | 'dark', anxiety: number }) => {
    // We construct the brain from multiple lobes.
    // Positions are carefully tweaked to form a coherent brain shape.
    
    return (
        <group>
            {/* BRAINSTEM (Central Support) */}
            {unlockedRegions[RegionName.Brainstem] && (
                <BrainLobe 
                    type="stem"
                    position={[0, -2.0, -0.2]} 
                    rotation={[0.2, 0, 0]}
                    scale={[1, 1, 1]}
                    color={REGION_COLORS[RegionName.Brainstem]}
                    themeMode={themeMode}
                    anxiety={anxiety}
                />
            )}

            {/* CEREBELLUM (Back Bottom) */}
            {unlockedRegions[RegionName.Cerebellum] && (
                <group position={[0, -1.4, -1.2]} rotation={[-0.2, 0, 0]}>
                    <BrainLobe 
                        type="cerebellum"
                        position={[-0.6, 0, 0]} 
                        scale={[0.7, 0.6, 0.7]}
                        color={REGION_COLORS[RegionName.Cerebellum]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                    <BrainLobe 
                        type="cerebellum"
                        position={[0.6, 0, 0]} 
                        scale={[0.7, 0.6, 0.7]}
                        color={REGION_COLORS[RegionName.Cerebellum]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                </group>
            )}

            {/* LIMBIC SYSTEM (Internal Core - visible if others missing or translucent) */}
            {/* We position this centrally. If lobes are present, it's hidden inside, which is anatomically correct-ish */}
            {unlockedRegions[RegionName.Limbic] && (
                <BrainLobe 
                    type="lobe"
                    position={[0, -0.2, 0]} 
                    scale={[0.5, 0.5, 0.5]}
                    color={REGION_COLORS[RegionName.Limbic]}
                    themeMode={themeMode}
                    anxiety={anxiety}
                />
            )}

            {/* TEMPORAL LOBES (Sides) */}
            {unlockedRegions[RegionName.Temporal] && (
                <group>
                    <BrainLobe 
                        type="lobe"
                        position={[-1.2, -0.4, 0.2]} 
                        rotation={[0, 0, 0.2]}
                        scale={[0.6, 0.8, 1.2]}
                        color={REGION_COLORS[RegionName.Temporal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                    <BrainLobe 
                        type="lobe"
                        position={[1.2, -0.4, 0.2]} 
                        rotation={[0, 0, -0.2]}
                        scale={[0.6, 0.8, 1.2]}
                        color={REGION_COLORS[RegionName.Temporal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                </group>
            )}

            {/* OCCIPITAL LOBES (Back) */}
            {unlockedRegions[RegionName.Occipital] && (
                <group>
                    <BrainLobe 
                        type="lobe"
                        position={[-0.5, 0.2, -1.6]} 
                        scale={[0.7, 0.8, 0.8]}
                        color={REGION_COLORS[RegionName.Occipital]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                    <BrainLobe 
                        type="lobe"
                        position={[0.5, 0.2, -1.6]} 
                        scale={[0.7, 0.8, 0.8]}
                        color={REGION_COLORS[RegionName.Occipital]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                </group>
            )}

            {/* PARIETAL LOBES (Top Back) */}
            {unlockedRegions[RegionName.Parietal] && (
                <group>
                    <BrainLobe 
                        type="lobe"
                        position={[-0.6, 1.2, -0.5]} 
                        scale={[0.8, 0.9, 1.0]}
                        color={REGION_COLORS[RegionName.Parietal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                    <BrainLobe 
                        type="lobe"
                        position={[0.6, 1.2, -0.5]} 
                        scale={[0.8, 0.9, 1.0]}
                        color={REGION_COLORS[RegionName.Parietal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                </group>
            )}

            {/* FRONTAL LOBES (Front) */}
            {unlockedRegions[RegionName.Frontal] && (
                <group>
                    <BrainLobe 
                        type="lobe"
                        position={[-0.6, 0.6, 1.0]} 
                        scale={[0.9, 1.0, 1.1]}
                        color={REGION_COLORS[RegionName.Frontal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                    <BrainLobe 
                        type="lobe"
                        position={[0.6, 0.6, 1.0]} 
                        scale={[0.9, 1.0, 1.1]}
                        color={REGION_COLORS[RegionName.Frontal]}
                        themeMode={themeMode}
                        anxiety={anxiety}
                    />
                </group>
            )}
        </group>
    );
};

const CyborgCore = ({ themeMode, isBreakdown }: { themeMode: 'light' | 'dark', isBreakdown: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        if (!meshRef.current || !ringRef.current) return;
        const t = state.clock.getElapsedTime();
        
        meshRef.current.rotation.x = t * 0.5;
        meshRef.current.rotation.y = t * 0.8;
        
        ringRef.current.rotation.x = t * -0.2;
        ringRef.current.rotation.z = t * 0.1;

        if (isBreakdown) {
            meshRef.current.scale.setScalar(1 + Math.sin(t * 20) * 0.1);
        }
    });

    const coreColor = isBreakdown ? '#ef4444' : '#10b981';

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[1.5, 1]} />
                    <meshStandardMaterial 
                        color={coreColor} 
                        wireframe 
                        transparent 
                        opacity={0.8}
                        emissive={coreColor}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </Float>
            <mesh ref={ringRef}>
                <torusGeometry args={[2.5, 0.05, 16, 100]} />
                <meshStandardMaterial color={themeMode === 'light' ? '#334155' : '#475569'} />
            </mesh>
            <pointLight position={[0,0,0]} intensity={2} color={coreColor} distance={5} />
        </group>
    );
};


// --- MAIN COMPONENT ---

const BrainViz: React.FC<BrainVizProps> = ({ unlockedRegions, anxiety, isBreakdown, totalNeurons, isCyborg = false, themeMode }) => {
    
    return (
        <div className="relative w-full h-full">
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} shadows>
                {/* Lighting Setup */}
                <ambientLight intensity={themeMode === 'light' ? 0.8 : 0.2} />
                <spotLight 
                    position={[10, 10, 10]} 
                    angle={0.5} 
                    penumbra={1} 
                    intensity={themeMode === 'light' ? 1.5 : 1} 
                    castShadow 
                />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4338ca" />
                
                {/* Environment Reflections */}
                <Environment preset={themeMode === 'light' ? 'studio' : 'city'} />

                {isCyborg ? (
                    <CyborgCore themeMode={themeMode} isBreakdown={isBreakdown} />
                ) : (
                    <group rotation={[0, -Math.PI / 2, 0]}>
                        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
                            <BiologicalBrain 
                                unlockedRegions={unlockedRegions} 
                                themeMode={themeMode}
                                anxiety={anxiety}
                            />
                        </Float>
                    </group>
                )}

                {/* Stars for Dark Mode */}
                {themeMode === 'dark' && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />}
                
                <ContactShadows opacity={0.4} scale={10} blur={2.5} far={4} color={themeMode === 'light' ? '#000' : '#000'} />

                <OrbitControls 
                    enableZoom={false} 
                    enablePan={false} 
                    minPolarAngle={Math.PI / 4} 
                    maxPolarAngle={Math.PI - Math.PI / 4}
                    autoRotate={!isBreakdown}
                    autoRotateSpeed={0.5}
                />
            </Canvas>
            
            {/* Overlay Elements */}
            {isBreakdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 pointer-events-none">
                    <div className="text-red-500 font-mono font-bold text-2xl animate-pulse text-center border-4 border-red-600 p-6 bg-black shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                        <AlertTriangle size={48} className="mx-auto mb-2" />
                        {isCyborg ? "THERMAL CRITICAL" : "SYSTEM FAILURE"}<br/>
                        <span className="text-sm">REBOOTING...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrainViz;