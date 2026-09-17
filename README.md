# Kleyton Gonçalves Silva · Portfólio profissional

Portfólio de **Administração, Gestão de Contratos, Contas a Pagar e Gestão de Frota**, com trajetória profissional, currículo e cinco cases interativos.

**[Acessar o portfólio](https://kley22.github.io/KleytonG.github.io/)** · [LinkedIn](https://www.linkedin.com/in/kleyton-goncalves-silva/) · [Currículo público](cv/kleyton-goncalves-silva.pdf)

## Sobre

Kleyton atua como Auxiliar de Escritório no CREA-RJ desde junho de 2026. O conteúdo profissional foi revisado com base no currículo fornecido em setembro de 2026. Formação em andamento: Administração na UNIFATECIE e Gestão de Serviços Judiciais no Gran Centro Universitário. Técnico em Administração pelo SENAI, concluído em 2021.

## Cases

| Projeto | Demonstração |
| --- | --- |
| [Vigência contratual](projetos/vigencia-contratual/) | Datas, filtros, situações e alertas de renovação |
| [Previsão contratual](projetos/previsao-contratual/) | Projeção de saldo de serviço e material |
| [Pagamentos mensais](projetos/pagamentos/) | Competências, vencimentos, documentação e baixas |
| [Aditivos e repactuações](projetos/aditivos-repactuacoes/) | Histórico ilustrativo e simulação percentual |
| [Gestão de frota](projetos/gestao-frota/) | Hodômetro, consumo e manutenção por quilometragem |

**Todos os exemplos usam dados fictícios.** As demonstrações foram construídas para o portfólio a partir dos temas informados. As planilhas originais não foram fornecidas e não são reproduzidas. Não há resultados quantitativos alegados, dados internos ou integração com sistemas institucionais.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `index.html` | Página inicial gerada, pronta para publicação |
| `projetos/<nome>/` | Case, README, documentação, JSON fictício e captura real da demo |
| `assets/css/` | Estilos responsivos compartilhados |
| `assets/js/` | Navegação, filtros e cálculos das demonstrações |
| `assets/images/` | Favicon e imagem de compartilhamento 1200 × 630 |
| `cv/` | Currículo atualizado em versão pública |
| `content/projects.json` | Conteúdo e premissas dos cinco projetos |
| `scripts/build.py` | Gerador estático com biblioteca padrão do Python |
| `scripts/check_links.py` | Verificação de links e âncoras locais |
| `tests/` | Testes de cálculos e roteiro automatizado de navegador |
| `docs/` | Relatório, fontes do conteúdo e orientações de manutenção |

## Tecnologias e execução

HTML semântico, CSS e JavaScript nativo. Sem framework, CDN, fontes externas, cookies, rastreamento ou servidor de aplicação. O conteúdo principal e os exemplos iniciais permanecem disponíveis sem JavaScript.

Python 3 e Node.js são ferramentas de desenvolvimento, não dependências da hospedagem.

```bash
python scripts/build.py
python scripts/check_links.py
node --test tests/*.test.mjs
python -m http.server 8000
```

Abra `http://localhost:8000/`. O arquivo 404 usa a raiz de produção `/KleytonG.github.io/`.

Para repetir os testes visuais/interativos opcionais, instale Playwright no ambiente de desenvolvimento, instale o Chromium e execute `PORTFOLIO_URL=http://localhost:8000/ node tests/browser.mjs`. Para verificar também o 404 em sua configuração real, sirva a pasta com o prefixo `/KleytonG.github.io/`, como em produção. O navegador não faz parte do site publicado.

## GitHub Pages

O projeto é um **site de repositório**: o usuário é `Kley22` e o repositório é `KleytonG.github.io`. Por isso a URL inclui o nome do repositório:

**https://kley22.github.io/KleytonG.github.io/**

Publicação estática pela branch `main`, pasta `/ (root)`. O arquivo `.nojekyll` dispensa a transformação por Jekyll. Não é necessário configurar variáveis ou segredos. O submódulo incompleto que existia no repositório antigo foi removido.

## Atualizar o portfólio

- Edite os cases em `content/projects.json` e execute `python scripts/build.py`.
- Edite o conteúdo da página inicial e os componentes compartilhados em `scripts/build.py`; regenere os HTMLs.
- Atualize CSS e JavaScript em `assets/`.
- Antes de publicar novos arquivos, revise a origem e remova informações internas ou pessoais desnecessárias.
- Preserve a indicação de dados fictícios até haver material original autorizado e anonimizado.
- Ao mudar uma demo, atualize sua captura em `screenshots/demonstracao.png`.
- Ao mudar o currículo, substitua `cv/kleyton-goncalves-silva.pdf` por uma versão pública revisada.

## Preservação do estado anterior

A branch `backup/antes-reformulacao-2026-09-17` preserva o commit `1d8bfac59b502e4008bfb305040ac3004d03e3d3` e todos os arquivos antigos. A reformulação não reescreve o histórico Git.

O histórico e a branch de backup mantêm o currículo antigo, que já estava no repositório público. A remoção do arquivo da versão atual **não o apaga do histórico**. Não foi feita reescrita de histórico.

## Licença

Mantida a [licença MIT](LICENSE) do repositório. Dados profissionais são fornecidos pelo titular; exemplos demonstrativos são fictícios.
