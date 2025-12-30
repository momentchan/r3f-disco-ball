import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";
import { SpriteNodeMaterial, MeshPhysicalNodeMaterial } from "three/webgpu";
import { extend } from "@react-three/fiber";
import { extractBallData, prepareCubeGeometry, createMergedGeometry } from "./utils/geometryUtils";
import { createMaterial } from "./utils/materialUtils";
import { createComputeUpdate } from "./utils/computeUtils";
import { createRaycastPlane, setupRaycastHandler } from "./utils/raycastUtils";
import { instancedArray } from "three/tsl";

extend({ SpriteNodeMaterial, MeshPhysicalNodeMaterial });

export default function DiscoBall() {
  const { gl, scene, camera } = useThree();
  const meshRef = useRef(null);
  const planeRef = useRef(null);
  const hitPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const computeUpdateRef = useRef(null);
  const uniformsRef = useRef(null);

  // Leva controls
  const { speed, timeMultiplier, roughness, metalness } = useControls("Disco Ball", {
    speed: {
      value: 1.0,
      min: 0,
      max: 5,
      step: 0.1,
    },
    timeMultiplier: {
      value: 2.0,
      min: 0,
      max: 10,
      step: 0.1,
    },
    roughness: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
    },
    metalness: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

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

  // Setup raycast plane and handler
  useEffect(() => {
    const { plane, dispose: disposePlane } = createRaycastPlane(scene);
    planeRef.current = plane;

    const cleanupHandler = setupRaycastHandler(
      gl.domElement,
      camera,
      plane,
      (point) => {
        hitPositionRef.current.copy(point);
      }
    );

    return () => {
      cleanupHandler();
      disposePlane();
    };
  }, [scene, gl, camera]);

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
    const material = createMaterial(positions, envTexture);
    const mesh = new THREE.Mesh(mergedGeometry, material);

    meshRef.current = mesh;
    const computeResult = createComputeUpdate(positions, ringData, count);
    computeUpdateRef.current = computeResult.compute;
    uniformsRef.current = computeResult.uniforms;

    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      computeUpdateRef.current = null;
      uniformsRef.current = null;
    };
  }, [ball, cube, scene, envTexture]);

  // Run compute update
  useFrame((state) => {
    if (computeUpdateRef.current && uniformsRef.current) {
      uniformsRef.current.hitPosition.value = hitPositionRef.current;
      uniformsRef.current.time.value = state.clock.elapsedTime * timeMultiplier;
      uniformsRef.current.speed.value = speed;
      gl.compute(computeUpdateRef.current);
    }

    // Update material properties in real-time
    if (meshRef.current?.material) {
      meshRef.current.material.roughness = roughness;
      meshRef.current.material.metalness = metalness;
    }

    // Make raycast plane always face camera
    if (planeRef.current && camera) {
      planeRef.current.lookAt(camera.position);
    }
  });

  return null;
}
