"""Download verified public asset; extract only reviewed blend/license, never scripts."""
import pathlib, urllib.request, urllib.parse, hashlib, json, zipfile, stat
ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=json.loads((ROOT/'asset-sources/street-house.json').read_text(encoding='utf-8'))
dest=ROOT/'.preview/street-source'; dest.mkdir(parents=True,exist_ok=True)
archive=dest/'house1.zip'; info=spec['archive']; url=urllib.parse.urlparse(info['url'])
if url.scheme!='https' or url.hostname!='opengameart.org' or url.username: raise ValueError('host rejected')
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): raise ValueError('redirect rejected')
if not archive.exists():
    with urllib.request.build_opener(NoRedirect).open(info['url'],timeout=90) as r: data=r.read(info['bytes']+1)
    if len(data)!=info['bytes'] or hashlib.sha256(data).hexdigest()!=info['sha256']: raise ValueError('source mismatch')
    partial=archive.with_suffix('.partial');partial.write_bytes(data);partial.replace(archive)
data=archive.read_bytes()
if len(data)!=info['bytes'] or hashlib.sha256(data).hexdigest()!=info['sha256']: raise ValueError('archive changed')
with zipfile.ZipFile(archive) as z:
    total=0
    for item in z.infolist():
        p=pathlib.PurePosixPath(item.filename)
        if p.is_absolute() or '..' in p.parts or '\\' in item.filename or ':' in item.filename or stat.S_ISLNK(item.external_attr>>16): raise ValueError('unsafe archive path')
        total+=item.file_size
        if total>40*1024*1024: raise ValueError('expanded archive too large')
    for name in spec['extract']:
        if len([i for i in z.infolist() if i.filename==name])!=1: raise ValueError('missing/duplicate entry')
        (dest/name).write_bytes(z.read(name))
print('Verified source:',archive,info['sha256'])
