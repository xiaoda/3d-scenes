"""Offline Blender 4.5 study: keep the original glTF immutable, export a separate variant.

Run with --background --factory-startup --disable-autoexec --python-exit-code 1.
Requires verified files from fetch-facade-materials.mjs. Never modifies bitmap pixels.
"""
import bpy
import hashlib
import json
import pathlib
import shutil
from mathutils import Vector, Matrix

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = ROOT / 'public/assets/town'
SOURCE = BASE / 'buildings/daniel-tavern/model.gltf'
DEST = BASE / 'facade/tavern-v1'
MATERIALS = ROOT / '.preview/facade-materials'
spec = json.loads((ROOT / 'asset-sources/facade-materials.json').read_text(encoding='utf-8'))
source_manifest = json.loads((BASE / 'buildings/manifest.json').read_text(encoding='utf-8'))
source_asset = next(a for a in source_manifest['assets'] if a['id'] == 'daniel-tavern')
for item in source_asset['files']:
    if hashlib.sha256((BASE / item['path']).read_bytes()).hexdigest() != item['sha256']:
        raise ValueError('Original asset changed: ' + item['path'])
for item in spec['files']:
    data = (MATERIALS / item['path']).read_bytes()
    if len(data) != item['size'] or hashlib.md5(data).hexdigest() != item['md5']:
        raise ValueError('Unverified source texture: ' + item['path'])
paths = {f['role']: MATERIALS / f['path'] for f in spec['files']}
DEST.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
bpy.context.view_layer.update()


def simple_material(name, color, roughness, metallic=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True
    shader = m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return m, shader


wall, bsdf = simple_material('Facade_Stone_PBR', (1, 1, 1), 1)
for role in ['baseColor', 'normal']:
    image = bpy.data.images.load(str(paths[role]), check_existing=False)
    image.colorspace_settings.name = 'sRGB' if role == 'baseColor' else 'Non-Color'
    node = wall.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = image
    if role == 'baseColor':
        wall.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        normal = wall.node_tree.nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = .65
        wall.node_tree.links.new(node.outputs['Color'], normal.inputs['Color'])
        wall.node_tree.links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])

# Opaque dark glazing is deliberate: this model has no reviewed interior.
glass, _ = simple_material('Facade_Window_Glass', (.028, .044, .038), .28)
lead, _ = simple_material('Facade_Window_Leads', (.045, .04, .034), .72, .35)
lead_vertices, lead_faces = [], []


