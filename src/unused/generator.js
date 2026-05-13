function drawBranch(start, length, angle, depth, branchWidth) {
  if (depth === 0) {
    return;
  }

  // const offset = THREE.MathUtils.seededRandom()*2;
  const end = new THREE.Vector3(
    start.x + length * Math.cos(angle),
    start.y + length * Math.sin(angle),
    start.z
  );
  // Create branch geometry with varying thickness
  const geometry = new THREE.CylinderGeometry(
    branchWidth / 2,
    branchWidth / 2,
    length,
    8
  );
  const branch = new THREE.Mesh(geometry, branchMaterial);

  scene.add(branch);

  // Position and rotate branch correctly
  branch.position.set(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    (start.z + end.z) / 2
  );
  branch.lookAt(end);
  branch.rotateX(Math.PI / 2);
  scene.add(branch);

  const newLength = length * (0.7 + Math.random() * 0.1); // Add randomness to the length
  const newWidth = branchWidth * 0.7; // Decrease branch width

  // Add randomness to the angles
  const angleVariation = Math.PI / 6 + (Math.random() * Math.PI) / 12;
  drawBranch(end, newLength, angle + angleVariation, depth - 1, newWidth); // Right branch
  drawBranch(end, newLength, angle - angleVariation, depth - 1, newWidth); // Left branch
}
