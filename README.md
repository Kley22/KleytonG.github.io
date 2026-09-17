# Kleyton Gonçalves Silva · Portfólio profissional

**Controle e acompanhamento administrativo de contratos, pagamentos, imóveis e frota.**

[Acessar o portfólio](https://kley22.github.io/KleytonG.github.io/) · [LinkedIn](https://www.linkedin.com/in/kleyton-gon%C3%A7alves-silva/) · [Currículo público](cv/kleyton-goncalves-silva.pdf)

Kleyton atua como Auxiliar de Escritório no CREA-RJ. O portfólio apresenta sua trajetória e seis cases sobre organização, conferência, atualização de controles e acompanhamento administrativo. O cargo formal é preservado.

## Cases

| Case | O que apresenta |
| --- | --- |
| [Contratos e vigências](projetos/vigencia-contratual/) | Acompanhamento de prazos, instrumentos e alterações de contratos de obras e facilities. |
| [Saldos e previsões contratuais](projetos/previsao-contratual/) | Organização de saldos, consumo e previsões, com serviço e material acompanhados separadamente. |
| [Documentos e pagamentos](projetos/pagamentos/) | Controle de competências, documentos, protocolos e etapas de encaminhamento para pagamento. |
| [Imóveis e obrigações](projetos/controle-imoveis/) | Organização de locações, aluguéis, condomínios, IPTU e taxas, com acompanhamento por competência. |
| [Rotina e controle de frota](projetos/controle-frota/) | Conferência de abastecimentos, sequência de hodômetros e acompanhamento de ocorrências por identificador. |
| [Da base ao painel](projetos/paineis-acompanhamento/) | Uma arquitetura de apoio que conecta cadastros, controles operacionais e consultas de acompanhamento. |

## Escopo público

As planilhas de trabalho foram analisadas para compreender sua estrutura. O site apresenta somente descrições conceituais e etapas navegáveis. **Não contém planilhas, registros, valores operacionais, capturas, fórmulas de origem ou conexões com fontes internas.** A versão atual também não distribui as antigas bases de demonstração fictícias.

Cada case distingue contexto, papel profissional, estrutura observada e melhorias propostas. Não se afirmam ganhos quantitativos medidos nem atribuições de aprovação ou gestão. A revisão dos textos não altera os títulos oficiais de cursos, formação ou sistemas.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `content/projects.json` | Textos conceituais dos seis cases, sem modelos de dados |
| `scripts/build.py` | Gerador estático da home, cases e documentação |
| `assets/css/site.css` | Estilos responsivos |
| `assets/js/site.js` | Menu, filtros e exploradores de etapas |
| `projetos/` | Cases, escopo e documentação pública |
| `cv/` | Currículo público com linguagem de controle e acompanhamento |
| `tests/browser.mjs` | Verificação de responsividade, interação e conteúdo sem JavaScript |
| `docs/` | Fontes, decisões e manutenção |

## Executar e verificar

HTML, CSS e JavaScript nativo, sem dependências de execução, rastreamento, cookies ou backend. O conteúdo principal fica disponível sem JavaScript.

```bash
python scripts/build.py
python scripts/check_links.py
python scripts/check_public_content.py
python -m http.server 8000
```

Para QA de navegador, instale Playwright e Chromium no ambiente de desenvolvimento e execute `PORTFOLIO_URL=http://localhost:8000/ node tests/browser.mjs`. Para incluir a rota 404 com seu prefixo real, sirva o site sob `/KleytonG.github.io/`.

## Publicação e histórico

GitHub Pages usa a branch `main`, pasta raiz e `.nojekyll`. URL: https://kley22.github.io/KleytonG.github.io/

As rotas antigas de frota e aditivos levam a páginas de compatibilidade que indicam os cases atuais. O histórico Git preserva versões anteriores. A remoção de um arquivo da versão publicada não elimina suas versões antigas do histórico. As planilhas institucionais analisadas nesta revisão nunca foram adicionadas ao repositório.

Mantida a [licença MIT](LICENSE).
