"""Check public sources and packaging while allowing interactive sample records."""
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
projects=json.loads((ROOT/'content/projects.json').read_text())
assert len(projects)==6
assert all(len(p['steps'])==4 for p in projects)
for p in ROOT.rglob('*'):
    if not p.is_file() or '.git' in p.parts or 'node_modules' in p.parts:
        continue
    assert p.suffix.lower() not in {'.xlsx','.xls','.zip'}, f'Unexpected source attachment: {p}'
    if p.suffix in {'.html','.json','.js','.mjs','.md'}:
        content=p.read_text()
        assert not re.search(r'docs\.google\.com/spreadsheets|drive\.google\.com/file|IMPORTRANGE\s*\(',content,re.I), f'Internal source reference: {p}'
        assert 'sem exposição de dados operacionais' not in content.lower(), f'Obsolete wording: {p}'
for project in projects:
    content=(ROOT/'projetos'/project['slug']/'index.html').read_text()
    assert f'data-demo="{project["slug"]}"' in content
    assert 'type="module" src="../../assets/js/demos.mjs"' in content
    assert content.count('Demonstrações com dados de exemplo.')==1
print('Public content: six interactive projects; source attachments and internal connections absent.')
