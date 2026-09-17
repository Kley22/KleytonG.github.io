"""Generate static, accessible pages using only Python's standard library."""
from pathlib import Path
from html import escape
import json

ROOT=Path(__file__).resolve().parents[1]
BASE='https://kley22.github.io/KleytonG.github.io/'
REPO='https://github.com/Kley22/KleytonG.github.io'
LINKEDIN='https://www.linkedin.com/in/kleyton-goncalves-silva/'
PROJECTS=json.loads((ROOT/'content/projects.json').read_text())

def write(path,text):
    dest=ROOT/path
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(text,encoding='utf-8')

def head(title,description,path='',prefix='./',demo=False):
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description)}"><meta name="theme-color" content="#17372e">
<link rel="canonical" href="{BASE+path}"><link rel="icon" href="{prefix}assets/images/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Kleyton Gonçalves Silva | Portfólio">
<meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{BASE+path}">
<meta property="og:image" content="{BASE}assets/images/social-preview.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Kleyton Gonçalves Silva — Administração, contratos, contas a pagar e gestão de frota">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title)}"><meta name="twitter:description" content="{escape(description)}"><meta name="twitter:image" content="{BASE}assets/images/social-preview.png">
<link rel="stylesheet" href="{prefix}assets/css/site.css"><script src="{prefix}assets/js/site.js" defer></script>
{f'<script type="module" src="{prefix}assets/js/demo.js"></script>' if demo else ''}
</head><body><a href="#main" class="skip-link">Ir para o conteúdo</a>'''

def header(prefix='./'):
    return f'''<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="{prefix}" aria-label="Kleyton Gonçalves Silva — início"><span class="brand-mark" aria-hidden="true">K.</span><span>Kleyton Gonçalves<small>Portfólio profissional</small></span></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="navigation" hidden>Menu <span aria-hidden="true">☰</span></button>
<nav class="nav" id="navigation" aria-label="Navegação principal"><a href="{prefix}#projetos">Projetos</a><a href="{prefix}#sobre">Sobre</a><a href="{prefix}#experiencia">Experiência</a><a href="{prefix}#formacao">Formação</a><a class="nav-contact" href="{prefix}#contato">Vamos conversar <span aria-hidden="true">↗</span></a></nav>
</div></header>'''

def footer(prefix='./'):
    return f'''<footer class="site-footer"><div class="wrap footer-inner"><p>© 2026 Kleyton Gonçalves Silva</p><span>Administração com organização, clareza e propósito.</span><a href="{prefix}#main">Voltar ao início ↑</a></div></footer></body></html>'''

def mini(p):
    n=p['number']
    if n=='01':
        visual='''<div class="mini-heading"><span>Visão de vigências</span><span>SET / 2026</span></div><div class="mini-row"><span>DEMO-001 · Aurora</span><span class="pill warn">A renovar</span></div><div class="mini-row"><span>DEMO-002 · Horizonte</span><span class="pill">Vigente</span></div><div class="mini-row"><span>DEMO-003 · Norte</span><span class="pill danger">Vencido</span></div>'''
    elif n=='02':
        visual='''<div class="mini-heading"><span>Saldo projetado · serviço</span><span>6 MESES</span></div><div class="mini-number">R$ 4.800</div><div class="mini-footnote">Saldo inicial de R$ 48.000 · previsão de R$ 43.200</div><div class="mini-bars" style="height:38px"><div style="height:100%"></div><div style="height:90%"></div><div style="height:10%"></div></div>'''
    elif n=='03':
        visual='''<div class="mini-heading"><span>Pagamentos · setembro</span><span>3 REGISTROS</span></div><div class="mini-row"><span>Aurora · R$ 7.200</span><span class="pill danger">Em atraso</span></div><div class="mini-row"><span>Horizonte · R$ 4.500</span><span class="pill">Pago</span></div><div class="mini-row"><span>Norte · R$ 3.200</span><span class="pill neutral">A pagar</span></div>'''
    elif n=='04':
        visual='''<div class="mini-heading"><span>Histórico de alterações</span><span>DEMO</span></div><div class="mini-number">R$ 2.592</div><div class="mini-footnote">Exemplo de ajuste de 8% sobre R$ 2.400</div><div class="mini-timeline"><span>Contrato</span><span>Prazo</span><span>Simulação</span></div>'''
    else:
        visual='''<div class="mini-heading"><span>VEÍCULO-DEMO-01</span><span>FROTA</span></div><div class="mini-number">12 <small style="font:12px Arial">km/L</small></div><div class="mini-row"><span>Distância percorrida</span><span>420 km</span></div><div class="mini-row"><span>Próxima manutenção em</span><span class="pill warn">80 km</span></div>'''
    return f'''<div class="project-cover" aria-hidden="true"><div class="cover-label"><span>{p['tag']}</span><span>Demonstração / {n}</span></div><div class="mini-window">{visual}</div></div>'''

def project_card(p):
    return f'''<article class="project-card" data-category="{p['category']}">{mini(p)}<div class="project-body"><div class="project-type"><span>{p['tag']}</span><span>Projeto {p['number']}</span></div><h3>{p['title']}</h3><p>{p['short']}</p><div class="project-bottom"><span>Case + demonstração interativa</span><a href="./projetos/{p['slug']}/" aria-label="Explorar case: {p['name']}">Explorar case</a></div></div></article>'''

def home():
    title='Kleyton Gonçalves Silva | Administração e Gestão de Contratos'
    desc='Portfólio profissional de Kleyton Gonçalves Silva: experiência no CREA-RJ, contratos, contas a pagar, gestão de frota e soluções administrativas.'
    out=head(title,desc)+header()
    out+='''<main id="main"><section class="hero"><div class="wrap"><div class="hero-grid"><div><div class="eyebrow">Administração & processos</div><h1>Kleyton<br><em>Gonçalves Silva.</em></h1><p class="hero-role">Gestão de contratos · Contas a pagar<br>Gestão de frota · Processos administrativos</p><p class="hero-description">Organizo informações, acompanho prazos e transformo rotinas administrativas em controles claros.</p><div class="actions"><a class="button" href="#projetos">Conheça meus projetos <span aria-hidden="true">↗</span></a><a class="button secondary" href="./cv/kleyton-goncalves-silva.pdf" download>Baixar currículo <span aria-hidden="true">↓</span></a></div><div class="hero-meta"><span><i class="small-dot" aria-hidden="true"></i>Niterói, RJ</span><span>Auxiliar de Escritório · CREA-RJ</span></div></div>
