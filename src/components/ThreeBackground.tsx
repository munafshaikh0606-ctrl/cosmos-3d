import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeBackgroundProps {
  pulseTrigger?: number;
}

export default function ThreeBackground({ pulseTrigger = 0 }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef({ active: false, radius: 0, speed: 0.15, maxRadius: 15 });

  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseRef.current.active = true;
      pulseRef.current.radius = 0;
    }
  }, [pulseTrigger]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 12;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particles Data
    const count = 120;
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorPresets = [
      new THREE.Color("#60a5fa"), // Blue
      new THREE.Color("#c084fc"), // Purple
      new THREE.Color("#2dd4bf"), // Teal
      new THREE.Color("#f472b6"), // Pink
    ];

    for (let i = 0; i < count; i++) {
      // Spread particles in a sphere/box
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.015;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.015;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;

      const randomColor = colorPresets[Math.floor(Math.random() * colorPresets.length)];
      colors[i * 3] = randomColor.r;
      colors[i * 3 + 1] = randomColor.g;
      colors[i * 3 + 2] = randomColor.b;
    }

    // Node Points Geometry
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Particle Texture (create a circular glow in canvas)
    const createCircleTexture = () => {
      const matCanvas = document.createElement("canvas");
      matCanvas.width = 16;
      matCanvas.height = 16;
      const ctx = matCanvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(matCanvas);
    };

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      map: createCircleTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointCloud);

    // Line network geometry
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create custom line segment representation
    const linePositions = new Float32Array(count * count * 2 * 3); // Over-allocated structure
    const lineColors = new Float32Array(count * count * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // Interaction State
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.targetX = x * 8; // scale to scene coordinates
      mouse.targetY = y * 6;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Resize Observer to handle responsiveness correctly
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      width = entry.contentRect.width;
      height = entry.contentRect.height;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    resizeObserver.observe(container);

    // Animation loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse coordinate tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      const positionAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = positionAttr.array as Float32Array;

      // Handle active pulse animation state
      if (pulseRef.current.active) {
        pulseRef.current.radius += pulseRef.current.speed;
        if (pulseRef.current.radius > pulseRef.current.maxRadius) {
          pulseRef.current.active = false;
        }
      }

      // Update node positions
      for (let i = 0; i < count; i++) {
        const xIdx = i * 3;
        const yIdx = i * 3 + 1;
        const zIdx = i * 3 + 2;

        // Natural drifting movement
        const driftX = Math.sin(elapsedTime * 0.5 + i) * 0.002;
        const driftY = Math.cos(elapsedTime * 0.4 + i) * 0.002;
        const driftZ = Math.sin(elapsedTime * 0.3 + i) * 0.002;

        originalPositions[xIdx] += driftX + velocities[xIdx] * 0.1;
        originalPositions[yIdx] += driftY + velocities[yIdx] * 0.1;
        originalPositions[zIdx] += driftZ + velocities[zIdx] * 0.1;

        // Apply container boundary wraps
        if (Math.abs(originalPositions[xIdx]) > 10) velocities[xIdx] *= -1;
        if (Math.abs(originalPositions[yIdx]) > 8) velocities[yIdx] *= -1;
        if (Math.abs(originalPositions[zIdx]) > 5) velocities[zIdx] *= -1;

        let targetX = originalPositions[xIdx];
        let targetY = originalPositions[yIdx];
        let targetZ = originalPositions[zIdx];

        // 1. Mouse Interaction deflection
        if (mouse.active) {
          const dx = mouse.x - targetX;
          const dy = mouse.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 3) {
            const force = (3 - dist) / 3;
            // push away from cursor
            targetX -= (dx / dist) * force * 1.2;
            targetY -= (dy / dist) * force * 1.2;
          }
        }

        // 2. Pulse (Shockwave) Interaction
        if (pulseRef.current.active) {
          const dx = targetX; // From center (0,0,0)
          const dy = targetY;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);
          const pr = pulseRef.current.radius;

          // If close to the wave front
          const distToWave = Math.abs(distFromCenter - pr);
          if (distToWave < 1.5) {
            const force = (1.5 - distToWave) / 1.5;
            targetX += (dx / distFromCenter) * force * 0.8;
            targetY += (dy / distFromCenter) * force * 0.8;
          }
        }

        // Move current positions towards targeted positions with easing
        posArray[xIdx] += (targetX - posArray[xIdx]) * 0.1;
        posArray[yIdx] += (targetY - posArray[yIdx]) * 0.1;
        posArray[zIdx] += (targetZ - posArray[zIdx]) * 0.1;
      }

      positionAttr.needsUpdate = true;

      // Update lines linking nearby nodes
      let lineCount = 0;
      const maxDistance = 2.4;
      const linePosArray = lineGeometry.attributes.position.array as Float32Array;
      const lineColorArray = lineGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const x1 = posArray[i * 3];
        const y1 = posArray[i * 3 + 1];
        const z1 = posArray[i * 3 + 2];

        for (let j = i + 1; j < count; j++) {
          const x2 = posArray[j * 3];
          const y2 = posArray[j * 3 + 1];
          const z2 = posArray[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (d < maxDistance) {
            // Add a line segment linking node i and j
            const lIdx = lineCount * 6;

            linePosArray[lIdx] = x1;
            linePosArray[lIdx + 1] = y1;
            linePosArray[lIdx + 2] = z1;

            linePosArray[lIdx + 3] = x2;
            linePosArray[lIdx + 4] = y2;
            linePosArray[lIdx + 5] = z2;

            // Fade the line based on node proximity distance
            const alpha = 1.0 - d / maxDistance;

            // Give lines colors matching their endpoints
            lineColorArray[lIdx] = colors[i * 3] * alpha * 0.6;
            lineColorArray[lIdx + 1] = colors[i * 3 + 1] * alpha * 0.6;
            lineColorArray[lIdx + 2] = colors[i * 3 + 2] * alpha * 0.6;

            lineColorArray[lIdx + 3] = colors[j * 3] * alpha * 0.6;
            lineColorArray[lIdx + 4] = colors[j * 3 + 1] * alpha * 0.6;
            lineColorArray[lIdx + 5] = colors[j * 3 + 2] * alpha * 0.6;

            lineCount++;
          }
        }
      }

      lineGeometry.setDrawRange(0, lineCount * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      // Slow global rotation
      pointCloud.rotation.y = elapsedTime * 0.03;
      lineSegments.rotation.y = elapsedTime * 0.03;
      pointCloud.rotation.x = elapsedTime * 0.015;
      lineSegments.rotation.x = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Clean up to prevent memory leaks
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
      renderer.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="three-background-canvas"
      className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-slate-950/20"
    />
  );
}
