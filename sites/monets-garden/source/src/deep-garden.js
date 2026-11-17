import * as THREE from 'three';
import { createPaintedFoliageLayer } from './painted-foliage.js';
import { assetURL } from './asset-url.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
function seeded(seed = 1899) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }; }
export const GARDEN_SPEC = { figureHeight: 2.4, canvasHeight: 1.72, canvasWidth: 1.72 * 73.7 / 92.7, bridgeSpan: 10.8 };

function beamBetween(a, b, thickness, material) {
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, direction.length(), thickness), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), direction.normalize());
  return mesh;
}

export class DeepGarden {
  constructor({ gray = false } = {}) {
    this.gray = gray;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#586750');
    this.camera = new THREE.PerspectiveCamera(46, 1.6, .1, 140);
    this.camera.position.set(1.3, 2.8, 8);
    this.camera.lookAt(2.6, 1.45, -.4);
    this.artistAnchor = V(4.8, 2.2, .2);
    this.bridgeAnchor = V(-5.2, 2.5, -5.8);
    this.materials = {};
    this.textures = [];
    this.look = V(2.6,1.45,-.4);
    this.smoothProgress = 0;
    this.stage = new THREE.Group();
    this.scene.add(this.stage);
    this.scene.add(new THREE.HemisphereLight('#e8edc9', '#4c5136', 2));
    const sun = new THREE.DirectionalLight('#fff0c8', 2.1);
    sun.position.set(-3, 12, 5);
    this.scene.add(sun);
    this.construct();
  }