def bar(center, right, up, normal, width, height, depth=.018):
    """Eight actual vertices per bar, collected into one shared mesh/draw call."""
    start = len(lead_vertices)
    for x, y, z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),
                    (-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
        lead_vertices.append(center + right*x*width/2 + up*y*height/2 + normal*z*depth/2)
    for face in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:
        lead_faces.append(tuple(start+i for i in face))


stats = {'wallTileMetres': spec['tileMetres'], 'doorThicknessMetres': .06,
         'thickenedDoors': 0, 'rectangularWindows': 0, 'sourceGeometryPreserved': True,
         'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
         'sourceNote': 'Original geometry preserved except explicit door thickness/bevel; wall UVs replaced. No bitmap edits.',
         'wallMeshes': [], 'remainingLegacyMaterials': 'Roof, timber, foundation, brick chimney retain original albedo.',
         'blenderVersion': bpy.app.version_string}

for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    # glTF reuses one mesh datablock for several windows/doors. Make an owned
    # copy before changing UVs/material slots or baking object transforms.
    obj.data = obj.data.copy()
    original_mats = [m.name for m in obj.data.materials]
    if 'StoneWall_review' in original_mats:
        # UVs use world-space metres rather than stretching one image to each wall.
        uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='FacadeMetres')
        normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
        for poly in obj.data.polygons:
            if obj.data.materials[poly.material_index].name != 'StoneWall_review':
                continue
            n = (normal_matrix @ poly.normal).normalized()
            dominant = max(range(3), key=lambda i: abs(n[i]))
            for loop_index in poly.loop_indices:
                p = obj.matrix_world @ obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
                if dominant == 2:
                    u, v = p.x, p.y
                elif dominant == 0:
                    u, v = p.y * (1 if n.x > 0 else -1), p.z
                else:
                    u, v = p.x * (-1 if n.y > 0 else 1), p.z
                uv.data[loop_index].uv = (u/spec['tileMetres'], v/spec['tileMetres'])
        for slot in obj.material_slots:
            if slot.material.name == 'StoneWall_review':
                slot.material = wall
        stats['wallMeshes'].append(obj.name)
    if 'WindowBlue1_review' in original_mats:
        coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
        # The existing window planes are in the original openings. Add geometry,
        # not opaque cards in front of the building, using their actual orientation.
        normal = (obj.matrix_world.to_3x3().inverted().transposed() @ obj.data.polygons[0].normal).normalized()
        up = Vector((0,0,1))
        right = up.cross(normal).normalized()
        left, right_edge = min(p.dot(right) for p in coords), max(p.dot(right) for p in coords)
        bottom, top = min(p.z for p in coords), max(p.z for p in coords)
        center = right*((left+right_edge)/2) + up*((bottom+top)/2) + normal*(sum(p.dot(normal) for p in coords)/len(coords))
        width, height = right_edge-left, top-bottom
        # Original rectangular windows contain two panes separated by a timber
        # mullion (8 vertices), not one four-vertex quad. Curved dormers have >2 heights.
        rectangular = all(min(abs(p.z-bottom),abs(p.z-top)) < .0001 for p in coords)
        if rectangular and width > .4 and height > .4:
            center += normal*.016
            for fraction in [-1/6, 1/6]:
                bar(center+right*width*fraction, right, up, normal, .012, height*.98)
            bar(center, right, up, normal, width*.98, .012)
            stats['rectangularWindows'] += 1
        for slot in obj.material_slots:
            if slot.material.name == 'WindowBlue1_review':
                slot.material = glass
    if obj.name.startswith(('DoorEntrance','DoorBack','DoorBalcony','DoorKitchen')) and 'DoorType1_2_review' in original_mats:
        # Apply transforms so thickness is measured in metres, not object-local scale.
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
        solid = obj.modifiers.new('DoorThickness_6cm', 'SOLIDIFY')
        solid.thickness = .06
        solid.offset = -1
        bevel = obj.modifiers.new('DoorEdge_6mm', 'BEVEL')
        bevel.width = .006
        bevel.segments = 2
        stats['thickenedDoors'] += 1

if not stats['wallMeshes'] or stats['rectangularWindows'] < 10 or stats['thickenedDoors'] != 4:
    raise RuntimeError('Source structure changed; stop instead of generating a partial variant: ' + json.dumps(stats))
mesh = bpy.data.meshes.new('Facade_LeadedWindowGeometry')
mesh.from_pydata(lead_vertices, [], lead_faces)
mesh.update()
leads = bpy.data.objects.new('Facade_WindowLeads', mesh)
bpy.context.collection.objects.link(leads)
mesh.materials.append(lead)
stats['leadTriangles'] = len(lead_faces)*2
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(DEST/'model.gltf'), export_format='GLTF_SEPARATE',
                          use_selection=True, export_animations=False, export_cameras=False,
                          export_lights=False, export_apply=True, export_yup=True,
                          export_image_format='AUTO', export_texture_dir='textures')

# Preserve the original packed ARM bytes instead of synthesizing/re-encoding images.
gltf = json.loads((DEST/'model.gltf').read_text(encoding='utf-8'))
arm_file = 'textures/' + paths['arm'].name
shutil.copyfile(paths['arm'], DEST/arm_file)
image_index = len(gltf['images'])
gltf['images'].append({'uri': arm_file})
texture_index = len(gltf['textures'])
gltf['textures'].append({'source': image_index, 'sampler': 0})
for mat in gltf['materials']:
    if mat['name'] == 'Facade_Stone_PBR':
        mat['pbrMetallicRoughness']['metallicFactor'] = 0
        mat['pbrMetallicRoughness']['roughnessFactor'] = 1
        mat['pbrMetallicRoughness']['metallicRoughnessTexture'] = {'index': texture_index}
        mat['occlusionTexture'] = {'index': texture_index, 'strength': .8}
stats['runtimeTriangles'] = sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
stats['runtimePrimitives'] = sum(len(m['primitives']) for m in gltf['meshes'])
(DEST/'model.gltf').write_text(json.dumps(gltf, indent=2), encoding='utf-8', newline='\n')
(DEST/'conversion.json').write_text(json.dumps(stats, indent=2), encoding='utf-8', newline='\n')
print('FACADE_STATS', json.dumps(stats))
