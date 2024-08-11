import { Vector3 } from "three";
const createLeaves = (count) => {
  const leaves = [];
  for (let index = 0; index < count; index++) {
    const randX = Math.random() * 10 - 1;
    const randY = Math.random() * 10 - 1;
    const randZ = Math.random() * 10 - 1;
    leaves.push({ pos: new Vector3(randX, randY, randZ), reached: false });
  }
  return leaves;
};

const createBranch = (pos, dir, parent, depth) => {
  const newPos = pos.clone().add(dir.clone().multiplyScalar(5));
  return { pos: pos, dir: dir.clone(),end: newPos, parent: parent };
};
const growTree = (minDist, maxDist, leaves, branches) => {
  const newBranches = [];

  branches.forEach((branch) => {
    const closestLeaf = [];

    leaves.forEach((leaf) => {
      const dist = leaf.pos.distanceTo(branch.pos);
      console.log(dist)
      if (dist < minDist) {
        leaf.reached = true;
      } else if (dist < maxDist) {
        closestLeaf.push(leaf);
      }
    });

    // console.log("cl", closestLeaf);
    if (closestLeaf.length > 0) {
      let x = 0;
      let y = 0;
      let z = 0;
      closestLeaf.forEach(l => {
        x += l.pos.x;
        y += l.pos.y;
        z += l.pos.z;
      })
      const avgDir = new Vector3(x, y, z);
      avgDir.divideScalar(closestLeaf.length);
      // get average then subtract and normalize
      const newDir = avgDir.clone().sub(branch.pos).normalize();
      newBranches.push(createBranch(branch.pos, newDir, branch));
    }
  });

  newBranches.forEach((newBranch) => {
    branches.push(newBranch);
  });

  for (let i = leaves.length - 1; i >= 0; i--) {
    if (leaves[i].reached) {
      leaves.splice(i, 1);
    }
  }
};

export const newTree = (minDist, maxDist, startPos) => {
  const leaves = createLeaves(10);
  const branches = [createBranch(startPos, new Vector3(0, 1, 0), null)];
  let iterations = 0;
  const maxIterations = 100; // Safety limit to avoid infinite loop

  while (leaves.length > 0 && iterations < maxIterations) {
    console.log("i: ", iterations, " leaves: ", leaves.length)
    growTree(minDist, maxDist, leaves, branches);
    iterations++;
  }
  return { leaves: leaves, branches: branches };
};
    const dotGeometry = new THREE.BufferGeometry();
    const dotVertices = new Float32Array(
      leaves.map((l) => [l.pos.x, l.pos.y, l.pos.z]).flat()
    );
    dotGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dotVertices, 3)
    );
    const dotMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xff0000,
    });
    const dot = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dot);
    const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    console.log("Branches", branches);
    branches.forEach((branch) => {
      if (branch.parent) {
        const branchGeometry = new THREE.CylinderGeometry(
          0.1,
          0.1,
          branch.pos.distanceTo(branch.end),
          8
        );
        const branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
        branchMesh.position.copy(
          branch.pos.clone().add(branch.end).divideScalar(5)
        );
        branchMesh.lookAt(branch.end);
        scene.add(branchMesh);
      }
    });
