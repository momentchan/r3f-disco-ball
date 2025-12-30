import * as THREE from "three";

/**
 * Create invisible raycast plane for mouse interaction
 */
export function createRaycastPlane(scene) {
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    visible: false,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, 0, 0);
  scene.add(plane);

  return {
    plane,
    dispose: () => {
      scene.remove(plane);
      planeGeometry.dispose();
      planeMaterial.dispose();
    },
  };
}

/**
 * Setup pointer move handler for raycasting
 */
export function setupRaycastHandler(canvas, camera, plane, onHit) {
  const handlePointerMove = (event) => {
    if (!plane || !camera) return;

    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObject(plane);
    if (intersects.length > 0) {
      onHit(intersects[0].point);
    }
  };

  canvas.addEventListener("pointermove", handlePointerMove);

  return () => {
    canvas.removeEventListener("pointermove", handlePointerMove);
  };
}

