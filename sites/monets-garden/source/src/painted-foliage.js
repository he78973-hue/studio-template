import * as THREE from 'three';

// A complete passage of the original painting, not an imitation of its strokes.
// Aspect and colours stay intact; depth comes from placement of a few broad layers.
export function createPaintedFoliageLayer(texture,{x,y,z,width,yaw=0,tilt=0,pitch=0,bank=false}) {
  const height=width*texture.image.height/texture.image.width;
  const geometry=new THREE.PlaneGeometry(width,height,12,12);
  const position=geometry.attributes.position;
  for(let i=0;i<position.count;i++) {
    const u=geometry.attributes.uv.getX(i),v=geometry.attributes.uv.getY(i);
    position.setZ(i,Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*width*.025);
  }
  geometry.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({
    map:texture,transparent:true,alphaTest:.015,depthWrite:false,
    side:THREE.DoubleSide,color:0xffffff,
  });
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`
      #include <alphamap_fragment>
      diffuseColor.a*=smoothstep(0.,.09,vMapUv.x)*(1.-smoothstep(.91,1.,vMapUv.x));
      diffuseColor.a*=smoothstep(0.,${bank?'.30':'.07'},vMapUv.y)*(1.-smoothstep(.94,1.,vMapUv.y));
    `);
  };
  material.customProgramCacheKey=()=>bank?'painted-bank':'painted-canopy';
  const layer=new THREE.Mesh(geometry,material);
  layer.position.set(x,y,z);
  layer.rotation.set(pitch,yaw,tilt);
  layer.userData.restTilt=tilt;
  return layer;
}
