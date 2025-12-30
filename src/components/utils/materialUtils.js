import { Fn, vec3, positionLocal, attribute, mat3 } from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import * as THREE from "three";

/**
 * Create material with position node setup
 */
export function createMaterial(positions) {
  const material = new MeshPhysicalNodeMaterial({
    roughness: 0.1,
    metalness: 1,
    side: THREE.DoubleSide,
  });

  const lookAtFn = Fn(([position, target]) => {
    const localUp = vec3(0, 1, 0);
    const forward = target.sub(position).normalize();
    const right = forward.cross(localUp).normalize();
    const up = right.cross(forward).normalize();
    const rotation = mat3(right, up, forward);
    return rotation;
  });

  material.positionNode = Fn(() => {
    const pos = positionLocal.toVar();
    const referenceIndex = attribute("fboIndex");
    const updatedPos = positions.element(referenceIndex);
    const rotationMatrix = lookAtFn(updatedPos, vec3(0, 0, 0));

    pos.xyz = rotationMatrix.mul(pos.xyz);
    pos.addAssign(updatedPos);

    return pos;
  })();

  return material;
}

