export interface Point {x:number;z:number}
export interface Rect {minX:number;maxX:number;minZ:number;maxZ:number}
export const PLAYER={height:1.65,radius:.28,speed:2.4} as const;
export function isWalkable(p:Point,obstacles:readonly Rect[],bounds:Rect):boolean{
 const r=PLAYER.radius;
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.x<bounds.minX+r||p.x>bounds.maxX-r||p.z<bounds.minZ+r||p.z>bounds.maxZ-r)return false;
 return !obstacles.some(b=>{const dx=p.x-Math.max(b.minX,Math.min(b.maxX,p.x)),dz=p.z-Math.max(b.minZ,Math.min(b.maxZ,p.z));return dx*dx+dz*dz<r*r;});
}
export function movePlayer(p:Point,input:{forward:number;right:number},yaw:number,dt:number,obstacles:readonly Rect[],bounds:Rect):Point{
 if(![p.x,p.z,input.forward,input.right,yaw,dt].every(Number.isFinite)||dt<=0)return {...p};
 const n=Math.max(1,Math.hypot(input.forward,input.right)),distance=PLAYER.speed*Math.min(dt,.05);
 const dx=(-Math.sin(yaw)*input.forward+Math.cos(yaw)*input.right)/n*distance,dz=(-Math.cos(yaw)*input.forward-Math.sin(yaw)*input.right)/n*distance;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));let result={...p};
 for(let i=0;i<steps;i++){
  const x={x:result.x+dx/steps,z:result.z};if(isWalkable(x,obstacles,bounds))result=x;
  const z={x:result.x,z:result.z+dz/steps};if(isWalkable(z,obstacles,bounds))result=z;
 }
 return result;
}
