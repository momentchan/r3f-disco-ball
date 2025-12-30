import {
  Fn,
  instanceIndex,
  vec3,
  float,
  mat3,
  negate,
  cos,
  sin,
  floor,
  uniform,
  smoothstep,
  oneMinus,
  min,
  mix,
  hash,
} from "three/tsl";
import * as THREE from "three/webgpu";

/**
 * Create rotation matrix for particle animation
 */
function createRotationMatrix(angle) {
  return mat3(
    vec3(cos(angle), 0, sin(angle)),
    vec3(0, 1, 0),
    vec3(negate(sin(angle)), 0, cos(angle))
  );
}

/**
 * Calculate particle speed based on ring data and speed multiplier
 */
function calculateSpeed(ring, speedMultiplier) {
  return sin(floor(ring.mul(112480)).add(1232))
    .add(1)
    .mul(0.5)
    .mul(speedMultiplier);
}

/**
 * Create compute update function for particle animation
 */
export function createComputeUpdate(positions, ringData, count) {
  const hitPositionUniform = uniform(new THREE.Vector3(0));
  const timeUniform = uniform(0);
  const speedUniform = uniform(1.0);

  const computeFn = Fn(() => {
    const position = positions.element(instanceIndex);
    const ring = ringData.element(instanceIndex);

    // Calculate distance-based influence from hit position
    const distance = position.xy.sub(hitPositionUniform.xy).length();
    const distanceFactor = smoothstep(0.0, 0.5, distance).oneMinus();

    // Calculate rotation speed and angle
    const speed = calculateSpeed(ring, speedUniform);
    const angle = float(0.0002).add(speed.mul(0.002));
    const rotationMatrix = createRotationMatrix(angle);

    // Apply rotation
    position.xyz.assign(rotationMatrix.mul(position.xyz));

    // Calculate scale based on distance and time-based animation
    const originalPosition = position.toVar().normalize();
    const rnd = hash(instanceIndex);
    const sinAddition = sin(rnd.mul(7).add(timeUniform)).add(1).mul(0.5);
    const sinAdditionSmall = sin(rnd.mul(127).add(timeUniform)).add(1).mul(0.01);

    let target = min(float(1.2), float(1).add(distanceFactor.mul(sinAddition)));
    target.addAssign(sinAdditionSmall);

    // Interpolate between current and scaled position
    position.assign(mix(position, originalPosition.toVar().mul(target), 0.07));
  })().compute(count);

  return {
    compute: computeFn,
    uniforms: {
      hitPosition: hitPositionUniform,
      time: timeUniform,
      speed: speedUniform,
    },
  };
}