<div class="hero-visual"><div class="visual-caption"><span>Organização que ganha forma</span><span>01 / Portfólio</span></div><div class="workbook" role="img" aria-label="Exemplo fictício de controle de vigências: cinco contratos na base, um a renovar e um vencido em 17 de setembro de 2026."><div class="book-top"><div><small>Visão demonstrativa</small><strong>Controle de vigências</strong></div><span class="book-icon" aria-hidden="true">↗</span></div><div class="book-stats"><div><strong>05</strong><span>Na base fictícia</span></div><div><strong>01</strong><span>A renovar</span></div><div><strong>01</strong><span>Vencido</span></div></div><div class="book-table"><div class="book-table-head"><span>Contrato / objeto</span><span>Situação</span></div><div class="book-row"><span>Aurora Serviços<small>DEMO-001 · Manutenção predial</small></span><span class="pill warn">A renovar</span></div><div class="book-row"><span>Horizonte Espaços<small>DEMO-002 · Locação de imóvel</small></span><span class="pill">Vigente</span></div><div class="book-row"><span>Norte Apoio<small>DEMO-003 · Serviços de apoio</small></span><span class="pill danger">Vencido</span></div></div><div class="book-footer"><span>Dados fictícios · 17/09/2026</span><span>3 de 5 registros</span></div></div><div class="visual-note">Do detalhe à visão do todo.</div></div></div>
<div class="intro-strip"><p>Ferramentas<br>no dia a dia</p><ul><li>Google Planilhas</li><li>Excel</li><li>SEI</li><li>PNCP</li><li>Compras.gov.br</li></ul></div></div></section>
<section class="section projects-section" id="projetos"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Soluções administrativas</div><h2>Da rotina,<br>para a prática.</h2></div><p>Projetos de controle e acompanhamento apresentados em cases. Explore o problema, o processo e uma demonstração de cada solução.</p></div><div class="filter-bar" role="group" aria-label="Filtrar projetos"><button hidden class="filter-button" data-filter="all" aria-pressed="true">Todos os projetos</button><button hidden class="filter-button" data-filter="contratos" aria-pressed="false">Contratos</button><button hidden class="filter-button" data-filter="financeiro" aria-pressed="false">Financeiro</button><button hidden class="filter-button" data-filter="operacoes" aria-pressed="false">Frota</button></div><p id="filter-status" class="sr-only" role="status" aria-live="polite"></p><div class="project-grid">'''
    out+=''.join(project_card(p) for p in PROJECTS)
    out+='''</div><p class="project-notice">As demonstrações foram preparadas para este portfólio com dados fictícios. Ilustram os temas dos projetos informados; não reproduzem sistemas, documentos ou dados internos das instituições.</p></div></section>
