import React, {useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import WebView from 'react-native-webview';
import {useStore} from '../store/useStore';
import {useAvatar} from '../hooks/useAvatar';
import type {Emotion} from '../types';

// ─────────────────────────────────────────────
// Inline HTML/JS for WebView — Three.js CDN
// GLB loaded via Three.js GLTFLoader
// Emotion + speaking state sent via postMessage
// ─────────────────────────────────────────────
function buildAvatarHTML(glbFileName: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#1a1a2e; overflow:hidden; width:100vw; height:100vh; }
  canvas { display:block; width:100% !important; height:100% !important; }
  #status {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:${accentColor}; font-family:sans-serif; font-size:14px; text-align:center;
  }
</style>
</head>
<body>
<div id="status">Loading avatar...</div>

<script>
// ── Three.js r165 via CDN ──
</script>
<script src="https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.165.0/examples/js/loaders/GLTFLoader.js"></script>

<script>
const ACCENT = '${accentColor}';
const GLB_FILE = '${glbFileName}';

// ── Scene setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 2.8);

const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
document.getElementById('status').style.display = 'none';

// ── Lighting ──
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(2, 3, 2);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(ACCENT, 0.6);
rimLight.position.set(-2, 1, -2);
scene.add(rimLight);

// ── State ──
let avatarRoot = null;
let mixer = null;
let clock = new THREE.Clock();
let emotion = 'neutral';
let isSpeaking = false;
let mouthBone = null;
let headBone = null;
let spineBone = null;

// ── Procedural avatar fallback (sphere-based) ──
function buildProceduralAvatar() {
  const root = new THREE.Group();
  const accentHex = parseInt(ACCENT.replace('#',''), 16);

  // Head
  const headGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const headMat = new THREE.MeshStandardMaterial({color: accentHex, roughness:0.4, metalness:0.1});
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.55;
  root.add(head);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({color:0xffffff});
  const pupilGeo = new THREE.SphereGeometry(0.04, 12, 12);
  const pupilMat = new THREE.MeshStandardMaterial({color:0x111111});

  [-0.18, 0.18].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.65, 0.48);
    root.add(eye);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(x, 0.65, 0.52);
    root.add(pupil);
  });

  // Mouth (torus arc)
  const mouthGeo = new THREE.TorusGeometry(0.1, 0.022, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({color:0x222222});
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.name = 'mouth';
  mouth.position.set(0, 0.4, 0.5);
  mouth.rotation.x = Math.PI;
  root.add(mouth);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 16);
  const neckMat = new THREE.MeshStandardMaterial({color: accentHex, roughness:0.5});
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.y = 0.06;
  root.add(neck);

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.9, 16);
  const bodyMat = new THREE.MeshStandardMaterial({color: accentHex, roughness:0.5});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -0.45;
  root.add(body);

  // Glow ring
  const ringGeo = new THREE.TorusGeometry(0.56, 0.015, 8, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: accentHex, emissive: accentHex, emissiveIntensity: 1.0, transparent:true, opacity:0.7
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = 'ring';
  ring.position.y = 0.55;
  ring.rotation.x = Math.PI / 2;
  root.add(ring);

  scene.add(root);
  avatarRoot = root;
  document.getElementById('status').style.display = 'none';
}

// ── GLB loader ──
function tryLoadGLB() {
  if (typeof THREE.GLTFLoader === 'undefined') {
    buildProceduralAvatar(); return;
  }
  const loader = new THREE.GLTFLoader();
  // Android asset path
  const assetPath = 'file:///android_asset/avatars/' + GLB_FILE;
  loader.load(
    assetPath,
    (gltf) => {
      const model = gltf.scene;
      // Auto-center
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      model.position.y += size.y * 0.1;
      const scale = 1.2 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);

      // Find bones for animation
      model.traverse(node => {
        if (!node.isBone) return;
        const n = node.name.toLowerCase();
        if (n.includes('jaw') || n.includes('mouth')) mouthBone = node;
        if (n.includes('head')) headBone = node;
        if (n.includes('spine') || n.includes('chest')) spineBone = node;
      });

      scene.add(model);
      avatarRoot = model;

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const idle = gltf.animations.find(a => a.name.toLowerCase().includes('idle'))
                  || gltf.animations[0];
        const action = mixer.clipAction(idle);
        action.play();
      }

      document.getElementById('status').style.display = 'none';
    },
    null,
    () => buildProceduralAvatar() // fallback on error
  );
}

tryLoadGLB();

