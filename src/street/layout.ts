import type{Rect}from'./movement.ts';
export const bounds:Rect={minX:-20,maxX:20,minZ:-17,maxZ:23};
export const buildings=[
 {id:'tavern',position:[5,0,-7],rotation:0,footprint:{minX:-3.9,maxX:13.9,minZ:-13.96,maxZ:-.04}},
 {id:'house',position:[-11,0,3],rotation:Math.PI/2,footprint:{minX:-15.28,maxX:-6.72,minZ:-5.26,maxZ:11.26}},
] as const;
export const walls=[
 {x:-19.5,z:3,width:.5,depth:39,height:1.05},
 {x:19.5,z:3,width:.5,depth:39,height:1.05},
 {x:0,z:-16.5,width:39,depth:.5,height:1.25},
 {x:-10,z:22.5,width:19,depth:.5,height:1.05},
 {x:15,z:22.5,width:9,depth:.5,height:1.05},
] as const;
export const barrels=[{x:11,z:1.1},{x:12,z:1.7},{x:-5.7,z:8.8}] as const;
export const crates=[{x:13.5,z:1.4,w:.9,h:.65,d:.7},{x:13.5,z:2.2,w:.7,h:.5,d:.65}] as const;
export const obstacles:Rect[]=[...buildings.map(b=>b.footprint),...walls.map(w=>({minX:w.x-w.width/2,maxX:w.x+w.width/2,minZ:w.z-w.depth/2,maxZ:w.z+w.depth/2})),...barrels.map(p=>({minX:p.x-.39,maxX:p.x+.39,minZ:p.z-.39,maxZ:p.z+.39})),...crates.map(p=>({minX:p.x-p.w/2,maxX:p.x+p.w/2,minZ:p.z-p.d/2,maxZ:p.z+p.d/2}))];
export const viewpoints={
 entry:{x:9,z:17,yaw:.62,pitch:.10,label:'入街'},
 porch:{x:7,z:2.2,yaw:.30,pitch:.08,label:'酒馆门廊'},
 corner:{x:-4.5,z:13.5,yaw:.15,pitch:.13,label:'石路转角'},
} as const;
export type Viewpoint=keyof typeof viewpoints;
