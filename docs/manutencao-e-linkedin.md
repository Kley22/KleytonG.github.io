# Atualização do portfólio e apresentação no LinkedIn

## Link principal

https://kley22.github.io/KleytonG.github.io/

Use o link do site no currículo e nas candidaturas. O endereço do GitHub é complementar, para quem quiser consultar documentação e código.

## Apresentação no LinkedIn

Adicione o endereço do portfólio à área de links do perfil e à seção Destaques, quando disponível na sua interface.

**Título sugerido do destaque:** Portfólio | Contratos, Pagamentos e Gestão de Frota

**Descrição sugerida:** Minha trajetória na área administrativa e cinco cases sobre vigência contratual, previsão de saldos, pagamentos mensais, alterações contratuais e gestão de frota. Demonstrações interativas com dados fictícios.

**Texto sugerido para uma publicação:**

Reuni minha trajetória e meus projetos administrativos em um portfólio profissional.

O site apresenta minha experiência com contratos, contas a pagar, documentação e frota, além de cinco cases com demonstrações interativas preparadas com dados fictícios. A proposta é mostrar, de forma prática, como a organização das informações apoia o acompanhamento da rotina.

Conheça o portfólio: https://kley22.github.io/KleytonG.github.io/

## Como atualizar

1. Edite o arquivo `content/projects.json` para atualizar os cases ou seus exemplos.
2. Edite `scripts/build.py` para atualizar o currículo online, contatos ou layout compartilhado.
3. Execute `python scripts/build.py` e atualize as capturas das demos afetadas.
4. Execute `python scripts/check_links.py` e `node --test tests/*.test.mjs`.
5. Revise o site localmente em celular e desktop antes do commit.
6. Publique em `main` e acompanhe a execução de Pages no GitHub Actions.

Para incluir um novo projeto, acrescente seus dados, sua lógica demonstrativa, a documentação e a navegação; o gerador não inventa automaticamente regras de negócio.

## Ideias para próximos projetos

- Checklist demonstrativo de documentos para instrução de pagamentos.
- Histórico de consumo contratual por competência, comparando estimado e realizado.
- Controle fictício de manutenções de veículos por data e quilometragem.
- Pesquisa de preços demonstrativa com registro de fontes públicas e critérios de comparação.

Apresente cada evolução como nova demonstração até que sua utilização e seus resultados reais possam ser comprovados e publicados.
