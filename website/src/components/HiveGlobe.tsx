'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import styles from './HiveGlobe.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HiveNode {
  id: string;
  lat: number;
  lng: number;
  country: string;
  active: boolean;
  isUser?: boolean;
}

interface PulseRing {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
  color: THREE.Color;
  nodeId: string;
}

interface Props {
  mockMode?: boolean;
}

// ─── Mock node data (regional clusters, never GPS-precise) ────────────────────

const MOCK_NODES: HiveNode[] = [
  { id: 'gb-london',    lat: 51.5,  lng: -0.1,   country: 'GB', active: true },
  { id: 'gb-manchester',lat: 53.5,  lng: -2.2,   country: 'GB', active: false },
  { id: 'gb-edinburgh', lat: 55.9,  lng: -3.2,   country: 'GB', active: true },
  { id: 'gb-birmingham',lat: 52.5,  lng: -1.9,   country: 'GB', active: false },
  { id: 'hu-budapest',  lat: 47.5,  lng: 19.0,   country: 'HU', active: true },
  { id: 'hu-debrecen',  lat: 47.5,  lng: 21.6,   country: 'HU', active: true },
  { id: 'hu-pecs',      lat: 46.1,  lng: 18.2,   country: 'HU', active: false },
  { id: 'de-berlin',    lat: 52.5,  lng: 13.4,   country: 'DE', active: true },
  { id: 'de-munich',    lat: 48.1,  lng: 11.6,   country: 'DE', active: false },
  { id: 'de-hamburg',   lat: 53.6,  lng: 10.0,   country: 'DE', active: true },
  { id: 'fr-paris',     lat: 48.9,  lng: 2.3,    country: 'FR', active: true },
  { id: 'fr-lyon',      lat: 45.7,  lng: 4.8,    country: 'FR', active: false },
  { id: 'us-nyc',       lat: 40.7,  lng: -74.0,  country: 'US', active: true },
  { id: 'us-la',        lat: 34.1,  lng: -118.2, country: 'US', active: false },
  { id: 'us-chicago',   lat: 41.9,  lng: -87.6,  country: 'US', active: true },
  { id: 'us-austin',    lat: 30.3,  lng: -97.7,  country: 'US', active: false },
  { id: 'ca-toronto',   lat: 43.7,  lng: -79.4,  country: 'CA', active: true },
  { id: 'ca-vancouver', lat: 49.3,  lng: -123.1, country: 'CA', active: false },
  { id: 'au-sydney',    lat: -33.9, lng: 151.2,  country: 'AU', active: true },
  { id: 'au-melbourne', lat: -37.8, lng: 145.0,  country: 'AU', active: false },
  { id: 'br-saopaulo',  lat: -23.5, lng: -46.6,  country: 'BR', active: true },
  { id: 'br-rio',       lat: -22.9, lng: -43.2,  country: 'BR', active: false },
  { id: 'in-mumbai',    lat: 19.1,  lng: 72.9,   country: 'IN', active: true },
  { id: 'in-delhi',     lat: 28.6,  lng: 77.2,   country: 'IN', active: true },
  { id: 'jp-tokyo',     lat: 35.7,  lng: 139.7,  country: 'JP', active: true },
  { id: 'jp-osaka',     lat: 34.7,  lng: 135.5,  country: 'JP', active: false },
  { id: 'ng-lagos',     lat: 6.5,   lng: 3.4,    country: 'NG', active: true },
  { id: 'za-cape',      lat: -33.9, lng: 18.4,   country: 'ZA', active: false },
  { id: 'mx-cdmx',      lat: 19.4,  lng: -99.1,  country: 'MX', active: true },
  { id: 'ar-ba',        lat: -34.6, lng: -58.4,  country: 'AR', active: false },
  { id: 'pl-warsaw',    lat: 52.2,  lng: 21.0,   country: 'PL', active: true },
  { id: 'se-stockholm', lat: 59.3,  lng: 18.1,   country: 'SE', active: false },
  { id: 'nl-amsterdam', lat: 52.4,  lng: 4.9,    country: 'NL', active: true },
  { id: 'es-madrid',    lat: 40.4,  lng: -3.7,   country: 'ES', active: false },
  { id: 'it-rome',      lat: 41.9,  lng: 12.5,   country: 'IT', active: true },
  { id: 'pt-lisbon',    lat: 38.7,  lng: -9.1,   country: 'PT', active: false },
  { id: 'ro-bucharest', lat: 44.4,  lng: 26.1,   country: 'RO', active: true },
  { id: 'ua-kyiv',      lat: 50.5,  lng: 30.5,   country: 'UA', active: true },
  { id: 'tr-istanbul',  lat: 41.0,  lng: 28.9,   country: 'TR', active: false },
  { id: 'kr-seoul',     lat: 37.6,  lng: 127.0,  country: 'KR', active: true },
  { id: 'sg-sg',        lat: 1.4,   lng: 103.8,  country: 'SG', active: true },
  { id: 'nz-auckland',  lat: -36.9, lng: 174.8,  country: 'NZ', active: false },
  { id: 'ke-nairobi',   lat: -1.3,  lng: 36.8,   country: 'KE', active: true },
  { id: 'eg-cairo',     lat: 30.1,  lng: 31.2,   country: 'EG', active: false },
  { id: 'id-jakarta',   lat: -6.2,  lng: 106.8,  country: 'ID', active: true },
];

