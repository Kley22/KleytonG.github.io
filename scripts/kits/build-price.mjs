import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

// Run a temporary copy with the Codex primary runtime and its dependency symlink.
const repo = path.resolve(process.argv[2] || process.env.PORTFOLIO_REPO || process.cwd());
const review = path.resolve(process.argv[3] || process.env.KITS_REVIEW || path.join(repo, '..', 'review', 'topic-kits'));
const data = JSON.parse(await fs.readFile(path.join(repo, 'content/topic-data.json'), 'utf8'))['mapa-precos'];
const OUT = path.join(repo, 'downloads/mapa-precos');
await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(review, { recursive: true });
const CAPACITY = 20, FIRST = 7, LAST = FIRST + CAPACITY - 1, CALC = 32;
const C = { ink: '#233F35', green: '#315647', pale: '#EDF2EC', amber: '#FFF3D6', gray: '#66736C', line: '#D8DFD8', warning: '#FBE5DF', red: '#8D2E20' };
const money = '"R$" #,##0.00';
const decimal = '#,##0.00';
const v = (s, r, value) => s.getRange(r).values = [[value]];
const f = (s, r, value) => s.getRange(r).formulas = [[value]];
const value = (s, r) => s.getRange(r).values[0][0];
function base(s, range, widths) {
  s.showGridLines = false;
  s.getRange(range).format = { font: {name:'Arial',size:10,color:C.ink}, verticalAlignment:'center', rowHeight:24 };
  for (const [col, width] of Object.entries(widths)) s.getRange(`${col}1:${col}${range.match(/\d+$/)[0]}`).format.columnWidth = width;
}
function title(s, text, lastCol) {
  v(s,'A2',text); s.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:C.ink};
  s.getRange(`A3:${lastCol}3`).format.borders = {bottom:{style:'thin',color:C.line}};
}
function head(s, address, labels) {
  s.getRange(address).values = [labels];
  s.getRange(address).format = {fill:C.green,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:36,horizontalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#FFFFFF'}}};
}
function input(s, address) {
  s.getRange(address).format.fill = C.amber;
  s.getRange(address).format.borders = {insideHorizontal:{style:'thin',color:'#E7DDC7'}};
}
function note(s, address, text) {
  v(s,address,text); s.getRange(address).format.font = {name:'Arial',size:10,color:C.gray,italic:true};
}
function numericalValidation(s,address) {
  s.getRange(address).dataValidation = {rule:{type:'decimal',operator:'greaterThan',formula1:0}};
}

function create(example) {
  const wb=Workbook.create();
  const panel=wb.worksheets.add('Painéis'), op=wb.worksheets.add('Operacional'), aux=wb.worksheets.add('Auxiliar');
  base(panel,'A1:I36',{A:32,B:20,C:17,D:22,E:3,F:15,G:15,H:15,I:15});
  base(op,'A1:K57',{A:12,B:14,C:36,D:12,E:12,F:15,G:15,H:15,I:15,J:15,K:15});
  base(aux,'A1:F26',{A:15,B:18,C:36,D:17,E:32,F:22});
  panel.tabColor=C.green; aux.tabColor='#A8B9A8';
  title(panel,'Mapa comparativo de preços','I');
  title(op,'Itens, pesquisas e propostas','K');
  title(aux,'Critério e fontes de consulta','F');
  note(op,'A4','Preencha as células amarelas. Preços unitários em reais. Cada linha reúne um item e suas seis cotações.');
  note(aux,'A4','O método selecionado será usado para todos os itens. Preços em branco, zero ou negativos ficam fora da referência.');
  v(aux,'A6','Método'); v(aux,'B6','Média'); input(aux,'B6');
  aux.getRange('B6').dataValidation={rule:{type:'list',values:['Média','Mediana']}};
  v(aux,'A8','Pesquisa P1–P3'); v(aux,'C8','Referências de mercado para a média ou mediana.');
  v(aux,'A9','Proposta F1–F3'); v(aux,'C9','Valores recebidos para a mesma cesta de itens.');
  head(aux,'A12:E12',['Código','Tipo','Nome da fonte','Data da consulta','Referência ou documento']);
  aux.getRange('A13:E18').values=data.sources.map(s=>[s.id,s.type,example?s.name:null,example?new Date(`${s.date}T12:00:00Z`):null,example?s.reference:null]);
  input(aux,'C13:E18'); aux.getRange('D13:D18').setNumberFormat('dd/mm/yyyy'); aux.getRange('D13:D18').format.horizontalAlignment='center';
  aux.getRange('C13:E18').format.wrapText=true; aux.getRange('A13:E18').format.rowHeight=32;
  note(aux,'A21','Nome e data identificam a fonte. Registre em Referência o documento, consulta ou endereço que fundamenta a cotação.');
  note(aux,'A23','A versão de exemplo usa dados de demonstração. A versão em branco mantém as fórmulas e as opções de preenchimento.');
  note(aux,'A25','Escopo: 20 itens por mapa, 3 referências de pesquisa e 3 fornecedores. Valores devem usar a mesma base de custos.');
  head(op,'A6:K6',['Item','Categoria','Descrição','Unidade','Quantidade','Pesquisa P1','Pesquisa P2','Pesquisa P3','Proposta F1','Proposta F2','Proposta F3']);
  input(op,`A${FIRST}:K${LAST}`);
  op.getRange(`A${FIRST}:K${LAST}`).format.rowHeight=34;
  op.getRange(`C${FIRST}:D${LAST}`).format.wrapText=true;
  op.getRange(`E${FIRST}:E${LAST}`).setNumberFormat(decimal);
  op.getRange(`F${FIRST}:K${LAST}`).setNumberFormat(money);
  op.getRange(`E${FIRST}:K${LAST}`).format.horizontalAlignment='right';
  op.getRange(`B${FIRST}:B${LAST}`).dataValidation={rule:{type:'list',values:['Material','Serviço']}};
  numericalValidation(op,`E${FIRST}:K${LAST}`);
  if(example) op.getRange(`A${FIRST}:K${FIRST+data.items.length-1}`).values=data.items.map(x=>[x.id,x.kind,x.description,x.unit,x.quantity,...x.research,...x.suppliers]);
  head(op,'A31:K31',['Item','Pesquisas válidas','Média unitária','Mediana unitária','Referência unitária','Referência total','Total F1','Total F2','Total F3','Cadastro','Conferência']);
  op.getRange(`A${CALC}:K${CALC+CAPACITY-1}`).format.rowHeight=30;
  op.getRange(`C${CALC}:I${CALC+CAPACITY-1}`).setNumberFormat(money);
  op.getRange(`C${CALC}:I${CALC+CAPACITY-1}`).format.horizontalAlignment='right';
  op.getRange(`J${CALC}:K${CALC+CAPACITY-1}`).format.wrapText=true;
  for(let i=0;i<CAPACITY;i++) {
    const r=FIRST+i, c=CALC+i, valid=`COUNTIFS(F${r}:H${r},">0")`;
    const active=`COUNTA(A${r}:K${r})=0`;
    const id=`IF(A${r}="","Sem ID",A${r})`;
    const med=`IF(B${c}=3,MEDIAN(F${r}:H${r}),C${c})`;
    op.getRange(`A${c}:K${c}`).formulas=[[
      `=IF(${active},"",${id})`,
      `=IF(${active},"",${valid})`,
      `=IF(OR(${active},B${c}=0),"",ROUND(SUM(${['F','G','H'].map(col=>`IF(AND(ISNUMBER(${col}${r}),${col}${r}>0),${col}${r},0)`).join(',')})/B${c},2))`,
      `=IF(OR(${active},B${c}=0),"",ROUND(${med},2))`,
      `=IF(OR(${active},B${c}=0,J${c}<>"Completo"),"",IF('Auxiliar'!$B$6="Média",C${c},IF('Auxiliar'!$B$6="Mediana",D${c},"")))`,
      `=IF(E${c}="","",ROUND(E${r}*E${c},2))`,
      ...['I','J','K'].map(col=>`=IF(OR(${active},J${c}<>"Completo",NOT(ISNUMBER(${col}${r})),${col}${r}<=0),"",ROUND(E${r}*${col}${r},2))`),
      `=IF(${active},"",IF(A${r}="","Falta ID",IF(COUNTIFS($A$${FIRST}:$A$${LAST},A${r})>1,"ID duplicado",IF(OR(B${r}="",C${r}="",D${r}=""),"Falta cadastro",IF(AND(B${r}<>"Material",B${r}<>"Serviço"),"Categoria inválida",IF(OR(NOT(ISNUMBER(E${r})),E${r}<=0),"Quantidade inválida","Completo"))))))`,
      `=IF(${active},"",IF(OR(${['F','G','H','I','J','K'].map(col=>`AND(NOT(ISBLANK(${col}${r})),OR(NOT(ISNUMBER(${col}${r})),${col}${r}<=0))`).join(',')}),"Preço inválido",IF(B${c}=0,"Sem preço",IF(B${c}<3,"Parcial","3 pesquisas"))))`
    ]];
  }
  op.getRange(`J${CALC}:J${CALC+CAPACITY-1}`).conditionalFormats.add('expression',{formula:`AND(J${CALC}<>"",J${CALC}<>"Completo")`,format:{fill:C.warning,font:{color:C.red,bold:true}}});
  op.getRange(`K${CALC}:K${CALC+CAPACITY-1}`).conditionalFormats.add('containsText',{text:'Sem preço',format:{fill:C.warning,font:{color:C.red,bold:true}}});
  op.getRange(`K${CALC}:K${CALC+CAPACITY-1}`).conditionalFormats.add('containsText',{text:'Preço inválido',format:{fill:C.warning,font:{color:C.red,bold:true}}});
  op.getRange(`F${FIRST}:K${LAST}`).conditionalFormats.add('expression',{formula:`AND(NOT(ISBLANK(F${FIRST})),OR(NOT(ISNUMBER(F${FIRST})),F${FIRST}<=0))`,format:{fill:C.warning,font:{color:C.red,bold:true}}});
  note(op,'A54','Referência total = quantidade × referência unitária arredondada para 2 casas. Média e mediana usam somente as pesquisas P1–P3.');
  note(op,'A56','Os cálculos seguem as 20 linhas de entrada. Para ordenar, selecione todas as colunas A:K da área de entradas.');
  op.freezePanes.freezeRows(6); op.freezePanes.freezeColumns(3);

  panel.getRange('A5:A9').values=[['Método de referência'],['Itens cadastrados'],['Itens com referência'],['Referência da cesta'],['Situação da referência']];
  panel.getRange('A5:A9').format.font={name:'Arial',size:10,bold:true,color:C.ink};
  f(panel,'B5',"='Auxiliar'!B6");
  f(panel,'B6',`=COUNT('Operacional'!B${CALC}:B${CALC+CAPACITY-1})`);
  f(panel,'B7',`=COUNT('Operacional'!F${CALC}:F${CALC+CAPACITY-1})`);
  f(panel,'B8',`=IF(OR(B6=0,B7<>B6),"",SUM('Operacional'!F${CALC}:F${CALC+CAPACITY-1}))`);
  f(panel,'B9',`=IF(B6=0,"Sem itens",IF(B7=B6,"Completa","Incompleta"))`);
  panel.getRange('B8').setNumberFormat(money);
  panel.getRange('A8:B8').format.fill=C.pale; panel.getRange('B8').format.font={name:'Arial',size:14,bold:true,color:C.ink};
  head(panel,'A13:D13',['Referência / fornecedor','Total da cesta','Variação','Cobertura']);
  v(panel,'A14','Referência de pesquisa'); f(panel,'B14','=IF(B8="","",B8)'); f(panel,'C14','=IF(B8="","",B14/B8-1)'); f(panel,'D14','=B9');
  for(let n=0;n<3;n++) {
    const r=15+n, col=['G','H','I'][n], sr=16+n;
    f(panel,`A${r}`,`=IF('Auxiliar'!C${sr}="","Fornecedor ${n+1}",'Auxiliar'!C${sr})`);
    f(panel,`D${r}`,`=IF($B$6=0,"Sem itens",IF(COUNT('Operacional'!${col}${CALC}:${col}${CALC+CAPACITY-1})=$B$6,"Completa","Incompleta"))`);
    f(panel,`B${r}`,`=IF(D${r}<>"Completa","",SUM('Operacional'!${col}${CALC}:${col}${CALC+CAPACITY-1}))`);
    f(panel,`C${r}`,`=IF(OR(B${r}="",$B$8=""),"",B${r}/$B$8-1)`);
  }
  panel.getRange('B14:B17').setNumberFormat(money); panel.getRange('C14:C17').setNumberFormat('0.0%'); panel.getRange('D14:D17').format.horizontalAlignment='center';
  panel.getRange('A14:D17').format.rowHeight=32; panel.getRange('A14:A17').format.wrapText=true;
  panel.getRange('D14:D17').conditionalFormats.add('containsText',{text:'Incompleta',format:{fill:C.warning,font:{color:C.red,bold:true}}});
  head(panel,'A21:D21',['Categoria','Itens','Referência total','Sem referência']);
  for(let i=0;i<2;i++) {
    const r=22+i; v(panel,`A${r}`,['Material','Serviço'][i]);
    f(panel,`B${r}`,`=COUNTIFS('Operacional'!B${FIRST}:B${LAST},A${r})`);
    f(panel,`D${r}`,`=B${r}-COUNTIFS('Operacional'!B${FIRST}:B${LAST},A${r},'Operacional'!F${CALC}:F${CALC+CAPACITY-1},">0")`);
    f(panel,`C${r}`,`=IF(OR(B${r}=0,D${r}>0),"",SUMIFS('Operacional'!F${CALC}:F${CALC+CAPACITY-1},'Operacional'!B${FIRST}:B${LAST},A${r}))`);
  }
  panel.getRange('C22:C23').setNumberFormat(money);
  note(panel,'A27','Propostas incompletas não recebem total da cesta. Compare as mesmas quantidades, unidades e condições comerciais.');
  note(panel,'A29','A variação compara a proposta completa com a referência. O menor preço observado não define a contratação.');
  note(panel,'A31','Comece em Auxiliar, preencha Operacional e volte a Painéis. O guia do kit explica o preenchimento e os cálculos.');
  const chart=panel.charts.add('bar',[panel.getRange('A13:A17'),panel.getRange('C13:C17')]);
  chart.title='Variação sobre a referência (%)'; chart.titleTextStyle.typeface='Arial'; chart.titleTextStyle.fontSize=12; chart.hasLegend=false;
  chart.series.items[0].fill=C.green;
  chart.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:10}};
  chart.yAxis={numberFormatCode:'0.0%',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};
  chart.setPosition('F5','J21');
  wb.recalculate();
  return {wb,panel,op,aux,chart};
}

