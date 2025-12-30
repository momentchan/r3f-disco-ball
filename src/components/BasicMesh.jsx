import { useEffect, useRef } from "react";
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
  const { gl, scene, camera } = useThree();
  const meshRef = useRef(null);
  const planeRef = useRef(null);
  const hitPositionRef = useRef(new THREE.Vector3(0, 0, 0));

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
  const uniformsRef = useRef(null);

  // Create invisible raycast plane
  useEffect(() => {
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      side: THREE.DoubleSide,
      visible: false,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(0, 0, 0);
    scene.add(plane);
    planeRef.current = plane;

    return () => {
      scene.remove(plane);
      planeGeometry.dispose();
      planeMaterial.dispose();
    };
  }, [scene]);

  // Handle mouse/touch movement for raycasting
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!planeRef.current || !camera) return;

      const rect = event.target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {

        hitPositionRef.current.copy(intersects[0].point);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("pointermove", handlePointerMove);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [gl, camera]);

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
  }, [ball, cube, scene]);

  // Run compute update
  useFrame((state) => {
    if (computeUpdateRef.current && uniformsRef.current) {
      uniformsRef.current.hitPosition.value = hitPositionRef.current;
      uniformsRef.current.time.value = state.clock.elapsedTime;
      gl.compute(computeUpdateRef.current);
    }
  });

  return null;
}
