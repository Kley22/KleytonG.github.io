# Relatório de reformulação do portfólio

**Kleyton Gonçalves Silva · 17/09/2026**

## 1. O que existia anteriormente

Site de currículo baseado em template de 2023, com 50 arquivos regulares, cerca de 3,24 MB e uma referência incompleta de submódulo. O conteúdo destacava TI e programação, com formação, contatos e experiência incompatíveis com o currículo atual. Havia seções de serviços e portfólio vazias, marcação HTML incompleta e referência a `images/Kleyton.jpg`, que não existia.

Bootstrap completo e minificado coexistiam. Fontes e recursos `.html` eram páginas de erro salvas como se fossem arquivos de fontes/imagens. Havia dependências de jQuery, carrossel, animações, mapas, popups e um painel de demonstração do template sem utilidade para o objetivo atual.

A execução de Pages disponível antes da intervenção falhou na etapa de checkout. O repositório continha um gitlink `KleytonG.github.io` sem configuração `.gitmodules`, removido na reformulação. Esse achado é compatível com a falha observada; os logs completos daquela execução não estavam disponíveis pelo conector.

## 2. O que foi alterado

Reconstrução em HTML, CSS e JavaScript nativo; atualização integral do conteúdo profissional pelo currículo anexado; criação de área de projetos com filtros, cinco cases e cinco demonstrações funcionais. O currículo antigo deixou de ser usado. O conteúdo principal é estático e indexável, com navegação normal por links.

## 3. Estrutura final do site

- Página inicial: apresentação, projetos, sobre, experiência, competências, formação/cursos e contato.
- Cinco páginas individuais em `projetos/`, com problema, solução, finalidade, demonstração, recursos, processo, limites e evolução.
- Currículo público em PDF, página 404, favicon, imagem de compartilhamento, sitemap e documentação do repositório.

## 4. Projetos criados

| Case | Recursos da demonstração |
| --- | --- |
| Vigência contratual | Busca, data de referência, antecedência e filtro de situação |
| Previsão contratual | Projeções de serviço/material e alerta apenas para saldo negativo |
| Pagamentos mensais | Competências, baixas, vencimentos, documentos e totais filtrados |
| Aditivos e repactuações | Histórico fictício e efeito matemático de ajuste percentual |
| Gestão de frota | Quilometragem, consumo estimado, validação e aviso de manutenção |

Os projetos temáticos foram informados pelo titular. As interfaces e os cálculos publicados são **demonstrações criadas para o portfólio com dados fictícios**. Não se apresentam como cópias das planilhas originais nem como evidência de resultados quantitativos obtidos no trabalho.

## 5. Arquivos criados

| Grupo | Principais arquivos |
| --- | --- |
| Interface | `assets/css/site.css`, `assets/js/site.js`, `assets/js/demo.js`, `assets/js/logic.mjs` |
| Identidade | `assets/images/favicon.svg`, `assets/images/social-preview.png` |
| Currículo | `cv/kleyton-goncalves-silva.pdf` |
| Projetos | Cinco `index.html`, README, `documentacao/regras.md`, JSON fictício e screenshot por case |
| Geração e testes | `content/projects.json`, `scripts/build.py`, `scripts/check_links.py`, `tests/logic.test.mjs`, `tests/browser.mjs` |
| Publicação | `.nojekyll`, `404.html`, `robots.txt`, `sitemap.xml` |
| Documentação | Este relatório, fontes, guia de manutenção/LinkedIn e inventário |

O [inventário completo](inventario-arquivos.json) lista os caminhos criados, alterados e removidos.

## 6. Arquivos removidos

Removidos da versão atual: pastas antigas `css/`, `js/`, `fonts/`, `images/`, `preview/`, `cv/resume.pdf`, `favicon.ico` e gitlink incompleto `KleytonG.github.io`. A licença MIT foi mantida. `index.html` e README foram substituídos pelo conteúdo atualizado.

Tudo permanece recuperável pela branch `backup/antes-reformulacao-2026-09-17`, no commit `1d8bfac59b502e4008bfb305040ac3004d03e3d3`. O histórico não foi reescrito.

