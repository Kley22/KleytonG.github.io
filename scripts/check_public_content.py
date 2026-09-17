"""Guard the public portfolio against accidental operational-file publication.

This is a structural check, not a substitute for reviewing every staged change.
"""
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
projects=json.loads((ROOT/'content/projects.json').read_text())
assert len(projects)==6
assert all('model' not in p and 'rows' not in p for p in projects)
assert all(len(p['steps'])==4 for p in projects)
for p in ROOT.rglob('*'):
    if not p.is_file() or '.git' in p.parts or 'node_modules' in p.parts:
        continue
    assert p.suffix.lower() not in {'.xlsx','.xls','.csv','.tsv','.zip'}, f'Unexpected data file: {p}'
    assert p.name!='dados-ficticios.json', f'Legacy fixture: {p}'
    if p.suffix in {'.html','.json','.js','.md'}:
        content=p.read_text()
        assert not re.search(r'docs\.google\.com/spreadsheets|drive\.google\.com/file|IMPORTRANGE\s*\(',content,re.I), f'Internal source reference: {p}'
        assert 'demo-data' not in content, f'Legacy embedded data: {p}'
        if p.suffix=='.html' and 'projetos' in p.parts:
            assert not re.search(r'<(?:input|table)\b',content), f'Unexpected data interface: {p}'
print('Public content: six conceptual cases, no spreadsheet files, datasets or source connections.')