<section class="section about-section" id="sobre"><div class="wrap about-grid"><div><div class="eyebrow">Sobre mim</div><h2>Clareza para acompanhar.<br>Organização para agir.</h2></div><div><p>Sou profissional da área administrativa, com atuação no CREA-RJ no acompanhamento de contratos de obras, facilities e locação de imóveis, contas a pagar e gestão de frota.</p><p>Minha rotina reúne conferência de documentos, controle de vigências e saldos, protocolos, notas fiscais e provisões de pagamento. A experiência em licitações e processos administrativos complementa essa visão do trabalho, da informação inicial ao acompanhamento de cada etapa.</p><p class="about-foot">Em formação contínua <span>— Administração e Gestão de Serviços Judiciais</span></p></div></div></section>
<section class="section" id="experiencia"><div class="wrap experience-grid"><div class="sticky-copy"><div class="eyebrow">Experiência profissional</div><h2>Uma trajetória<br>em construção.</h2><p>Da organização documental ao acompanhamento de contratos e pagamentos.</p><div class="actions"><a class="text-link" href="./cv/kleyton-goncalves-silva.pdf">Ver currículo completo ↗</a></div></div><div class="timeline">
<article class="experience"><div class="experience-head"><h3>CREA-RJ</h3><time>jun/2026 — atual</time></div><p class="role">Auxiliar de Escritório · Tempo integral</p><ul><li>Acompanhamento de contratos de obras, facilities e locação de imóveis, incluindo vigências, renovações, saldos, aditivos e distratos.</li><li>Controle de notas fiscais, provisões de pagamento, contas a pagar e documentação para liquidação de despesas.</li><li>Emissão e acompanhamento de protocolos e conferência de certidões fiscais, trabalhistas e documentos de regularidade.</li><li>Atualização de indicadores e planilhas de frota: quilometragem, abastecimento, utilização e manutenções preventivas e corretivas.</li></ul><div class="tags"><span class="tag">Contratos</span><span class="tag">Pagamentos</span><span class="tag">Frota</span></div></article>
<article class="experience"><div class="experience-head"><h3>CREA-RJ</h3><time>ago/2025 — jun/2026</time></div><p class="role">Estagiário Administrativo · Licitações e Contratos (CLIC)</p><ul><li>Pesquisa de preços para contratações públicas com PNCP, Compras.gov.br, editais e mídia especializada.</li><li>Levantamento de valores de mercado e apoio à elaboração de estimativas de preços.</li><li>Apoio à análise de Termos de Referência, especificações técnicas e critérios de contratação.</li></ul><div class="tags"><span class="tag">Pesquisa de preços</span><span class="tag">Contratações públicas</span></div></article>
<article class="experience"><div class="experience-head"><h3>INSS</h3><time>2023 — 2025</time></div><p class="role">Estagiário Administrativo · Perícia Médica</p><ul><li>Abertura, tramitação e acompanhamento de processos administrativos no SEI.</li><li>Organização de processos simultâneos, apoio à instrução de processos previdenciários e encaminhamento entre setores.</li><li>Tratamento de documentos sigilosos conforme as normas institucionais.</li></ul><div class="tags"><span class="tag">SEI</span><span class="tag">Gestão documental</span></div></article>
<article class="experience"><div class="experience-head"><h3>ECONIT Engenharia Ambiental</h3><time>jan/2020 — jan/2021</time></div><p class="role">Auxiliar Administrativo</p><ul><li>Controle de folha de ponto, benefícios e documentação de colaboradores.</li><li>Apoio ao recrutamento e seleção: triagem, contato e agendamento.</li></ul></article></div></div></section>
<section class="section skills-section" id="competencias"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Competências & ferramentas</div><h2>O que levo para a rotina.</h2></div><p>Experiência administrativa conectada às ferramentas de organização, consulta e acompanhamento.</p></div><div class="skill-grid"><article class="skill-item"><span class="skill-index">01 / CONTRATOS</span><h3>Prazos e documentação</h3><p>Vigências, renovações, aditivos, distratos, saldos contratuais e organização de documentos.</p></article><article class="skill-item"><span class="skill-index">02 / FINANCEIRO</span><h3>Conferência e acompanhamento</h3><p>Contas a pagar, notas fiscais, provisões, protocolos e documentos para liquidação de despesas.</p></article><article class="skill-item"><span class="skill-index">03 / OPERAÇÃO</span><h3>Processos e controles</h3><p>Indicadores de frota, quilometragem, abastecimento, manutenção, pesquisa de preços e tramitação processual.</p></article></div><div class="tool-list"><span>Ferramentas<br>& plataformas</span><div class="tags">'''
    out+=''.join(f'<span class="tag">{t}</span>' for t in ['Excel','Google Planilhas','Word','Pacote Office','SEI','PNCP','Compras.gov.br','Banco de Preços','Sistemas de gestão financeira'])
    out+='''</div></div></div></section><section class="section education-section" id="formacao"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Formação & desenvolvimento</div><h2>Aprender faz parte<br>do processo.</h2></div><p>Formação técnica, graduação e cursos complementares ligados à atuação profissional.</p></div><div class="education-layout"><div><article class="degree"><span>Em andamento · Previsão jun/2028</span><h3>Bacharelado em Administração</h3><p>Centro Universitário UNIFATECIE</p></article><article class="degree"><span>Em andamento · Previsão mai/2028</span><h3>Tecnólogo em Gestão de Serviços Judiciais</h3><p>Gran Centro Universitário</p></article><article class="degree"><span>Concluído em 2021</span><h3>Técnico em Administração</h3><p>SENAI</p></article></div><div><h3 class="course-title">Cursos complementares</h3>
