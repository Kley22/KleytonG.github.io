# Aditivos e Repactuações

**Projeto demonstrativo — dados fictícios.**

[Abrir case](https://kley22.github.io/KleytonG.github.io/projetos/aditivos-repactuacoes/) · [Experimentar demonstração](https://kley22.github.io/KleytonG.github.io/projetos/aditivos-repactuacoes/#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

Consultar apenas a versão inicial de um contrato pode ocultar alterações posteriores de valor e prazo.

## Solução demonstrada

Manter uma sequência de registros vinculados ao contrato, com data, tipo de alteração e efeito. O exemplo também permite simular um ajuste percentual sobre um valor mensal fictício.

## Recursos

- Linha do tempo de alterações fictícias
- Visualização do valor inicial e do atualizado
- Simulação do efeito de um percentual
- Separação entre alteração de prazo e de valor

## Processo

1. Registrar o instrumento inicial e suas condições.
2. Vincular cada alteração à data e ao documento correspondente.
3. Consultar o histórico antes de atualizar os controles.

## Finalidade

Apoiar a rastreabilidade das alterações e a consulta ao histórico de cada instrumento.

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

Incluir referências a documentos públicos ou modelos anonimizados e uma trilha demonstrativa de revisão.

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
