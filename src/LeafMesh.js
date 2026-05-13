import * as THREE from "three";

/**
 * Creates an optimized leaf mesh using indexed BufferGeometry.
 *
 * Geometry strategy:
 *  - One center vertex (index 0) for the triangle fan hub.
 *  - `segments` perimeter vertices forming a teardrop/ellipse outline.
 *  - Fully indexed: (segments) triangles → minimum vertex/index count.
 *  - Includes: positions, normals (with subtle curvature), UVs, vertex colors.
 *
 * @param {object} options
 * @param {number} [options.width=1]       Half-width of the leaf.
 * @param {number} [options.height=2]      Full height of the leaf.
 * @param {number} [options.segments=16]   Perimeter resolution (≥ 6).
 * @param {number} [options.curvature=0.1] How much the leaf bows in +Z (0 = flat).
 * @param {THREE.Color} [options.tipColor]    Color at the leaf tip (default: light green).
 * @param {THREE.Color} [options.baseColor]   Color at the center (default: mid green).
 * @param {THREE.Color} [options.stemColor]   Color at the stem end (default: dark green).
 * @returns {THREE.Mesh}
 */
export function createLeafMesh({
  width = 1,
  height = 2,
  segments = 16,
  curvature = 0.1,
  tipColor = new THREE.Color(0x88cc44),
  baseColor = new THREE.Color(0x338822),
  stemColor = new THREE.Color(0x225511),
} = {}) {
  const halfH = height / 2;
  const halfW = width / 2;
  const totalVerts = 1 + segments; // center + perimeter ring

  // Typed arrays – optimal memory layout for GPU upload
  const positions = new Float32Array(totalVerts * 3);
  const normals   = new Float32Array(totalVerts * 3);
  const uvs       = new Float32Array(totalVerts * 2);
  const colors    = new Float32Array(totalVerts * 3);

  // ── Center vertex (index 0) ──────────────────────────────────────────────
  positions[0] = 0;
  positions[1] = 0;
  positions[2] = 0;
  normals[0]   = 0;
  normals[1]   = 0;
  normals[2]   = 1;
  uvs[0]       = 0.5;
  uvs[1]       = 0.5;
  baseColor.toArray(colors, 0);

  // ── Perimeter vertices ───────────────────────────────────────────────────
  for (let i = 0; i < segments; i++) {
    // t goes 0 → 2π; start at top (tip) so index 0 = tip for easy winding
    const t = (i / segments) * Math.PI * 2 - Math.PI / 2;

    // Teardrop shape: full ellipse but with a slight inward pinch near stem.
    // The pinch factor narrows x near the bottom (t ≈ +π/2).
    const normalizedY = Math.sin(t); // -1 (stem) .. +1 (tip)
    const pinch = 1 - 0.35 * Math.max(0, -normalizedY); // pinch only below center
    const px = halfW * Math.cos(t) * pinch;
    const py = halfH * normalizedY;

    // Subtle leaf curvature: bow in +Z proportional to distance from midrib
    const bow = curvature * (1 - (px / halfW) ** 2) * (1 - (py / halfH) ** 2);
    const pz = bow;

    const vi  = (1 + i) * 3;
    const uvi = (1 + i) * 2;

    positions[vi]     = px;
    positions[vi + 1] = py;
    positions[vi + 2] = pz;

    // Approximate normal: mostly facing +Z, tilted by local bow gradient
    const nx = -curvature * 2 * (px / (halfW * halfW)) * (1 - (py / halfH) ** 2);
    const ny = -curvature * 2 * (py / (halfH * halfH)) * (1 - (px / halfW) ** 2);
    const nz = 1.0;
    const nLen = Math.hypot(nx, ny, nz);
    normals[vi]     = nx / nLen;
    normals[vi + 1] = ny / nLen;
    normals[vi + 2] = nz / nLen;

    // UV: map leaf local space → [0,1]²
    uvs[uvi]     = (px / halfW) * 0.5 + 0.5;
    uvs[uvi + 1] = (py / halfH) * 0.5 + 0.5;

    // Vertex color: blend tip ↔ base ↔ stem along Y axis
    const tNorm = normalizedY * 0.5 + 0.5; // 0 (stem) → 1 (tip)
    const vc = new THREE.Color();
    if (tNorm >= 0.5) {
      vc.lerpColors(baseColor, tipColor, (tNorm - 0.5) * 2);
    } else {
      vc.lerpColors(stemColor, baseColor, tNorm * 2);
    }
    vc.toArray(colors, vi);
  }

  // ── Indices: triangle fan from center ────────────────────────────────────
  // segments triangles → segments * 3 indices
  const indices = new Uint16Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const curr = 1 + i;
    const next = 1 + ((i + 1) % segments);
    indices[i * 3]     = 0;    // center
    indices[i * 3 + 1] = curr;
    indices[i * 3 + 2] = next;
  }

  // ── BufferGeometry assembly ───────────────────────────────────────────────
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal",   new THREE.BufferAttribute(normals,   3));
  geometry.setAttribute("uv",       new THREE.BufferAttribute(uvs,       2));
  geometry.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // Tight bounding sphere for fast frustum culling
  geometry.computeBoundingSphere();

  // ── Material ──────────────────────────────────────────────────────────────
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,   // visible from both faces
    roughness: 0.8,
    metalness: 0.0,
  });

  return new THREE.Mesh(geometry, material);
}