<details class="course-group" open><summary>Contratos, licitações e administração pública</summary><ul><li>Programa Gestão Estratégica e Contratos — Escola Virtual.Gov · 365 h</li><li>Nova Lei de Licitações e Contratos Administrativos — Udemy · 15 h</li><li>Licitações e Contratos Administrativos — EV.G/ENAP · 40 h</li><li>Direito Administrativo — EV.G/ENAP · 40 h</li><li>Elaboração de Termos de Referência para Contratação de Bens e Serviços na Nova Lei de Licitações — ENAP · 20 h</li></ul></details>
<details class="course-group"><summary>Inteligência artificial e produtividade</summary><ul><li>Engenharia de Prompt — Gran Faculdade · 30 h · 2026</li><li>Agentes Inteligentes: do Simples ao Avançado — Gran Faculdade · 30 h · 2026</li><li>Inteligência Artificial na Prática: Domine as Ferramentas e Saia na Frente — Gran Faculdade · 30 h · 2026</li></ul></details>
<details class="course-group"><summary>Desenvolvimento profissional</summary><ul><li>Liderança — Gran Faculdade · 30 h · 2026</li><li>Posicionamento Profissional e Empregabilidade — Gran Faculdade · 30 h · 2026</li><li>Performance, Emoções e Relações no Trabalho — Gran Faculdade · 30 h · 2026</li><li>Carreira, Futuro e Protagonismo Profissional — Gran Faculdade · 30 h · 2026</li><li>Educação Financeira - Dinheiro em Movimento — Gran Faculdade · 30 h · 2026</li><li>Nivelamento: Inglês Instrumental — Gran Faculdade · 15 h · 2026</li><li>Nivelamento: Matemática — Gran Faculdade · 15 h · 2026</li></ul></details></div></div></div></section>
<section class="contact" id="contato"><div class="wrap contact-grid"><div><div class="eyebrow">Contato profissional</div><h2>Vamos conversar<br>sobre o próximo passo?</h2><p>Interesse em oportunidades como Auxiliar ou Assistente Administrativo, com foco em contratos, contas a pagar, gestão documental e processos administrativos.</p><div class="actions"><a class="button secondary" href="./cv/kleyton-goncalves-silva.pdf" download>Currículo em PDF <span aria-hidden="true">↓</span></a></div></div><div class="contact-links"><a class="contact-link" href="mailto:kleytons67@gmail.com"><span><small>E-MAIL</small>kleytons67@gmail.com</span><span aria-hidden="true">↗</span></a>'''
    out+=f'''<a class="contact-link" href="{LINKEDIN}"><span><small>REDE PROFISSIONAL</small>LinkedIn</span><span aria-hidden="true">↗</span></a><a class="contact-link" href="https://github.com/Kley22"><span><small>PROJETOS & DOCUMENTAÇÃO</small>GitHub / Kley22</span><span aria-hidden="true">↗</span></a></div></div></section></main>'''
    schema={'@context':'https://schema.org','@type':'Person','name':'Kleyton Gonçalves Silva','url':BASE,'jobTitle':'Auxiliar de Escritório','worksFor':{'@type':'Organization','name':'CREA-RJ'},'sameAs':[LINKEDIN,'https://github.com/Kley22']}
    out+='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False)+'</script>'+footer()
    write('index.html',out)

def field(name,label,value='',type='number',extra=''):
    return f'<div class="field"><label for="{name}">{label}</label><input id="{name}" name="{name}" type="{type}" value="{value}" {extra}></div>'

def select(name,label,options):
    return f'<div class="field"><label for="{name}">{label}</label><select id="{name}" name="{name}">'+''.join(f'<option value="{v}">{l}</option>' for v,l in options)+'</select></div>'

def stats(labels,values,currency=False):
    return '<dl class="demo-stats'+(' currency-stats' if currency else '')+'">'+''.join(f'<div class="demo-stat"><dt>{label}</dt><dd id="metric-{key}">{value}</dd></div>' for key,label,value in zip(['one','two','three'],labels,values))+'</dl>'

def table(headers,rows):
    return '<div class="table-wrap" role="region" aria-label="Tabela de registros demonstrativos" tabindex="0"><table class="data-table"><caption>Dados fictícios. Em telas pequenas, deslize a tabela horizontalmente.</caption><thead><tr>'+''.join(f'<th scope="col">{h}</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{c}</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>'

def demo(p):
    slug=p['slug']; m=p['model']; controls=''; result=''; helptext=''
    if slug in ('vigencia-contratual','pagamentos'):
        controls+=field('search','Buscar contrato ou fornecedor','','search','placeholder="Digite para filtrar"')+field('reference','Data de referência',m['reference'],'date','required min="2020-01-01" max="2100-12-31"')
    if slug=='vigencia-contratual':
        controls+=field('threshold','Alerta com antecedência (dias)',60,extra='min="0" max="365" step="1" required')+select('status','Situação',[('all','Todas')]+[(s,s) for s in ['A renovar','Vigente','Vencido','Encerrado','Não iniciado']])
        result+=stats(['Vigentes na consulta','A renovar','Vencidos'],[2,1,1])
        states=['A renovar','Vigente','Vencido','Encerrado','Não iniciado']
        result+=table(['Contrato / fornecedor','Objeto','Término','Até o término','Situação'],[[f'{r["id"]}<small>{r["supplier"]}</small>',r['object'],'/'.join(r['end'].split('-')[::-1]),days,states[i]] for i,(r,days) in enumerate(zip(m['rows'],['28 dias','136 dias','-16 dias','—','378 dias']))])
        helptext='A data de término é inclusiva. “Encerrado” é uma situação informada separadamente; contratos com início futuro aparecem como “Não iniciado”. Altere a data e a antecedência para explorar os alertas.'
    elif slug=='pagamentos':
        controls+=select('period','Competência',[('all','Todas'),('2026-09','09/2026'),('2026-08','08/2026')])+select('status','Situação',[('all','Todas'),('Pago','Pago'),('A pagar','A pagar'),('Em atraso','Em atraso')])
        result+=stats(['Pago na consulta','A pagar na consulta','Em atraso na consulta'],['R$ 7.300,00','R$ 3.200,00','R$ 7.200,00'],True)
        result+=table(['Documento / fornecedor','Competência','Valor','Vencimento','Documentação','Pagamento','Situação'],[[f'{r["id"]}<small>{r["supplier"]}</small>','/'.join(r['period'].split('-')[::-1]),f'R$ {r["value"]:,.2f}'.replace(',','X').replace('.',',').replace('X','.'),'/'.join(r['due'].split('-')[::-1]),r['documents'],'/'.join(r['paid'].split('-')[::-1]) if r['paid'] else '—',['Em atraso','Pago','A pagar','Pago'][i]] for i,r in enumerate(m['rows'])])
        helptext='A data de referência altera apenas a avaliação dos vencimentos. A situação “Pago” usa a baixa registrada e não reconstrói uma posição histórica. Vencimento hoje ainda é “A pagar”. Os totais respeitam os filtros.'
    elif slug=='previsao-contratual':
        controls='<div class="projection-form">'
        for key,label in [('service','Serviço'),('material','Material')]:
            controls+=f'<fieldset class="input-group"><legend>{label}</legend>'+field(key+'Balance','Saldo disponível (R$)',m[key+'Balance'],extra='min="0" max="100000000" step="0.01" required')+field(key+'Monthly','Consumo mensal previsto (R$)',m[key+'Monthly'],extra='min="0" max="100000000" step="0.01" required')+'</fieldset>'
        controls+='</div><div class="projection-months">'+field('months','Meses restantes',6,extra='min="1" max="60" step="1" required')+'</div>'
        result='<div class="projection-results">'
        for key,label,balance,spend,state,risk in [('service','Serviço','R$ 4.800,00','R$ 43.200,00','Saldo suficiente na simulação',''),('material','Material','-R$ 1.800,00','R$ 13.800,00','Insuficiência projetada',' risk')]:
            result+=f'<div class="result-panel{risk}" id="{key}-panel"><h4>{label} · saldo projetado</h4><p class="balance" id="{key}-balance">{balance}</p><p id="{key}-spend">Consumo previsto: {spend} em 6 meses.</p><p id="{key}-state">{state}</p></div>'
        result+='</div>'
        helptext='Saldo projetado = saldo disponível − (consumo mensal previsto × meses restantes). O cálculo usa centavos; apenas resultado negativo indica insuficiência. Serviço e material são avaliados separadamente, sem transferência automática de saldo. Consumo constante, sem reajustes ou sazonalidade.'
    elif slug=='aditivos-repactuacoes':
        controls=field('base','Valor mensal de referência (R$)',m['base'],extra='min="0" max="100000000" step="0.01" required')+field('percent','Ajuste ilustrativo (%)',m['percent'],extra='min="-100" max="100" step="0.01" required')
        result+=stats(['Valor de referência','Efeito do percentual','Valor mensal simulado'],['R$ 2.400,00','R$ 192,00','R$ 2.592,00'],True)
        result+='<div class="demo-history">'+''.join(f'<article class="event"><time>{"/".join(e["date"].split("-")[::-1])}</time><h4>{e["title"]}</h4><p>{e["text"]}</p></article>' for e in m['events'])+'<article class="event"><time>Cenário interativo</time><h4>Simulação de valor</h4><p id="adjustment-description">Aplicação demonstrativa de 8% sobre R$ 2.400,00. Novo valor mensal: R$ 2.592,00.</p></article></div>'
        helptext='Esta simulação mostra somente o efeito matemático de um percentual informado. Não calcula índices oficiais, direitos à repactuação ou requisitos jurídicos. O histórico é ilustrativo e não muda quando você altera a simulação.'
    else:
        controls=field('previous','Hodômetro anterior (km)',m['previous'],extra='min="0" max="9999999" step="1" required')+field('current','Hodômetro atual (km)',m['current'],extra='min="0" max="9999999" step="1" required')+field('litres','Abastecimento (litros)',m['litres'],extra='min="0.01" max="1000" step="0.01" required')+field('maintenance','Próxima manutenção (km)',m['maintenance'],extra='min="0" max="9999999" step="1" required')
        result+=stats(['Distância percorrida','Consumo médio estimado','Até a manutenção'],['420 km','12 km/L','80 km'])+'<p id="maintenance-state" style="padding:0 27px 25px;font-size:13px">Manutenção próxima: conferir o agendamento.</p>'
        helptext='Consumo = distância percorrida ÷ litros. O exemplo pressupõe dois abastecimentos consecutivos até o mesmo nível do tanque. Abastecimentos parciais não permitem essa comparação direta. O aviso aparece a 500 km ou menos da manutenção informada; esse limite é apenas demonstrativo.'
    return f'''<section class="demo-section" id="demonstracao"><div class="demo-heading"><div><div class="eyebrow">Explore na prática</div><h2>Uma visão em funcionamento.</h2></div><span class="demo-label">Projeto demonstrativo — dados fictícios</span></div>
