'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function HeroMoon3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let geometry: THREE.SphereGeometry | null = null;
    let material: THREE.MeshStandardMaterial | null = null;
    let glowGeo: THREE.SphereGeometry | null = null;
    let glowMat: THREE.MeshBasicMaterial | null = null;
    let moonTexture: THREE.Texture | null = null;
    let animationFrameId: number | null = null;

    try {
      // 1. Check if WebGL context can be created safely
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGLError(true);
        return;
      }

      // 2. Scene, Camera, Renderer
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        45,
        mount.clientWidth / mount.clientHeight || 1,
        0.1,
        1000
      );
      camera.position.z = 3.2;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });

      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      mount.appendChild(renderer.domElement);

      // 3. Texture & Mesh
      const textureLoader = new THREE.TextureLoader();
      moonTexture = textureLoader.load('/moon_hd.jpg');
      moonTexture.colorSpace = THREE.SRGBColorSpace;

      geometry = new THREE.SphereGeometry(1.15, 48, 48);
      material = new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.85,
        metalness: 0.05,
      });
      const moonMesh = new THREE.Mesh(geometry, material);
      scene.add(moonMesh);

      // Atmospheric Glow
      glowGeo = new THREE.SphereGeometry(1.17, 32, 32);
      glowMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glowMesh);

      // Lighting
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(5, 3, 4);
      scene.add(keyLight);

      const ambientLight = new THREE.AmbientLight(0x0f172a, 0.5);
      scene.add(ambientLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
      rimLight.position.set(-4, -2, -3);
      scene.add(rimLight);

      // Parallax interaction
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

      const handleResize = () => {
        if (!mount || !camera || !renderer) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        moonMesh.rotation.y += 0.0018;
        moonMesh.rotation.y += (targetRotationY - moonMesh.rotation.y * 0.05) * 0.02;
        moonMesh.rotation.x += (targetRotationX - moonMesh.rotation.x * 0.05) * 0.02;
        glowMesh.rotation.copy(moonMesh.rotation);
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (glowGeo) glowGeo.dispose();
        if (glowMat) glowMat.dispose();
        if (moonTexture) moonTexture.dispose();
        if (renderer) {
          renderer.dispose();
          if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
            mount.removeChild(renderer.domElement);
          }
        }
      };
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to CSS 3D Lunar renderer:', e);
      setHasWebGLError(true);
    }
  }, []);

  if (hasWebGLError) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[540px] md:h-[540px] rounded-full overflow-hidden shadow-[0_0_90px_rgba(56,189,248,0.3)] border border-white/20 animate-[spin_180s_linear_infinite]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/moon_hd.jpg"
            alt="3D Lunar Surface"
            className="w-full h-full object-cover filter contrast-125 brightness-95"
          />
          {/* Planetary shadow overlay for authentic 3D sphere look */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/20 to-sky-400/25 mix-blend-overlay"></div>
          <div className="absolute inset-0 rounded-full shadow-[inset_-25px_-25px_60px_rgba(0,0,0,0.9),inset_20px_20px_40px_rgba(255,255,255,0.2)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0 overflow-hidden"
    />
  );
}
