# Controles de Gestão de Frota

**Projeto demonstrativo — dados fictícios.**

[Abrir case](https://kley22.github.io/KleytonG.github.io/projetos/gestao-frota/) · [Experimentar demonstração](https://kley22.github.io/KleytonG.github.io/projetos/gestao-frota/#demonstracao)

## Contexto e limites

Tema de projeto informado por Kleyton. As planilhas originais não foram anexadas. A demonstração web foi construída especificamente para este portfólio e não reproduz uma implementação institucional. Benefícios são finalidades esperadas, não resultados quantitativos comprovados. Excel e Google Planilhas constam no currículo como ferramentas; o código web não é apresentado como uma competência declarada no currículo.

## Problema

Registros dispersos de quilometragem, abastecimento e manutenção dificultam o acompanhamento da utilização de veículos.

## Solução demonstrada

Organizar os indicadores em uma consulta por veículo. A demonstração calcula a distância percorrida, o consumo médio estimado e a distância até uma manutenção programada.

## Recursos

- Validação de hodômetros crescentes
- Cálculo demonstrativo de km por litro
- Alerta de manutenção por quilometragem
- Premissas de medição visíveis

## Processo

1. Conferir hodômetros e volumes registrados.
2. Calcular indicadores com uma referência de abastecimento consistente.
3. Comparar a quilometragem atual com a próxima manutenção.

## Finalidade

Facilitar a conferência dos registros e a organização do acompanhamento preventivo da frota.

## Arquivos

- `index.html`: case e demonstração integrada, compatíveis com GitHub Pages.
- `modelo/dados-ficticios.json`: premissas e dados fictícios, sem informações internas.
- `screenshots/demonstracao.png`: captura real da demonstração web criada neste projeto.
- `documentacao/regras.md`: regras e limites do exemplo.

## Evolução

Adicionar histórico fictício por veículo e acompanhamento de manutenção por data, além da quilometragem.

Antes de inserir planilhas ou imagens originais, remover nomes de fornecedores, dados pessoais, contratos reais, números de processos, valores e outras informações internas. Não substituir a demonstração por dados reais automaticamente.

## Tecnologias desta demonstração

HTML, CSS e JavaScript nativo. Cálculos compartilhados em `assets/js/logic.mjs`; não há backend, armazenamento ou integrações com sistemas institucionais.
