# Kleyton Gonçalves Silva · Portfólio

[Visitar o portfólio](https://kleyton-gsilva.netlify.app/)

Controle e acompanhamento administrativo. Trajetória profissional, currículo e cinco projetos organizados por assunto, cada um com demonstração, planilhas e guia de uso.

## Projetos

| Assunto | O que reúne |
| --- | --- |
| [Obras e facilities](https://kleyton-gsilva.netlify.app/projetos/obras-facilities/) | Contratos, vigências, documentos, pagamentos e previsão de serviços e materiais |
| [Imóveis](https://kleyton-gsilva.netlify.app/projetos/imoveis/) | Aluguéis, condomínios, IPTU, taxas e vencimentos por imóvel |
| [Frota](https://kleyton-gsilva.netlify.app/projetos/frota/) | Abastecimentos, quilometragem, consumo e ocorrências |
| [Contratos de estacionamento](https://kleyton-gsilva.netlify.app/projetos/estacionamentos/) | Vagas contratadas, vigências, mensalidades e acompanhamento de pagamentos |
| [Pesquisa e mapa de preços](https://kleyton-gsilva.netlify.app/projetos/mapa-precos/) | Itens, referências, propostas e comparação de preços unitários e totais |

Cada assunto usa registros e indicadores próprios. As demonstrações apresentam uma primeira ação simples; opções adicionais ficam em “Mais opções”. Os exemplos são criados para o portfólio.

## Kits de planilhas

Cada pasta em `downloads/<assunto>/` contém o ZIP do projeto e o guia em PDF. O kit reúne:

1. Uma planilha Excel com exemplos.
2. Uma planilha Excel para começar a preencher.
3. Um guia de uso em PDF.
4. Um arquivo de orientação inicial.

As abas de cada planilha organizam o controle operacional, as referências auxiliares e os painéis. Os cinco kits são independentes.

## Estrutura

- `scripts/build.py`: gera a página inicial, os cinco projetos e as páginas de compatibilidade.
- `content/topics.json`: descrição, contribuição, finalidade e etapas de cada assunto.
- `content/topic-data.json`: registros de exemplo, separados por assunto, usados nas demonstrações e na criação das planilhas.
- `content/kits/`: instruções e resultados de conferência dos guias.
- `content/projects.json`: conteúdo histórico dos projetos anteriores; não gera as páginas atuais.
- `assets/js/topics-demo.mjs`: entrada das demonstrações por assunto.
- `assets/js/`: regras, exemplos e navegação.
- `assets/css/topics.css`: apresentação simplificada, prévias e downloads.
- `downloads/`: kits e guias públicos.
- `cv/`: currículo público.
- `tests/`: regras, arquivos e navegação.

O site usa HTML, CSS e JavaScript. As descrições e os downloads permanecem disponíveis sem JavaScript. Endereços anteriores levam a uma página de orientação para o novo projeto correspondente.

## Desenvolvimento

```sh
python scripts/build.py
npm test
python -m http.server 8000
```

Para a verificação no navegador, execute `tests/browser.mjs` com `PORTFOLIO_URL` apontando para a URL base. `PORTFOLIO_BROWSER` pode informar o caminho do Chromium. Verifique também o menu no celular, o teclado e o acesso aos kits.

O endereço principal é o Netlify, configurado em `netlify.toml`, com publicação a partir de `main`. O repositório também mantém compatibilidade com o GitHub Pages.

Os arquivos de `downloads/` são entregáveis prontos, versionados no repositório. O build do site não os recria. Para atualizar os XLSX, os geradores em `scripts/kits/*.mjs` exigem Node com `@oai/artifact-tool`; execute a partir da raiz do repositório. Eles também produzem relatórios de conferência fora da pasta pública. Revise as instruções em `content/kits/` e use `scripts/kits/build-guides.py` com ReportLab para regenerar os PDFs, ZIPs e manifesto. Confira os cálculos em um aplicativo de planilhas antes de publicar um novo kit.
