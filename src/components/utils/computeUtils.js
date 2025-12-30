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
} from "three/tsl";

/**
 * Create compute update function for particle rotation
 */
export function createComputeUpdate(positions, ringData, count) {
  return Fn(() => {
    const position = positions.element(instanceIndex);
    const ring = ringData.element(instanceIndex);
    
    const speed = sin(floor(ring.mul(112480)).add(1232))
      .add(1)
      .mul(0.5);

    const angle = float(0.0002).add(speed.mul(0.002));
    const rotationMatrix = mat3(
      vec3(cos(angle), 0, sin(angle)),
      vec3(0, 1, 0),
      vec3(negate(sin(angle)), 0, cos(angle))
    );
    
    position.xyz.assign(rotationMatrix.mul(position.xyz));
  })().compute(count);
}

