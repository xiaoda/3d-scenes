"""Blender 4.5: --background --factory-startup --disable-autoexec --python THIS -- SOURCE_DIR.

SOURCE_DIR contains reviewed, selectively extracted tavern-source/ and shack-source/.
No downloaded scripts, source lights/cameras, or external texture paths are executed/exported.
"""
import bpy
import json
import pathlib
import sys
from mathutils import Vector

SOURCE = pathlib.Path(sys.argv[sys.argv.index('--') + 1]).resolve()
OUTPUT = pathlib.Path(__file__).resolve().parent.parent / 'public/assets/town/buildings'


def material(name, image, alpha=False, roughness=0.88):
    mat = bpy.data.materials.new(name + '_review')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = 0
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if alpha:
        mat.node_tree.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
        mat.surface_render_method = 'DITHERED'
    mat.use_backface_culling = True
    return mat


def export(asset_id):
    dest = OUTPUT / asset_id
    dest.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in meshes:
        o.select_set(True)
        # FBX has unused placeholder material slots; remove only slots with no faces.
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.material_slot_remove_unused()
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(c[i] for c in corners) for i in range(3)]
    hi = [max(c[i] for c in corners) for i in range(3)]
    stats = {'blenderVersion': bpy.app.version_string, 'sourceBoundsZUp': {'min': lo, 'max': hi},
             'sourceMeshCount': len(meshes), 'units': 'source units interpreted as metres; no automatic rescale',
             'conversion': 'Original geometry/UV/albedo; explicit roughness approximation, not native PBR.'}
    bpy.ops.export_scene.gltf(filepath=str(dest / 'model.gltf'), export_format='GLTF_SEPARATE',
                              use_selection=True, export_animations=False, export_cameras=False,
                              export_lights=False, export_yup=True, export_apply=True,
                              export_image_format='AUTO', export_texture_dir='textures')
    # Alpha cutout avoids order-dependent blended roof fragments; no invented geometry.
    path = dest / 'model.gltf'
    gltf = json.loads(path.read_text(encoding='utf-8'))
    for mat in gltf.get('materials', []):
        if mat.get('alphaMode') == 'BLEND':
            mat['alphaMode'] = 'MASK'
            mat['alphaCutoff'] = 0.5
    path.write_text(json.dumps(gltf, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    (dest / 'conversion.json').write_text(json.dumps(stats, indent=2), encoding='utf-8', newline='\n')
    print('EXPORTED', asset_id, json.dumps(stats))


bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'tavern-source/ThePaintedWench_02Upload.blend'), use_scripts=False)
# Legacy Blender Internal material slots no longer survive in modern Blender. The
# source has named image textures corresponding to material names. Restore those explicitly.
mapping = {t.name: t.image for t in bpy.data.textures if t.type == 'IMAGE' and t.image}
mapping['Sign'] = mapping['Texture']
for mat in list(bpy.data.materials):
    image = mapping.get(mat.name)
    if not image:
        raise RuntimeError('Unmapped legacy material: ' + mat.name)
    if not image.packed_file:
        raise RuntimeError('Reject external source texture path: ' + image.name)
    new = material(mat.name, image, roughness=0.75 if mat.name == 'RustedMetal' else 0.88)
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for slot in obj.material_slots:
                if slot.material == mat:
                    slot.material = new
export('daniel-tavern')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(SOURCE / 'shack-source/small_shack.FBX'), use_image_search=False)
for name, file in [('shack_main_tex', 'shack_main_diff.png'), ('shack_details_tex', 'shack_details_diff.png')]:
    original = bpy.data.materials.get(name)
    if original is None:
        raise RuntimeError('Missing FBX material: ' + name)
    image = bpy.data.images.load(str(SOURCE / 'shack-source' / file), check_existing=False)
    new = material(name, image, alpha=True)
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for slot in obj.material_slots:
                if slot.material == original:
                    slot.material = new
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        for polygon in obj.data.polygons:
            name = obj.data.materials[polygon.material_index].name
            if not name.endswith('_review'):
                raise RuntimeError('Face with unreviewed FBX material: ' + name)
export('spiral-shack')
