"""Build each topic's usage guide and independently usable download package."""
from pathlib import Path
from xml.sax.saxutils import escape
import hashlib,json,zipfile,re
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.colors import HexColor,white
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[2]
FONT=Path('/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype')
for name,file in [('Kit','LiberationSans-Regular.ttf'),('KitBold','LiberationSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
pdfmetrics.registerFontFamily('Kit',normal='Kit',bold='KitBold',italic='Kit',boldItalic='KitBold')
GREEN=HexColor('#17372e');MUTED=HexColor('#52665b');LINE=HexColor('#d4ddd0');CREAM=HexColor('#f1f3e9');GOLD=HexColor('#88602e')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='KTitle',fontName='KitBold',fontSize=24,leading=28,textColor=GREEN,spaceAfter=15))
styles.add(ParagraphStyle(name='KHeading',fontName='KitBold',fontSize=14,leading=18,textColor=GREEN,spaceBefore=15,spaceAfter=9))
styles.add(ParagraphStyle(name='KBody',fontName='Kit',fontSize=10,leading=14.5,textColor=GREEN,spaceAfter=8))
styles.add(ParagraphStyle(name='KSmall',fontName='Kit',fontSize=8.5,leading=12,textColor=MUTED,spaceAfter=7))
styles.add(ParagraphStyle(name='KCell',fontName='Kit',fontSize=8.5,leading=12,textColor=GREEN,spaceAfter=0))
styles.add(ParagraphStyle(name='KHeadCell',fontName='KitBold',fontSize=8.5,leading=12,textColor=white,spaceAfter=0))

def p(text,style='KBody'):
    return Paragraph(escape(str(text)).replace('\n','<br/>'),styles[style])
def heading(text):return p(text,'KHeading')
def items(values):return [p(str(i+1)+'. '+str(value)) for i,value in enumerate(values)]

def footer(c,doc):
    c.setStrokeColor(LINE);c.line(43,42,552,42)
    c.setFont('Kit',8);c.setFillColor(MUTED)
    c.drawString(43,29,'Kleyton Gonçalves Silva | Guia de uso | Versão 1.0')
    c.drawRightString(552,29,str(doc.page))

