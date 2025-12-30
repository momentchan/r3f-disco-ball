import { useMemo, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SpriteNodeMaterial, MeshPhysicalNodeMaterial } from "three/webgpu";
import { extend } from "@react-three/fiber";
import { extractBallData, prepareCubeGeometry, createMergedGeometry } from "./utils/geometryUtils";
import { createMaterial } from "./utils/materialUtils";
import { createComputeUpdate } from "./utils/computeUtils";
import { instancedArray } from "three/tsl";

extend({ SpriteNodeMaterial, MeshPhysicalNodeMaterial });

export default function BasicMesh() {
  const { gl, scene } = useThree();
  const meshRef = useRef(null);

  // Load GLB models
  const ball = useGLTF("/models/team-ball.glb");
  const cube = useGLTF("/models/team-cube.glb");

  // Load environment map texture
  const envTexture = useTexture("/textures/team-orb-env.jpg");

  // Setup environment map
  useEffect(() => {
    if (envTexture) {
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      envTexture.needsUpdate = true;
      scene.environment = envTexture;
      scene.background = envTexture;
    }
  }, [envTexture, scene]);

  // Setup mesh and compute update
  const computeUpdateRef = useRef(null);

  useEffect(() => {
    const ballData = extractBallData(ball.scene);
    const cubeGeometry = prepareCubeGeometry(cube.scene);

    if (!ballData || !cubeGeometry) {
      return;
    }

    const { count, totalPointsData, ringDataArray } = ballData;
    const positions = instancedArray(totalPointsData, "vec3");
    const ringData = instancedArray(ringDataArray, "float");
    const mergedGeometry = createMergedGeometry(cubeGeometry, count);
    const material = createMaterial(positions);
    const mesh = new THREE.Mesh(mergedGeometry, material);

    meshRef.current = mesh;
    computeUpdateRef.current = createComputeUpdate(positions, ringData, count);

    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      computeUpdateRef.current = null;
    };
  }, [ball, cube, scene]);

  // Run compute update
  useFrame(() => {
    if (computeUpdateRef.current) {
      gl.compute(computeUpdateRef.current);
    }
  });

  return null;
}
