import { Fn, vec2, vec3, positionLocal, attribute, mat3, normalLocal, float, floor, div, texture, atan2, acos } from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import * as THREE from "three";

/**
 * Create material with position node setup
 */
export function createMaterial(positions, backgroundTexture) {
  const material = new MeshPhysicalNodeMaterial({
    roughness: 0.4,
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


  material.colorNode = Fn(() => {
    const referenceIndex = attribute("fboIndex");
    const updatedPos = positions.element(referenceIndex);
    const color = updatedPos.xyz.mul(0.5).add(0.5);
    // const localNormal = normalLocal.toVar();
    const rotationMatrix = lookAtFn(updatedPos, vec3(0, 0, 0));
    const rotatedNormal = rotationMatrix.mul(normalLocal).normalize();

    const step = float(10);
    const quantizedNormal = rotatedNormal.mul(step).floor().div(step).normalize();

    const envMap = texture(backgroundTexture);
    const pi = float(Math.PI);
    const uv = vec2(
      atan2(quantizedNormal.z, quantizedNormal.x).mul(0.5).div(pi).add(0.5),
      acos(quantizedNormal.y).div(pi)
    );
    const envColor = envMap.sample(uv);
    return envColor.rgb;
  })();

  return material;
}

