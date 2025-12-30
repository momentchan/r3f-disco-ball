import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Extract position and ring data from ball geometry
 */
export function extractBallData(ballScene) {
  if (!ballScene?.children[0]?.geometry) {
    return null;
  }

  const geometry = ballScene.children[0].geometry;
  const count = geometry.attributes.position.count;
  const positions = geometry.attributes.position.array;
  const ringPositions = geometry.attributes._ringid?.array || new Float32Array(count);

  const totalPointsData = new Float32Array(count * 3);
  const ringDataArray = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    totalPointsData[idx] = positions[idx];
    totalPointsData[idx + 1] = positions[idx + 1];
    totalPointsData[idx + 2] = positions[idx + 2];
    ringDataArray[i] = ringPositions[i];
  }

  return {
    count,
    totalPointsData,
    ringDataArray,
  };
}

/**
 * Prepare and transform cube geometry for instancing
 */
export function prepareCubeGeometry(cubeScene) {
  if (!cubeScene?.children[0]?.geometry) {
    return null;
  }

  const geometry = cubeScene.children[0].geometry.clone();
  geometry.scale(0.04, 0.02, 0.042);
  geometry.rotateY(Math.PI / 2);
  geometry.rotateZ(Math.PI / 2);

  return geometry;
}

/**
 * Create merged geometry with FBO index attributes for instancing
 */
export function createMergedGeometry(baseGeometry, count) {
  const geometries = [];

  for (let i = 0; i < count; i++) {
    const clonedGeo = baseGeometry.clone();
    const vertexCount = clonedGeo.attributes.position.count;
    const indexArray = new Float32Array(vertexCount).fill(i);
    clonedGeo.setAttribute("fboIndex", new THREE.BufferAttribute(indexArray, 1));
    geometries.push(clonedGeo);
  }

  return BufferGeometryUtils.mergeGeometries(geometries);
}

