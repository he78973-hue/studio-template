import * as THREE from 'three';
import { ART_WIDTH, ART_HEIGHT, CAMERA_Z, projectArtwork } from './depth.js';
import { chapters } from './content.js';
import { DeepGarden } from './deep-garden.js';
import { assetURL } from './asset-url.js';

const vertex = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uMotion;
  void main() {
    vUv = uv;
    vec3 p = position;
    float water = smoothstep(0.49, 0.65, 1.0 - uv.y);
    p.z += sin(p.x * 1.7 + uTime * 0.6) * sin(p.y * 1.3 + uTime * 0.4) * 0.026 * water * uMotion;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragment = `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uMotion;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float water = smoothstep(0.50, 0.65, 1.0 - uv.y);
    uv.x += sin(uv.y * 190.0 + uTime * 0.65) * 0.00045 * water * uMotion;
    vec4 color = texture2D(uMap, uv);
    gl_FragColor = color;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function randomGenerator(seed = 1899) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

export class GardenScene {
  constructor(host, { onReady, onFailure, onFrame = () => {}, reducedMotion }) {
    this.host = host;
    this.onReady = onReady;
    this.onFailure = onFailure;
    this.onFrame = onFrame;
    this.enabled = !reducedMotion;
    this.ready = false;
    this.active = false;
    this.reading = false;
    this.progress = 0;
    this.time = 0;
    this.pointer = new THREE.Vector2();
    this.smoothPointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 3.5, CAMERA_Z);
    this.target = new THREE.Vector3(0, 3.5, 0);
    this.nextCamera = new THREE.Vector3();
    this.nextTarget = new THREE.Vector3();
    this.reducedMotion = reducedMotion;
    this.disposed = false;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x172c23, 0);
      this.renderer.domElement.setAttribute('aria-hidden', 'true');
      host.append(this.renderer.domElement);
      this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        cancelAnimationFrame(this.frame);
        this.onFailure('图形渲染已暂停，可刷新页面恢复。');
      });
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
      this.load();
    } catch (error) {
      this.onFailure('当前浏览器以静态画作模式呈现。');
    }
  }

  async load() {
    try {
      const texture = await new THREE.TextureLoader().loadAsync(assetURL('monet-garden.webp'));
      if (this.disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      const geometry = new THREE.PlaneGeometry(1, 1, 260, 320);
      const positions = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(i, ...projectArtwork(uv.getX(i), 1 - uv.getY(i)));
      }
      geometry.computeBoundingSphere();
      this.uniforms = { uMap: { value: texture }, uTime: { value: 0 }, uMotion: { value: this.enabled ? 1 : 0 } };
      const material = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: vertex, fragmentShader: fragment, side: THREE.DoubleSide });
      this.scene.add(new THREE.Mesh(geometry, material));
      this.createPaintFragments(texture);
      this.createMotes();
      await this.createForeground();
      this.deepGarden = new DeepGarden();
      await this.deepGarden.load();
      this.createTransition();
      this.resize();
      // Warm shaders and upload the garden textures before the visitor reaches
      // the threshold, so the first scroll-through does not compile mid-flight.
      await this.renderer.compileAsync(this.deepGarden.scene,this.deepGarden.camera);
      await this.renderer.compileAsync(this.transition.scene,this.transition.camera);
      if(this.disposed)return;
      this.renderer.setRenderTarget(this.transition.b);
      this.renderer.render(this.deepGarden.scene,this.deepGarden.camera);
      this.renderer.setRenderTarget(null);
      this.ready = true;
      this.camera.lookAt(this.target);
      this.renderer.render(this.scene, this.camera);
      this.tick();
      this.onReady();
    } catch (error) {
      this.onFailure('画作暂时未能载入，请刷新页面重试。');
    }
  }

  createPaintFragments(texture) {
    const random = randomGenerator();
    const count = innerWidth < 600 ? 16000 : 34000;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = random();
      const v = random();
      const depth = 0.025 + random() * (v < 0.25 ? 1.25 : v > 0.52 ? 0.5 : 0.08);
      const pos = projectArtwork(u, v, depth);
      positions.set(pos, i * 3);
      uvs.set([u, 1 - v], i * 2);
      sizes[i] = 0.018 + random() * 0.075;
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.fragmentMaterial = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: texture }, uTime: { value: 0 }, uMotion: { value: this.enabled ? 1 : 0 }, uScale: { value: innerHeight }, uDpr: { value: this.renderer.getPixelRatio() } },
      vertexShader: `
        attribute vec2 aUv; attribute float aSize; attribute float aSeed;
        varying vec2 vUv; varying float vSeed;
        uniform float uTime; uniform float uMotion; uniform float uScale; uniform float uDpr;
        void main() {
          vUv = aUv; vSeed = aSeed;
          vec3 p = position;
          float leaves = smoothstep(0.7, 0.9, aUv.y);
          p.x += sin(uTime * 0.38 + aSeed * 30.0) * 0.016 * leaves * uMotion;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * uScale * uDpr / -mv.z, 1.0, 14.0 * uDpr);
        }`,
      fragmentShader: `
        uniform sampler2D uMap; varying vec2 vUv; varying float vSeed;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float shape = 1.0 - smoothstep(0.20, 0.48, length(p * vec2(1.0, 1.7)));
          if (shape < 0.02) discard;
          vec3 color = texture2D(uMap, vUv).rgb;
          gl_FragColor = vec4(color, shape * (0.16 + vSeed * 0.34));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false,
    });
    this.scene.add(new THREE.Points(geometry, this.fragmentMaterial));
  }

  createMotes() {
    const random = randomGenerator(6270);
    const count = 76;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set([(random() - 0.5) * 29, (random() - 0.5) * 23, 4 + random() * 13], i * 3);
      seeds[i] = random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.moteMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDpr: { value: this.renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uTime; uniform float uDpr; attribute float aSeed;
        varying float vAlpha; varying float vSeed;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.12 + aSeed * 60.0) * 0.6;
          p.y += sin(uTime * 0.16 + aSeed * 20.0) * 0.7;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((16.0 + aSeed * 48.0) / -mv.z, 1.0, 9.0) * uDpr;
          vAlpha = (0.20 + 0.22 * sin(uTime * 0.4 + aSeed * 40.0)) * smoothstep(1.5, 7.0, -mv.z);
          vSeed = aSeed;
        }`,
      fragmentShader: `
        varying float vAlpha; varying float vSeed;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * max(0.06, vAlpha);
          gl_FragColor = vec4(mix(vec3(0.89, 0.89, 0.64), vec3(1.0, 0.95, 0.84), vSeed), alpha);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.motes = new THREE.Points(geometry, this.moteMaterial);
    this.scene.add(this.motes);
  }

  async createForeground() {
    // These near-camera layers are cut from the painting itself. Their shallow
    // focus and stronger parallax make the threshold into the painting visible.
    this.foreground = new THREE.Group();
    const definitions = [
      { file: 'lilies-left.webp', x: -6.9, y: -1.85, z: 12, w: 7.3, h: 4.7, opacity: .88, rotation: -.05 },
      { file: 'lilies-right.webp', x: 6.8, y: -1.6, z: 11.4, w: 8.4, h: 4, opacity: .84, rotation: .06 },
      { file: 'willow-left.webp', x: -7.6, y: 7.5, z: 11, w: 6, h: 6.9, opacity: .52, rotation: -.17 },
      { file: 'willow-right.webp', x: 7.8, y: 7.6, z: 10.6, w: 6.5, h: 6.8, opacity: .46, rotation: .15 },
    ];
    await Promise.all(definitions.map(async (definition) => {
      const texture = await new THREE.TextureLoader().loadAsync(assetURL(definition.file));
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: definition.opacity, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(definition.w, definition.h), material);
      mesh.position.set(definition.x, definition.y, definition.z);
      mesh.rotation.z = definition.rotation;
      mesh.userData = { ...definition };
      this.foreground.add(mesh);
    }));
    this.scene.add(this.foreground);
    this.foreground.visible = !this.narrow;
  }

  resize() {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;
    // Cover the viewport without stretching the painted texture.
    const visibleHeight = Math.min(ART_HEIGHT * 0.92, ART_WIDTH / aspect / 1.14);
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(visibleHeight / (2 * CAMERA_Z)));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.fragmentMaterial) this.fragmentMaterial.uniforms.uScale.value = height;
    this.narrow = aspect < 0.8;
    if (this.foreground) this.foreground.visible = !this.narrow;
    this.deepGarden?.resize(width,height);
    if(this.transition) {
      const dpr=this.renderer.getPixelRatio();
      this.transition.a.setSize(width*dpr,height*dpr);
      this.transition.b.setSize(width*dpr,height*dpr);
    }
  }

  createTransition() {
    const a=new THREE.WebGLRenderTarget(1,1,{colorSpace:THREE.SRGBColorSpace});
    const b=new THREE.WebGLRenderTarget(1,1,{colorSpace:THREE.SRGBColorSpace});
    const material=new THREE.ShaderMaterial({
      uniforms:{uA:{value:a.texture},uB:{value:b.texture},uMix:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`uniform sampler2D uA;uniform sampler2D uB;uniform float uMix;varying vec2 vUv;
        void main(){
          vec3 a=texture2D(uA,vUv).rgb;vec3 b=texture2D(uB,vUv).rgb;
          gl_FragColor=vec4(mix(a,b,uMix),1.);
          #include <colorspace_fragment>
        }`,depthTest:false,depthWrite:false,
    });
    const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
    this.transition={a,b,material,scene,camera:new THREE.OrthographicCamera(-1,1,1,-1,0,1)};
  }

  setPointer(x, y) { this.pointer.set(x, y); }
  setProgress(value) { this.progress = THREE.MathUtils.clamp(value, 0, chapters.length-1); }
  setActive(value) { this.active = value; this.progress = 0; }
  setReading(value) { this.reading = value; }
  setMotion(value) {
    this.enabled = value;
    if(this.reducedMotion){this.pointer.set(0,0);this.smoothPointer.set(0,0);}
    if (this.uniforms) this.uniforms.uMotion.value = value ? 1 : 0;
    if (this.fragmentMaterial) this.fragmentMaterial.uniforms.uMotion.value = value ? 1 : 0;
  }

  tick = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (document.hidden || this.reading) return;
    if (this.enabled) this.time += delta;
    const damping = this.reducedMotion ? 1 : 1 - Math.exp(-delta * 3.4);
    this.smoothPointer.lerp(this.enabled ? this.pointer : new THREE.Vector2(), 1 - Math.exp(-delta * 3));
    const p = this.smoothPointer;
    if (this.active) {
      const index = Math.min(1, Math.floor(this.progress));
      const blend = THREE.MathUtils.smoothstep(this.progress - index, 0, 1);
      this.nextCamera.fromArray(chapters[index].camera).lerp(new THREE.Vector3().fromArray(chapters[index + 1].camera), blend);
      this.nextTarget.fromArray(chapters[index].target).lerp(new THREE.Vector3().fromArray(chapters[index + 1].target), blend);
      if (this.narrow) { this.nextCamera.y *= 0.7; this.nextTarget.y *= 0.7; }
    } else {
      this.nextCamera.set(0, this.narrow ? 0.3 : 3.5, CAMERA_Z);
      this.nextTarget.set(0, this.narrow ? 0.3 : 3.5, 0);
    }
    const strength = this.active ? 1.15 : 0.8;
    this.nextCamera.x += p.x * strength;
    this.nextCamera.y -= p.y * strength * 0.55;
    this.nextTarget.x += p.x * strength * 0.25;
    this.nextTarget.y -= p.y * strength * 0.14;
    this.camera.position.lerp(this.nextCamera, damping);
    this.target.lerp(this.nextTarget, damping);
    this.camera.lookAt(this.target);
    this.uniforms.uTime.value = this.time;
    this.fragmentMaterial.uniforms.uTime.value = this.time;
    this.moteMaterial.uniforms.uTime.value = this.time;
    this.motes.visible = this.enabled;
    if (this.foreground) {
      for (const mesh of this.foreground.children) {
        const d = mesh.userData;
        mesh.position.x = d.x + Math.sin(this.time * .23 + d.z) * .025;
        const cameraY = this.nextCamera.y + p.y * strength * 0.55;
        mesh.position.y += (d.y + cameraY - 3.5 - mesh.position.y) * damping;
        mesh.rotation.z = d.rotation + Math.sin(this.time * .16 + d.z) * .006;
      }
    }
    const desiredMix=this.active?THREE.MathUtils.smoothstep(this.progress,2.16,2.92):0;
    this.deepMix=THREE.MathUtils.lerp(this.deepMix||0,desiredMix,damping);
    this.deepGarden.update((this.progress-2.2)/1.8,p,this.time,delta,this.reducedMotion);
    if(this.deepMix<.001) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene,this.camera);
    } else if(this.deepMix>.999) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.deepGarden.scene,this.deepGarden.camera);
    } else {
      const {a,b,material,scene,camera}=this.transition;
      this.renderer.setRenderTarget(a);this.renderer.render(this.scene,this.camera);
      this.renderer.setRenderTarget(b);this.renderer.render(this.deepGarden.scene,this.deepGarden.camera);
      this.renderer.setRenderTarget(null);material.uniforms.uMix.value=this.deepMix;this.renderer.render(scene,camera);
    }
    this.onFrame({ mix:this.deepMix,progress:this.progress,hotspots:this.deepGarden.hotspots() });
  };

  inspect() {
    return { ready: this.ready, active: this.active, progress: this.progress, motion: this.enabled, reading: this.reading, camera: this.camera.position.toArray(), pointer: this.smoothPointer.toArray(), deepMix:this.deepMix||0,deepCamera:this.deepGarden?.camera.position.toArray(),triangles: this.renderer?.info.render.triangles, points: this.renderer?.info.render.points };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.resize);
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      object.material?.map?.dispose();
      object.material?.dispose();
    });
    this.uniforms?.uMap.value.dispose();
    this.deepGarden?.dispose();
    if(this.transition) {this.transition.a.dispose();this.transition.b.dispose();this.transition.material.dispose();this.transition.scene.children[0].geometry.dispose();}
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
