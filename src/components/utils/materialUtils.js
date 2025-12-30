import {
  Fn,
  vec2,
  vec3,
  positionLocal,
  attribute,
  mat3,
  normalLocal,
  float,
  texture,
  atan2,
  acos,
} from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import * as THREE from "three";

/**
 * Create look-at rotation matrix function
 */
function createLookAtFunction() {
  return Fn(([position, target]) => {
    const localUp = vec3(0, 1, 0);
    const forward = target.sub(position).normalize();
    const right = forward.cross(localUp).normalize();
    const up = right.cross(forward).normalize();
    return mat3(right, up, forward);
  });
}

/**
 * Create position node that transforms local position based on instanced data
 */
function createPositionNode(positions, lookAtFn) {
  return Fn(() => {
    const pos = positionLocal.toVar();
    const referenceIndex = attribute("fboIndex");
    const updatedPos = positions.element(referenceIndex);
    const rotationMatrix = lookAtFn(updatedPos, vec3(0, 0, 0));

    pos.xyz = rotationMatrix.mul(pos.xyz);
    pos.addAssign(updatedPos);

    return pos;
  })();
}

/**
 * Create color node that samples environment map based on quantized normal
 */
function createColorNode(positions, backgroundTexture, lookAtFn) {
  return Fn(() => {
    const referenceIndex = attribute("fboIndex");
    const updatedPos = positions.element(referenceIndex);
    const rotationMatrix = lookAtFn(updatedPos, vec3(0, 0, 0));
    const rotatedNormal = rotationMatrix.mul(normalLocal).normalize();

    // Quantize normal for faceted look
    const step = float(10);
    const quantizedNormal = rotatedNormal.mul(step).floor().div(step).normalize();

    // Sample environment map using spherical coordinates
    const envMap = texture(backgroundTexture);
    const pi = float(Math.PI);
    const uv = vec2(
      atan2(quantizedNormal.z, quantizedNormal.x).mul(0.5).div(pi).add(0.5),
      acos(quantizedNormal.y).div(pi)
    );
    const envColor = envMap.sample(uv);

    return envColor.rgb;
  })();
}

/**
 * Create material with position and color node setup
 */
export function createMaterial(positions, backgroundTexture, roughness = 0.4, metalness = 1) {
  const material = new MeshPhysicalNodeMaterial({
    roughness,
    metalness,
    side: THREE.DoubleSide,
  });

  const lookAtFn = createLookAtFunction();
  material.positionNode = createPositionNode(positions, lookAtFn);
  material.colorNode = createColorNode(positions, backgroundTexture, lookAtFn);

  return material;
}