<div class="demo-shell" data-demo="{slug}"><div class="demo-top"><h3>{p['name']}</h3><span>Ambiente de demonstração</span></div><noscript><p class="demo-bottom">Esta é a visualização inicial. Ative o JavaScript para alterar os filtros e as simulações.</p></noscript><form class="demo-controls" aria-label="Controles da demonstração">{controls}<button type="reset" class="button secondary" hidden>Restaurar exemplo</button></form><p id="demo-error" class="demo-errors" role="alert"></p>{result}<div class="demo-bottom" id="demo-status" role="status" aria-live="polite">Demonstração com dados fictícios.</div></div><p class="demo-help">{helptext}</p><p class="demo-help">Você pode alterar os controles livremente. Nada é enviado ou salvo; recarregar a página restaura os exemplos.</p><script id="demo-data" type="application/json">{json.dumps(m,ensure_ascii=False)}</script></section>'''

def case(p,index):
    prefix='../../';slug=p['slug'];path=f'projetos/{slug}/'
    out=head(p['name']+' | Kleyton Gonçalves Silva',p['short'],path,prefix,True)+header(prefix)
    out+=f'''<main id="main"><div class="wrap"><nav class="breadcrumb" aria-label="Caminho da página"><a href="../../#projetos">← Todos os projetos</a></nav><section class="case-hero"><div class="eyebrow">Case {p['number']} / {p['tag']}</div><h1>{p['name']}</h1><p>{p['short']}</p><div class="actions"><a class="button" href="#demonstracao">Explorar demonstração <span aria-hidden="true">↓</span></a><a class="button secondary" href="{REPO}/tree/main/{path}">Ver projeto no GitHub <span aria-hidden="true">↗</span></a></div></section><dl class="case-meta"><div><dt>Contexto profissional</dt><dd>Controles administrativos informados no portfólio</dd></div><div><dt>Ferramentas da rotina</dt><dd>Google Planilhas · Excel</dd></div><div><dt>Versão apresentada</dt><dd>Demonstração web com dados fictícios</dd></div></dl><div class="case-story"><section><div class="eyebrow">01 / O problema</div><h2>O que precisa de atenção.</h2><p>{p['problem']}</p></section><section><div class="eyebrow">02 / A solução proposta</div><h2>Organizar para acompanhar.</h2><p>{p['solution']}</p></section></div><aside class="case-benefit"><h2>Finalidade operacional</h2><p>{p['benefit']}</p></aside>'''
    out+=demo(p)
    out+='<section><div class="eyebrow">Do processo ao controle</div><h2 class="process-title">Como o exemplo foi estruturado.</h2><ol class="process-grid">'+''.join(f'<li>{s}</li>' for s in p['process'])+'</ol></section>'
    out+=f'''<div class="case-story"><section><h2>Recursos demonstrados</h2><ul class="feature-list">{''.join(f'<li>{s}</li>' for s in p['features'])}</ul></section><section><h2>Desafio de organização</h2><p>{p['challenge']}</p></section></div><aside class="case-benefit"><h2>Próximas evoluções</h2><p>{p['future']}</p></aside><section class="case-resources"><h2>Conheça a estrutura do projeto.</h2><p>Documentação, dados fictícios e referência visual da demonstração, organizados para consulta e evolução.</p><div class="actions"><a class="button secondary" href="{REPO}/blob/main/{path}README.md">Ver documentação <span aria-hidden="true">↗</span></a><a class="button secondary" href="./modelo/dados-ficticios.json" download>Baixar dados do exemplo <span aria-hidden="true">↓</span></a><a class="text-link" href="./screenshots/demonstracao.png">Ver captura da demonstração ↗</a></div><p class="project-notice">As planilhas originais e seus screenshots não foram fornecidos nesta etapa. Este case apresenta uma estrutura demonstrativa baseada nos temas informados, sem afirmar resultados medidos ou reproduzir a implementação original.</p></section></div>'''
    nxt=PROJECTS[(index+1)%len(PROJECTS)]
    out+=f'<aside class="next-project"><div class="wrap"><a href="../{nxt["slug"]}/"><span><small>Próximo projeto</small>{nxt["title"]}</span><span aria-hidden="true">↗</span></a></div></aside></main>'+footer(prefix)
    write(path+'index.html',out)
    model={'notice':'Projeto demonstrativo — dados fictícios. Não contém dados institucionais.',**p['model']}
    write(path+'modelo/dados-ficticios.json',json.dumps(model,ensure_ascii=False,indent=2)+'\n')
    write(path+'README.md',f'''# {p['name']}

