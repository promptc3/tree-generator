import * as THREE from "three";
import { useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { OrbitControls } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import TreeForm from "./Settings.js";
import { ChakraProvider, Flex, Box } from "@chakra-ui/react";
import { Perf } from "r3f-perf";

function App() {
  const [formData, setFormData] = useState({
    showNodes: true,
    showAttractors: true,
    radiusOfInfluence: 5,
    displacementOfVectors: 1,
    noOfIterations: 100,
    minDistanceBetweenNodes: 5,
    branchingDensity: "normal",
    addJitter: false,
    attractorShape: "sphere",
    canopyShape: "sphere",
    attractorDensity: "normal",
    upwardBias: 1.5,
    treeColor: "#a87a6b",
    backgroundColor: "#111111"
  });
  const [nodePoints, setNodePoints] = useState([]);
  const maxNodes = 10000;
  const ri = 10; // Radius of influence
  const D = 1.0; // Displacement of vectors
  const itrs = 100; // Iterations
  const minDist = 5; // minimum distance between nodes

  // Derive branching params from the branchingDensity setting
  const branchingDensityMap = {
    dense:  { maxBranchesPerNode: 4, branchProbability: 0.4 },
    normal: { maxBranchesPerNode: 3, branchProbability: 0.3 },
    sparse: { maxBranchesPerNode: 2, branchProbability: 0.15 },
  };
  const { maxBranchesPerNode, branchProbability } =
    branchingDensityMap[formData.branchingDensity] ?? branchingDensityMap.normal;
  const repulsionForce = 0.5;
  const [attractorPoints, setAttractorsPoints] = useState([]);
  const generateAttractors = (canopyShape, size) => {
    const tempArr = [];
    for (let i = 0; i < size; i++) {
      const theta = Math.random() * Math.PI * 2;
      let x, y, z;

      if (canopyShape === "sphere") {
        // Rounded canopy — upper hemisphere (oak, maple)
        const phi = Math.acos(1 - Math.random()); // 0..PI/2
        const r = 9 + Math.random() * 14;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi) + 8;
        z = r * Math.sin(phi) * Math.sin(theta);

      } else if (canopyShape === "cone") {
        // Conical canopy — tall and narrow at top (pine, fir, cypress)
        const heightFrac = Math.random(); // 0 = base of cone, 1 = tip
        const coneHeight = 25;
        const coneBaseRadius = 10;
        const radius = coneBaseRadius * (1 - heightFrac) * Math.random();
        x = radius * Math.cos(theta);
        y = 5 + heightFrac * coneHeight;
        z = radius * Math.sin(theta);

      } else if (canopyShape === "cylinder") {
        // Tall narrow column — uniform spread at all heights (poplar, palm)
        const cylinderRadius = 4 + Math.random() * 3;
        const cylinderHeight = 25;
        x = cylinderRadius * Math.cos(theta);
        y = 8 + Math.random() * cylinderHeight;
        z = cylinderRadius * Math.sin(theta);

      } else if (canopyShape === "flat") {
        // Wide flat umbrella — low height, wide spread (acacia, cedar of Lebanon)
        const r = 5 + Math.random() * 18;
        x = r * Math.cos(theta);
        y = 10 + Math.random() * 5; // Shallow vertical range
        z = r * Math.sin(theta);

      } else {
        // Fallback: random scatter above base
        x = Math.random() * 20 - 10;
        y = Math.random() * 20 + 5;
        z = Math.random() * 20 - 10;
      }

      tempArr.push(new THREE.Vector3(x, y, z));
    }
    const newAttrPoints = tempArr.map((a) => [a.x, a.y, a.z]).flat();
    setAttractorsPoints(newAttrPoints);
    return tempArr;
  };

  function applyRepulsion(node, otherNodes) {
    const repulsion = new THREE.Vector3();
    otherNodes.forEach((otherNode) => {
      if (otherNode !== node) {
        const diff = node.pos.clone().sub(otherNode.pos);
        const dist = diff.length();
        if (dist < ri) {
          repulsion.add(
            diff.normalize().multiplyScalar(repulsionForce / (dist * dist))
          );
        }
      }
    });
    return repulsion;
  }

  const generateNodes = (initPos, attractorPoints) => {
    const branchOffset = 0.3;

    // First, grow a straight trunk upward until we reach the attractor zone
    const trunkNodes = [];
    let currentPos = initPos.clone();
    const trunkStep = D;
    // Find the lowest attractor y to know where to stop the trunk
    const lowestAttractorY = Math.min(...attractorPoints.map((a) => a.y));
    // Grow trunk until within radius of influence of the nearest attractor
    let trunkLevel = 0;
    while (true) {
      const closestDist = Math.min(
        ...attractorPoints.map((a) => a.distanceTo(currentPos))
      );
      trunkNodes.push({
        pos: currentPos.clone(),
        visited: true, // trunk nodes are consumed; branching starts at the top
        parent: trunkNodes.length > 0 ? trunkNodes[trunkNodes.length - 1].pos.clone() : null,
        level: trunkLevel,
      });
      if (closestDist <= ri) break; // we're in range, stop growing trunk
      if (currentPos.y > lowestAttractorY + ri) break; // safety: don't overshoot
      currentPos.y += trunkStep;
      trunkLevel++;
    }
    // Mark the last trunk node as unvisited so it can branch
    if (trunkNodes.length > 0) {
      trunkNodes[trunkNodes.length - 1].visited = false;
    }

    let nodes = [...trunkNodes];

    for (let i = 0; i < itrs && nodes.length < maxNodes; i++) {
      const newNodes = [];

      for (
        let j = 0;
        j < nodes.length && newNodes.length + nodes.length < maxNodes;
        j++
      ) {
        const n = nodes[j];
        if (n.visited) continue;

        const closeAttractors = attractorPoints.filter(
          (a) => a.distanceTo(n.pos) <= ri
        );

        if (closeAttractors.length > 0) {
          // For cone canopy, taper branching probability with height so the
          // top stays sparse (like a real pine/fir).
          // Cone spans y = 6 (base) to y = 30 (tip) — clamp to [0,1].
          const coneTaperFactor =
            formData.canopyShape === "cone"
              ? Math.max(0, 1 - (n.pos.y - 6) / 25)
              : 1;
          // console.info(`Cone taper factor at y=${n.pos.y.toFixed(2)} is ${coneTaperFactor.toFixed(2)}`);
          const effectiveBranchProbability = branchProbability * coneTaperFactor;

          let numBranches = 1;
          for (let b = 1; b < maxBranchesPerNode; b++) {
            if (Math.random() < effectiveBranchProbability) numBranches++;
            else break;
          }
          // const numBranches = Math.floor(
          //   Math.random() * (maxBranchesPerNode + 1)
          // );

          for (
            let b = 0;
            b < numBranches && newNodes.length + nodes.length < maxNodes;
            b++
          ) {
            const closestAttr =
              closeAttractors[
                Math.floor(Math.random() * closeAttractors.length)
              ];
            const dir = closestAttr.clone().sub(n.pos).normalize();
            // Stronger upward bias for lower levels (trunk), weaker for higher (tips)
            const upwardBias = Math.max(0, formData.upwardBias - n.level * 0.05);
            dir.y += upwardBias;
            dir.normalize();

            // Apply repulsion
            const repulsion = applyRepulsion(n, nodes);
            dir.add(repulsion).normalize();

            // Prevent early branches from growing downward
            if (n.level < 3 && dir.y < 0.2) {
              dir.y = 0.2;
              dir.normalize();
            }
            // Add some randomness to branch direction
            if (formData.addJitter) {
              dir
                .add(
                  new THREE.Vector3(
                    (Math.random() - 0.5) * branchOffset,
                    (Math.random() - 0.5) * branchOffset,
                    (Math.random() - 0.5) * branchOffset
                  )
                )
                .normalize();
            }
            if (!isNaN(dir.x) || !isNaN(dir.y) || !isNaN(dir.z)) {
              const newPos = n.pos.clone().add(dir.multiplyScalar(D));
              newNodes.push({
                pos: newPos,
                visited: false,
                parent: n.pos,
                level: n.level + 1,
              });
            }
            // Check if the new position is too close to existing nodes
          }

          n.visited = true;

          // Remove attractors that are too close
          for (let k = closeAttractors.length - 1; k >= 0; k--) {
            if (closeAttractors[k].distanceTo(n.pos) < minDist) {
              const index = attractorPoints.indexOf(closeAttractors[k]);
              if (index !== -1) attractorPoints.splice(index, 1);
            }
          }
        }
      }
      nodes = nodes.concat(newNodes);
    }
    // console.info("[generateNodes] new nodes", nodes);
    const newNodePoints =
      nodes && nodes.map((n) => [n.pos.x, n.pos.y, n.pos.z]).flat();
    setNodePoints(newNodePoints);
    return nodes;
  };

  // Build a tapered tube geometry along a curve path with different start/end radii
  // Includes flat end caps so no sphere joints are needed at connection points.
  function createTaperedTubeGeometry(path, tubularSegments, radiusStart, radiusEnd, radialSegments) {
    const frames = path.computeFrenetFrames(tubularSegments);
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // --- Tube wall ---
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const pos = path.getPointAt(t);
      const N = frames.normals[i];
      const B = frames.binormals[i];
      const radius = radiusStart + (radiusEnd - radiusStart) * t;

      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        const normal = new THREE.Vector3(
          cos * N.x + sin * B.x,
          cos * N.y + sin * B.y,
          cos * N.z + sin * B.z
        ).normalize();

        vertices.push(
          pos.x + radius * normal.x,
          pos.y + radius * normal.y,
          pos.z + radius * normal.z
        );
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(t, j / radialSegments);
      }
    }

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // --- End caps ---
    // Adds a filled circle at each end so tubes appear solid and
    // connect seamlessly without needing sphere joints.
    const addCap = (ringIndex, radius, faceNormal) => {
      const t = ringIndex / tubularSegments;
      const pos = path.getPointAt(t);
      const N = frames.normals[ringIndex];
      const B = frames.binormals[ringIndex];

      // Centre vertex
      const centerIdx = vertices.length / 3;
      vertices.push(pos.x, pos.y, pos.z);
      normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
      uvs.push(0.5, 0.5);

      // Ring vertices (duplicate ring so the cap has its own flat normal)
      const ringStart = vertices.length / 3;
      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const sin = Math.sin(v);
        const cos = -Math.cos(v);
        vertices.push(
          pos.x + radius * (cos * N.x + sin * B.x),
          pos.y + radius * (cos * N.y + sin * B.y),
          pos.z + radius * (cos * N.z + sin * B.z)
        );
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
        uvs.push(0.5 + 0.5 * cos, 0.5 + 0.5 * sin);
      }

      // Triangles: fan from centre to ring
      for (let j = 0; j < radialSegments; j++) {
        if (faceNormal.dot(path.getTangentAt(t)) < 0) {
          // Start cap — reverse winding so normal faces outward
          indices.push(centerIdx, ringStart + j + 1, ringStart + j);
        } else {
          // End cap
          indices.push(centerIdx, ringStart + j, ringStart + j + 1);
        }
      }
    };

    const startTangent = path.getTangentAt(0).negate();
    const endTangent   = path.getTangentAt(1);
    addCap(0,              radiusStart, startTangent);
    addCap(tubularSegments, radiusEnd,  endTangent);

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return geometry;
  }

  // Helper function to create a smooth curve between two points
  function createSmoothCurve(start, end) {
    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    midPoint.y += (end.y - start.y) * 0.1; // Add a slight curve

    return new THREE.CatmullRomCurve3([start, midPoint, end]);
  }

  function generateCurves(nodes) {
    const curves = [];
    // Create a map to store connections
    const connections = new Map();
    const nodeMap = new Map(nodes.map((n) => [n.pos.toArray().join(","), n]));
    // Create smooth curves for each unique branch
    nodes.forEach((node) => {
      if (node.parent) {
        const parentNode = nodeMap.get(node.parent.toArray().join(","));
        if (parentNode) {
          // Create a unique key for this connection
          const key = [
            parentNode.pos.toArray().join(","),
            node.pos.toArray().join(","),
          ]
            .sort()
            .join("|");

          // Only create the curve if this connection hasn't been made yet
          if (!connections.has(key)) {
            const curve = createSmoothCurve(parentNode.pos, node.pos);
            // console.info(curves)
            curves.push({ curve: curve, level: node.level });
            // Mark this connection as created
            connections.set(key, true);
          }
        }
      }
    });
    return curves;
  }

  function Dots({ show, color, points, count }) {
    if (show && color && points && points.length > 0) {
      return (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(points)}
              count={count}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.1} color={color} />
        </points>
      );
    }
  }
  const [curves, setCurves] = useState([]);
  const newCurve = () => {
    const attractorDensityMap = { dense: 200, normal: 100, sparse: 50 };
    const attractorCount =
      attractorDensityMap[formData.attractorDensity] ?? attractorDensityMap.normal;
    const initPos = new THREE.Vector3(0, -10, 0);
    const newAttractors = generateAttractors(formData.canopyShape, attractorCount);
    const newNodes = generateNodes(initPos, newAttractors);
    // console.info("[newCurve] New nodes", newNodes);
    const newCurves = generateCurves(newNodes);
    // console.info("[newCurve] New curves", newCurves);
    setCurves([]);
    setCurves(newCurves);
  };

  function TreeMeshes({ curves }) {
    if (curves && curves.length > 0) {
      const maxLevel = Math.max(...curves.map((c) => c.level));
      // Initial trunk radius scales with tree depth
      const initialRadius = Math.min(2.0, 0.15 + maxLevel * 0.04);
      const minRadius = 0.02;
      // Exponential decay so radius at maxLevel equals minRadius
      const decayFactor =
        maxLevel > 0
          ? Math.pow(minRadius / initialRadius, 1 / maxLevel)
          : 1;
      const radiusAtLevel = (level) =>
        initialRadius * Math.pow(decayFactor, level);

      // const hue = convert.hex.hsl(formData.treeColor)[0] / 360;
      const radialSegments = 8; // 8
      const tubularSegments = 10; // 12

      const treeMeshes = curves.map(({ curve, level }) => {
        const bottomRadius = radiusAtLevel(level - 1); // parent side
        const topRadius = radiusAtLevel(level);         // child side
        // const color = new THREE.Color().setHSL(hue, 1 - level * 0.02, 0.5);
        const geometry = createTaperedTubeGeometry(
          curve,
          tubularSegments,
          bottomRadius,
          topRadius,
          radialSegments
        );
        return geometry;
        // return (
        //   <mesh key={nanoid()} geometry={geometry}>
        //     <meshPhongMaterial color={color} shininess={10} />
        //   </mesh>
        // );
      });
      // const mergedTreeMesh = mergeGeometries(treeMeshes, false);
      // const treeMesh = (
      //   <mesh geometry={mergedTreeMesh}>
      //     <meshPhongMaterial color={formData.treeColor} shininess={10} />
      //   </mesh>
      // );

      // Add a sphere at every unique junction point to fill the gap where
      // tubes meet at angles. Key by rounded position to deduplicate.
      const junctionMap = new Map();
      curves.forEach(({ curve, level }) => {
        const startPt = curve.getPointAt(0);
        const endPt   = curve.getPointAt(1);
        const startKey = `${startPt.x.toFixed(3)},${startPt.y.toFixed(3)},${startPt.z.toFixed(3)}`;
        const endKey   = `${endPt.x.toFixed(3)},${endPt.y.toFixed(3)},${endPt.z.toFixed(3)}`;
        // Use the larger radius at each point so the sphere always covers the gap
        const startR = radiusAtLevel(level - 1);
        const endR   = radiusAtLevel(level);
        if (!junctionMap.has(startKey) || junctionMap.get(startKey).r < startR) {
          junctionMap.set(startKey, { pos: startPt, r: startR });
        }
        if (!junctionMap.has(endKey) || junctionMap.get(endKey).r < endR) {
          junctionMap.set(endKey, { pos: endPt, r: endR });
        }
      });

      const sphereGeos = [];
      junctionMap.forEach(({ pos, r }) => {
        const geo = new THREE.SphereGeometry(r, radialSegments, radialSegments);
        geo.translate(pos.x, pos.y, pos.z);
        sphereGeos.push(geo);
      });

      const mergedGeometry = mergeGeometries([...treeMeshes, ...sphereGeos], false);
      return (
        <mesh geometry={mergedGeometry}>
          <meshPhongMaterial color={formData.treeColor} shininess={10} />
        </mesh>
      );
    }
  }
  // console.info("Attractor Points", attractorPoints);

  // Captures the live Three.js scene into a ref so we can export it
  const sceneRef = useRef(null);
  function SceneCapture() {
    const { scene } = useThree();
    sceneRef.current = scene;
    return null;
  }

  function exportGLB() {
    if (!sceneRef.current) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (result) => {
        const blob = new Blob([result], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tree_${formData.canopyShape}_${Date.now()}.glb`;
        a.click();
        URL.revokeObjectURL(url);
      },
      (error) => console.error("GLB export error", error),
      { binary: true }
    );
  }

  return (
    <ChakraProvider>
      <Flex height="100vh">
        <Box flex="1">
          <Canvas
            style={{ height: "100%", width: "100%", background: formData.backgroundColor }}
            camera={{ position: [0, 0, 10], fov: 50, near: 0.5, far: 1000 }}
          >
            <Perf position="top-left" />
            <ambientLight intensity={Math.PI / 2} />
            <spotLight
              position={[10, 10, 10]}
              angle={0.15}
              penumbra={1}
              decay={0}
              intensity={Math.PI}
            />
            <pointLight
              position={[-10, -10, -10]}
              decay={0}
              intensity={Math.PI}
            />
            <TreeMeshes curves={curves} />
            <SceneCapture />
            <Dots
              show={formData.showNodes}
              color={"red"}
              points={nodePoints}
              count={nodePoints.length * 3}
            />
            <Dots
              show={formData.showAttractors}
              color={"blue"}
              points={attractorPoints}
              count={100}
            />
            <OrbitControls />
          </Canvas>
        </Box>
        <Box width="300px" p={0} bg="white">
          <TreeForm
            formData={formData}
            setFormData={setFormData}
            handleSubmit={newCurve}
            handleExport={exportGLB}
          />
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default App;