function near(actual, expected, label) {assert.ok(Math.abs(actual-expected)<0.005,`${label}: ${actual} versus ${expected}`);}
const validation={capacity:CAPACITY,engine:'Artifact Tool; abertura no Excel e Google Planilhas não verificada',tests:[]};
for(const example of [true,false]) {
  const s=create(example), variant=example?'exemplo':'em-branco';
  if(example) {
    const mean=x=>Math.round((x.reduce((a,b)=>a+b,0)/x.length)*100)/100;
    const totals=data.items.map(x=>Math.round(mean(x.research)*x.quantity*100)/100);
    near(value(s.panel,'B8'),totals.reduce((a,b)=>a+b,0),'Reference initial');
    for(let n=0;n<3;n++) near(value(s.panel,`B${15+n}`),data.items.reduce((a,x)=>a+Math.round(x.quantity*x.suppliers[n]*100)/100,0),`Supplier ${n+1}`);
    // A missing quote must invalidate the full basket, while restoring it restores the total.
    v(s.op,'I7',null); s.wb.recalculate(); assert.equal(value(s.panel,'D15'),'Incompleta'); assert.equal(value(s.panel,'B15'),'');
    v(s.op,'I7',82); v(s.op,'E7',5); v(s.op,'F7',100); s.wb.recalculate();
    near(value(s.op,'F32'),458.35,'changed quantity and reference');
    near(value(s.panel,'B15'),1482,'changed quantity supplier basket');
    v(s.op,'E7',4); v(s.op,'F7',80); v(s.aux,'B6','Mediana'); s.wb.recalculate();
    near(value(s.panel,'B8'),1466,'median basket');
    v(s.op,'G7',null); v(s.op,'H7',0); s.wb.recalculate(); near(value(s.op,'D32'),80,'median ignores blank and zero'); assert.equal(value(s.op,'K32'),'Preço inválido');
    v(s.op,'F7',-5); s.wb.recalculate(); assert.equal(value(s.op,'K32'),'Preço inválido'); assert.equal(value(s.panel,'B8'),'');
    v(s.op,'F7',80); v(s.op,'G7',85); v(s.op,'H7',90); v(s.aux,'B6','Média');
    v(s.op,'A8','MP-01'); s.wb.recalculate(); assert.equal(value(s.op,'J32'),'ID duplicado'); assert.equal(value(s.panel,'B8'),'');
    v(s.op,'A8','MP-02');
    // Last supported row must participate in the summary and formulas.
    s.op.getRange('A26:K26').values=[['MP-20','Material','Item adicional','Unidade',2,10,20,30,11,12,13]];
    s.wb.recalculate(); near(value(s.op,'F51'),40,'capacity last row'); assert.equal(value(s.panel,'B6'),5);
    s.op.getRange('A26:K26').clear({applyTo:'contents'});
    validation.tests.push('Totais iniciais e centavos','Preço e quantidade alterados','Média/Mediana','Pesquisa vazia, zero e negativa','Proposta parcial não classificada','ID duplicado','20ª linha recalculada');
  } else {assert.equal(value(s.panel,'B6'),0); assert.equal(value(s.panel,'B8'),''); assert.equal(value(s.panel,'B15'),''); validation.tests.push('Versão em branco sem dados e sem total aparente');}
  s.wb.recalculate();
  const scan=await s.wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Final formula error scan'});
  await fs.writeFile(path.join(review,`price-${variant}-errors.ndjson`),scan.ndjson);
  const table=await s.wb.inspect({kind:'table',range:'Painéis!A5:D23',include:'values,formulas',tableMaxRows:23,tableMaxCols:4,maxChars:12000});
  await fs.writeFile(path.join(review,`price-${variant}-values.ndjson`),table.ndjson);
  for(const [sheetName,range] of [['Painéis','A1:J33'],['Auxiliar','A1:H26'],['Operacional','A1:K12'],['Operacional','A29:K38']]) {
    const preview=await s.wb.render({sheetName,range,scale:1.5,format:'png'});
    await fs.writeFile(path.join(review,`price-${variant}-${sheetName.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}-${range.replace(':','-')}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
  const output=await SpreadsheetFile.exportXlsx(s.wb); const exportPath=path.join(OUT,`planilha-${variant}.xlsx`); await output.save(exportPath);
  await fs.rename(`${exportPath}.inspect.ndjson`,path.join(review,`price-${variant}-export.ndjson`)).catch(e=>{if(e.code!=='ENOENT')throw e;});
  validation[variant]={reference:value(s.panel,'B8'),suppliers:s.panel.getRange('B15:B17').values,formulaScan:scan.ndjson,chartBindings:s.chart.series.items.map(x=>({values:x.formula,categories:x.categoryFormula}))};
  console.log(`Exported mapa-precos/planilha-${variant}.xlsx`);
}
const guide={
  slug:'mapa-precos',
  title:'Pesquisa e mapa comparativo de preços',
  capacity:'20 itens por arquivo. Cada item aceita três pesquisas de mercado e três propostas de fornecedores.',
  purpose:'Organizar pesquisas e comparar propostas da mesma cesta, separando material e serviço.',
  files:['planilha-exemplo.xlsx: quatro itens preenchidos para conhecer o funcionamento.','planilha-em-branco.xlsx: a mesma estrutura sem os registros de exemplo.'],
  sheets:[
    {name:'Painéis',purpose:'Exibe referência da cesta, cobertura das propostas, totais por fornecedor, variação e separação de material e serviço.',inputs:'Nenhum. Os resultados e o gráfico são calculados.'},
    {name:'Auxiliar',purpose:'Mantém o método de referência e identifica as fontes.',inputs:'B6: Média ou Mediana. C13:E18: nomes, datas e documentos das três pesquisas (P1–P3) e das três propostas (F1–F3).'},
    {name:'Operacional',purpose:'Recebe os itens e preços e mostra os cálculos por item.',inputs:'A7:K26: ID, categoria, descrição, unidade, quantidade, P1, P2, P3, F1, F2 e F3. A32:K51 contém fórmulas e deve ser preservado.'}
  ],
  steps:[
    'Extraia o ZIP e abra primeiro planilha-exemplo.xlsx para explorar. Use planilha-em-branco.xlsx para seu próprio controle e salve com outro nome.',
    'Em Auxiliar, escolha Média ou Mediana na célula B6. Preencha o nome, a data e o documento de cada fonte em C13:E18.',
    'Em Operacional, preencha uma linha por item em A7:K26. Use um ID único, escolha Material ou Serviço e informe a unidade e a quantidade positiva.',
    'Registre preços unitários positivos em Pesquisa P1, P2 e P3. Deixe sem preenchimento o preço que ainda não possui. Não use zero como cotação.',
    'Preencha as propostas F1, F2 e F3 para os mesmos itens e condições. Verifique se tributos, frete e demais custos usam a mesma base.',
    'Confira Cadastro e Conferência na seção de cálculos (linhas 32 a 51). Corrija IDs duplicados, campos faltantes, quantidades e preços inválidos.',
    'Abra Painéis. Uma proposta só recebe total da cesta quando possui preço para todos os itens cadastrados com cadastro válido.',
    'Salve o arquivo. Para outro mapa, faça uma nova cópia da versão em branco. O limite desta edição é de 20 itens.'
  ],
  rules:[
    'Média e mediana consideram apenas valores numéricos positivos nas três pesquisas P1–P3. Fornecedores F1–F3 não entram no cálculo da referência.',
    'Média: soma dos preços válidos dividida pela quantidade de preços válidos. Mediana: valor central de três preços; média dos dois quando restam dois; o único preço quando resta um.',
    'A referência unitária é arredondada para duas casas decimais. A referência total de cada item é quantidade × referência unitária, também arredondada para duas casas.',
    'O total de cada proposta por item é quantidade × preço unitário da proposta. O total da cesta soma os totais arredondados de todos os itens.',
    'A variação é (total da proposta ÷ total de referência) − 1. Variação negativa indica valor abaixo da referência.',
    'Uma pesquisa parcial pode formar referência com os preços válidos disponíveis e fica indicada como Parcial. Sem nenhum preço válido, não há referência do item nem total completo da cesta.',
    'Propostas incompletas ficam sem total e sem variação. O gráfico mostra a variação das propostas completas em relação à referência. A referência é a base de 0%. O menor valor observado não define automaticamente a contratação.',
    'Preço numérico zero, negativo ou texto recebe o aviso Preço inválido na coluna Conferência. A célula é destacada. Preços inválidos não entram na referência e não completam uma proposta.',
    'Nome e data das fontes documentam a pesquisa; não substituem a conferência de escopo, unidade, quantidade e condições comerciais.',
    'A coluna Quantidade aceita valores decimais positivos. As datas devem ser datas de planilha, apresentadas no formato dia/mês/ano.',
    'Cada linha de entradas mantém o item junto das seis cotações. Ao ordenar, selecione toda a faixa A7:K26, preservando a correspondência entre os dados.'
  ],
  exercise:{instruction:'No arquivo de exemplo, altere a quantidade do Filtro de ar de 4 para 5 e a Pesquisa P1 de 80 para 100. Mantenha o método Média.',expected:'A referência unitária do item passa a R$ 91,67 e a referência total a R$ 458,35. O total da proposta do Fornecedor A passa a R$ 1.482,00. Restaure quantidade 4 e Pesquisa P1 80 para retornar ao exemplo.',missing:'Apague a Proposta F1 do Filtro de ar. O Fornecedor A deverá aparecer como Incompleta, sem total da cesta. Preencha novamente 82 para restabelecer a comparação.'},
  troubleshooting:[
    {problem:'O total da referência não aparece.',solution:'Confira a situação do cadastro e as pesquisas. Todos os itens precisam de quantidade, unidade, categoria, descrição, ID único e ao menos uma pesquisa positiva.'},
    {problem:'Um fornecedor aparece como Incompleta.',solution:'Existe um item sem proposta positiva ou com cadastro incompleto. Preencha a proposta de todos os itens ou corrija o cadastro.'},
    {problem:'Uma fonte não muda o resultado.',solution:'Os nomes e as datas ficam em Auxiliar. Os preços que movem os cálculos ficam em Operacional. O método de referência afeta as pesquisas, não os preços ofertados.'},
    {problem:'Preciso de mais de 20 itens ou mais fornecedores.',solution:'Este modelo tem capacidade delimitada. Não escreva fora das faixas esperando inclusão automática. Amplie fórmulas e resumos em uma cópia com conferência técnica ou use outro arquivo.'},
    {problem:'O programa mostra números diferentes ou fórmulas sem atualizar.',solution:'Ative o cálculo automático ou solicite recálculo no aplicativo. Os arquivos foram recalculados no ambiente de geração; a abertura e a importação em cada versão do Excel ou Google Planilhas precisam ser conferidas.'}
  ],
  limitations:'Arquivo XLSX sem macros e sem vínculos com outros arquivos. O modelo cobre comparação de preços e registro de fontes. Não calcula frete ou tributos em campos separados e não faz seleção automática de fornecedor.'
};
guide.settings=['Método da referência: Auxiliar!B6 (Média ou Mediana).','Fontes de pesquisa P1–P3: Auxiliar!C13:E15.','Fornecedores F1–F3: Auxiliar!C16:E18.'];
guide.steps=guide.steps.map((text,i)=>({title:['Abrir o arquivo','Identificar as fontes','Cadastrar os itens','Informar as pesquisas','Informar as propostas','Conferir os registros','Ler o painel','Salvar outro mapa'][i],text}));
guide.exercise=Object.values(guide.exercise);
guide.checks=[{sheet:'Painéis',cell:'B6',expected:4},{sheet:'Painéis',cell:'B8',expected:1458.71},{sheet:'Painéis',cell:'B15',expected:1400},{sheet:'Painéis',cell:'B16',expected:1405},{sheet:'Painéis',cell:'B17',expected:1410},{sheet:'Painéis',cell:'C22',expected:1182.04},{sheet:'Painéis',cell:'C23',expected:276.67},{sheet:'Operacional',cell:'F33',expected:452.04}];
validation.checks=guide.checks;
await fs.writeFile(path.join(review,'price-guide.json'),JSON.stringify({topics:[guide]},null,2));
await fs.writeFile(path.join(review,'price-validation.json'),JSON.stringify(validation,null,2));