**Projeto demonstrativo — dados fictícios.**

[Abrir case]({BASE+path}) · [Experimentar demonstração]({BASE+path}#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

{p['problem']}

## Solução demonstrada

{p['solution']}

## Recursos

'''+''.join(f'- {s}\n' for s in p['features'])+f'''
## Processo

'''+''.join(f'{i+1}. {s}\n' for i,s in enumerate(p['process']))+f'''
## Finalidade

{p['benefit']}

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

{p['future']}

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
''')
    # Reuse explanatory text from the rendered demo to keep documentation aligned.
    rules={
      'vigencia-contratual':'Encerrado tem prioridade; início futuro implica Não iniciado; término anterior à referência implica Vencido; término entre a referência e o limite de alerta, inclusive, implica A renovar; os demais são Vigentes. A data final é inclusiva. Datas são calculadas em UTC. Indicadores respeitam os filtros; A renovar está contido no total de vigentes.',
      'previsao-contratual':'Saldo projetado = saldo disponível − mensal previsto × meses. Valores são arredondados em centavos. Risco apenas se o saldo projetado for negativo, por componente. Serviço e material não compensam um ao outro. A projeção assume consumo mensal constante e não inclui reajustes, sazonalidade ou rateio de mês parcial.',
      'pagamentos':'Registro com data de pagamento é Pago. Sem baixa e com vencimento anterior à referência é Em atraso; os demais são A pagar. A data de referência avalia apenas o vencimento, sem reconstruir posição histórica. A pagar e Em atraso são categorias exclusivas. Totais respeitam filtros, valores acumulados em centavos. Situação documental é um campo independente.',
      'aditivos-repactuacoes':'Efeito = base mensal × percentual / 100, arredondado em centavos. Novo valor = base + efeito. Percentuais de -100% a 100% são aceitos apenas como intervalo demonstrativo. O exemplo não determina índice, elegibilidade, limites legais nem direitos à repactuação. O histórico não muda ao alterar a simulação.',
      'gestao-frota':'Distância = hodômetro atual − anterior. Consumo = distância / litros, supondo abastecimentos consecutivos ao mesmo nível. Hodômetro atual deve superar o anterior; litros devem ser positivos. Distância até manutenção = hodômetro de manutenção − atual. Limite ilustrativo de aviso: 500 km. Zero ou negativo indica quilometragem atingida. Manutenção por data ainda não está incluída.'
    }
    write(path+'documentacao/regras.md',f'# Regras e limites\n\n{rules[slug]}\n\nTodos os dados são fictícios. Alterações feitas no navegador não são gravadas. Entradas inválidas mantêm o último resultado válido, com aviso visível.\n')

home()
for i,p in enumerate(PROJECTS): case(p,i)
write('404.html',head('Página não encontrada | Kleyton Gonçalves Silva','Volte ao portfólio profissional de Kleyton Gonçalves Silva.','404.html','/KleytonG.github.io/')+header('/KleytonG.github.io/')+'<main id="main" class="wrap error-page"><div class="eyebrow">Página não encontrada</div><h1>Vamos retomar<br>o caminho?</h1><p>O endereço pode ter mudado. Você encontra os projetos e a trajetória profissional na página inicial.</p><div class="actions"><a class="button" href="/KleytonG.github.io/">Voltar ao portfólio ↗</a></div></main>'+footer('/KleytonG.github.io/'))
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE+path}</loc></url>' for path in ['']+[f'projetos/{p["slug"]}/' for p in PROJECTS])+'</urlset>\n')
write('robots.txt',f'User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n')
print('Generated home, 5 cases, models, project documentation, 404 and sitemap.')
