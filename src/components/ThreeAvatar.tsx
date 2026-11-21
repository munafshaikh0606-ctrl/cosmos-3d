import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeAvatarProps {
  isLoading?: boolean;
  isSpeaking?: boolean;
  size?: number;
}

export default function ThreeAvatar({ isLoading = false, isSpeaking = false, size = 150 }: ThreeAvatarProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);
  const isSpeakingRef = useRef(isSpeaking);

  // Sync state to ref for access in requestAnimationFrame
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = size;
    const height = size;

    // Scene setup
    const scene = new THREE.Scene();

    // Pure white background 100% matched with uploaded image
    scene.background = new THREE.Color(0xffffff);

    // Camera setup (Close-up perspective suited for a character bust)
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 4.25);

    // Renderer with shadow map and smooth high-dpi rendering
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting setup matching the professional studio portrait lighting in the image
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Key Light: Warm, bright light from top-right-front to cast natural shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(2.5, 3.5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light: Soft, cool white light from the left to soften key shadows
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.55);
    fillLight.position.set(-3, 1, 3);
    scene.add(fillLight);

    // Rim Light: Backlight to create beautiful highlights on her hair and shoulders
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(0, 3.5, -4);
    scene.add(rimLight);

    // Base Group to hold the entire avatar
    const avatarGroup = new THREE.Group();
    avatarGroup.position.y = -0.16; // Center her bust perfectly in the frame
    scene.add(avatarGroup);

    // Create 3D Stylized Character Bust
    const characterGroup = new THREE.Group();
    avatarGroup.add(characterGroup);

    // Define custom materials matching the exact colors/textures of the uploaded image
    const skinMaterial = new THREE.MeshPhongMaterial({
      color: 0xfbdccb, // Soft porcelain female skin tone with healthy pink undertones
      shininess: 15,
      flatShading: false,
    });

    const hairMaterial = new THREE.MeshPhongMaterial({
      color: 0x30211a, // Rich, warm espresso dark brown hair matching image
      shininess: 12,
      flatShading: false,
    });

    const glassesMaterial = new THREE.MeshPhongMaterial({
      color: 0x161616, // Professional polished black plastic frames
      shininess: 45,
    });

    const suitMaterial = new THREE.MeshPhongMaterial({
      color: 0x22262f, // Deep blue-grey professional suit jacket matching image
      shininess: 5,
    });

    const shirtMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, // Crisp white collared shirt
      shininess: 5,
    });

    const tieMaterial = new THREE.MeshPhongMaterial({
      color: 0x008cd6, // Bright, vivid cyan-blue tie matching image
      shininess: 25,
    });

    const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMaterial = new THREE.MeshBasicMaterial({ color: 0x5a3e2b }); // Sophia's gorgeous warm brown/hazel eyes matching image
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x0b0b0b });
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xc86468, shininess: 20 }); // Warm friendly coral lips

    // --- 1. HEAD GROUP (Pivots smoothly with cursor tracking) ---
    const headGroup = new THREE.Group();
    characterGroup.add(headGroup);

    // Head Sphere (Elongated vertically for an elegant feminine facial form)
    const headGeom = new THREE.SphereGeometry(0.68, 32, 32);
    const headMesh = new THREE.Mesh(headGeom, skinMaterial);
    headMesh.scale.set(0.9, 1.08, 0.88);
    headMesh.position.set(0, 0.22, 0);
    headGroup.add(headMesh);

    // Neck Cylinder
    const neckGeom = new THREE.CylinderGeometry(0.16, 0.19, 0.45, 24);
    const neckMesh = new THREE.Mesh(neckGeom, skinMaterial);
    neckMesh.position.set(0, -0.34, -0.04);
    characterGroup.add(neckMesh);

    // Nose (Stylized cute nose bridge matching image)
    const noseGeom = new THREE.ConeGeometry(0.05, 0.16, 8);
    const noseMesh = new THREE.Mesh(noseGeom, skinMaterial);
    noseMesh.position.set(0, 0.16, 0.6);
    noseMesh.rotation.x = 0.22;
    headGroup.add(noseMesh);

    // Cheek Blush (To recreate the soft pink cheeks in the image)
    const blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xde7f84,
      transparent: true,
      opacity: 0.25,
    });
    const blushGeom = new THREE.SphereGeometry(0.12, 16, 16);
    
    const blushL = new THREE.Mesh(blushGeom, blushMaterial);
    blushL.scale.set(1.4, 0.9, 0.4);
    blushL.position.set(-0.32, 0.08, 0.52);
    headGroup.add(blushL);

    const blushR = new THREE.Mesh(blushGeom, blushMaterial);
    blushR.scale.set(1.4, 0.9, 0.4);
    blushR.position.set(0.32, 0.08, 0.52);
    headGroup.add(blushR);

    // --- 2. EYES & INTERACTIVE GAZE TRACKING ---
    const leftEyeGroup = new THREE.Group();
    const rightEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.21, 0.23, 0.51);
    rightEyeGroup.position.set(0.21, 0.23, 0.51);
    headGroup.add(leftEyeGroup, rightEyeGroup);

    // Eyeballs
    const eyeballGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const leftEyeball = new THREE.Mesh(eyeballGeom, eyeWhiteMaterial);
    const rightEyeball = new THREE.Mesh(eyeballGeom, eyeWhiteMaterial);
    leftEyeGroup.add(leftEyeball);
    rightEyeGroup.add(rightEyeball);

    // Irises (warm brown/hazel)
    const irisGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const leftIris = new THREE.Mesh(irisGeom, irisMaterial);
    leftIris.position.set(0, 0, 0.045);
    leftIris.scale.set(1, 1, 0.4);
    leftEyeGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeom, irisMaterial);
    rightIris.position.set(0, 0, 0.045);
    rightIris.scale.set(1, 1, 0.4);
    rightEyeGroup.add(rightIris);

    // Pupils (dark brown/black)
    const pupilGeom = new THREE.SphereGeometry(0.032, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMaterial);
    leftPupil.position.set(0, 0, 0.068);
    leftPupil.scale.set(1, 1, 0.2);
    leftEyeGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeom, pupilMaterial);
    rightPupil.position.set(0, 0, 0.068);
    rightPupil.scale.set(1, 1, 0.2);
    rightEyeGroup.add(rightPupil);

    // Eye Highlights (glossy glints for a lively gaze)
    const glintGeom = new THREE.SphereGeometry(0.015, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeom, eyeWhiteMaterial);
    leftGlint.position.set(0.02, 0.02, 0.078);
    leftEyeGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeom, eyeWhiteMaterial);
    rightGlint.position.set(0.02, 0.02, 0.078);
    rightEyeGroup.add(rightGlint);

    // Stylized Eyeballs/Eyelashes
    const lashGeom = new THREE.TorusGeometry(0.1, 0.012, 8, 24, Math.PI * 0.7);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x22110a });
    
    const lashL = new THREE.Mesh(lashGeom, lashMat);
    lashL.position.set(-0.21, 0.33, 0.52);
    lashL.rotation.set(0.1, 0.1, Math.PI - 0.22);
    headGroup.add(lashL);

    const lashR = new THREE.Mesh(lashGeom, lashMat);
    lashR.position.set(0.21, 0.33, 0.52);
    lashR.rotation.set(0.1, -0.1, 0.22);
    headGroup.add(lashR);

    // Beautiful arched eyebrows matching the image
    const eyebrowMat = new THREE.MeshPhongMaterial({ color: 0x22110a, shininess: 2 });
    const eyebrowGeom = new THREE.TorusGeometry(0.16, 0.018, 8, 24, Math.PI * 0.65);
    
    const eyebrowL = new THREE.Mesh(eyebrowGeom, eyebrowMat);
    eyebrowL.position.set(-0.21, 0.42, 0.52);
    eyebrowL.rotation.set(0.15, 0.18, Math.PI - 0.22);
    headGroup.add(eyebrowL);

    const eyebrowR = new THREE.Mesh(eyebrowGeom, eyebrowMat);
    eyebrowR.position.set(0.21, 0.42, 0.52);
    eyebrowR.rotation.set(0.15, -0.18, 0.22);
    headGroup.add(eyebrowR);

    // --- 3. CLASSIC BLACK EYEGLASSES (100% Matching Shape) ---
    // Curved/rounded soft rectangular rims matching the image
    const leftRimGeom = new THREE.TorusGeometry(0.14, 0.018, 8, 32);
    const leftRim = new THREE.Mesh(leftRimGeom, glassesMaterial);
    leftRim.position.set(-0.21, 0.23, 0.58);
    leftRim.scale.set(1.22, 0.95, 1);
    headGroup.add(leftRim);

    const rightRimGeom = new THREE.TorusGeometry(0.14, 0.018, 8, 32);
    const rightRim = new THREE.Mesh(rightRimGeom, glassesMaterial);
    rightRim.position.set(0.21, 0.23, 0.58);
    rightRim.scale.set(1.22, 0.95, 1);
    headGroup.add(rightRim);

    // Glasses center bridge
    const bridgeGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, glassesMaterial);
    bridgeMesh.position.set(0, 0.23, 0.59);
    bridgeMesh.rotation.z = Math.PI / 2;
    headGroup.add(bridgeMesh);

    // Glasses side temples (legs) running backwards
    const templeGeom = new THREE.BoxGeometry(0.012, 0.012, 0.5);
    const leftTemple = new THREE.Mesh(templeGeom, glassesMaterial);
    leftTemple.position.set(-0.4, 0.23, 0.35);
    leftTemple.rotation.y = 0.15;
    headGroup.add(leftTemple);

    const rightTemple = new THREE.Mesh(templeGeom, glassesMaterial);
    rightTemple.position.set(0.4, 0.23, 0.35);
    rightTemple.rotation.y = -0.15;
    headGroup.add(rightTemple);

    // --- 4. EXQUISITE SIDE-SWEPT STYLIZED HAIR (100% MATCH) ---
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Back hair dome coverage
    const backHairGeom = new THREE.SphereGeometry(0.74, 24, 24);
    const backHairMesh = new THREE.Mesh(backHairGeom, hairMaterial);
    backHairMesh.position.set(0, 0.22, -0.16);
    backHairMesh.scale.set(1.05, 1.06, 1.01);
    hairGroup.add(backHairMesh);

    // Top volume crown of hair
    const hairCrownGeom = new THREE.SphereGeometry(0.44, 24, 24);
    const hairCrown = new THREE.Mesh(hairCrownGeom, hairMaterial);
    hairCrown.position.set(-0.06, 0.78, 0.04);
    hairCrown.scale.set(1.28, 0.88, 1.22);
    hairGroup.add(hairCrown);

    // Left swept hair volume going around her left side (image right)
    const hairSweeperGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const hairSweeper = new THREE.Mesh(hairSweeperGeom, hairMaterial);
    hairSweeper.position.set(0.3, 0.5, 0.25);
    hairSweeper.scale.set(1.1, 1.3, 1.2);
    hairSweeper.rotation.set(-0.2, -0.3, -0.4);
    hairGroup.add(hairSweeper);

    // Side hair locks framing her face perfectly (image left)
    const sideHairLGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const sideHairL = new THREE.Mesh(sideHairLGeom, hairMaterial);
    sideHairL.position.set(-0.45, 0.06, 0.18);
    sideHairL.scale.set(1, 2.3, 1.15);
    hairGroup.add(sideHairL);

    const sideHairRGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const sideHairR = new THREE.Mesh(sideHairRGeom, hairMaterial);
    sideHairR.position.set(0.44, 0.02, 0.18);
    sideHairR.scale.set(1, 2.1, 1.15);
    hairGroup.add(sideHairR);

    // Side-parted sweeping bangs across forehead
    // Left swept bang
    const bangLGeom = new THREE.SphereGeometry(0.32, 16, 16);
    const bangL = new THREE.Mesh(bangLGeom, hairMaterial);
    bangL.position.set(-0.16, 0.62, 0.38);
    bangL.scale.set(1.6, 0.78, 1.15);
    bangL.rotation.set(-0.1, 0.1, 0.26);
    hairGroup.add(bangL);

    // Right swept bang
    const bangRGeom = new THREE.SphereGeometry(0.28, 16, 16);
    const bangR = new THREE.Mesh(bangRGeom, hairMaterial);
    bangR.position.set(0.24, 0.58, 0.38);
    bangR.scale.set(1.3, 0.75, 1.1);
    bangR.rotation.set(-0.1, -0.15, -0.32);
    hairGroup.add(bangR);

    // Ponytail shown behind her left shoulder (image right)
    const ponytailGeom = new THREE.SphereGeometry(0.25, 24, 24);
    const ponytailMesh = new THREE.Mesh(ponytailGeom, hairMaterial);
    ponytailMesh.position.set(0.32, -0.25, -0.38);
    ponytailMesh.scale.set(1.0, 1.9, 0.9);
    ponytailMesh.rotation.set(0.1, -0.2, -0.1);
    hairGroup.add(ponytailMesh);

    // --- 5. SMILE & MOUTH (Warm, Happy lips) ---
    // Curved torus for her beautiful happy smile
    const smileGeom = new THREE.TorusGeometry(0.08, 0.02, 8, 24, Math.PI);
    const smileMesh = new THREE.Mesh(smileGeom, mouthMaterial);
    smileMesh.position.set(0, -0.22, 0.56);
    smileMesh.rotation.set(Math.PI / 10, 0, Math.PI); // Flipped upside down for nice smile curves
    headGroup.add(smileMesh);

    // --- 6. SUIT JACKET, WHITE SHIRT & CYAN TIE (100% MATCH) ---
    // Torso / Shoulder Block
    const torsoGeom = new THREE.SphereGeometry(0.9, 32, 32);
    const torsoMesh = new THREE.Mesh(torsoGeom, suitMaterial);
    torsoMesh.position.set(0, -1.35, -0.05);
    torsoMesh.scale.set(1.38, 0.82, 0.68);
    characterGroup.add(torsoMesh);

    // Inner White Shirt Panel
    const shirtGeom = new THREE.SphereGeometry(0.42, 24, 24);
    const shirtMesh = new THREE.Mesh(shirtGeom, shirtMaterial);
    shirtMesh.position.set(0, -0.84, 0.16);
    shirtMesh.scale.set(0.85, 1.0, 0.8);
    characterGroup.add(shirtMesh);

    // White Shirt Collars
    const collarLGeom = new THREE.ConeGeometry(0.12, 0.35, 4);
    const collarL = new THREE.Mesh(collarLGeom, shirtMaterial);
    collarL.position.set(-0.14, -0.65, 0.33);
    collarL.rotation.set(0.1, 0.4, -0.6);
    characterGroup.add(collarL);

    const collarRGeom = new THREE.ConeGeometry(0.12, 0.35, 4);
    const collarR = new THREE.Mesh(collarRGeom, shirtMaterial);
    collarR.position.set(0.14, -0.65, 0.33);
    collarR.rotation.set(0.1, -0.4, 0.6);
    characterGroup.add(collarR);

    // Cyan Blue Tie matching her design in the image
    // Tie Knot
    const tieKnotGeom = new THREE.ConeGeometry(0.062, 0.1, 3);
    const tieKnot = new THREE.Mesh(tieKnotGeom, tieMaterial);
    tieKnot.position.set(0, -0.73, 0.38);
    tieKnot.rotation.set(Math.PI, 0, Math.PI);
    characterGroup.add(tieKnot);

    // Tie Body
    const tieBodyGeom = new THREE.BoxGeometry(0.075, 0.44, 0.024);
    const tieBody = new THREE.Mesh(tieBodyGeom, tieMaterial);
    tieBody.position.set(0, -0.96, 0.38);
    tieBody.rotation.x = 0.06; // Curve naturally with torso
    characterGroup.add(tieBody);

    // Suit Jacket Lapels
    const lapelLGeom = new THREE.BoxGeometry(0.14, 0.52, 0.04);
    const lapelL = new THREE.Mesh(lapelLGeom, suitMaterial);
    lapelL.position.set(-0.27, -0.98, 0.3);
    lapelL.rotation.set(0.1, 0.15, 0.18);
    characterGroup.add(lapelL);

    const lapelRGeom = new THREE.BoxGeometry(0.14, 0.52, 0.04);
    const lapelR = new THREE.Mesh(lapelRGeom, suitMaterial);
    lapelR.position.set(0.27, -0.98, 0.3);
    lapelR.rotation.set(0.1, -0.15, -0.18);
    characterGroup.add(lapelR);


    // --- 7. INTERACTIVE GAZE AND ROTATION INTERPOLATION ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouse.targetX = x * 0.9; // Horizontal scope
      mouse.targetY = -y * 0.7; // Vertical scope
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop variables
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const activeLoading = isLoadingRef.current;

      // Gaze/Nod tracking interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Rotate Head & Face to follow the user's cursor
      headGroup.rotation.y = mouse.x * 0.42;
      headGroup.rotation.x = mouse.y * 0.32;

      // Dynamic eyes tracking slightly more than head for a lively feel
      leftEyeGroup.rotation.y = mouse.x * 0.35;
      leftEyeGroup.rotation.x = mouse.y * 0.28;
      rightEyeGroup.rotation.y = mouse.x * 0.35;
      rightEyeGroup.rotation.x = mouse.y * 0.28;

      // Subtle natural suit adjustments
      torsoMesh.rotation.y = mouse.x * 0.06;
      tieBody.rotation.y = mouse.x * 0.1;

      // Eye Blinking (Natural 150ms blink every 4.5 seconds)
      const blinkCycle = elapsedTime % 4.5;
      if (blinkCycle > 4.35) {
        leftEyeGroup.scale.y = 0.05;
        rightEyeGroup.scale.y = 0.05;
      } else {
        leftEyeGroup.scale.y = 1.0;
        rightEyeGroup.scale.y = 1.0;
      }

      // Continuous natural breathing simulation
      const breathe = Math.sin(elapsedTime * 1.8) * 0.022;
      characterGroup.position.y = breathe;

      // Talking/Thinking Animation
      const activeSpeaking = isSpeakingRef.current;
      if (activeLoading || activeSpeaking) {
        // Dynamic mouth movement mimicking speech/processing
        // Speak faster, think/load slightly slower
        const speed = activeSpeaking ? 16 : 12;
        const amplitude = activeSpeaking ? 0.35 : 0.22;
        const talkFreq = Math.sin(elapsedTime * speed) * amplitude + amplitude;
        smileMesh.scale.set(1.0, 0.45 + talkFreq, 1.0);
        headGroup.position.y = 0.012 * Math.sin(elapsedTime * 6);
      } else {
        smileMesh.scale.set(1.0, 1.0, 1.0);
        headGroup.position.y = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      
      // Dispose geometry and materials
      avatarGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      
      try {
        container.removeChild(renderer.domElement);
      } catch (e) {
        // safe ignore
      }
    };
  }, [size]);

  return (
    <div className="relative flex items-center justify-center select-none overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-xl" style={{ width: size, height: size }}>
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-10 pointer-events-auto" />

      {/* Glass overlay highlight matching image background cleanliness */}
      <div className={`absolute inset-0 rounded-full pointer-events-none z-20 ${
        isLoading ? "ring-2 ring-blue-500/20 animate-pulse" : ""
      }`} />
    </div>
  );
}