// Country centre coordinates for zoom targeting
const COUNTRY_CENTRES: Record<string, { lat: number; lng: number; zoom: number }> = {
  GB: { lat: 54.0,  lng: -2.0,   zoom: 3.2 },
  HU: { lat: 47.2,  lng: 19.4,   zoom: 4.0 },
  DE: { lat: 51.2,  lng: 10.5,   zoom: 3.5 },
  FR: { lat: 46.6,  lng: 2.3,    zoom: 3.4 },
  US: { lat: 39.5,  lng: -98.4,  zoom: 2.5 },
  CA: { lat: 56.1,  lng: -106.3, zoom: 2.4 },
  AU: { lat: -25.3, lng: 133.8,  zoom: 2.5 },
  DEFAULT: { lat: 20.0, lng: 0.0, zoom: 1.6 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

function detectUserCountry(): string {
  try {
    const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language?.split('-')[1]?.toUpperCase() ?? '';
    if (tz.startsWith('Europe/London'))         return 'GB';
    if (tz.startsWith('Europe/Budapest'))       return 'HU';
    if (tz.startsWith('Europe/Berlin'))         return 'DE';
    if (tz.startsWith('Europe/Paris'))          return 'FR';
    if (tz.startsWith('America/New_York') ||
        tz.startsWith('America/Chicago')  ||
        tz.startsWith('America/Los_Angeles'))   return 'US';
    if (tz.startsWith('America/Toronto') ||
        tz.startsWith('America/Vancouver'))     return 'CA';
    if (tz.startsWith('Australia/'))            return 'AU';
    if (tz.startsWith('Europe/Warsaw'))         return 'PL';
    if (tz.startsWith('Europe/Stockholm'))      return 'SE';
    if (tz.startsWith('Europe/Amsterdam'))      return 'NL';
    if (tz.startsWith('Europe/Madrid'))         return 'ES';
    if (tz.startsWith('Europe/Rome'))           return 'IT';
    if (tz.startsWith('Europe/Bucharest'))      return 'RO';
    if (tz.startsWith('Europe/Kiev') ||
        tz.startsWith('Europe/Kyiv'))           return 'UA';
    if (tz.startsWith('Asia/Tokyo'))            return 'JP';
    if (tz.startsWith('Asia/Seoul'))            return 'KR';
    if (tz.startsWith('Asia/Singapore'))        return 'SG';
    if (tz.startsWith('Asia/Kolkata'))          return 'IN';
    if (tz.startsWith('Asia/Jakarta'))          return 'ID';
    if (lang && COUNTRY_CENTRES[lang])          return lang;
  } catch { /* silent */ }
  return 'DEFAULT';
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function sphericalToCartesian(lat: number, lng: number): THREE.Spherical {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Spherical(1, phi, theta);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HiveGlobe({ mockMode = false }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [showHint,    setShowHint]    = useState(true);
  const [webglOk,     setWebglOk]     = useState(true);
  const [userCountry, setUserCountry] = useState<string>('DEFAULT');
  const interactedRef = useRef(false);
  const mountedRef    = useRef(false);

  // Mutable refs for Three.js objects (don't trigger re-renders)
  const sceneRef       = useRef<THREE.Scene | null>(null);
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null);
  const nodeMeshesRef  = useRef<Map<string, THREE.Mesh>>(new Map());
  const pulseRingsRef  = useRef<PulseRing[]>([]);
  const rafRef         = useRef<number>(0);
  const isDraggingRef  = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const velocityRef    = useRef({ x: 0, y: 0 });
  // rotationRef reserved for future use (external rotation control API)
  const globeRef       = useRef<THREE.Group | null>(null);
  const nodesDataRef   = useRef<HiveNode[]>([]);
  const homeCentreRef  = useRef({ lat: 20, lng: 0, zoom: 1.6 });
  const cameraZoomRef  = useRef(1.6);
  const targetZoomRef  = useRef(1.6);
  const cameraDistRef  = useRef(4.0);

  // Zoom-to-country animation state
  const zoomAnimRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    fromSph: THREE.Spherical;
    toSph: THREE.Spherical;
    fromZoom: number;
    toZoom: number;
  } | null>(null);

  const dismissHint = useCallback(() => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      setShowHint(false);
    }
  }, []);

  const triggerPulse = useCallback((nodeId: string, type: 'answer' | 'evidence' | 'session_start') => {
    const mesh = nodeMeshesRef.current.get(nodeId);
    if (!mesh || !sceneRef.current) return;

    const colors: Record<string, THREE.Color> = {
      answer:        new THREE.Color(0xfef08a),
      evidence:      new THREE.Color(0x7dd3fc),
      session_start: new THREE.Color(0xffffff),
    };

    const durations: Record<string, number> = {
      answer:        1500,
      evidence:      2000,
      session_start: 3000,
    };

    const geometry = new THREE.RingGeometry(0.04, 0.07, 32);
    const material = new THREE.MeshBasicMaterial({
      color:       colors[type],
      transparent: true,
      opacity:     0.85,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(mesh.position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    ring.rotateX(Math.PI / 2);

    // Orient ring to face camera outward from globe surface
    const normal = mesh.position.clone().normalize();
    ring.position.copy(mesh.position);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(normal, right);
    ring.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(right, correctedUp, normal)
    );

    sceneRef.current.add(ring);
    pulseRingsRef.current.push({
      mesh:      ring,
      startTime: performance.now(),
      duration:  durations[type],
      color:     colors[type],
      nodeId,
    });
  }, []);

  const zoomToCountry = useCallback((countryCode: string, instant = false) => {
    const centre = COUNTRY_CENTRES[countryCode] ?? COUNTRY_CENTRES.DEFAULT;
    homeCentreRef.current = centre;

    if (!globeRef.current) return;

    const toSph = sphericalToCartesian(centre.lat, centre.lng);
    const fromEuler = globeRef.current.rotation.clone();
    const fromSph = new THREE.Spherical().setFromVector3(
      new THREE.Vector3(0, 0, 1).applyEuler(fromEuler)
    );

    if (instant) {
      globeRef.current.rotation.set(-toSph.phi + Math.PI / 2, toSph.theta - Math.PI, 0, 'YXZ');
      cameraDistRef.current = centre.zoom;
      targetZoomRef.current = centre.zoom;
      cameraZoomRef.current = centre.zoom;
      return;
    }

    zoomAnimRef.current = {
      active:    true,
      startTime: performance.now(),
      duration:  1800,
      fromSph,
      toSph,
      fromZoom:  cameraDistRef.current,
      toZoom:    centre.zoom,
    };
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // WebGL check
    try {
      const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!testCtx) { setWebglOk(false); return; }
    } catch { setWebglOk(false); return; }

    // ── Scene setup ──────────────────────────────────────────────────────────
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.0);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    sceneRef.current   = scene;
    cameraRef.current  = camera;
    rendererRef.current = renderer;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Globe group ──────────────────────────────────────────────────────────
    const globe = new THREE.Group();
    scene.add(globe);
    globeRef.current = globe;

    // Globe sphere (subtle wireframe sphere for depth)
    const sphereGeo = new THREE.SphereGeometry(1.0, 48, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color:       0x0ea5e9,
      wireframe:   true,
      transparent: true,
      opacity:     0.04,
    });
    globe.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Atmosphere glow ring
    const atmGeo = new THREE.SphereGeometry(1.06, 48, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color:       0x38bdf8,
      transparent: true,
      opacity:     0.05,
      side:        THREE.BackSide,
    });
    globe.add(new THREE.Mesh(atmGeo, atmMat));

    // ── Nodes ────────────────────────────────────────────────────────────────
    const country = detectUserCountry();
    setUserCountry(country);
    nodesDataRef.current = MOCK_NODES;

    MOCK_NODES.forEach(node => {
      const pos = latLngToVec3(node.lat, node.lng, 1.01);

      // Glow halo
      const haloGeo = new THREE.SphereGeometry(node.active ? 0.045 : 0.028, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color:       node.country === country ? 0x22d3ee : node.active ? 0xe0f2fe : 0x475569,
        transparent: true,
        opacity:     node.active ? 0.25 : 0.1,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos);
      globe.add(halo);

      // Core dot
      const dotGeo = new THREE.SphereGeometry(node.active ? 0.018 : 0.011, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({
        color: node.country === country
          ? 0x67e8f9
          : node.active ? 0xe0f2fe : 0x475569,
        transparent: true,
        opacity: node.active ? 0.9 : 0.35,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globe.add(dot);
      nodeMeshesRef.current.set(node.id, dot);
    });

    // ── Ambient light ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // ── Initial camera distance ──────────────────────────────────────────────
    cameraDistRef.current = 4.0;
    camera.position.set(0, 0, 4.0);

    // Detect user country and schedule zoom after world-view establishing shot
    const detectedCountry = detectUserCountry();
    setTimeout(() => {
      zoomToCountry(detectedCountry);
    }, 800);

    // ── Mock SSE simulation ──────────────────────────────────────────────────
    let mockTimer: ReturnType<typeof setTimeout> | null = null;
    if (mockMode) {
      const scheduleNext = () => {
        const delay = 4000 + Math.random() * 4000;
        mockTimer = setTimeout(() => {
          const idx  = Math.floor(Math.random() * MOCK_NODES.length);
          const node = MOCK_NODES[idx];
          const types: Array<'answer' | 'evidence' | 'session_start'> = ['answer', 'answer', 'evidence', 'answer'];
          const type  = types[Math.floor(Math.random() * types.length)];
          triggerPulse(node.id, type);
          scheduleNext();
        }, delay);
      };
      scheduleNext();
    }

    // ── Pointer interaction ──────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current    = { x: 0, y: 0 };
      dismissHint();
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !globe) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      velocityRef.current    = { x: dx, y: dy };
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      globe.rotation.y += dx * 0.005;
      globe.rotation.x += dy * 0.005;
      globe.rotation.x  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
      zoomAnimRef.current = null; // Cancel any ongoing zoom animation
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    // Scroll / wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dismissHint();
      targetZoomRef.current = Math.max(1.5, Math.min(6.0, targetZoomRef.current + e.deltaY * 0.005));
    };

    // Double-click → zoom home
    const onDblClick = () => {
      zoomToCountry(detectedCountry);
    };

    // Pinch-to-zoom (touch)
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        dismissHint();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = lastPinchDist - dist;
        targetZoomRef.current = Math.max(1.5, Math.min(6.0, targetZoomRef.current + delta * 0.01));
        lastPinchDist = dist;
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);
    canvas.addEventListener('wheel',       onWheel,     { passive: false });
    canvas.addEventListener('dblclick',    onDblClick);
    canvas.addEventListener('touchstart',  onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });

    // ── Render loop ──────────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const now = performance.now();

      // Inertia
      if (!isDraggingRef.current && globe) {
        globe.rotation.y += velocityRef.current.x * 0.003;
        globe.rotation.x += velocityRef.current.y * 0.003;
        globe.rotation.x  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
        velocityRef.current.x *= 0.92;
        velocityRef.current.y *= 0.92;
      }

      // Smooth zoom (camera distance lerp)
      cameraZoomRef.current += (targetZoomRef.current - cameraZoomRef.current) * 0.08;
      camera.position.z = cameraZoomRef.current;

      // Zoom-to-country animation
      if (zoomAnimRef.current?.active && globe) {
        const anim = zoomAnimRef.current;
        const elapsed = now - anim.startTime;
        const t = Math.min(elapsed / anim.duration, 1);
        const te = easeOutCubic(t);

        // Derive target rotation that brings target lat/lng to face camera (+Z)
        const targetRotY = -(homeCentreRef.current.lng + 180) * (Math.PI / 180) + Math.PI;
        const targetRotX = -(90 - homeCentreRef.current.lat) * (Math.PI / 180) + Math.PI / 2;

        globe.rotation.y = globe.rotation.y + (targetRotY - globe.rotation.y) * te * 0.06;
        globe.rotation.x = globe.rotation.x + (targetRotX - globe.rotation.x) * te * 0.06;

        // Zoom camera in
        targetZoomRef.current = anim.fromZoom + (anim.toZoom - anim.fromZoom) * te;

        if (t >= 1) anim.active = false;
      }

      // Pulse ring animation
      const toRemove: PulseRing[] = [];
      pulseRingsRef.current.forEach(pulse => {
        const elapsed = now - pulse.startTime;
        const t = elapsed / pulse.duration;
        if (t >= 1) {
          toRemove.push(pulse);
          return;
        }
        const scale  = 1 + t * 6;
        const opacity = (1 - t) * 0.7;
        pulse.mesh.scale.set(scale, scale, scale);
        (pulse.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      });
      toRemove.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
      });
      pulseRingsRef.current = pulseRingsRef.current.filter(p => !toRemove.includes(p));

      // Slow auto-rotation when idle (very subtle)
      if (!isDraggingRef.current && !zoomAnimRef.current?.active && globe) {
        globe.rotation.y += 0.0006;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mockTimer) clearTimeout(mockTimer);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup',   onPointerUp);
      canvas.removeEventListener('wheel',       onWheel);
      canvas.removeEventListener('dblclick',    onDblClick);
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      renderer.dispose();
      mountedRef.current = false;
    };
  }, [mockMode, triggerPulse, zoomToCountry, dismissHint]);

  if (!webglOk) {
    return (
      <div className={styles.fallback} role="img" aria-label="Prism global participation network">
        <span>Globe unavailable — WebGL not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.shell} aria-label="Interactive Prism hive globe">
      <canvas ref={canvasRef} className={styles.canvas} />

      {showHint && (
        <div className={styles.hint} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 6h4M6 4l2 2-2 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to rotate · Scroll to zoom · Double-click to go home
        </div>
      )}

      <button
        className={styles.homeBtn}
        onClick={() => zoomToCountry(userCountry)}
        aria-label="Zoom to my country"
        type="button"
      >
        ⌂ Home
      </button>
    </div>
  );
}
