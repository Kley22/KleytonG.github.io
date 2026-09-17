"""Validate public examples and the explicitly downloadable subject kits.

Original workbooks are never a publication target. Only generated .xlsx files
in the five named download directories are accepted, with no macros, external
connections, embedded institutional media, or references to private sources.
"""
from hashlib import sha256
from io import BytesIO
from pathlib import Path, PurePosixPath
import json
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ('obras-facilities', 'imoveis', 'frota', 'estacionamentos', 'mapa-precos')
KIT_FILES = {
    '01-Planilhas/planilha-exemplo.xlsx': 'planilha-exemplo.xlsx',
    '01-Planilhas/planilha-em-branco.xlsx': 'planilha-em-branco.xlsx',
    '02-Guia/guia-de-uso.pdf': 'guia-de-uso.pdf',
    'LEIA-PRIMEIRO.txt': 'LEIA-PRIMEIRO.txt',
}
PRIVATE_LINK = re.compile(r'docs\.google\.com/spreadsheets|drive\.google\.com/(?:file|open)|IMPORTRANGE\s*\(', re.I)
PRIVATE_BRAND = re.compile(r'\b(?:CREA(?:-RJ)?|GEIN)\b', re.I)
ERRORS = {'#REF!', '#DIV/0!', '#VALUE!', '#NAME?', '#N/A', '#NUM!', '#NULL!'}
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def members(archive, label):
    names = archive.namelist()
    assert len(names) == len(set(names)), f'Duplicate archive paths: {label}'
    for name in names:
        path = PurePosixPath(name)
        assert not path.is_absolute() and '..' not in path.parts and '\\' not in name, f'Unsafe archive path: {label}: {name}'
        assert not (archive.getinfo(name).flag_bits & 1), f'Encrypted archive member: {label}: {name}'
    return names


def check_workbook(data, label):
    with zipfile.ZipFile(BytesIO(data)) as archive:
        names = members(archive, label)
        assert 'xl/workbook.xml' in names, f'Invalid workbook: {label}'
        forbidden = ('vbaproject', 'externallinks/', 'connections.xml', 'querytables/', 'xl/media/', 'xl/embeddings/')
        assert not any(any(part in name.lower() for part in forbidden) for name in names), f'Macro, source connection, or embedded image: {label}'
        for name in names:
            if not name.endswith(('.xml', '.rels')):
                continue
            content = archive.read(name).decode('utf-8')
            assert not PRIVATE_LINK.search(content), f'Private source reference: {label}: {name}'
            assert not PRIVATE_BRAND.search(content), f'Institutional text in reusable example: {label}: {name}'
            node = ET.fromstring(content)
            if name.endswith('.rels'):
                assert not any(item.get('TargetMode') == 'External' for item in node), f'External relationship: {label}: {name}'
            if name.startswith('xl/worksheets/'):
                for formula in node.findall('.//s:f', NS):
                    assert not re.search(r'\[[^\]]+\.(?:xls|xlsx|xlsm)\]', formula.text or '', re.I), f'Cross-file formula: {label}'
                for cell in node.findall('.//s:c', NS):
                    value = cell.find('s:v', NS)
                    assert cell.get('t') != 'e' and (value is None or value.text not in ERRORS), f'Cached formula error: {label}: {cell.get("r")}'


topics = json.loads((ROOT / 'content/topics.json').read_text())
assert {topic['slug'] for topic in topics} == set(SLUGS), 'The portfolio must contain exactly the five separate subjects'
dataset = json.loads((ROOT / 'content/topic-data.json').read_text())
assert set(SLUGS) <= set(dataset), 'Every subject has a distinct example dataset'
allowed = set()
for slug in SLUGS:
    directory = ROOT / 'downloads' / slug
    expected = set(KIT_FILES.values()) | {f'kit-{slug}.zip'}
    assert {p.name for p in directory.iterdir() if p.is_file()} == expected, f'Unexpected download files: {slug}'
    for filename in expected:
        allowed.add(directory / filename)
    for filename in ('planilha-exemplo.xlsx', 'planilha-em-branco.xlsx'):
        check_workbook((directory / filename).read_bytes(), f'{slug}/{filename}')
    assert (directory / 'guia-de-uso.pdf').read_bytes().startswith(b'%PDF-'), f'Missing PDF guide: {slug}'
    instructions = (directory / 'LEIA-PRIMEIRO.txt').read_text()
    assert instructions.strip(), f'Empty initial instructions: {slug}'
    assert not PRIVATE_LINK.search(instructions) and not PRIVATE_BRAND.search(instructions), f'Institutional/source text in kit: {slug}'
    with zipfile.ZipFile(directory / f'kit-{slug}.zip') as archive:
        names = members(archive, slug)
        actual_files = {name for name in names if not name.endswith('/')}
        assert actual_files == {f'{slug}/{name}' for name in KIT_FILES}, f'Unexpected kit contents: {slug}'
        for archived, loose in KIT_FILES.items():
            assert archive.read(f'{slug}/{archived}') == (directory / loose).read_bytes(), f'ZIP differs from downloadable file: {slug}/{loose}'

for path in ROOT.rglob('*'):
    if not path.is_file() or '.git' in path.parts or 'node_modules' in path.parts:
        continue
    if path.suffix.lower() in {'.xlsx', '.xls', '.xlsm', '.zip'}:
        assert path in allowed, f'Unexpected source attachment: {path.relative_to(ROOT)}'
    if path.suffix.lower() in {'.html', '.json', '.js', '.mjs', '.md', '.txt'}:
        content = path.read_text()
        assert not PRIVATE_LINK.search(content), f'Internal source reference: {path.relative_to(ROOT)}'
        assert 'sem exposição de dados operacionais' not in content.lower(), f'Obsolete wording: {path.relative_to(ROOT)}'

# Optional local evidence: CI does not need, access, or publish private uploads.
uploads = ROOT.parent / 'upload'
if uploads.exists():
    source_hashes = {sha256(p.read_bytes()).digest() for p in uploads.iterdir() if p.is_file() and p.suffix.lower() in {'.xlsx', '.xls', '.xlsm', '.zip'}}
    assert not any(sha256(path.read_bytes()).digest() in source_hashes for path in allowed), 'An uploaded source file was copied into downloads'

for topic in topics:
    content = (ROOT / 'projetos' / topic['slug'] / 'index.html').read_text()
    assert f'data-topic="{topic["slug"]}"' in content, f'Missing isolated demonstration: {topic["slug"]}'
    assert 'assets/js/topics-demo.mjs' in content, f'Missing subject module: {topic["slug"]}'
    assert f'kit-{topic["slug"]}.zip' in content, f'Missing subject download: {topic["slug"]}'
    assert content.count('Demonstrações com dados de exemplo.') == 1, f'Sample note should appear once: {topic["slug"]}'

print('Public content: five separate demonstrations and five verified kits; no original attachments, macros, institutional kit branding, or external workbook connections.')
