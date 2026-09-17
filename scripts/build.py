"""Generate the portfolio and five independent subject pages with download kits."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://kleyton-gsilva.netlify.app/'
REPO = 'https://github.com/Kley22/KleytonG.github.io'
LINKEDIN = 'https://www.linkedin.com/in/kleyton-gon%C3%A7alves-silva/'
TOPICS = json.loads((ROOT / 'content/topics.json').read_text())
CV_VERSION = '20260917-kits'


def write(path, text):
    dest = ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding='utf-8')


def head(title, description, path='', prefix='./', demo=False):
    demo_script = f'<script type="module" src="{prefix}assets/js/topics-demo.mjs"></script>' if demo else ''
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description)}"><meta name="theme-color" content="#17372e">
<link rel="canonical" href="{BASE + path}"><link rel="icon" href="{prefix}assets/images/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Kleyton Gonçalves Silva | Portfólio">
<meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{BASE + path}">
<meta property="og:image" content="{BASE}assets/images/social-preview.png?v=controle-2026"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Kleyton Gonçalves Silva — Controle e acompanhamento administrativo">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title)}"><meta name="twitter:description" content="{escape(description)}"><meta name="twitter:image" content="{BASE}assets/images/social-preview.png?v=controle-2026">
<link rel="stylesheet" href="{prefix}assets/css/site.css"><link rel="stylesheet" href="{prefix}assets/css/experience.css"><link rel="stylesheet" href="{prefix}assets/css/topics.css"><script src="{prefix}assets/js/site.js" defer></script>{demo_script}
</head><body><a href="#main" class="skip-link">Ir para o conteúdo</a>'''


def header(prefix='./'):
    return f'''<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="{prefix}" aria-label="Kleyton Gonçalves Silva — início"><span class="brand-mark" aria-hidden="true">K.</span><span>Kleyton Gonçalves<small>Portfólio profissional</small></span></a>
<button class="menu-toggle" aria-expanded="false" aria-controls="navigation" hidden>Menu <span aria-hidden="true">☰</span></button>
<nav class="nav" id="navigation" aria-label="Navegação principal"><a href="{prefix}#projetos">Projetos</a><a href="{prefix}#sobre">Sobre</a><a href="{prefix}#experiencia">Experiência</a><a class="nav-contact" href="{prefix}#contato">Contato <span aria-hidden="true">↗</span></a></nav>
</div></header>'''


def footer(prefix='./'):
    return f'<footer class="site-footer"><div class="wrap footer-inner"><p>© 2026 Kleyton Gonçalves Silva</p><span>Demonstrações com dados de exemplo.</span><a href="{prefix}#main">Voltar ao início ↑</a></div></footer></body></html>'


def mini(p):
    slug = p['slug']
    if slug == 'obras-facilities':
        visual = '<div class="subject-contract"><div class="contract-sheet"><span>ACOMPANHAMENTO DO CONTRATO</span><strong>Etapas organizadas.</strong><div><i>01</i> Vigências e documentos <b>✓</b></div><div><i>02</i> Pagamentos <b>✓</b></div><div><i>03</i> Serviços e materiais <b>→</b></div></div><div class="contract-seal">Da referência<br><b>ao painel.</b></div></div>'
    elif slug == 'imoveis':
        visual = '<div class="preview-property"><div class="building-silhouette">' + ''.join('<i></i>' for _ in range(12)) + '</div><div class="property-list"><small>OBRIGAÇÕES DO IMÓVEL</small><div><span>Aluguel</span><b class="done">Pago</b></div><div><span>Condomínio</span><b class="pending">Conferir</b></div><div><span>IPTU</span><b>Em prazo</b></div></div></div>'
    elif slug == 'frota':
        visual = '<div class="preview-fleet"><div class="preview-dial"><div><small>CONSUMO MÉDIO</small><strong>12,00<span>km/l</span></strong></div></div><div class="fleet-values"><div><span>Distância</span><b>420 km</b></div><div><span>Abastecimento</span><b>35 litros</b></div><p>Registrar · Conferir · Acompanhar</p></div></div>'
    elif slug == 'estacionamentos':
        visual = '<div class="subject-parking"><div class="parking-sign">P</div><div class="parking-info"><small>CONTRATO DE ESTACIONAMENTO</small><strong>Vagas.<br>Prazos.<br>Mensalidades.</strong><div class="parking-bays"><i></i><i></i><i></i><i></i></div></div></div>'
    else:
        visual = '<div class="subject-prices"><div class="price-paper"><span>O MESMO ITEM. TRÊS COTAÇÕES.</span><div><small>Referência A</small><i style="width:calc(83% - 75px)"></i></div><div><small>Referência B</small><i style="width:calc(68% - 75px)"></i></div><div><small>Referência C</small><i style="width:calc(93% - 75px)"></i></div><p>Quantidade × valor unitário <b>= total</b></p></div><span class="price-tag">Comparar<br><strong>com clareza.</strong></span></div>'
    return f'<div class="project-cover topic-cover topic-cover-{slug}" aria-hidden="true"><div class="cover-label"><span>{p["tag"]}</span><span>{p["number"]} / PROJETO</span></div>{visual}</div>'


def project_card(p):
    return f'''<article class="project-card" data-project="{p['slug']}">{mini(p)}<div class="project-body"><div class="project-type"><span>{p['tag']}</span><span>Projeto {p['number']}</span></div><h3>{p['name']}</h3><p>{p['summary']}</p><div class="project-bottom"><span>Demonstração + planilhas</span><a href="./projetos/{p['slug']}/" aria-label="Conhecer o projeto: {p['name']}">Conhecer o projeto</a></div></div></article>'''


def home():
    title = 'Kleyton Gonçalves Silva | Controle e acompanhamento administrativo'
    description = 'Conheça minha trajetória e projetos de controle administrativo por assunto: obras e facilities, imóveis, frota, contratos de estacionamento e mapa de preços. Demonstrações e planilhas para baixar.'
    out = head(title, description) + header()
    out += '''<main id="main"><section class="hero subject-hero"><div class="wrap"><div class="hero-grid"><div><div class="eyebrow">Portfólio profissional</div><h1>Kleyton<br><em>Gonçalves Silva.</em></h1><p class="hero-role">Controle e acompanhamento administrativo</p><p class="hero-intro">Organizo informações, confiro documentos e acompanho contratos, pagamentos e prazos. Aqui você conhece minha trajetória e explora os controles que desenvolvo para a rotina administrativa.</p><div class="actions"><a class="button" href="#projetos">Conhecer meus projetos <span aria-hidden="true">↗</span></a><a class="button secondary" href="./cv/kleyton-goncalves-silva.pdf?v=20260917-kits">Ver currículo <span aria-hidden="true">↗</span></a></div><div class="hero-meta"><span><i class="small-dot" aria-hidden="true"></i>Niterói, RJ</span><span>Auxiliar de Escritório · CREA-RJ</span></div></div><div class="hero-method-art" aria-hidden="true"><span class="method-art-label">O CUIDADO EM CADA ETAPA</span><div class="method-art-orbit"></div><div class="method-art-paper"><div><small>01</small><span>Organizar</span><i>↗</i></div><div><small>02</small><span>Conferir</span><i>✓</i></div><div><small>03</small><span>Acompanhar</span><i>→</i></div></div><p>Informação clara.<br><em>Próximo passo à vista.</em></p><span class="method-art-signature">K.</span></div></div><div class="intro-strip"><p>Ferramentas<br>no dia a dia</p><ul><li>Google Planilhas</li><li>Excel</li><li>SEI</li><li>PNCP</li><li>Compras.gov.br</li></ul></div></div></section>
<section class="section projects-section" id="projetos"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Projetos por assunto</div><h2>Escolha uma rotina.<br><em>Veja como funciona.</em></h2></div><p>Cada projeto tem uma demonstração, planilhas organizadas e um guia para começar a usar.</p></div><div class="project-grid subject-project-grid">'''
    out += ''.join(project_card(p) for p in TOPICS)
    out += '</div></div></section>'
    out += '''
<section class="section about-section" id="sobre"><div class="wrap about-grid"><div><div class="eyebrow">Sobre mim</div><h2>Clareza para acompanhar.<br>Organização para agir.</h2></div><div><p>Sou profissional da área administrativa, com atuação no CREA-RJ no acompanhamento de contratos de obras, facilities, locação de imóveis e estacionamentos, acompanhamento de pagamentos e controle operacional de frota.</p><p>Minha rotina reúne conferência de documentos, controle de vigências e saldos, protocolos, notas fiscais e provisões de pagamento. A experiência em licitações e processos administrativos complementa essa visão do trabalho, da informação inicial ao acompanhamento de cada etapa.</p><p class="about-foot">Em formação contínua <span>— Administração e Gestão de Serviços Judiciais</span></p></div></div></section>
<section class="section" id="experiencia"><div class="wrap experience-grid"><div class="sticky-copy"><div class="eyebrow">Experiência profissional</div><h2>Uma trajetória<br>em construção.</h2><p>Da organização documental ao acompanhamento de contratos e pagamentos.</p><div class="actions"><a class="text-link" href="./cv/kleyton-goncalves-silva.pdf?v=20260917-kits">Ver currículo completo ↗</a></div></div><div class="timeline">
<article class="experience"><div class="experience-head"><h3>CREA-RJ</h3><time>jun/2026 — atual</time></div><p class="role">Auxiliar de Escritório · Tempo integral</p><ul><li>Acompanhamento de contratos de obras, facilities e locação de imóveis, incluindo vigências, renovações, saldos, aditivos e distratos.</li><li>Controle de notas fiscais, provisões de pagamento, contas a pagar e documentação para liquidação de despesas.</li><li>Organização e acompanhamento de protocolos e conferência de certidões fiscais, trabalhistas e documentos de regularidade.</li><li>Atualização de indicadores e planilhas de frota: quilometragem, abastecimento, utilização e manutenções preventivas e corretivas.</li></ul><div class="tags"><span class="tag">Contratos</span><span class="tag">Pagamentos</span><span class="tag">Frota</span></div></article>
<article class="experience"><div class="experience-head"><h3>CREA-RJ</h3><time>ago/2025 — jun/2026</time></div><p class="role">Estagiário Administrativo · Licitações e Contratos (CLIC)</p><ul><li>Pesquisa de preços para contratações públicas com PNCP, Compras.gov.br, editais e mídia especializada.</li><li>Levantamento de valores de mercado e apoio à elaboração de estimativas de preços.</li><li>Apoio à análise de Termos de Referência, especificações técnicas e critérios de contratação.</li></ul><div class="tags"><span class="tag">Pesquisa de preços</span><span class="tag">Contratações públicas</span></div></article>
<article class="experience"><div class="experience-head"><h3>INSS</h3><time>2023 — 2025</time></div><p class="role">Estagiário Administrativo · Perícia Médica</p><ul><li>Abertura, tramitação e acompanhamento de processos administrativos no SEI.</li><li>Organização de processos simultâneos, apoio à instrução de processos previdenciários e encaminhamento entre setores.</li><li>Tratamento de documentos sigilosos conforme as normas institucionais.</li></ul><div class="tags"><span class="tag">SEI</span><span class="tag">Organização documental</span></div></article>
<article class="experience"><div class="experience-head"><h3>ECONIT Engenharia Ambiental</h3><time>jan/2020 — jan/2021</time></div><p class="role">Auxiliar Administrativo</p><ul><li>Controle de folha de ponto, benefícios e documentação de colaboradores.</li><li>Apoio ao recrutamento e seleção: triagem, contato e agendamento.</li></ul></article></div></div></section>
<section class="section skills-section" id="competencias"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Competências & ferramentas</div><h2>O que levo para a rotina.</h2></div><p>Experiência administrativa conectada às ferramentas de organização, consulta e acompanhamento.</p></div><div class="skill-grid"><article class="skill-item"><span class="skill-index">01 / CONTRATOS</span><h3>Prazos e documentação</h3><p>Vigências, renovações, aditivos, distratos, saldos contratuais e organização de documentos.</p></article><article class="skill-item"><span class="skill-index">02 / FINANCEIRO</span><h3>Conferência e acompanhamento</h3><p>Contas a pagar, notas fiscais, provisões, protocolos e documentos para liquidação de despesas.</p></article><article class="skill-item"><span class="skill-index">03 / OPERAÇÃO</span><h3>Processos e controles</h3><p>Indicadores de frota, quilometragem, abastecimento, manutenção, pesquisa de preços e tramitação processual.</p></article></div><div class="tool-list"><span>Ferramentas<br>& plataformas</span><div class="tags">'''
    out+=''.join(f'<span class="tag">{t}</span>' for t in ['Excel','Google Planilhas','Word','Pacote Office','SEI','PNCP','Compras.gov.br','Banco de Preços','Sistemas de gestão financeira'])
    out+='''</div></div></div></section><section class="section education-section" id="formacao"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">Formação & desenvolvimento</div><h2>Aprender faz parte<br>do processo.</h2></div><p>Formação técnica, graduação e cursos complementares ligados à atuação profissional.</p></div><div class="education-layout"><div><article class="degree"><span>Em andamento · Previsão jun/2028</span><h3>Bacharelado em Administração</h3><p>Centro Universitário UNIFATECIE</p></article><article class="degree"><span>Em andamento · Previsão mai/2028</span><h3>Tecnólogo em Gestão de Serviços Judiciais</h3><p>Gran Centro Universitário</p></article><article class="degree"><span>Concluído em 2021</span><h3>Técnico em Administração</h3><p>SENAI</p></article></div><div><h3 class="course-title">Cursos complementares</h3>
<details class="course-group" open><summary>Contratos, licitações e administração pública</summary><ul><li>Programa Gestão Estratégica e Contratos — Escola Virtual.Gov · 365 h</li><li>Nova Lei de Licitações e Contratos Administrativos — Udemy · 15 h</li><li>Licitações e Contratos Administrativos — EV.G/ENAP · 40 h</li><li>Direito Administrativo — EV.G/ENAP · 40 h</li><li>Elaboração de Termos de Referência para Contratação de Bens e Serviços na Nova Lei de Licitações — ENAP · 20 h</li></ul></details>
<details class="course-group"><summary>Inteligência artificial e produtividade</summary><ul><li>Engenharia de Prompt — Gran Faculdade · 30 h · 2026</li><li>Agentes Inteligentes: do Simples ao Avançado — Gran Faculdade · 30 h · 2026</li><li>Inteligência Artificial na Prática: Domine as Ferramentas e Saia na Frente — Gran Faculdade · 30 h · 2026</li></ul></details>
<details class="course-group"><summary>Desenvolvimento profissional</summary><ul><li>Liderança — Gran Faculdade · 30 h · 2026</li><li>Posicionamento Profissional e Empregabilidade — Gran Faculdade · 30 h · 2026</li><li>Performance, Emoções e Relações no Trabalho — Gran Faculdade · 30 h · 2026</li><li>Carreira, Futuro e Protagonismo Profissional — Gran Faculdade · 30 h · 2026</li><li>Educação Financeira - Dinheiro em Movimento — Gran Faculdade · 30 h · 2026</li><li>Nivelamento: Inglês Instrumental — Gran Faculdade · 15 h · 2026</li><li>Nivelamento: Matemática — Gran Faculdade · 15 h · 2026</li></ul></details></div></div></div></section>
<section class="contact" id="contato"><div class="wrap contact-grid"><div><div class="eyebrow">Contato profissional</div><h2>Vamos conversar<br>sobre o próximo passo?</h2><p>Interesse em oportunidades como Auxiliar ou Assistente Administrativo, com foco em controle de contratos, acompanhamento de pagamentos, organização documental e processos administrativos.</p><div class="actions"><a class="button secondary" href="./cv/kleyton-goncalves-silva.pdf?v=20260917-kits" download>Currículo em PDF <span aria-hidden="true">↓</span></a></div></div><div class="contact-links"><a class="contact-link" href="mailto:kleytons67@gmail.com"><span><small>E-MAIL</small>kleytons67@gmail.com</span><span aria-hidden="true">↗</span></a>'''
    out+=f'''<a class="contact-link" href="{LINKEDIN}"><span><small>REDE PROFISSIONAL</small>LinkedIn</span><span aria-hidden="true">↗</span></a><a class="contact-link" href="https://github.com/Kley22"><span><small>PROJETOS & DOCUMENTAÇÃO</small>GitHub / Kley22</span><span aria-hidden="true">↗</span></a></div></div></section></main>'''
    schema={'@context':'https://schema.org','@type':'Person','name':'Kleyton Gonçalves Silva','url':BASE,'jobTitle':'Auxiliar de Escritório','worksFor':{'@type':'Organization','name':'CREA-RJ'},'sameAs':[LINKEDIN,'https://github.com/Kley22']}
    out+='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False)+'</script>'+footer()
    write('index.html',out)

def case(p):
    path = f'projetos/{p["slug"]}/'
    prefix = '../../'
    download = f'{prefix}downloads/{p["slug"]}/'
    out = head(p['name'] + ' | Kleyton Gonçalves Silva', p['purpose'], path, prefix, demo=True) + header(prefix)
    out += f'''<main id="main"><div class="wrap topic-page"><nav class="breadcrumb" aria-label="Caminho da página"><a href="../../#projetos">← Todos os projetos</a><span>Projeto {p['number']}</span></nav><section class="case-hero topic-hero"><div class="eyebrow">{p['tag']}</div><h1>{p['name']}</h1><p>{p['purpose']}</p><div class="actions"><a class="button" href="#demonstracao">Experimentar <span aria-hidden="true">↓</span></a><a class="button secondary" href="#baixar">Baixar kit <span aria-hidden="true">↓</span></a></div></section><div class="topic-contribution"><span>Minha contribuição</span><p>{p['contribution']}</p></div><section class="demo-section interactive-section" id="demonstracao" aria-labelledby="demo-title"><div class="demo-heading"><div><div class="eyebrow">Experimente na prática</div><h2 id="demo-title">{p['demo_title']}</h2></div></div><div class="demo-app" data-topic="{p['slug']}"><p class="demo-fallback">O exemplo interativo está carregando. Você também pode baixar as planilhas e seguir o guia de uso abaixo.</p><noscript><p>Ative o JavaScript para usar a demonstração no navegador.</p></noscript></div></section>
<section class="topic-download" id="baixar" aria-labelledby="download-title"><div class="download-copy"><div class="eyebrow">Leve o controle para sua rotina</div><h2 id="download-title">Tudo para começar.<br>Em uma pasta.</h2><p>Baixe o kit de {p['name'].lower()} e siga o guia de uso, do primeiro cadastro à leitura do painel.</p><div class="actions"><a class="button" data-download="kit" href="{download}kit-{p['slug']}.zip" download>Baixar kit completo <span aria-hidden="true">↓</span></a><a class="text-link" data-download="guide" href="{download}guia-de-uso.pdf">Ver guia de uso <span aria-hidden="true">↗</span></a></div><small class="download-version">Versão 1.0 · ZIP · Planilhas Excel e guia PDF</small></div><div class="download-contents"><h3>O que vem no kit</h3><ul><li><span>01</span><div><strong>Planilha com exemplos</strong><p>Operacional, Auxiliar e Painéis em abas do mesmo arquivo.</p></div></li><li><span>02</span><div><strong>Planilha para preencher</strong><p>A mesma estrutura, pronta para seus próprios registros.</p></div></li><li><span>03</span><div><strong>Guia de uso em PDF</strong><p>Passo a passo, campos de entrada e leitura dos resultados.</p></div></li><li><span>04</span><div><strong>Leia primeiro</strong><p>Um ponto de partida para localizar os arquivos do kit.</p></div></li></ul></div></section>
<details class="project-notes topic-notes" id="estrutura"><summary>Entenda a estrutura e as etapas do controle</summary><div class="topic-notes-grid"><section><h2>O que este projeto reúne</h2><ul class="feature-list">{''.join(f'<li>{escape(item)}</li>' for item in p['features'])}</ul></section><section><h2>Da entrada ao acompanhamento</h2><ol class="topic-steps">{''.join(f'<li><h3>{escape(step[0])}</h3><p>{escape(step[1])}</p></li>' for step in p['steps'])}</ol></section></div></details><div class="topic-return"><a class="text-link" href="../../#projetos">← Voltar aos projetos</a></div></div></main>''' + footer(prefix)
    write(path + 'index.html', out)
    write(path + 'README.md', f"# {p['name']}\n\n[Abrir projeto]({BASE + path})\n\n{p['purpose']}\n\n## Contribuição profissional\n\n{p['contribution']}\n\n## Demonstração\n\n{p['demo_hint']}\n\nEste assunto usa seus próprios registros de exemplo e seus próprios indicadores.\n\n## Kit para baixar\n\n- [Kit ZIP]({BASE}downloads/{p['slug']}/kit-{p['slug']}.zip)\n- [Guia de uso]({BASE}downloads/{p['slug']}/guia-de-uso.pdf)\n\nVersão 1.0. O kit reúne duas planilhas Excel (exemplo e para preencher), guia em PDF e arquivo de orientação inicial. Os controles operacionais, as referências auxiliares e os painéis ficam em abas de cada planilha.\n\n## Etapas\n\n" + '\n\n'.join(f"### {i}. {step[0]}\n\n{step[1]}" for i, step in enumerate(p['steps'], 1)) + '\n')


LEGACY = {
    'vigencia-contratual': 'obras-facilities',
    'previsao-contratual': 'obras-facilities',
    'pagamentos': 'obras-facilities',
    'paineis-acompanhamento': 'obras-facilities',
    'controle-imoveis': 'imoveis',
    'controle-frota': 'frota',
    'gestao-frota': 'frota',
    'aditivos-repactuacoes': 'obras-facilities',
}


def compatibility(old, new):
    dest = next(p for p in TOPICS if p['slug'] == new)
    target = f'../{new}/#demonstracao'
    out = head('Projeto reorganizado | Kleyton Gonçalves Silva', 'Encontre este controle no projeto correspondente.', f'projetos/{new}/', '../../') + header('../../')
    out += f'<main id="main" class="wrap error-page"><div class="eyebrow">Projetos por assunto</div><h1>{dest["name"]}</h1><p>Este controle agora faz parte do projeto de {dest["name"].lower()}, com demonstração, planilhas para baixar e guia de uso.</p><div class="actions"><a class="button" data-legacy-target="{new}" href="{target}">Conhecer o projeto ↗</a></div></main>' + footer('../../')
    write(f'projetos/{old}/index.html', out)
    write(f'projetos/{old}/README.md', f'# Projeto reorganizado\n\n[Abrir {dest["name"]}]({BASE}projetos/{new}/)\n\nO conteúdo agora está organizado por assunto. Consulte a página atual para acessar a demonstração, o kit de planilhas e o guia.\n')
    old_rules = ROOT / f'projetos/{old}/documentacao/regras.md'
    if old_rules.exists():
        write(f'projetos/{old}/documentacao/regras.md', f'# Documentação reorganizada\n\n[Abrir {dest["name"]}]({BASE}projetos/{new}/)\n\nAs regras, a demonstração e o guia de uso estão no projeto correspondente.\n')


home()
for topic in TOPICS:
    case(topic)
for old, new in LEGACY.items():
    compatibility(old, new)
write('404.html', head('Página não encontrada | Kleyton Gonçalves Silva', 'Volte ao portfólio profissional de Kleyton Gonçalves Silva.', '404.html', '/') + header('/') + '<main id="main" class="wrap error-page"><div class="eyebrow">Página não encontrada</div><h1>Vamos retomar<br>o caminho?</h1><p>O endereço pode ter mudado. Você encontra os projetos e a trajetória profissional na página inicial.</p><div class="actions"><a class="button" href="/">Voltar ao portfólio ↗</a></div></main>' + footer('/'))
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{BASE + path}</loc></url>' for path in [''] + [f'projetos/{p["slug"]}/' for p in TOPICS]) + '</urlset>\n')
write('robots.txt', f'User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n')
print('Generated home, five subject projects, eight compatibility pages, documentation, 404 and sitemap.')
