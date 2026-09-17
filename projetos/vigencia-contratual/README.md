# Acompanhamento de Vigência Contratual

**Projeto demonstrativo — dados fictícios.**

[Abrir case](https://kley22.github.io/KleytonG.github.io/projetos/vigencia-contratual/) · [Experimentar demonstração](https://kley22.github.io/KleytonG.github.io/projetos/vigencia-contratual/#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

Datas distribuídas entre contratos e documentos dificultam a identificação das próximas renovações e do que precisa de atenção primeiro.

## Solução demonstrada

Reunir início, término e situação em uma base única. A demonstração classifica cada contrato a partir de uma data de referência e permite ajustar a antecedência dos alertas.

## Recursos

- Consulta por contrato ou fornecedor fictício
- Filtro de situação e data de referência
- Alertas configuráveis de renovação
- Contratos encerrados identificados separadamente

## Processo

1. Reunir as datas e a situação de cada instrumento.
2. Calcular o intervalo até o término e identificar exceções.
3. Organizar a consulta por prioridade de acompanhamento.

## Finalidade

Apoiar a organização das prioridades e a preparação de documentos com antecedência.

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

Receber capturas anonimizadas da planilha original e documentar seu fluxo de atualização.

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
