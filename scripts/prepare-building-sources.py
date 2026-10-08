"""Download reviewed CC0 archives, verify pinned SHA256, selectively extract data only.

Usage: python scripts/prepare-building-sources.py [local-output-directory]
Requires py7zr for the Spiral 7z source. No executables or Unity packages are extracted.
"""
import hashlib
import json
import pathlib
import sys
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / '.preview/building-sources').resolve()
if not DEST.is_relative_to(ROOT):
    raise ValueError('Output must stay inside the project')
DEST.mkdir(parents=True, exist_ok=True)
spec = json.loads((ROOT / 'asset-sources/building-sources.json').read_text(encoding='utf-8'))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('Redirect rejected; review changed source URL manually')


def download(asset, filename):
    record = asset['archive']
    if not record['url'].startswith('https://opengameart.org/sites/default/files/'):
        raise ValueError('Unreviewed host/path')
    dest = DEST / filename
    def valid():
        return dest.exists() and dest.stat().st_size == record['bytes'] and hashlib.sha256(dest.read_bytes()).hexdigest() == record['sha256']
    if not valid():
        partial = dest.with_suffix(dest.suffix + '.partial')
        request = urllib.request.Request(record['url'], headers={'User-Agent': '3D-Scenes-local-asset-review/1.0'})
        with urllib.request.build_opener(NoRedirect).open(request, timeout=180) as response, partial.open('wb') as output:
            count = 0
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > record['bytes']:
                    raise ValueError('Archive exceeds expected size')
                output.write(chunk)
        if partial.stat().st_size != record['bytes'] or hashlib.sha256(partial.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError('Archive size/SHA256 mismatch')
        partial.replace(dest)
    return dest


def safe_name(name):
    if pathlib.PurePosixPath(name).name != name or any(c in name for c in ('\\', ':')) or name in ('.', '..'):
        raise ValueError('Archive member path rejected: ' + name)


archive = download(spec['assets'][0], 'daniel-tavern.zip')
with zipfile.ZipFile(archive) as z:
    for entry in z.infolist():
        safe_name(entry.filename)
        if entry.file_size > 20_000_000 or (entry.external_attr >> 16) & 0o170000 == 0o120000:
            raise ValueError('Oversize member or symlink')
    out = DEST / 'tavern-source'
    out.mkdir(exist_ok=True)
    (out / 'ThePaintedWench_02Upload.blend').write_bytes(z.read('ThePaintedWench_02Upload.blend'))

import py7zr
archive = download(spec['assets'][1], 'spiral-house.7z')
with py7zr.SevenZipFile(archive) as z:
    entries = z.list()
    if sum(e.uncompressed or 0 for e in entries) > 200_000_000:
        raise ValueError('Archive expands beyond budget')
    for entry in entries:
        safe_name(entry.filename)
        if entry.is_symlink or (entry.uncompressed or 0) > 100_000_000:
            raise ValueError('Oversize member or symlink')
    out = DEST / 'shack-source'
    out.mkdir(exist_ok=True)
    z.extract(out, targets=['small_shack.FBX', 'shack_main_diff.png', 'shack_details_diff.png'])
print('Verified source data extracted to', DEST)
