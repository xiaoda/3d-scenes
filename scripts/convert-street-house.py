"""Owned Blender conversion script. Run with --disable-autoexec, never source scripts."""
import bpy,json,pathlib,hashlib
from mathutils import Vector,Matrix
ROOT=pathlib.Path(__file__).resolve().parent.parent
source=ROOT/'.preview/street-source/House1Upload.blend'
spec=json.loads((ROOT/'asset-sources/street-house.json').read_text(encoding='utf-8'))
if hashlib.sha256(source.read_bytes()).hexdigest()!=spec['sourceBlendSha256']:raise ValueError('Source blend changed; run verified prepare script')
dest=ROOT/'public/assets/town/street/house1';dest.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source),use_scripts=False)
mapping={t.name:t.image for t in bpy.data.textures if t.type=='IMAGE' and t.image}
mapping['GreyStone2']=mapping['GreyStone']
original=list(bpy.data.materials)
for old in original:
    m=bpy.data.materials.new(old.name+'_street');m.use_nodes=True;m.use_backface_culling=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Roughness'].default_value=.88;b.inputs['Metallic'].default_value=0
    if old.name.startswith('WindowBlue'):
        b.inputs['Base Color'].default_value=(.028,.044,.038,1);b.inputs['Roughness'].default_value=.3
    else:
        img=mapping.get(old.name)
        if not img or not img.packed_file:raise RuntimeError('No verified packed image for '+old.name)
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img;m.node_tree.links.new(tex.outputs['Color'],b.inputs['Base Color'])
    for obj in bpy.data.objects:
        if obj.type=='MESH':
            for slot in obj.material_slots:
                if slot.material==old:slot.material=m
# Local packed Wood resolves the source's missing linked Wood material explicitly.
bpy.context.view_layer.update()
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for obj in meshes:
    if obj.name.startswith('Door') and any(s.material and s.material.name.startswith('DoorType') for s in obj.material_slots):
        obj.data=obj.data.copy();obj.data.transform(obj.matrix_world);obj.matrix_world=Matrix.Identity(4)
        mod=obj.modifiers.new('Door_6cm','SOLIDIFY');mod.thickness=.06;mod.offset=-1
corners=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=[min(c[i] for c in corners) for i in range(3)];hi=[max(c[i] for c in corners) for i in range(3)]
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(dest/'model.gltf'),export_format='GLTF_SEPARATE',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_apply=True,export_yup=True,export_texture_dir='textures',export_image_format='AUTO')
g=json.loads((dest/'model.gltf').read_text());stats={'sizeYUp':[hi[0]-lo[0],hi[2]-lo[2],hi[1]-lo[1]],'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'meshes':sum(len(m['primitives']) for m in g['meshes']),'triangles':sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives']),'note':'Original geometry/UV/packed albedo; opaque dark windows, 6cm doors; legacy fixed roughness, not full PBR. Missing linked Wood replaced with packed local Wood.'}
(dest/'model.gltf').write_text(json.dumps(g,indent=2),encoding='utf-8',newline='\n')
(dest/'conversion.json').write_text(json.dumps(stats,indent=2),encoding='utf-8',newline='\n')
print('STREET_HOUSE',json.dumps(stats))