// ── Animation loop ──
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  t += delta;

  if (mixer) mixer.update(delta);

  if (avatarRoot) {
    // Breathing
    const breathY = Math.sin(t * 1.8) * 0.012;
    avatarRoot.position.y = breathY;

    // Glow ring pulse (procedural mode)
    const ring = avatarRoot.getObjectByName('ring');
    if (ring) {
      ring.material.emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.4;
      ring.rotation.z = t * 0.3;
    }

    // Mouth (procedural) speaking animation
    const mouth = avatarRoot.getObjectByName('mouth');
    if (mouth && isSpeaking) {
      mouth.scale.y = 0.8 + Math.abs(Math.sin(t * 18)) * 1.2;
    } else if (mouth) {
      mouth.scale.y += (1.0 - mouth.scale.y) * 0.15;
    }

    // GLB bone lip-sync
    if (mouthBone && isSpeaking) {
      mouthBone.rotation.x = Math.abs(Math.sin(t * 18)) * 0.4;
    } else if (mouthBone) {
      mouthBone.rotation.x *= 0.85;
    }

    // Emotion animations
    switch (emotion) {
      case 'happy':
        avatarRoot.rotation.y = Math.sin(t * 1.2) * 0.08;
        if (spineBone) spineBone.rotation.z = Math.sin(t * 1.2) * 0.03;
        break;
      case 'sad':
        avatarRoot.rotation.x = 0.08;
        if (headBone) headBone.rotation.x = 0.1;
        break;
      case 'angry':
        avatarRoot.scale.setScalar(1 + Math.sin(t * 12) * 0.015);
        break;
      case 'excited':
        avatarRoot.position.y = breathY + Math.abs(Math.sin(t * 6)) * 0.05;
        avatarRoot.rotation.z = Math.sin(t * 4) * 0.04;
        break;
      case 'thinking':
        avatarRoot.rotation.y = Math.sin(t * 0.6) * 0.18;
        if (headBone) headBone.rotation.z = Math.sin(t * 0.5) * 0.08;
        break;
      case 'love':
        avatarRoot.rotation.y = Math.sin(t * 0.8) * 0.06;
        if (ring) ring.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.5;
        break;
      case 'anxious':
        avatarRoot.position.x = Math.sin(t * 8) * 0.02;
        break;
      default: // neutral
        avatarRoot.rotation.y += (-avatarRoot.rotation.y) * 0.05;
        avatarRoot.rotation.x += (-avatarRoot.rotation.x) * 0.05;
        if (headBone) {
          headBone.rotation.x *= 0.9;
          headBone.rotation.z *= 0.9;
        }
    }
  }

  renderer.render(scene, camera);
}
animate();

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Message from React Native ──
// Receives: { type: 'emotion', value: 'happy' }
//           { type: 'speaking', value: true/false }
//           { type: 'avatar', glb: 'luna.glb', color: '#4ECDC4' }
document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);

function handleMessage(event) {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'emotion') {
      emotion = msg.value;
    } else if (msg.type === 'speaking') {
      isSpeaking = msg.value;
    }
  } catch(e) {}
}
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// React Native Component
// ─────────────────────────────────────────────
export function Avatar3D() {
  const {currentEmotion, isSpeaking} = useStore();
  const {currentAvatar} = useAvatar();
  const webViewRef = useRef<any>(null);
  const prevEmotion = useRef<Emotion>('neutral');
  const prevSpeaking = useRef(false);

  // Send emotion updates to WebView (only when changed)
  useEffect(() => {
    if (!webViewRef.current) return;
    if (prevEmotion.current === currentEmotion) return;
    prevEmotion.current = currentEmotion;
    webViewRef.current.postMessage(
      JSON.stringify({type: 'emotion', value: currentEmotion})
    );
  }, [currentEmotion]);

  // Send speaking state to WebView (only when changed)
  useEffect(() => {
    if (!webViewRef.current) return;
    if (prevSpeaking.current === isSpeaking) return;
    prevSpeaking.current = isSpeaking;
    webViewRef.current.postMessage(
      JSON.stringify({type: 'speaking', value: isSpeaking})
    );
  }, [isSpeaking]);

  const htmlContent = buildAvatarHTML(currentAvatar.file, currentAvatar.color);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{html: htmlContent}}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
        mixedContentMode="always"
        // Prevent WebView from intercepting touch scroll of parent ScrollView
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        // Key changes: re-render WebView when avatar changes
        key={currentAvatar.name}
        onError={(e) => console.log('Avatar WebView error:', e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
