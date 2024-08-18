import * as THREE from "three";
import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { nanoid } from "nanoid";
import TreeForm from "./Settings.js";
import { ChakraProvider, Flex, Box } from "@chakra-ui/react";
import convert from "color-convert";

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
    attractorDensity: "normal",
    treeColor: "#00ff00",
  });
  const [nodePoints, setNodePoints] = useState([]);
  const maxNodes = 10000;
  const ri = 10; // Radius of influence
  const D = 1.0; // Displacement of vectors
  const itrs = 100; // Iterations
  const minDist = 5; // minimum distance between nodes
  const maxBranchesPerNode = 3; // Maximum number of branches per node
  const branchProbability = 0.3;
  const repulsionForce = 0.5;
  const [attractorPoints, setAttractorsPoints] = useState([]);
  const generateAttractors = (shape, size) => {
    const tempArr = [];
    const attractorSize = size;
    if (shape === "sphere") {
      for (let i = 0; i < attractorSize; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 9 + Math.random() * 20; // Radius between 30 and 50
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        tempArr.push(new THREE.Vector3(x, y, z));
      }
      const newAttrPoints = tempArr.map((a) => [a.x, a.y, a.z]).flat();
      setAttractorsPoints(newAttrPoints);
      return tempArr;
    } else {
      for (let i = 0; i < attractorSize; i++) {
        const x = Math.random() * 20 - 10;
        const y = Math.random() * 20 + 5;
        const z = Math.random() * 20 - 10;
        tempArr.push(new THREE.Vector3(x, y, z));
      }
      const newAttrPoints = tempArr.map((a) => [a.x, a.y, a.z]).flat();
      setAttractorsPoints(newAttrPoints);
      return tempArr;
    }
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
    // pos: new THREE.Vector3(0, -10, 0),
    const branchOffset = 0.3;
    let nodes = [
      {
        pos: initPos,
        visited: false,
        parent: null,
        level: 0,
      },
    ];
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
          let numBranches = 1;
          for (let b = 1; b < maxBranchesPerNode; b++) {
            if (Math.random() < branchProbability) numBranches++;
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
            dir.y += 0.5; // Add slight upward bias
            // dir.normalize();

            // Apply repulsion
            const repulsion = applyRepulsion(n, nodes);
            dir.add(repulsion).normalize();
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
    console.info("[generateNodes] new nodes", nodes);
    const newNodePoints =
      nodes && nodes.map((n) => [n.pos.x, n.pos.y, n.pos.z]).flat();
    setNodePoints(newNodePoints);
    return nodes;
  };

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
    // Create smooth curves for each unique branch
    nodes.forEach((node) => {
      if (node.parent) {
        const parentNode = nodes.find((n) => n.pos.equals(node.parent));
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
  function TreeMesh(geometry, level) {
    const hue = convert.hex.hsl(formData.treeColor)[0] / 360;
    const color = new THREE.Color().setHSL(hue, 1 - level * 0.05, 0.5);
    const material = <meshPhongMaterial color={color} shininess={10} />;
    const ref = useRef();
    return (
      <mesh key={nanoid()} ref={ref}>
        {geometry}
        {material}
      </mesh>
    );
  }
  const [curves, setCurves] = useState([]);
  const newCurve = () => {
    const initPos = new THREE.Vector3(0, -10, 0);
    const newAttractors = generateAttractors(formData.attractorShape, 100);
    const newNodes = generateNodes(initPos, newAttractors);
    console.info("[newCurve] New nodes", newNodes);
    const newCurves = generateCurves(newNodes);
    console.info("[newCurve] New curves", newCurves);
    setCurves(newCurves);
  };
  function TreeMeshes({ curves }) {
    if (curves) {
      const tubeGeometries = curves.map(({ curve, level }) => {
        const radius = Math.max(0.05, 0.2 - level * 0.02); // Decrease radius for higher levels
        const radialSegments = 8; // Number of sides for the tube
        const tubularSegments = 20; // Number of divisions along the tube
        const tubeGeometry = (
          <tubeGeometry
            key={nanoid()}
            args={[curve, tubularSegments, radius, radialSegments, false]}
          />
        );
        return { geometry: tubeGeometry, level };
      });

      const treeMeshes = tubeGeometries.map(({ geometry, level }) =>
        TreeMesh(geometry, level)
      );
      return treeMeshes;
    }
  }
  // console.info("Attractor Points", attractorPoints);

  return (
    <ChakraProvider>
      <Flex height="100vh">
        <Box flex="1">
          <Canvas
            style={{ height: "100%", width: "100%" }}
            camera={{ position: [0, 0, 10], fov: 50, near: 0.5, far: 1000 }}
          >
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
          />
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default App;
