import * as THREE from'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{HDRLoader}from'three/addons/loaders/HDRLoader.js';
import{barrels,buildings,crates,walls}from'./layout.ts';
import{prepareMaterials}from'./materials.ts';
const base='/assets/town/';
export class StreetScene{
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(58,1,.08,180);
 renderer:THREE.WebGLRenderer;errors:string[]=[];models:Record<string,{size:number[];triangles:number;meshes:number}>={};
 private targets:THREE.WebGLRenderTarget[]=[];private textures=new Set<THREE.Texture>();private disposed=false;
 constructor(readonly mount:HTMLElement,onLost:()=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.renderer.domElement.setAttribute('aria-label','街角实时 WebGL 画面');mount.append(this.renderer.domElement);
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onLost();});
  const sun=new THREE.DirectionalLight(0xffedcf,2.1);sun.position.set(15,24,18);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.5,far:85});sun.shadow.normalBias=.025;sun.shadow.bias=-.00004;
  this.scene.add(sun,sun.target,new THREE.HemisphereLight(0xcddbeb,0x807052,.6));this.camera.rotation.order='YXZ';this.resize();
 }
 resize(){const w=this.mount.clientWidth,h=this.mount.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 async load(progress:(s:string)=>void){
  const json=async(p:string)=>{const r=await fetch(base+p);if(!r.ok)throw Error(p+' HTTP '+r.status);return r.json();};
  const [assets,facade,street]=await Promise.all([json('manifest.json'),json('facade/manifest.json'),json('street/manifest.json')]);
  const get=(id:string)=>assets.assets.find((a:{id:string})=>a.id===id);
  const model=async(id:string,url:string)=>{
   const manager=new THREE.LoadingManager(),missing:string[]=[];manager.onError=p=>missing.push(p);
   const object=(await new GLTFLoader(manager).loadAsync(base+url)).scene;this.scene.add(object);
   if(missing.length)throw Error(id+' 依赖缺失：'+missing.join(', '));
   const b=new THREE.Box3().setFromObject(object),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());object.position.set(-center.x,-b.min.y,-center.z);
   const group=new THREE.Group();group.add(object);this.scene.add(group);
   let triangles=0,meshes=0;
   object.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=true;o.receiveShadow=true;}});
   prepareMaterials(object,Math.min(8,this.renderer.capabilities.getMaxAnisotropy()));
   this.models[id]={size:size.toArray(),triangles,meshes};progress(id==='tavern'?'酒馆已落位':id==='house'?'邻舍已落位':'酒桶已载入');return group;
  };
  const floor=async()=>{
   const paths=get('cobblestone_floor_08').textures;
   const tl=new THREE.TextureLoader();const ts=await Promise.all(['baseColor','normal','arm'].map(async role=>{const t=await tl.loadAsync(base+paths[role]);this.textures.add(t);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(22,21);t.anisotropy=8;if(role==='baseColor')t.colorSpace=THREE.SRGBColorSpace;return t;}));
   const mat=new THREE.MeshStandardMaterial({map:ts[0],normalMap:ts[1],roughnessMap:ts[2],aoMap:ts[2],metalness:0,roughness:1,aoMapIntensity:.8,color:0xe0d4bb});mat.normalScale.set(.55,.55);
   const geom=new THREE.PlaneGeometry(44,42,1,1);geom.rotateX(-Math.PI/2);const ground=new THREE.Mesh(geom,mat);ground.position.set(0,-.015,3);ground.receiveShadow=true;this.scene.add(ground);
   progress('石路已铺设');
  };
  const sky=async()=>{const rec=assets.assets.find((a:{hdri?:string})=>a.hdri),hdr=await new HDRLoader().loadAsync(base+rec.hdri);this.textures.add(hdr);hdr.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(this.renderer),env=pmrem.fromEquirectangular(hdr);this.targets.push(env);pmrem.dispose();this.scene.environment=env.texture;this.scene.environmentIntensity=.65;this.scene.background=hdr;this.scene.backgroundIntensity=.85;this.scene.backgroundBlurriness=.025;};
  let tavern:THREE.Group|undefined,house:THREE.Group|undefined,barrel:THREE.Group|undefined;
  const tasks=await Promise.allSettled([model('tavern',facade.assets[0].model).then(o=>tavern=o),model('house',street.assets[0].model).then(o=>house=o),model('barrel',get('wine_barrel_01').model).then(o=>barrel=o),floor(),sky()]);
  for(const t of tasks)if(t.status==='rejected')this.errors.push(String(t.reason));
  if(this.disposed)throw Error('页面已离开');if(this.errors.length)throw Error(this.errors.join('；'));
  [tavern!,house!].forEach((o,i)=>{o.position.fromArray(buildings[i].position);o.rotation.y=buildings[i].rotation;});
  // Verify actual imported dimensions before relying on layout/collision assumptions.
  for(const b of buildings){const size=this.models[b.id].size,expected=b.id==='tavern'?[17.8,8.32,13.91]:[16.5,12.27,8.54];if(size.some((v,i)=>Math.abs(v-expected[i])>.08))throw Error('建筑尺寸变化，停止漫游：'+b.id);}
  barrel!.removeFromParent();barrels.forEach((p,i)=>{const o=i===0?barrel!:barrel!.clone(true);o.position.set(p.x,0,p.z);o.rotation.y=i*.7;this.scene.add(o);});
  let stone:THREE.MeshStandardMaterial|undefined,wood:THREE.MeshStandardMaterial|undefined;
  tavern!.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.name==='Facade_Stone_PBR')stone=m;if(m.name==='Wood_review')wood=m;}});
  if(!stone||!wood)throw Error('缺少院墙/木箱复用材质');
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material)=>{
   const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   for(let i=0;i<p.count;i++){const u=Math.abs(n.getX(i))>.5?p.getZ(i)+z:p.getX(i)+x,v=Math.abs(n.getY(i))>.5?p.getZ(i)+z:p.getY(i)+y;uv.setXY(i,u/2.5,v/2.5);}
   const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;this.scene.add(o);return o;
  };
  const cap=stone.clone();cap.color.setHex(0xc1b49c);cap.normalScale.set(.35,.35);
  for(const w of walls){box(w.width,w.height,w.depth,w.x,w.height/2,w.z,stone);box(w.width+.12,.12,w.depth+.12,w.x,w.height+.06,w.z,cap);}
  // Simple secondary props only; neither building is procedurally substituted.
  for(const c of crates){box(c.w,c.h,c.d,c.x,c.h/2,c.z,wood);for(const x of [-.4,.4])box(.06,c.h+.05,c.d+.04,c.x+x*c.w,c.h/2,c.z,wood);box(c.w+.05,.06,c.d+.04,c.x,c.h*.75,c.z,wood);}
  // Stone edging marks the dry strip beside the house without blocking the alley.
  for(let z=-4;z<11;z+=.55)box(.32,.09,.5,-6.45,.025,z,cap);
  this.scene.updateMatrixWorld(true);this.renderer.shadowMap.needsUpdate=true;
 }
 render(){if(!this.disposed)this.renderer.render(this.scene,this.camera);}
 inspect(){const gl=this.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{models:this.models,errors:this.errors,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,drawingBuffer:this.renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};}
 dispose(){this.disposed=true;const materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)this.textures.add(v);}}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of this.textures){t.dispose();if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)t.image.close();}for(const t of this.targets)t.dispose();this.renderer.dispose();}
}
