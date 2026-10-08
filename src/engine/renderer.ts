import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {cameraPreset,floorCameraPreset,groundControlState,groundPlacement,textureSpace,inspectionGroundSize} from './inspection.ts';
import type {View,Size} from './inspection.ts';
import {base,catalog} from '../assets/catalog.ts';
import type {AssetKey,Manifest} from '../assets/catalog.ts';
import {isTavernVariant} from './variants.ts';

export interface ModelReport {key:AssetKey;size:Size;triangles:number;meshes:number;materials:number}
function disposeTree(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});
 for(const t of textures){t.dispose();if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)t.image.close();}
 for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
}
export class AssetLab {
 renderer:THREE.WebGLRenderer;
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(42,1,.02,300);
 controls:OrbitControls;
 sun=new THREE.DirectionalLight(0xffedce,2.4);
 hemi=new THREE.HemisphereLight(0xc4d4e2,0x827365,.35);
 objects=new Map<AssetKey,THREE.Object3D>();
 reports=new Map<AssetKey,ModelReport>();
 floor!:THREE.Mesh;
 active:AssetKey='barrel';
 currentView:View='overall';
 detailSurfaceDistance:number|null=null;
 wire=false;
 ground=true;
 frame=0;
 disposed=false;
 shadowDirty=true;
 errors:string[]=[];
 frameTimes:number[]=[];
 last=0;
 private observer:ResizeObserver;
 private environmentTarget?:THREE.WebGLRenderTarget;
 private invalidate=()=>{if(this.disposed||this.frame)return;this.frame=requestAnimationFrame(this.render);};
 private render=(time:number)=>{
  this.frame=0;if(this.disposed||document.hidden)return;
  if(this.last&&time-this.last<300)this.frameTimes.push(time-this.last);
  if(this.frameTimes.length>120)this.frameTimes.shift();this.last=time;
  this.controls.update();
  if(this.shadowDirty){this.renderer.shadowMap.needsUpdate=true;this.shadowDirty=false;}
  this.renderer.render(this.scene,this.camera);
 };
 constructor(private mount:HTMLElement){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
  this.renderer.shadowMap.autoUpdate=false;
  this.scene.background=new THREE.Color(0xd9dcd5);
  mount.prepend(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','实际模型的 WebGL 渲染画布');
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.errors.push('WebGL 上下文丢失，请重新载入页面。');mount.dispatchEvent(new CustomEvent('lab-error',{detail:this.errors.at(-1)}));});
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);
  this.controls.enableDamping=true;this.controls.dampingFactor=.11;
  this.controls.minDistance=.12;this.controls.maxDistance=250;
  this.controls.maxPolarAngle=Math.PI*.49;
  this.controls.addEventListener('change',this.invalidate);
  this.controls.listenToKeyEvents(mount);
  this.sun.position.set(4,7,5);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);
  Object.assign(this.sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:25});
  this.sun.shadow.normalBias=.012;this.sun.shadow.bias=-.00003;
  this.scene.add(this.sun,this.sun.target,this.hemi);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(mount);
  document.addEventListener('visibilitychange',this.onVisibility);
 }
 private onVisibility=()=>{this.last=0;if(!document.hidden)this.invalidate();};
 resize(){const w=this.mount.clientWidth,h=this.mount.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.reports.has(this.active))this.view(this.currentView);this.invalidate();}
 async load(manifest:Manifest,onProgress:(label:string)=>void){
  const manager=new THREE.LoadingManager();
  manager.onError=url=>this.errors.push('资源加载失败：'+url);
  const loadModel=async(key:Exclude<AssetKey,'floor'>)=>{
   const rec=manifest.assets.find(a=>a.id===catalog[key].id)!;
   if(!rec?.model)throw Error('资产台账缺少 '+key);
   const missing:string[]=[],modelManager=new THREE.LoadingManager();
   modelManager.onError=url=>{missing.push(url);this.errors.push('资源加载失败：'+url);};
   const gltf=await new GLTFLoader(modelManager).loadAsync(base+rec.model);
   const object=gltf.scene;
   // GLTFLoader may resolve with a white material when an image fails. Such a
   // model is not a valid review sample: disable only that model, keep the rest.
   if(missing.length){disposeTree(object);throw Error('贴图/依赖不完整：'+missing.join('，'));}
   const box=new THREE.Box3().setFromObject(object);
   const p=groundPlacement({min:box.min.toArray() as [number,number,number],max:box.max.toArray() as [number,number,number]});
   object.position.add(new THREE.Vector3(...p));object.updateMatrixWorld(true);
   const size=box.getSize(new THREE.Vector3());
   let triangles=0,meshes=0;const mats=new Set<THREE.Material>();
   object.traverse(child=>{if(child instanceof THREE.Mesh){meshes++;triangles+=(child.geometry.index?.count??child.geometry.attributes.position.count)/3;child.castShadow=true;child.receiveShadow=true;for(const m of (Array.isArray(child.material)?child.material:[child.material])){mats.add(m);if(m instanceof THREE.MeshStandardMaterial){if(!m.aoMap&&m.metalnessMap){m.aoMap=m.metalnessMap;m.aoMapIntensity=.85;}for(const t of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(t)t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());}}}});
   object.visible=false;this.scene.add(object);this.objects.set(key,object);
   this.reports.set(key,{key,size:{width:size.x,height:size.y,depth:size.z},triangles,meshes,materials:mats.size});
   onProgress(rec.name+' 已导入');
  };
  const loadFloor=async()=>{
   const rec=manifest.assets.find(a=>a.id===catalog.floor.id)!;
   const paths=rec.textures!;const tl=new THREE.TextureLoader(manager);
   const [map,normal,arm,disp]=await Promise.all(['baseColor','normal','arm','displacement'].map(k=>tl.loadAsync(base+paths[k])));
   map.colorSpace=textureSpace('baseColor');
   for(const t of [normal,arm,disp])t.colorSpace=textureSpace('normal');
   for(const t of [map,normal,arm,disp]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());}
   const material=new THREE.MeshStandardMaterial({map,normalMap:normal,roughnessMap:arm,aoMap:arm,aoMapIntensity:.8,roughness:1,metalness:0,displacementMap:disp,displacementScale:.018,displacementBias:-.018});
   material.normalScale.set(.7,.7);
   const geometry=new THREE.PlaneGeometry(6,6,192,192);geometry.rotateX(-Math.PI/2);
   this.floor=new THREE.Mesh(geometry,material);this.floor.receiveShadow=true;this.scene.add(this.floor);
   this.objects.set('floor',this.floor);
   this.reports.set('floor',{key:'floor',size:{width:6,height:.018,depth:6},triangles:geometry.index!.count/3,meshes:1,materials:1});
   onProgress('石路材质已导入');
  };
  const loadEnvironment=async()=>{
   const rec=manifest.assets.find(a=>a.hdri)!;
   const hdr=await new HDRLoader(manager).loadAsync(base+rec.hdri);
   const pmrem=new THREE.PMREMGenerator(this.renderer);
   const env=pmrem.fromEquirectangular(hdr);
   this.environmentTarget=env;this.scene.environment=env.texture;this.scene.environmentIntensity=.7;
   hdr.dispose();pmrem.dispose();
  };
  const results=await Promise.allSettled([loadModel('barrel'),loadModel('door'),loadFloor(),loadEnvironment(),loadModel('tavern'),loadModel('shack'),loadModel('tavern-upgrade')]);
  results.forEach((r,i)=>{if(r.status==='rejected')this.errors.push(['酒桶','木门','地面','环境光','酒馆','小屋','立面升级'][i]+'：'+String(r.reason));});
  this.shadowDirty=true;
  return results;
 }
 select(key:AssetKey,preserveView=false){if(!this.reports.has(key))throw Error('该资产未成功加载');const keep=preserveView&&isTavernVariant(this.active)&&isTavernVariant(key);this.active=key;this.fitGroundAndShadow();this.updateVisibility();if(!keep)this.view('overall');else this.detailSurfaceDistance=null;this.shadowDirty=true;this.invalidate();return this.reports.get(key)!;}
 private fitGroundAndShadow(){
  const size=this.reports.get(isTavernVariant(this.active)&&this.reports.has('tavern')?'tavern':this.active)!.size;
  const span=this.active==='floor'?6:inspectionGroundSize(size);
  if(this.floor){
   this.floor.scale.set(span/6,1,span/6);
   const m=this.floor.material as THREE.MeshStandardMaterial;
   for(const t of new Set([m.map,m.normalMap,m.roughnessMap,m.aoMap,m.displacementMap]))if(t)t.repeat.set(span/2,span/2);
  }
  const reach=Math.max(span,size.height*1.5);
  this.sun.position.set(reach*.7,reach*1.2,reach*.85);this.sun.target.position.set(0,size.height*.35,0);
  Object.assign(this.sun.shadow.camera,{left:-span*.75,right:span*.75,top:span*.75,bottom:-span*.75,near:.1,far:reach*4});
  this.sun.shadow.camera.updateProjectionMatrix();
 }
 private updateVisibility(){const ground=groundControlState(this.active,this.ground,this.objects.has('floor'));for(const [key,o]of this.objects)o.visible=key==='floor'?ground.visible:key===this.active;this.applyWire();}
 view(view:View){
  const b=this.reports.get(this.active)?.size;if(!b)return;
  this.currentView=view;this.detailSurfaceDistance=null;
  this.controls.enableDamping=false;this.controls.update();
  if(this.active==='floor'){
   const v=floorCameraPreset(view,this.camera.aspect);this.camera.position.set(...v.position);this.controls.target.set(...v.target);
  }else{
   const p=cameraPreset(b,view,this.camera.aspect);
   if(view==='detail'&&(isTavernVariant(this.active)||this.active==='shack')){
    // Setback facades are not the bounding-box front. Place the close-up one metre
    // from an actual mesh hit at eye height, without changing source geometry.
    this.scene.updateMatrixWorld(true);
    const ray=new THREE.Raycaster(new THREE.Vector3(...p.position),new THREE.Vector3(0,0,-1));
    const hit=ray.intersectObject(this.objects.get(this.active)!,true)[0];
    if(hit){p.target=hit.point.toArray();p.position=[hit.point.x,hit.point.y,hit.point.z+1];this.detailSurfaceDistance=1;}
   }
   this.camera.position.set(...p.position);this.controls.target.set(...p.target);
  }
  this.controls.update();this.controls.enableDamping=true;this.invalidate();
 }
 light(mode:'sun'|'neutral'){this.sun.intensity=mode==='sun'?2.4:0;this.hemi.intensity=mode==='sun'?.35:1.2;this.scene.environmentIntensity=mode==='sun'?.7:1.05;this.renderer.toneMappingExposure=mode==='sun'?1:1.08;this.shadowDirty=true;this.invalidate();}
 setWire(value:boolean){this.wire=value;this.applyWire();this.invalidate();}
 private applyWire(){for(const[key,o]of this.objects)o.traverse(c=>{if(c instanceof THREE.Mesh)for(const m of Array.isArray(c.material)?c.material:[c.material])if(m instanceof THREE.MeshStandardMaterial)m.wireframe=this.wire&&key===this.active;});}
 setGround(value:boolean){this.ground=value;this.updateVisibility();this.shadowDirty=true;this.invalidate();}
 inspect(){
  const gl=this.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  return{active:this.active,view:this.currentView,detailSurfaceDistance:this.detailSurfaceDistance,groundSize:this.floor?6*this.floor.scale.x:null,errors:this.errors,reports:[...this.reports.values()],camera:this.camera.position.toArray(),target:this.controls.target.toArray(),wireframe:this.wire,ground:this.ground,groundVisible:this.floor?.visible??false,sunIntensity:this.sun.intensity,environmentIntensity:this.scene.environmentIntensity,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),drawingBuffer:this.renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),pixelRatio:this.renderer.getPixelRatio(),drawCalls:this.renderer.info.render.calls,renderedTriangles:this.renderer.info.render.triangles,textureCount:this.renderer.info.memory.textures,note:'按需渲染；不是连续行走帧率基准。'};
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.controls.dispose();disposeTree(this.scene);this.environmentTarget?.dispose();this.renderer.dispose();}
}
