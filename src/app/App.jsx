import { AdaptiveDpr, CameraControls } from "@react-three/drei";
import { CanvasCapture } from "@packages/r3f-gist/components/utility";
import DiscoBall from '../components/DiscoBall'
import { LevaWrapper } from "@packages/r3f-gist/components";
import { Canvas } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import { useState } from "react";
import * as THREE from "three";

export default function App() {
    return <>
        <LevaWrapper />

        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [0, 0, 3]
            }}
            gl={(canvas) => {
                const renderer = new WebGPURenderer({
                  ...canvas,
                  powerPreference: "high-performance",
                  antialias: true,
                  alpha: false,
                  stencil: false,
                  shadowMap: true,
                  toneMapping: THREE.ACESFilmicToneMapping
                });
                return renderer.init().then(() => renderer);
              }}
            dpr={[1, 2]}
            performance={{ min: 0.5, max: 1 }}
        >
            <color attach="background" args={["#ffffff"]} />
            <AdaptiveDpr pixelated />
            <CameraControls makeDefault />
            <DiscoBall />
            <CanvasCapture />
        </Canvas>
    </>
}
