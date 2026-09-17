# Previsão Contratual

**Projeto demonstrativo — dados fictícios.**

[Abrir case](https://kley22.github.io/KleytonG.github.io/projetos/previsao-contratual/) · [Experimentar demonstração](https://kley22.github.io/KleytonG.github.io/projetos/previsao-contratual/#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

Conhecer o saldo atual não basta para avaliar se os recursos cobrem as despesas esperadas até o fim de um período.

## Solução demonstrada

Relacionar saldo disponível, estimativa mensal e meses restantes. O simulador apresenta os componentes de serviço e material e sinaliza insuficiência quando o saldo projetado é negativo.

## Recursos

- Projeção separada de serviço e material
- Estimativa ajustável de consumo mensal
- Saldo projetado ao fim do período
- Alerta de insuficiência por componente

## Processo

1. Separar saldos disponíveis de serviço e material.
2. Definir o consumo mensal estimado e o horizonte.
3. Revisar a projeção quando houver mudança nas premissas.

## Finalidade

Dar visibilidade à diferença entre os recursos disponíveis e o consumo estimado, apoiando o acompanhamento contratual.

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

Conectar uma base demonstrativa de pagamentos por competência e comparar a estimativa com o realizado.

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
