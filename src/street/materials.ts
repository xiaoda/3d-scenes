import * as THREE from'three';
/** Apply scene-only grading once per shared material, never once per mesh. */
export function prepareMaterials(object:THREE.Object3D,anisotropy:number){
 const processed=new Set<THREE.Material>();
 object.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(!(m instanceof THREE.MeshStandardMaterial)||processed.has(m))continue;processed.add(m);
  if(!m.aoMap&&m.metalnessMap){m.aoMap=m.metalnessMap;m.aoMapIntensity=.85;}
  if(/Wood|Roof|Brick/.test(m.name)){m.color.multiply(new THREE.Color(0xc9bdaa));m.roughness=Math.max(m.roughness,.86);}
  if(/Plaster/.test(m.name))m.color.multiply(new THREE.Color(0xf2ddbd));
  for(const t of [m.map,m.normalMap,m.roughnessMap,m.aoMap])if(t)t.anisotropy=anisotropy;
 }});
}
