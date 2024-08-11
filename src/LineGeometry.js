    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    const colors = [];
    nodes.forEach((node, index) => {
      positions.push(node.pos.x, node.pos.y, node.pos.z);

      // Color based on branch level
      const color = new THREE.Color().setHSL(0.3 - node.level * 0.05, 1, 0.5);
      colors.push(color.r, color.g, color.b);

      if (node.parent) {
        const parentIndex = nodes.findIndex((n) => n.pos.equals(node.parent));
        if (parentIndex !== -1) {
          indices.push(index, parentIndex);
        }
      }
    });

    // console.log("Position", positions)
    // console.log("indices", indices)
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);

    // Create material and mesh
    const material = new THREE.LineBasicMaterial({ vertexColors: true });
    const tree = new THREE.LineSegments(geometry, material);
    // Add to your scene
    scene.add(tree);