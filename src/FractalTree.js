  for (let i = 0; i < itrs; i++) {
    const newNodes = [];
    const oldNodes = nodes;
    const visAttrs = new Set();
    oldNodes.forEach((n) => {
      const closestAttrs = [];
      attractorPoints.forEach((a, i) => {
        const crntDist = a.distanceTo(n.pos);
        if (crntDist <= ri) {
          if (crntDist < minDist) {
            visAttrs.add(i);
          } else {
            closestAttrs.push(a.clone());
          }
        }
      });
      if (closestAttrs.length > 0 && !n.visited) {
        let avgDir = new THREE.Vector3(0, 0, 0);
        closestAttrs.forEach((c) => {
          const dir = c.clone().sub(n.pos).normalize();
          dir.add(new THREE.Vector3(0, 0.5, 0)); // Add upward bias
          avgDir.add(dir);
          avgDir.divideScalar(closestAttrs.length).normalize();
        });
        const newNode = n.pos.clone().add(avgDir.multiplyScalar(D));
        newNodes.push({ pos: newNode, visited: false, parent: n.pos.clone() });
        n.visited = true;
      }
    });
    nodes = [...newNodes, ...oldNodes];
    const sortedVisAttrs = Array.from(visAttrs).sort((a, b) => b - a);
    sortedVisAttrs.forEach((v) => {
      attractorPoints.splice(v, 1);
    });
  }