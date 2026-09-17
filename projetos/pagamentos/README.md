# Controle de Pagamentos Mensais

**Projeto demonstrativo — dados fictícios.**

[Abrir case](https://kley22.github.io/KleytonG.github.io/projetos/pagamentos/) · [Experimentar demonstração](https://kley22.github.io/KleytonG.github.io/projetos/pagamentos/#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

A rotina de pagamentos exige conciliar o valor solicitado, a documentação e o vencimento, mantendo visibilidade do que já foi pago e do que está pendente.

## Solução demonstrada

Organizar os registros por contrato e competência. A demonstração combina filtros de situação, vencimento e fornecedor com totais calculados sobre os registros exibidos.

## Recursos

- Consulta por competência e fornecedor
- Totais por situação de pagamento
- Destaque de pendências documentais
- Atraso somente para valores sem pagamento

## Processo

1. Reunir competência, documento, valor e vencimento.
2. Conferir a situação documental e a data de pagamento.
3. Filtrar pendências e acompanhar sua regularização.

## Finalidade

Facilitar a conferência da rotina e a localização das pendências que precisam de acompanhamento.

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

Incluir um checklist demonstrativo de conferência e um histórico de atualizações por competência.

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
