export type Bounds={min:[number,number,number];max:[number,number,number]};
export type Size={width:number;height:number;depth:number};
export type View='overall'|'front'|'back'|'detail';
export type CameraPose={position:[number,number,number];target:[number,number,number]};
export function groundControlState(active:string,requested:boolean,available:boolean){
 return {visible:available&&(requested||active==='floor'),disabled:!available||active==='floor'};
}
export function floorCameraPreset(view:View,aspect:number):CameraPose{
 const target:[number,number,number]=[0,0,0];
 if(view==='detail')return{position:[.5,.38,1.2],target};
 if(view==='front')return{position:[0,4,4.6],target};
 if(view==='back')return{position:[0,1.2,-4.2],target};
 // Fit all four corners of the 6 m inspection tile in camera space.
 const length=Math.hypot(3.5,4.5,4.5),dx=3.5/length,dy=4.5/length,dz=4.5/length;
 const horizontal=Math.hypot(dx,dz),rx=dz/horizontal,rz=-dx/horizontal;
 const ux=dy*rz,uz=-dy*rx,tanV=Math.tan(42*Math.PI/360),tanH=tanV*Math.max(.2,aspect);
 let distance=0;
 for(const x of [-3,3])for(const z of [-3,3]){
  const depth=x*dx+z*dz;
  distance=Math.max(distance,depth+Math.abs(x*rx+z*rz)/tanH,depth+Math.abs(x*ux+z*uz)/tanV);
 }
 distance*=1.1;
 return{position:[dx*distance,dy*distance,dz*distance],target};
}
export function groundPlacement(b:Bounds):[number,number,number]{return[-(b.min[0]+b.max[0])/2,-b.min[1],-(b.min[2]+b.max[2])/2];}
export function textureSpace(role:string){return role==='baseColor'?'srgb':'';}
export function inspectionGroundSize(b:Size){const footprint=Math.max(b.width,b.depth);return footprint<=3?6:Math.ceil((footprint+4)/2)*2;}
export function cameraPreset(b:Size,view:View,aspect:number):{position:[number,number,number];target:[number,number,number]}{
 const target:[number,number,number]=[0,b.height*.5,0];
 if(view==='detail'){target[1]=Math.min(1.6,target[1]);target[2]=b.depth/2;return{position:[0,target[1],target[2]+1],target};}
 // Fit all eight corners in camera space, including deep buildings on narrow screens.
 const direction=view==='overall'?[.48,.25,1]:[0,0,view==='back'?-1:1];
 const length=Math.hypot(...direction),[dx,dy,dz]=direction.map(x=>x/length);
 const horizontal=Math.hypot(dx,dz),rx=dz/horizontal,rz=-dx/horizontal;
 const ux=dy*rz,uy=horizontal,uz=-dy*rx;
 const tanV=Math.tan(42*Math.PI/360),tanH=tanV*Math.max(.2,aspect);
 let distance=0;
 for(const x of [-b.width/2,b.width/2])for(const y of [-b.height/2,b.height/2])for(const z of [-b.depth/2,b.depth/2]){
  const depth=x*dx+y*dy+z*dz;
  distance=Math.max(distance,depth+Math.abs(x*rx+z*rz)/tanH,depth+Math.abs(x*ux+y*uy+z*uz)/tanV);
 }
 distance*=1.12;
 return{position:[dx*distance,target[1]+dy*distance,dz*distance],target};
}
