'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroMoon3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load('/moon_hd.jpg');
    moonTexture.colorSpace = THREE.SRGBColorSpace;

    // 3D Moon Sphere Geometry
    const geometry = new THREE.SphereGeometry(1.15, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(geometry, material);
    scene.add(moonMesh);

    // Subtle atmospheric glow halo
    const glowGeo = new THREE.SphereGeometry(1.17, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // Dynamic Space Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 3, 4);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.4);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // Mouse Interaction Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRotationY = mouseX * 0.45;
      targetRotationX = mouseY * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Constant gentle rotation + smooth mouse tilt
      moonMesh.rotation.y += 0.0018;
      moonMesh.rotation.y += (targetRotationY - moonMesh.rotation.y * 0.05) * 0.02;
      moonMesh.rotation.x += (targetRotationX - moonMesh.rotation.x * 0.05) * 0.02;

      glowMesh.rotation.copy(moonMesh.rotation);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      moonTexture.dispose();
      renderer.dispose();
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0 overflow-hidden"
    />
  );
}
