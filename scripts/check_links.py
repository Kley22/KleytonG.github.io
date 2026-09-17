"""Check local href/src paths and fragments without external dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.links=[];self.ids=set();self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        for prop in ['href','src']:
            if attrs.get(prop):self.links.append(attrs[prop])
pages={p:Page(p.read_text()) for p in ROOT.rglob('*.html') if '.git' not in p.parts and 'node_modules' not in p.parts}
count=0
for source,page in pages.items():
    for link in page.links:
        url=urlsplit(link)
        if url.scheme or url.netloc: continue
        path=unquote(url.path)
        if path in ('/KleytonG.github.io', '/KleytonG.github.io/'):
            target=ROOT/'index.html'
        elif path.startswith('/KleytonG.github.io/'):
            target=ROOT/path.removeprefix('/KleytonG.github.io/')
        elif path.startswith('/'):
            target=ROOT/path.lstrip('/')
        else:
            target=source.parent/path if path else source
        target=target.resolve()
        if target.is_dir():target=target/'index.html'
        assert target.is_file(),f'Missing path in {source.relative_to(ROOT)}: {link}'
        if url.fragment and target in pages: assert url.fragment in pages[target].ids,f'Missing fragment: {link}'
        count+=1
print(f'Validated {count} local links/resources across {len(pages)} HTML pages.')