## 7. Melhorias de UX/UI

Paleta sóbria em verde escuro e tons claros, tipografia com hierarquia, espaçamento consistente, navegação fixa, CTAs de projetos e currículo, filtros e cursos agrupados. Exemplos de controles aparecem na página inicial, facilitando a compreensão do tipo de trabalho apresentado.

Os estados das demos usam texto além de cor; formulários têm rótulos; há navegação por teclado, foco visível, atalho para o conteúdo e respeito à preferência de movimento reduzido. Sem porcentagens arbitrárias de habilidade, efeitos pesados ou dependências externas.

## 8. Melhorias de SEO e compartilhamento

Títulos e descrições individuais, URLs canônicas, idioma pt-BR, Open Graph, Twitter Card, imagem 1200 × 630, favicon vetorial, sitemap e dados estruturados `Person`. A imagem de compartilhamento contém nome e áreas profissionais; o resultado efetivo em LinkedIn/WhatsApp também depende do cache de cada plataforma.

O `robots.txt` foi incluído no projeto. Por se tratar de um site sob subdiretório, a política efetiva de robots do domínio continua dependente de `https://kley22.github.io/robots.txt`.

## 9. Mobile e validação

Validação em Chromium nos tamanhos **375, 390, 430, 768, 1366 e 1920 px**, cobrindo página inicial, cinco cases e 404: **42 combinações sem transbordamento horizontal da página**. Tabelas extensas permitem rolagem dentro do próprio quadro.

Foram verificados menu mobile, Escape, filtros, busca sem resultados, restauração, projeção com sobra de R$ 0,03, saldo negativo, atraso, ajuste percentual, hodômetro inválido e conteúdo sem JavaScript. **Nenhum erro de console ou resposta local 4xx/5xx** nos fluxos testados.

Outras verificações:

- 117 links, recursos e âncoras locais válidos em 7 páginas HTML.
- 4 grupos de testes unitários aprovados, incluindo fronteiras de datas e cálculos monetários.
- Auditoria automática axe-core: nenhuma violação nos critérios avaliados de WCAG 2 A/AA e 2.1 AA nas 7 páginas em desktop. Isso não equivale a certificação completa de acessibilidade.
- Revisão visual da página inicial em desktop/mobile, demos e imagem social.
- PDF de duas páginas verificado após remoção de telefone e bairro. Conteúdo profissional preservado.

Não foi realizado teste em aparelhos físicos, Safari ou Firefox. Não há alegação de pontuação Lighthouse ou de conformidade integral de acessibilidade.

## 10. Links configurados

- Site: https://kley22.github.io/KleytonG.github.io/
- LinkedIn: https://www.linkedin.com/in/kleyton-goncalves-silva/
- GitHub: https://github.com/Kley22
- Repositório: https://github.com/Kley22/KleytonG.github.io
- E-mail: kleytons67@gmail.com
- Currículo, demonstrações, arquivos fictícios, screenshots e documentação conectados às respectivas páginas.

LinkedIn e e-mail foram extraídos do currículo atual. Não foi feito envio de mensagens, teste de entrega de e-mail ou edição do perfil LinkedIn.

## 11. O que depende de informações adicionais

Somente o enriquecimento dos cases com capturas e modelos anonimizados das planilhas originais, detalhamento da autoria e resultados mensuráveis comprovados. O site já contém demonstrações completas; nenhum dado real foi inventado para preencher essas lacunas.

O PDF público não mostra telefone ou bairro. O PDF antigo com endereço continua no histórico que já era público; esta entrega não faz exclusão permanente desse histórico.

## 12. Sugestões futuras e LinkedIn

Checklist documental de pagamentos, comparativo previsto × realizado, manutenção de frota por data e histórico de pesquisa de preços são evoluções possíveis. Orientações de apresentação e um texto de publicação estão em [manutenção e LinkedIn](manutencao-e-linkedin.md).

## 13. Publicação

O endereço de produção é **https://kley22.github.io/KleytonG.github.io/**. O repositório está preparado para publicação estática por `main`, pasta raiz. O estado da implantação é registrado no histórico de execuções de GitHub Pages.
