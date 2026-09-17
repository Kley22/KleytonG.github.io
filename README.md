# Kleyton Gonçalves Silva · Portfólio

[Visitar o portfólio](https://kleyton-gsilva.netlify.app/)

Controle e acompanhamento administrativo de contratos, pagamentos, imóveis e frota. O site reúne trajetória profissional, currículo e seis projetos com demonstrações interativas.

## Projetos

| Projeto | O que experimentar |
| --- | --- |
| Contratos e vigências | Consulta por situação, referência de data e alertas de prazo |
| Saldos e previsões | Simulação separada de serviços e materiais |
| Pagamentos | Filtros, conferência documental e acompanhamento de etapas |
| Imóveis e obrigações | Despesas por imóvel, tipo, vencimento e situação |
| Frota | Cálculo de consumo e revisão de ocorrências |
| Painéis | Indicadores e composição de valores por período e origem |

As demonstrações usam registros criados para o portfólio. Pagamentos, previsões e conferências de frota permanecem durante a visita na mesma aba. Os filtros pertencem a cada consulta; use as opções de reinício para restaurar os exemplos. O painel inicial e o painel de acompanhamento refletem os pagamentos e as previsões compartilhadas.

## Estrutura

- `scripts/build.py`: gera as páginas e a documentação dos projetos.
- `content/projects.json`: contexto, contribuição profissional e etapas.
- `assets/js/`: navegação, interações, dados de exemplo e cálculos.
- `assets/css/`: layout, painel inicial, prévias e registros adaptados ao celular.
- `cv/`: currículo público.
- `tests/`: verificações de regras e interações.

O site utiliza HTML, CSS e JavaScript, sem dependências de execução externas. As explicações dos projetos permanecem legíveis sem JavaScript.

## Desenvolvimento

```sh
python scripts/build.py
npm test
python -m http.server 8000
```

Para a verificação de navegador, instale o Playwright, sirva o projeto e execute `tests/browser.mjs` com `PORTFOLIO_URL` apontando para a URL base. `PORTFOLIO_BROWSER` pode informar o caminho do Chromium.

O endereço principal é publicado pelo Netlify a partir de `main`, com a configuração em `netlify.toml`. O GitHub Pages permanece como endereço de compatibilidade.
