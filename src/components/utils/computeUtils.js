import {
  Fn,
  instancedArray,
  instanceIndex,
  vec3,
  float,
  mat3,
  negate,
  cos,
  sin,
  floor,
  uniform,
  length,
  smoothstep,
  oneMinus,
  min,
  mix,
  hash,
} from "three/tsl";
import * as THREE from "three/webgpu";

/**
 * Create compute update function for particle rotation
 */
export function createComputeUpdate(positions, ringData, count) {
  const hitPositionUniform = uniform(new THREE.Vector3(0));
  const time = uniform(0);

  const computeFn = Fn(() => {
    const position = positions.element(instanceIndex);
    const ring = ringData.element(instanceIndex);

    const distance = position.xy.sub(hitPositionUniform.xy).length();
    const distanceFactor = smoothstep(0.0, 0.5, distance).oneMinus();

    const speed = sin(floor(ring.mul(112480)).add(1232))
      .add(1)
      .mul(0.5);

    const rnd = hash(instanceIndex);

    const angle = float(0.0002).add(speed.mul(0.002));
    const rotationMatrix = mat3(
      vec3(cos(angle), 0, sin(angle)),
      vec3(0, 1, 0),
      vec3(negate(sin(angle)), 0, cos(angle))
    );

    position.xyz.assign(rotationMatrix.mul(position.xyz));

    const originalPosition = position.toVar().normalize();

    let target = float(1);
    const sinAddition = sin(rnd.mul(7).add(time.mul(2.0))).add(1).mul(0.5);

    const sinAdditionSmall = sin(rnd.mul(127).add(time.mul(2.0))).add(1).mul(0.01);

    target = min(float(1.2), float(1).add(distanceFactor.mul(sinAddition)));
    target.addAssign(sinAdditionSmall);
    position.assign(mix(position, originalPosition.toVar().mul(target), 0.07));

  })().compute(count);

  return {
    compute: computeFn,
    uniforms: {
      hitPosition: hitPositionUniform,
      time: time,
    },
  };
}