  construct() {
    const gray = (value) => new THREE.MeshLambertMaterial({ color: value, side: THREE.DoubleSide });
    this.materials.ground = gray('#767c71');
    this.materials.water = gray('#535e60');
    this.materials.bridge = gray('#9a9c91');
    this.materials.wood = gray('#7c7872');
    this.materials.canvas = gray('#e5e2d7');
    this.materials.figure = gray('#96958c');

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(75, 90), this.materials.ground);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -.04, -4);
    this.stage.add(this.ground);
    const pondGeometry = new THREE.PlaneGeometry(1,1,44,70);
    const pondPositions=pondGeometry.attributes.position;
    const pondUv=pondGeometry.attributes.uv;
    for(let i=0;i<pondPositions.count;i++) {
      const z=-19+pondUv.getY(i)*34;
      const left=-13.3+1.7*Math.cos(z*.16);
      const right=-.55+.5*Math.sin(z*.22);
      pondPositions.setXYZ(i,THREE.MathUtils.lerp(left,right,pondUv.getX(i)),.025,z);
    }
    pondGeometry.computeVertexNormals();
    this.water = new THREE.Mesh(pondGeometry, this.materials.water);
    this.stage.add(this.water);

    this.bridge = new THREE.Group();
    this.bridge.position.set(-6.3, 0, -5.8);
    const half = GARDEN_SPEC.bridgeSpan / 2;
    const curveY = (x) => .08 + 1.1 * (1 - (x / half) ** 2);
    for (let i = 0; i < 42; i++) {
      const x = -half + (i + .5) * GARDEN_SPEC.bridgeSpan / 42;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(.27, .16, 1.7), this.materials.bridge);
      plank.position.set(x, curveY(x), 0);
      plank.rotation.z = Math.atan(-2.2 * x / (half * half));
      this.bridge.add(plank);
    }
    for (const side of [-.78, .78]) {
      for (const rail of [.48, 1.05]) {
        const points = Array.from({ length: 33 }, (_, i) => { const x = -half + i * GARDEN_SPEC.bridgeSpan / 32; return V(x, curveY(x) + rail, side); });
        this.bridge.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 90, .066, 7, false), this.materials.bridge));
      }
      for (let i = 0; i <= 8; i++) {
        const x = -half + i * GARDEN_SPEC.bridgeSpan / 8;
        const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.17, .12), this.materials.bridge);
        post.position.set(x, curveY(x) + .53, side);
        this.bridge.add(post);
      }
    }
    this.stage.add(this.bridge);

    this.easel = new THREE.Group();
    this.easel.position.set(2.0, 0, 0);
    this.easel.rotation.y = -.13;
    const wood = this.materials.wood;
    this.easel.add(beamBetween(V(-.7, 0, .08), V(-.35, 3.32, -.13), .085, wood));
    this.easel.add(beamBetween(V(.7, 0, .08), V(.35, 3.32, -.13), .085, wood));
    this.easel.add(beamBetween(V(0, 0, -1), V(0, 3.35, -.15), .07, wood));
    this.easel.add(beamBetween(V(0, .3, .02), V(0, 3.5, -.19), .095, wood));
    this.easel.add(beamBetween(V(-.87, 1.03, .15), V(.87, 1.03, .15), .105, wood));
    this.painting = new THREE.Mesh(new THREE.BoxGeometry(GARDEN_SPEC.canvasWidth + .055, GARDEN_SPEC.canvasHeight + .055, .07), this.materials.canvas);
    this.painting.position.set(0, 1.94, .055);
    this.easel.add(this.painting);
    this.stage.add(this.easel);

    this.figure = new THREE.Mesh(new THREE.BoxGeometry(1.97, 2.4, .28), this.materials.figure);
    this.figure.position.set(3.94, 1.2, .33);
    this.stage.add(this.figure);
    this.brush = beamBetween(V(2.83, 1.32, .45), V(2.54, 1.6, .2), .018, wood);
    this.stage.add(this.brush);

    this.trunks=[];
    for (const [x, z, height] of [[-12,-9,11],[-15,0,12],[8,-7,10],[9,7,12],[-8,11,11],[7,-15,12],[-4,-20,13]]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.19,.38,height,9), this.materials.wood);
      trunk.position.set(x,height/2,z);
      trunk.rotation.z=x*.004;
      this.stage.add(trunk);
      this.trunks.push(trunk);
    }
  }

  resize(width, height) {
    this.narrow = width / height < .8;
    this.camera.aspect = width / height;
    this.camera.fov = this.narrow ? 53 : 46;
    this.camera.updateProjectionMatrix();
  }

  async load() {
    const names = ['monet-ground-passage','garden-path','garden-water','garden-canopy','monet-branches-silver','monet-branches-shade','monet-bank-ferns','monet-bridge-brush','monet-painting-cutout','monet-garden','lilies-left','lilies-right','willow-left','willow-right'];
    const loader = new THREE.TextureLoader();
    const maps = {};
    await Promise.all(names.map(async name => {
      const texture = await loader.loadAsync(assetURL(`${name}.webp`));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      maps[name] = texture;
      this.textures.push(texture);
    }));
    this.scene.background = new THREE.Color('#738264');
    this.scene.fog = new THREE.FogExp2('#7e8b69', .018);
    maps['monet-ground-passage'].wrapS = maps['monet-ground-passage'].wrapT = THREE.RepeatWrapping;
    maps['monet-ground-passage'].repeat.set(5,9);
    this.materials.ground.dispose();
    this.materials.ground=new THREE.MeshBasicMaterial({map:maps['monet-ground-passage'],color:'#b1bd9b'});
    this.ground.material=this.materials.ground;
    this.materials.bridge.color.set('#568978');
    this.materials.bridge.map=maps['monet-bridge-brush'];
    this.materials.bridge.needsUpdate=true;
    this.materials.wood.color.set('#756948');
    this.trunks.forEach(trunk=>{trunk.visible=false;});
    this.materials.water.dispose();
    this.waterUniforms = { uMap: { value: maps['garden-water'] }, uTime: { value: 0 } };
    this.water.material = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D uMap; uniform float uTime; varying vec2 vUv;
        void main(){ vec2 p=vUv; p.x+=sin(p.y*130.+uTime*.7)*.0018;
          vec3 c=texture2D(uMap,p).rgb; c=mix(c,vec3(.11,.20,.17),.25);
          float light=sin(p.y*370.+p.x*18.+uTime*.9)*.015;
          gl_FragColor=vec4(c+light,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.createPath(maps['garden-path']);
    this.createBackdrop(maps['garden-canopy']);
    this.createVegetation(maps);
    this.createLilies(maps);
    this.createFigure(maps['monet-painting-cutout'], maps['monet-garden']);
    this.createDust();
    this.loaded = true;
  }

  createPath(map) {
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(2,18);
    const geometry = new THREE.PlaneGeometry(1,1,8,90);
    const p=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<p.count;i++) {
      const z=-16+uv.getY(i)*47;
      const center=4.1+1.3*Math.sin(z*.12);
      const width=2.6+.3*Math.sin(z*.24);
      p.setXYZ(i,center+(uv.getX(i)-.5)*width,.012,z);
    }
    geometry.computeVertexNormals();
    const material=new THREE.ShaderMaterial({
      uniforms:{uMap:{value:map}},side:THREE.DoubleSide,transparent:true,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform sampler2D uMap;varying vec2 vUv;void main(){
        vec3 c=texture2D(uMap,vec2(vUv.x*2.,vUv.y*18.)).rgb;
        float rough=sin(vUv.y*370.)*.023+sin(vUv.y*1190.)*.016;
        float a=smoothstep(.0,.21,vUv.x+rough)*(1.-smoothstep(.79,1.,vUv.x+rough));
        gl_FragColor=vec4(c*.9,a*.92);
        #include <colorspace_fragment>
      }`,
    });
    this.stage.add(new THREE.Mesh(geometry,material));
  }

  createBackdrop(map) {
    map.wrapS=THREE.MirroredRepeatWrapping;
    map.repeat.set(4,1);
    const height=(2*Math.PI*37/4)*map.image.height/map.image.width;
    const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(37,37,height,60,1,true),new THREE.MeshBasicMaterial({map,side:THREE.BackSide,fog:false}));
    cylinder.position.set(0,height/2-.5,-8);
    this.stage.add(cylinder);
  }

  createVegetation(maps) {
    this.veils=[];
    const add=(name,placement,sway=false)=>{
      const layer=createPaintedFoliageLayer(maps[name],placement);
      this.stage.add(layer);
      if(sway)this.veils.push(layer);
      return layer;
    };
    // Whole willow passages keep Monet's long vertical strokes. Silver foliage
    // retains the original neighbouring ochre, grey-blue and green marks.
    for(const [name,x,y,z,width,tilt] of [
      ['monet-branches-shade',-2,8.8,-23,17,0],
      ['willow-left',-12,6.6,-14,9,-.03],
      ['monet-branches-silver',12,7.4,-15,15,.02],
      ['willow-left',-10,6.6,-2,8,.02],
      ['monet-branches-silver',10.5,7,0,11,-.025],
      ['willow-left',-8,6.8,8,7.4,-.025],
      ['monet-branches-silver',8.5,7.5,10,10,.02],
      ['willow-left',-6.5,6.1,18,6.6,.015],
      ['willow-right',7.1,6.5,17,6.6,-.02],
    ]) add(name,{x,y,z,width,tilt},true);

    // The entire source fern passage stays together, rather than becoming
    // thousands of identical upright leaves or a cloud of tiny paint particles.
    for(const [z,width,yaw] of [[-18,6,1.2],[-11,4.2,1.35],[-4,5.1,1.18],[4,3.7,1.3],[13,5.5,1.22],[23,5.9,1.34]]) {
      const height=width*maps['monet-bank-ferns'].image.height/maps['monet-bank-ferns'].image.width;
      add('monet-bank-ferns',{x:.25+.22*Math.sin(z*.22),y:height*.38,z,width,yaw,pitch:-.7,bank:true});
    }
    for(const [x,z,width] of [[9,-18,9],[10.8,-9,8],[10.2,-1,8.4],[10.4,7,8],[10.2,16,8.2],[10,25,8]]) {
      add('monet-bank-ferns',{x,y:width*maps['monet-bank-ferns'].image.height/maps['monet-bank-ferns'].image.width*.40,z,width,yaw:-.2,pitch:-.35,bank:true});
    }
    for(const x of [-18,-10,-2,6,14,22]) {
      add('monet-bank-ferns',{x,y:.76,z:-23,width:10,bank:true});
    }
  }

  createLilies(maps) {
    const random=seeded(1893);
    for(const name of ['lilies-left','lilies-right']) {
      const lilies=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:maps[name],transparent:true,alphaTest:.1,side:THREE.DoubleSide,color:'#d1ddbb'}),48);
      const dummy=new THREE.Object3D();
      for(let i=0;i<48;i++) {
        const x=-11+random()*9.3,z=-17+random()*29;
        dummy.position.set(x,.05+random()*.035,z);
        dummy.rotation.set(-Math.PI/2,0,random()*Math.PI*2);
        const size=.8+random()*2.5;dummy.scale.set(size,size*.6,1);dummy.updateMatrix();lilies.setMatrixAt(i,dummy.matrix);
      }
      this.stage.add(lilies);
    }
  }

  createFigure(map,paintingMap) {
    this.figure.geometry.dispose();this.figure.material.dispose();
    this.figure.geometry=new THREE.PlaneGeometry(1.97,2.4);
    this.figure.material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.13,side:THREE.DoubleSide});
    this.figure.rotation.y=-.08;
    const face=new THREE.Mesh(new THREE.PlaneGeometry(GARDEN_SPEC.canvasWidth,GARDEN_SPEC.canvasHeight),new THREE.MeshBasicMaterial({map:paintingMap,side:THREE.DoubleSide}));
    face.position.set(0,1.94,.095);this.easel.add(face);
    this.materials.canvas.color.set('#d6cba9');

    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,2,64,64,64);
    gradient.addColorStop(0,'rgba(22,32,17,.5)');gradient.addColorStop(1,'rgba(22,32,17,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const shadowMap=new THREE.CanvasTexture(canvas);this.textures.push(shadowMap);
    for(const [x,z,w,h] of [[3.94,.43,3,1.4],[2,0,2.5,1.4]]) {
      const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.035,z);this.stage.add(shadow);
    }
    this.brushBase=this.brush.quaternion.clone();
  }

  createDust() {
    const random=seeded(1883),positions=[];
    for(let i=0;i<100;i++) positions.push((random()-.5)*24,random()*7,-15+random()*40);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    this.dust=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#eceac2',size:.024,transparent:true,opacity:.5,depthWrite:false}));this.scene.add(this.dust);
  }

  update(progress,pointer,time,delta,reducedMotion) {
    const p=THREE.MathUtils.clamp(progress,0,1);
    const ease=reducedMotion?1:1-Math.exp(-delta*3.4);
    this.smoothProgress += (p-this.smoothProgress)*ease;
    const t=this.smoothProgress;
    let position,look;
    if(this.narrow) {
      position=V(2.6,3.5,25).lerp(V(3.2,3.4,12.5),t);
      look=V(2.2,1.5,-4).lerp(V(2.9,1.25,0),t);
    } else {
      position=V(-.2,3.8,24).lerp(V(1.3,2.8,8),t);
      position.x+=Math.sin(t*Math.PI)*.9;
      look=V(0,1.4,-6).lerp(V(2.6,1.45,-.4),t);
    }
    position.x+=pointer.x*.48;position.y-=pointer.y*.24;
    look.x+=pointer.x*.1;look.y-=pointer.y*.05;
    this.camera.position.copy(position);this.look.copy(look);this.camera.lookAt(look);this.camera.updateMatrixWorld();
    if(this.waterUniforms) this.waterUniforms.uTime.value=time;
    if(this.brushBase) this.brush.quaternion.copy(this.brushBase).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),Math.sin(time*.9)*.05));
    if(this.dust) {this.dust.position.x=Math.sin(time*.1)*.4;this.dust.position.y=Math.sin(time*.13)*.15;}
    this.figure.position.y=1.2+Math.sin(time*.8)*.002;
    if(this.veils) this.veils.forEach((mesh,i)=>mesh.rotation.z=mesh.userData.restTilt+Math.sin(time*.25+i)*.003);
  }

  hotspots() {
    const project = (point) => {
      const p=point.clone().project(this.camera);
      return { x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z<1&&p.z>-1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.84 };
    };
    return { artist:project(this.artistAnchor),bridge:project(this.bridgeAnchor) };
  }

  dispose() {
    this.scene.traverse(object => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach(m=>m.dispose()); else object.material?.dispose(); });
    this.textures.forEach(texture=>texture.dispose());
  }
}

export function createDeepGrayStage(host) {
  const garden = new DeepGarden({ gray: true });
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  garden.resize(innerWidth,innerHeight);
  const view = new URLSearchParams(location.search).get('view') || 'front';
  garden.camera.position.fromArray({ front: [1.3,4,14], top: [1,18,15], angle: [-13,8,12] }[view]);
  garden.camera.lookAt(0,1,-3);
  host.append(renderer.domElement);
  renderer.render(garden.scene,garden.camera);
  const label=document.createElement('div');
  label.style.cssText='position:fixed;left:28px;top:24px;color:white;font:14px monospace';
  label.textContent=`GARDEN BLOCKOUT / ${view} · seated figure 2.4 · easel 3.5 · bridge span 10.8`;
  host.append(label);
}