def generate(topic):
    slug=topic['slug'];out=ROOT/'downloads'/slug;out.mkdir(parents=True,exist_ok=True)
    for name in ['planilha-exemplo.xlsx','planilha-em-branco.xlsx']:
        assert (out/name).is_file(),f'Workbook missing: {slug}/{name}'
    target=out/'guia-de-uso.pdf'
    doc=SimpleDocTemplate(str(target),pagesize=(595.276,841.89),rightMargin=43,leftMargin=43,topMargin=42,bottomMargin=59,title=topic['title']+' - Guia de uso',author='Kleyton Gonçalves Silva')
    story=[p('GUIA DE USO / '+topic['title'].upper(),'KSmall'),p(topic['title'],'KTitle'),p('Preencha os registros, confira os resultados e acompanhe o painel do assunto escolhido.')]
    story.extend([heading('1. Abra o kit'),p('Extraia o ZIP para uma pasta. Em 01-Planilhas, abra planilha-exemplo.xlsx para aprender com os registros preenchidos. Use planilha-em-branco.xlsx para iniciar seus próprios controles. O guia fica em 02-Guia.'),p('Salve uma cópia de trabalho antes de alterar os exemplos. As abas do arquivo já estão conectadas; não é preciso vincular arquivos externos nem habilitar macros.')])
    story.append(heading('2. Siga a rotina'))
    for i,step in enumerate(topic.get('steps',[]),1):
        if isinstance(step,str):story.append(p(str(i)+'. '+step));continue
        if re.fullmatch(r'(Etapa|Passo) \d+',step['title']):
            story.append(p(str(i)+'. '+step['text']));continue
        story.append(KeepTogether([p(str(i)+'. '+step['title'],'KSmall'),p(step['text'])]))
    story.append(PageBreak())
    story.extend([p('ENCONTRE OS CAMPOS','KSmall'),p('Abas e preenchimento','KTitle')])
    rows=[[p('Aba','KHeadCell'),p('Finalidade e campos de entrada','KHeadCell')]]
    for sheet in topic['sheets']:
        inputs=sheet.get('inputs','')
        if isinstance(inputs,list):inputs='; '.join(inputs)
        rows.append([p(sheet['name'],'KCell'),p(sheet['purpose']+'\n'+inputs,'KCell')])
    table=Table(rows,colWidths=[91,418],repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),GREEN),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),11),('RIGHTPADDING',(0,0),(-1,-1),11),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,1),(-1,-1),.5,LINE),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,CREAM])]))
    story.append(table)
    if topic.get('settings'):
        story.append(heading('Configuração inicial'));story+=items(topic['settings'])
    if len(topic['sheets'])>5 or len(topic.get('rules',[]))>9:
        story.extend([PageBreak(),p('LEIA OS INDICADORES','KSmall'),p('Entenda os resultados','KTitle')])
    else:story.append(heading('Como interpretar os resultados'))
    story+=items(topic.get('rules',[]))
    story.append(PageBreak())
    story.extend([p('PRATIQUE E CONFIRA','KSmall'),p('Seu primeiro teste','KTitle')]);story+=items(topic.get('exercise',[]))
    story.append(p('Faça o exercício na planilha de exemplo. Depois, feche sem salvar ou reabra o arquivo original do kit para repetir. As alterações no site e nos arquivos baixados são independentes.'))
    story.append(heading('Dúvidas frequentes'))
    for item in topic.get('troubleshooting',[]):
        if isinstance(item,str):story.append(p(item));continue
        story.append(KeepTogether([p(item['problem'],'KSmall'),p(item['solution'])]))
    story.append(heading('Capacidade e uso'))
    story.append(p(topic.get('capacity','Preencha somente as linhas preparadas e preserve as fórmulas dos resultados.')))
    story.append(p('O formato do kit é XLSX. Use um aplicativo de planilhas com suporte a esse formato. Os arquivos foram conferidos com cálculo e reabertura no LibreOffice. A importação no Google Planilhas pode alterar recursos de apresentação ou validação e não foi testada neste kit.','KSmall'))
    story.append(p('Digite números e datas nos campos indicados. Não substitua as fórmulas. Antes de ordenar um cadastro, selecione a tabela inteira para manter as informações de cada registro juntas.','KSmall'))
    story.append(Paragraph('<link href="https://kleyton-gsilva.netlify.app/projetos/'+slug+'/" color="#17372e">Abrir a demonstração deste projeto</link>',styles['KBody']))
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    readme=f"{topic['title']}\nVersão 1.0\n\nCOMECE AQUI\n1. Extraia esta pasta do ZIP.\n2. Leia 02-Guia/guia-de-uso.pdf.\n3. Abra 01-Planilhas/planilha-exemplo.xlsx para experimentar.\n4. Use 01-Planilhas/planilha-em-branco.xlsx para começar seu controle.\n\nOperacional, auxiliares e painéis estão em abas do mesmo arquivo.\nNenhum outro kit precisa ser aberto. As alterações no site e na planilha são independentes.\n\n{topic.get('capacity','')}\n\nProjeto: https://kleyton-gsilva.netlify.app/projetos/{slug}/\n"
    (out/'LEIA-PRIMEIRO.txt').write_text(readme,encoding='utf-8')
    mapping=[('planilha-exemplo.xlsx','01-Planilhas/planilha-exemplo.xlsx'),('planilha-em-branco.xlsx','01-Planilhas/planilha-em-branco.xlsx'),('guia-de-uso.pdf','02-Guia/guia-de-uso.pdf'),('LEIA-PRIMEIRO.txt','LEIA-PRIMEIRO.txt')]
    zip_path=out/f'kit-{slug}.zip'
    with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for local,member in mapping:archive.write(out/local,f'{slug}/{member}')
    return {'slug':slug,'title':topic['title'],'version':'1.0','file':str(zip_path.relative_to(ROOT)),'bytes':zip_path.stat().st_size,'sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'contents':[f'{slug}/{member}' for _,member in mapping]}

if __name__=='__main__':
    topics=[]
    for source in sorted((ROOT/'content/kits').glob('*.json')):
        payload=json.loads(source.read_text());topics.extend(payload.get('topics',[payload]))
    assert len(topics)==5,f'Expected 5 guides, found {len(topics)}'
    manifest=[generate(t) for t in topics]
    (ROOT/'downloads/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps([{'slug':x['slug'],'zip_bytes':x['bytes']} for x in manifest]))
