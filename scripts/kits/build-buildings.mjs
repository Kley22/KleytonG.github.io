import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';

// Run a copy of this builder in a temporary directory with the primary runtime.
const repo=path.resolve(process.env.PORTFOLIO_REPO || process.cwd());
const review=path.resolve(process.env.KITS_REVIEW || path.join(repo,'..','review','topic-kits'));
const data=JSON.parse(await fs.readFile(path.join(repo,'content/topic-data.json'),'utf8'));
const GREEN='#204D40', CREAM='#F7F5ED', INPUT='#FFF3CE', CALC='#EDF3EE', INK='#243830', BLUE='#1751A2';
const FIRST=7,LAST=56;
const money='"R$ "#,##0.00;[Red]("R$ "#,##0.00);"R$ "0.00';
const serial=s=>s?Math.round((Date.parse(s+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000):null;
const day=s=>serial(s);
const month=s=>serial(s+'-01');
const letter=i=>String.fromCharCode(65+i);
const validations=[];
const guides=[];
await fs.mkdir(review,{recursive:true});

function value(s,cell,v){s.getRange(cell).values=[[v]];}
function formula(s,cell,v){s.getRange(cell).formulas=[[v]];}
function base(s,title,last='K',n=57){
 s.showGridLines=false;
 const a=s.getRange(`A1:${last}${n}`);a.format.font={name:'Arial',size:11,color:INK};a.format.verticalAlignment='center';a.format.rowHeight=28;
 a.format.fill='#FFFFFF';s.getRange(`A1:${last}4`).format.fill=CREAM;
 value(s,'A2',title);s.getRange('A2').format.font={size:16,bold:true,color:GREEN};s.getRange('A2').format.rowHeight=35;
 s.getRange(`A4:${last}4`).format.borders={bottom:{style:'thin',color:GREEN}};
 s.tabColor=s.name==='Painel'?GREEN:s.name==='Auxiliar'?'#B29B65':'#A8BDAE';
}
function table(s,headers,widths,inputs,help){
 base(s,s.name,letter(headers.length-1));value(s,'A3',help);
 s.getRange(`A6:${letter(headers.length-1)}6`).values=[headers];
 s.getRange(`A6:${letter(headers.length-1)}6`).format={fill:GREEN,font:{color:'#FFFFFF',bold:true},wrapText:true,horizontalAlignment:'center',rowHeight:46};
 widths.forEach((w,i)=>s.getRange(`${letter(i)}1:${letter(i)}57`).format.columnWidth=w);
 s.getRange(`A7:${letter(headers.length-1)}56`).format.rowHeight=40;
 s.getRange(inputs).format.fill=INPUT;s.getRange(inputs).format.font.color=BLUE;
 s.freezePanes.freezeRows(6);s.freezePanes.freezeColumns(1);
 s.tables.add(`A6:${letter(headers.length-1)}56`,true,`Tabela${s.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}`).showFilterButton=true;
}
function list(s,range,values){s.getRange(range).dataValidation={rule:{type:'list',values}};}
function num(s,range,min=0,max=1000000000,type='decimal'){s.dataValidations.add({range,rule:{type,operator:'between',formula1:min,formula2:max}});}
function datefmt(s,range){s.getRange(range).setNumberFormat('dd/mm/yyyy');}
function numeric(s,range){s.getRange(range).setNumberFormat(money);s.getRange(range).format.horizontalAlignment='right';}
function computed(s,range){s.getRange(range).format.fill=CALC;s.getRange(range).format.font.color=GREEN;}
function cf(s,range){
 for(const text of ['Vencido','Vence hoje','Revisar','Incompleto','Duplicado','Sem cadastro','Conferir','Aluguel indevido','Risco'])s.getRange(range).conditionalFormats.add('containsText',{text,format:{fill:'#FCE5DF',font:{color:'#922F25',bold:true}}});
 s.getRange(range).conditionalFormats.add('containsText',{text:'Em até 30 dias',format:{fill:'#FFF0C5',font:{color:'#785910',bold:true}}});
}
function aux(w,forecast){
 const s=w.worksheets.getItem('Auxiliar');base(s,'Configuração e listas','F',30);
 s.getRange('A1:A30').format.columnWidth=29;s.getRange('B1:B30').format.columnWidth=23;s.getRange('C1:C30').format.columnWidth=3;s.getRange('D1:F30').format.columnWidth=25;
 s.getRange('A4:B4').values=[['Campo','Preencha aqui']];s.getRange('A4:B4').format={fill:GREEN,font:{color:'#FFFFFF',bold:true}};
 s.getRange('A5:B6').values=[['Data de referência',day(data.reference)],['Mês de competência',month(data.period)]];datefmt(s,'B5:B6');
 s.getRange('B6').setNumberFormat('mm/yyyy');s.getRange('B5:B6').format.fill=INPUT;s.getRange('B5:B6').format.font.color=BLUE;
 if(forecast){value(s,'A7','Meses a projetar');value(s,'B7',3);num(s,'B7',1,24,'whole');s.getRange('B7').format.fill=INPUT;}
 value(s,'D5','Células amarelas: preencher');value(s,'D6','Células verdes: cálculo');value(s,'D8','Use datas completas e valores numéricos.');
 value(s,'D9','No mês de competência, informe o dia 1.');
 value(s,'A8','Configuração');formula(s,'B8',`=IF(AND(ISNUMBER(B5),B5>0,B5<2958466,ISNUMBER(B6),B6>0,B6<2958466),IF(DAY(B6)=1,"OK","Use dia 1 no mês"),"Informe datas válidas")`);computed(s,'B8');cf(s,'B8');
 num(s,'B5:B6',1,2958465,'whole');
 value(s,'A10','Documentos');s.getRange('A11:A12').values=[['Completa'],['Pendente']];
 value(s,'B10',forecast?'Estado administrativo':'Tipo de imóvel');s.getRange('B11:B12').values=forecast?[['Ativo'],['Encerrado']]:[['Locado'],['Próprio']];
 value(s,'D11','Exemplos criados para o portfólio.');
 s.getRange('D8:F9').format.font={size:10,color:'#566B5F'};
 return s;
}
function panel(w,title,paySheet,statusCol,qualityCol,competenceCol,amountCol){
 const s=w.worksheets.getItem('Painel');base(s,title,'J',33);s.getRange('A1:A33').format.columnWidth=33;s.getRange('B1:B33').format.columnWidth=22;s.getRange('C1:C33').format.columnWidth=3;s.getRange('D1:J33').format.columnWidth=12;
 value(s,'A3','Competência');formula(s,'B3',"=IF('Auxiliar'!B8=\"OK\",'Auxiliar'!B6,\"Informar no Auxiliar\")");s.getRange('B3').setNumberFormat('mm/yyyy');value(s,'D3','Referência');formula(s,'F3',"=IF('Auxiliar'!B8=\"OK\",'Auxiliar'!B5,\"\")");datefmt(s,'F3');
 const per=`'${paySheet}'!$${competenceCol}$7:$${competenceCol}$56`,am=`'${paySheet}'!$${amountCol}$7:$${amountCol}$56`,st=`'${paySheet}'!$${statusCol}$7:$${statusCol}$56`,qu=`'${paySheet}'!$${qualityCol}$7:$${qualityCol}$56`,dt="'Auxiliar'!$B$6",end="EDATE('Auxiliar'!$B$6,1)";
 const count=`COUNTIFS(${per},">="&${dt},${per},"<"&${end})`;
 const occupied=`ROWS(${qu})-COUNTBLANK(${qu})`;
 const bad=`${occupied}-COUNTIFS(${qu},"OK")`;
 const sum=extra=>`IF('Auxiliar'!B8<>"OK","Conferir Auxiliar",IF(${bad}>0,"Revisar dados",IF(${count}=0,"",SUMIFS(${am},${per},">="&${dt},${per},"<"&${end}${extra}))))`;
 s.getRange('A6:B6').values=[['Pagamentos do mês','Valor']];s.getRange('A6:B6').format={fill:GREEN,font:{color:'#FFFFFF',bold:true},rowHeight:33};
 s.getRange('A7:A10').values=[['Total previsto'],['Pago até a referência'],['Em aberto'],['Vencido e não pago']];
 formula(s,'B7','='+sum(''));formula(s,'B8','='+sum(`,${st},"Pago"`));formula(s,'B9','='+sum(`,${st},"<>Pago"`));formula(s,'B10','='+sum(`,${st},"Vencido"`));numeric(s,'B7:B10');s.getRange('B7:B10').format.font={bold:true,color:GREEN};
 value(s,'A12','Documentação pendente');formula(s,'B12',`=IF(${count}=0,"",COUNTIFS(${per},">="&${dt},${per},"<"&${end},'${paySheet}'!$H$7:$H$56,"Pendente"))`);
 value(s,'A13','Cadastros para corrigir');formula(s,'B13',`=IF(${occupied}=0,"",${bad})`);
 value(s,'A15','Comece pelo Auxiliar');value(s,'A16','Depois preencha as abas amarelas.');value(s,'A17','Use os filtros na linha 6 das tabelas.');
 value(s,'A19','Composição do mês');s.getRange('A20:B20').values=[['Situação','Valor (R$)']];s.getRange('A21:A22').values=[['Pago'],['Em aberto']];formula(s,'B21','=IF(ISNUMBER(B8),B8,"")');formula(s,'B22','=IF(ISNUMBER(B9),B9,"")');numeric(s,'B21:B22');
 const c=s.charts.add('doughnut',s.getRange('A20:B22'));c.title='Pago e em aberto (R$)';c.setPosition('D6','J20');c.hasLegend=true;c.titleTextStyle.fontSize=14;c.titleTextStyle.typeface='Arial';c.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:12}};c.yAxis={numberFormatCode:'"R$ "#,##0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};c.legend={position:'bottom',textStyle:{typeface:'Arial',fontSize:12}};
 cf(s,'B7:B13');return s;
}
function keyCheck(id,keySheet,keyCol='A'){return `IF(COUNTIFS('${keySheet}'!$${keyCol}$7:$${keyCol}$56,${id})<>1,"Sem cadastro único",`;}
function paidStatus(r,g,f,q){return `=IF(A${r}="","",IF(${q}${r}<>"OK","Conferir cadastro",IF(${g}${r}<>"",IF(AND(ISNUMBER(${g}${r}),${g}${r}>0,${g}${r}<='Auxiliar'!$B$5),"Pago","Conferir data"),IF(${f}${r}<'Auxiliar'!$B$5,"Vencido",IF(${f}${r}='Auxiliar'!$B$5,"Vence hoje","A vencer")))))`;}

function buildObras(){
 const w=Workbook.create();for(const n of ['Painel','Contratos','Pagamentos','Previsoes','Alteracoes','Auxiliar'])w.worksheets.add(n);aux(w,true);
 const d=data['obras-facilities'];const c=w.worksheets.getItem('Contratos');
 table(c,['ID contrato','Objeto','Fornecedor','Início','Fim','Estado administrativo','Dias até o fim','Prazo','Cadastro'],[15,34,28,15,15,21,16,25,25],'A7:F56','Preencha A:F. O prazo não altera o estado administrativo.');
 c.getRange('B7:C56').format.wrapText=true;datefmt(c,'D7:E56');list(c,'F7:F56',['Ativo','Encerrado']);computed(c,'G7:I56');
 c.getRange('A7:F10').values=d.contracts.map(x=>[x.id,x.description,x.supplier,day(x.start),day(x.end),x.status]);
 c.getRange('G7:I56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [
 `=IF(A${r}="","",IF(I${r}<>"OK","",E${r}-'Auxiliar'!$B$5))`,
 `=IF(A${r}="","",IF(I${r}<>"OK","Conferir cadastro",IF(F${r}="Encerrado","Encerrado",IF(G${r}<0,"Vencido",IF(G${r}=0,"Vence hoje",IF(G${r}<=30,"Em até 30 dias","Em prazo"))))))`,
 `=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",IF(OR(B${r}="",C${r}="",NOT(ISNUMBER(D${r})),NOT(ISNUMBER(E${r})),D${r}<=0,E${r}<D${r},AND(F${r}<>"Ativo",F${r}<>"Encerrado")),"Incompleto","OK")))`];});cf(c,'G7:I56');
 const p=w.worksheets.getItem('Pagamentos');
 table(p,['ID pagamento','Contrato','Descrição','Competência','Valor (R$)','Vencimento','Data de pagamento','Documentos','Etapa informada','Situação na referência','Cadastro'],[18,16,32,17,19,16,18,17,22,25,24],'A7:I56','Preencha A:I. A quitação usa a data de pagamento, não a etapa informada.');
 p.getRange('C7:C56').format.wrapText=true;datefmt(p,'D7:D56');p.getRange('D7:D56').setNumberFormat('mmm/yyyy');datefmt(p,'F7:G56');numeric(p,'E7:E56');computed(p,'J7:K56');
 list(p,'H7:H56',['Completa','Pendente']);list(p,'I7:I56',['Em conferência','Encaminhado','Pago']);list(p,'B7:B56',d.contracts.map(x=>x.id));num(p,'E7:E56');
 p.getRange('B7:B56').dataValidation={rule:{type:'list',formula1:"'Contratos'!$A$7:$A$56"}};
 p.getRange('A7:I11').values=d.payments.map(x=>[x.id,x.contract,x.description,month(x.competence),x.amount,day(x.due),day(x.paidOn),x.documents,x.stage]);
 p.getRange('J7:K56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [paidStatus(r,'G','F','K'),`=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",${keyCheck(`B${r}`,'Contratos')}IF(OR(C${r}="",NOT(ISNUMBER(D${r})),D${r}<=0,NOT(ISNUMBER(E${r})),E${r}<0,NOT(ISNUMBER(F${r})),F${r}<=0,AND(H${r}<>"Completa",H${r}<>"Pendente")),"Incompleto",IF(AND(G${r}<>"",OR(NOT(ISNUMBER(G${r})),G${r}<=0,G${r}>'Auxiliar'!$B$5)),"Conferir data","OK")))))`];});cf(p,'J7:K56');
 const f=w.worksheets.getItem('Previsoes');
 table(f,['Contrato','Saldo serviço (R$)','Mensal serviço (R$)','Saldo material (R$)','Mensal material (R$)','Meses','Projetado serviço (R$)','Projetado material (R$)','Situação serviço','Situação material','Cadastro'],[15,21,22,21,22,11,23,24,24,25,25],'A7:E56','Saldo atual menos valor mensal × meses. Serviço e material são analisados separadamente.');
 f.getRange('A7:E10').values=d.contracts.map(x=>[x.id,x.serviceBalance,x.serviceMonthly,x.materialBalance,x.materialMonthly]);
 f.getRange('A7:A56').dataValidation={rule:{type:'list',formula1:"'Contratos'!$A$7:$A$56"}};numeric(f,'B7:E56');numeric(f,'G7:H56');computed(f,'F7:K56');num(f,'B7:E56');
 f.getRange('F7:K56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [
 `=IF(A${r}="","",'Auxiliar'!$B$7)`,
 `=IF(A${r}="","",IF(OR(K${r}<>"OK",NOT(ISNUMBER(B${r})),NOT(ISNUMBER(C${r}))),"",ROUND(B${r}-C${r}*F${r},2)))`,
 `=IF(A${r}="","",IF(OR(K${r}<>"OK",NOT(ISNUMBER(D${r})),NOT(ISNUMBER(E${r}))),"",ROUND(D${r}-E${r}*F${r},2)))`,
 `=IF(A${r}="","",IF(K${r}<>"OK","Conferir cadastro",IF(OR(NOT(ISNUMBER(B${r})),NOT(ISNUMBER(C${r}))),"Incompleto",IF(G${r}<0,"Risco","Saldo suficiente"))))`,
 `=IF(A${r}="","",IF(K${r}<>"OK","Conferir cadastro",IF(OR(NOT(ISNUMBER(D${r})),NOT(ISNUMBER(E${r}))),"Incompleto",IF(H${r}<0,"Risco","Saldo suficiente"))))`,
 `=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",${keyCheck(`A${r}`,'Contratos')}IF(OR(NOT(ISNUMBER(F${r})),F${r}<1,F${r}>24,F${r}<>INT(F${r}),B${r}<0,C${r}<0,D${r}<0,E${r}<0),"Revisar valores","OK"))))`];});cf(f,'G7:K56');
 const a=w.worksheets.getItem('Alteracoes');table(a,['ID registro','Contrato','Data','Tipo','Registro','Cadastro'],[18,17,17,28,66,26],'A7:E56','Registre o histórico. Atualize a vigência e os saldos nas abas correspondentes.');a.getRange('D7:E56').format.wrapText=true;datefmt(a,'C7:C56');a.getRange('A7:E9').values=d.changes.map(x=>[x.id,x.contract,day(x.date),x.type,x.description]);a.getRange('B7:B56').dataValidation={rule:{type:'list',formula1:"'Contratos'!$A$7:$A$56"}};computed(a,'F7:F56');
 a.getRange('F7:F56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [`=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",${keyCheck(`B${r}`,'Contratos')}IF(OR(NOT(ISNUMBER(C${r})),C${r}<=0,D${r}="",E${r}=""),"Incompleto","OK"))))`];});cf(a,'F7:F56');
 const z=panel(w,'Obras e facilities','Pagamentos','J','K','D','E');
 value(z,'A25','Contratos em acompanhamento');formula(z,'B25','=IF(COUNTA(Contratos!A7:A56)=0,"",COUNTIFS(Contratos!F7:F56,"Ativo"))');value(z,'A26','Prazos que pedem atenção');formula(z,'B26','=IF(COUNTA(Contratos!A7:A56)=0,"",COUNTIFS(Contratos!F7:F56,"Ativo",Contratos!G7:G56,"<=30",Contratos!I7:I56,"OK"))');
 value(z,'A28','Serviços com risco');formula(z,'B28','=IF(COUNTA(Previsoes!A7:A56)=0,"",COUNTIFS(Previsoes!I7:I56,"Risco"))');value(z,'D28','Material com risco');formula(z,'G28','=IF(COUNTA(Previsoes!A7:A56)=0,"",COUNTIFS(Previsoes!J7:J56,"Risco"))');value(z,'A29','Previsões incompletas');formula(z,'B29','=IF(COUNTA(Previsoes!A7:A56)=0,"",COUNTIFS(Previsoes!I7:I56,"Incompleto")+COUNTIFS(Previsoes!J7:J56,"Incompleto"))');
 value(z,'A31','Risco: saldo projetado menor que zero.');value(z,'D31','Veja detalhes na aba Previsoes.');
 return {w,inputs:{Contratos:'A7:F56',Pagamentos:'A7:I56',Previsoes:'A7:E56',Alteracoes:'A7:E56'},ranges:{Painel:'A1:J33',Contratos:'A1:I13',Pagamentos:'A1:K14',Previsoes:'A1:K13',Alteracoes:'A1:F12',Auxiliar:'A1:F16'}};
}

function buildImoveis(){
 const w=Workbook.create();for(const n of ['Painel','Imoveis','Obrigacoes','Auxiliar'])w.worksheets.add(n);aux(w,false);const d=data.imoveis;
 const m=w.worksheets.getItem('Imoveis');table(m,['ID imóvel','Unidade','Tipo','Contrato de locação','Início','Fim','Dias até o fim','Prazo','Cadastro'],[16,28,16,24,16,16,18,26,26],'A7:F56','Imóvel próprio não exige contrato de locação nem datas de vigência.');datefmt(m,'E7:F56');computed(m,'G7:I56');list(m,'C7:C56',['Locado','Próprio']);m.getRange('A7:F9').values=d.properties.map(x=>[x.id,x.name,x.ownership,x.contract,day(x.start),day(x.end)]);
 m.getRange('G7:I56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [
 `=IF(A${r}="","",IF(OR(C${r}="Próprio",I${r}<>"OK"),"",F${r}-'Auxiliar'!$B$5))`,
 `=IF(A${r}="","",IF(I${r}<>"OK","Conferir cadastro",IF(C${r}="Próprio","Próprio",IF(G${r}<0,"Vencido",IF(G${r}=0,"Vence hoje",IF(G${r}<=30,"Em até 30 dias","Em prazo"))))))`,
 `=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",IF(OR(B${r}="",AND(C${r}<>"Locado",C${r}<>"Próprio")),"Incompleto",IF(C${r}="Próprio","OK",IF(OR(D${r}="",NOT(ISNUMBER(E${r})),NOT(ISNUMBER(F${r})),E${r}<=0,F${r}<E${r}),"Incompleto","OK")))))`];});cf(m,'G7:I56');
 const o=w.worksheets.getItem('Obrigacoes');table(o,['ID obrigação','Imóvel','Tipo de obrigação','Competência','Valor (R$)','Vencimento','Data de pagamento','Documentos','Situação na referência','Cadastro'],[18,16,22,17,18,16,19,17,27,27],'A7:H56','Cadastre uma obrigação por linha. Aluguel é permitido apenas para imóveis locados.');datefmt(o,'D7:D56');o.getRange('D7:D56').setNumberFormat('mmm/yyyy');datefmt(o,'F7:G56');numeric(o,'E7:E56');computed(o,'I7:J56');list(o,'C7:C56',['Aluguel','Condomínio','IPTU','Taxa']);list(o,'H7:H56',['Completa','Pendente']);o.getRange('B7:B56').dataValidation={rule:{type:'list',formula1:"'Imoveis'!$A$7:$A$56"}};num(o,'E7:E56');
 o.getRange('A7:H14').values=d.obligations.map(x=>[x.id,x.property,x.type,month(x.competence),x.amount,day(x.due),day(x.paidOn),x.documents]);
 o.getRange('I7:J56').formulas=Array.from({length:50},(_,i)=>{const r=i+7;return [paidStatus(r,'G','F','J'),`=IF(A${r}="","",IF(COUNTIFS($A$7:$A$56,A${r})>1,"Duplicado",${keyCheck(`B${r}`,'Imoveis')}IF(AND(C${r}="Aluguel",INDEX('Imoveis'!$C$7:$C$56,MATCH(B${r},'Imoveis'!$A$7:$A$56,0))="Próprio"),"Aluguel indevido",IF(OR(C${r}="",NOT(ISNUMBER(D${r})),D${r}<=0,NOT(ISNUMBER(E${r})),E${r}<0,NOT(ISNUMBER(F${r})),F${r}<=0,AND(H${r}<>"Completa",H${r}<>"Pendente")),"Incompleto",IF(AND(G${r}<>"",OR(NOT(ISNUMBER(G${r})),G${r}<=0,G${r}>'Auxiliar'!$B$5)),"Conferir data","OK"))))))`];});cf(o,'I7:J56');
 const z=panel(w,'Imóveis e obrigações','Obrigacoes','I','J','D','E');value(z,'A25','Imóveis locados');formula(z,'B25','=IF(COUNTA(Imoveis!A7:A56)=0,"",COUNTIFS(Imoveis!C7:C56,"Locado"))');value(z,'A26','Imóveis próprios');formula(z,'B26','=IF(COUNTA(Imoveis!A7:A56)=0,"",COUNTIFS(Imoveis!C7:C56,"Próprio"))');value(z,'A28','Locações com prazo próximo');formula(z,'B28','=IF(COUNTA(Imoveis!A7:A56)=0,"",COUNTIFS(Imoveis!C7:C56,"Locado",Imoveis!G7:G56,"<=30",Imoveis!I7:I56,"OK"))');value(z,'A30','Imóveis próprios não têm aluguel.');value(z,'A31','Documentos e pagamento têm situações separadas.');
 return {w,inputs:{Imoveis:'A7:F56',Obrigacoes:'A7:H56'},ranges:{Painel:'A1:J33',Imoveis:'A1:I12',Obrigacoes:'A1:J17',Auxiliar:'A1:F16'}};
}

function val(w,s,c){return w.worksheets.getItem(s).getRange(c).values[0][0];}
function strengthen(w,inputs){
 for(const [name,range] of Object.entries(inputs)){
  const s=w.worksheets.getItem(name),end=range.match(/:([A-Z]+)/)[1];
  const q={Contratos:'I',Pagamentos:'K',Previsoes:'K',Alteracoes:'F',Imoveis:'I',Obrigacoes:'J'}[name];
  const form=s.getRange(`${q}7:${q}56`).formulas;
  s.getRange(`${q}7:${q}56`).formulas=form.map(([f],i)=>{const r=i+7;return [f.replace(`=IF(A${r}="","",`,`=IF(COUNTA(A${r}:${end}${r})=0,"",IF(A${r}="","Informe ID",`)+')'];});
  s.getRange(`${q}7:${q}56`).conditionalFormats.add('containsText',{text:'Informe',format:{fill:'#FCE5DF',font:{color:'#922F25',bold:true}}});
 }
 for(const name of ['Contratos','Imoveis']){
  if(!inputs[name])continue;const s=w.worksheets.getItem(name);
  s.getRange('G7:G56').formulas=s.getRange('G7:G56').formulas.map(([f])=>[`=IF('Auxiliar'!B8<>"OK","",${f.slice(1)})`]);
  s.getRange('H7:H56').formulas=s.getRange('H7:H56').formulas.map(([f],i)=>[`=IF(A${i+7}="","",IF('Auxiliar'!B8<>"OK","Conferir Auxiliar",${f.slice(1)}))`]);
 }
 for(const name of ['Pagamentos','Obrigacoes']){
  if(!inputs[name])continue;const s=w.worksheets.getItem(name),col=name==='Pagamentos'?'J':'I';
  s.getRange(`${col}7:${col}56`).formulas=s.getRange(`${col}7:${col}56`).formulas.map(([f],i)=>[`=IF(A${i+7}="","",IF('Auxiliar'!B8<>"OK","Conferir Auxiliar",${f.slice(1)}))`]);
 }
 const z=w.worksheets.getItem('Painel');value(z,'A14','Outros cadastros para corrigir');
 const refs=inputs.Contratos?[['Contratos','I'],['Previsoes','K'],['Alteracoes','F']]:[['Imoveis','I']];
 const count=refs.map(([s,c])=>`(ROWS('${s}'!${c}7:${c}56)-COUNTBLANK('${s}'!${c}7:${c}56)-COUNTIFS('${s}'!${c}7:${c}56,"OK"))`).join('+');
 formula(z,'B14',`=IF(COUNTA('${refs[0][0]}'!A7:F56)=0,"",${count})`);
}
function check(w,s,c,expected){const got=val(w,s,c);if(typeof expected==='number')assert.ok(Math.abs(got-expected)<0.005,`${s}!${c}: ${got} != ${expected}`);else assert.equal(got,expected,`${s}!${c}`);return {cell:`${s}!${c}`,expected,actual:got};}
async function verify(topic,obj){
 const {w}=obj;w.recalculate();const checks=[];
 if(topic==='obras-facilities'){
  for(const [s,c,v] of [['Painel','B7',27200],['Painel','B8',4200],['Painel','B9',23000],['Painel','B10',7200],['Painel','B26',3],['Painel','B28',1],['Painel','B29',1],['Previsoes','G7',10500],['Previsoes','G8',-3100],['Previsoes','H9',1200],['Previsoes','J10','Incompleto']])checks.push(check(w,s,c,v));
  const p=w.worksheets.getItem('Pagamentos');value(p,'G7',day(data.reference));w.recalculate();checks.push(check(w,'Painel','B8',16700));checks.push(check(w,'Painel','B12',2));value(p,'G7',null);
  const f=w.worksheets.getItem('Previsoes');value(f,'B8',21600);w.recalculate();checks.push(check(w,'Previsoes','G8',0));checks.push(check(w,'Previsoes','I8','Saldo suficiente'));value(f,'B8',18500);
  value(f,'E10',0);w.recalculate();checks.push(check(w,'Previsoes','H10',2800));checks.push(check(w,'Previsoes','J10','Saldo suficiente'));value(f,'E10',null);
  value(w.worksheets.getItem('Contratos'),'F9','Encerrado');w.recalculate();checks.push(check(w,'Contratos','H9','Encerrado'));value(w.worksheets.getItem('Contratos'),'F9','Ativo');
  p.getRange('A56:I56').values=[['OF-TEST','OF-101','Teste de extensão',month(data.period),100,day('2026-09-30'),null,'Completa','Encaminhado']];w.recalculate();checks.push(check(w,'Painel','B7',27300));p.getRange('A56:I56').clear({applyTo:'contents'});
  value(p,'B7','INEXISTENTE');w.recalculate();checks.push(check(w,'Pagamentos','K7','Sem cadastro único'));checks.push(check(w,'Painel','B7','Revisar dados'));value(p,'B7','OF-101');
 }else{
  const d=data.imoveis.obligations,total=d.reduce((a,x)=>a+x.amount,0),paid=d.filter(x=>x.paidOn&&x.paidOn<=data.reference).reduce((a,x)=>a+x.amount,0);
  for(const [s,c,v] of [['Painel','B7',total],['Painel','B8',paid],['Painel','B9',total-paid],['Painel','B10',680],['Painel','B12',3],['Imoveis','H9','Próprio']])checks.push(check(w,s,c,v));
  const o=w.worksheets.getItem('Obrigacoes');value(o,'C13','Aluguel');w.recalculate();checks.push(check(w,'Obrigacoes','J13','Aluguel indevido'));value(o,'C13','IPTU');
  value(o,'G8',day(data.reference));w.recalculate();checks.push(check(w,'Painel','B8',paid+680));checks.push(check(w,'Painel','B12',3));value(o,'G8',null);
  value(o,'G8',day('2026-09-18'));w.recalculate();checks.push(check(w,'Obrigacoes','J8','Conferir data'));value(o,'G8',null);
  o.getRange('A56:H56').values=[['IM-TEST','IM-003','Taxa',month(data.period),100,day('2026-09-30'),null,'Completa']];w.recalculate();checks.push(check(w,'Painel','B7',total+100));o.getRange('A56:H56').clear({applyTo:'contents'});
 }
 const source=w.worksheets.getItem(topic==='obras-facilities'?'Pagamentos':'Obrigacoes'),sourceName=topic==='obras-facilities'?'Pagamentos':'Obrigacoes',qc=topic==='obras-facilities'?'K':'J';
 const id=source.getRange('A7').values[0][0];value(source,'A7',null);w.recalculate();checks.push(check(w,sourceName,qc+'7','Informe ID'));checks.push(check(w,'Painel','B7','Revisar dados'));value(source,'A7',id);
 value(w.worksheets.getItem('Auxiliar'),'B5',null);w.recalculate();checks.push(check(w,'Painel','B7','Conferir Auxiliar'));value(w.worksheets.getItem('Auxiliar'),'B5',day(data.reference));
 value(w.worksheets.getItem('Auxiliar'),'B6',month('2026-10'));w.recalculate();checks.push(check(w,'Painel','B7',''));value(w.worksheets.getItem('Auxiliar'),'B6',month(data.period));
 w.recalculate();const scan=await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Verificação final de fórmulas'});assert.ok(!/"match"|"error"/.test(scan.ndjson),scan.ndjson);
 return {topic,checks,errorScan:scan.ndjson,engine:'Artifact Tool recalculation. Microsoft Excel and Google Sheets native applications were not tested.'};
}
for(const [topic,builder] of [['obras-facilities',buildObras],['imoveis',buildImoveis]]){
 console.log(`Building ${topic}`);const obj=builder(),out=path.join(repo,'downloads',topic);strengthen(obj.w,obj.inputs);await fs.mkdir(out,{recursive:true});const validation=await verify(topic,obj);validations.push(validation);
 for(const [sheet,range] of Object.entries(obj.ranges)){
  const png=await obj.w.render({sheetName:sheet,range,scale:1.5,format:'png'});await fs.writeFile(path.join(review,`${topic}-${sheet}.png`),new Uint8Array(await png.arrayBuffer()));
 }
 const ex=await SpreadsheetFile.exportXlsx(obj.w);await ex.save(path.join(out,'planilha-exemplo.xlsx'));
 for(const [sheet,range] of Object.entries(obj.inputs))obj.w.worksheets.getItem(sheet).getRange(range).clear({applyTo:'contents'});
 obj.w.recalculate();check(obj.w,'Painel','B7','');const scan=await obj.w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!',options:{useRegex:true,maxResults:100}});validation.blankErrorScan=scan.ndjson;
 for(const [sheet,range] of Object.entries(obj.ranges)){
  const png=await obj.w.render({sheetName:sheet,range,scale:1,format:'png'});await fs.writeFile(path.join(review,`${topic}-${sheet}-em-branco.png`),new Uint8Array(await png.arrayBuffer()));
 }
 const blank=await SpreadsheetFile.exportXlsx(obj.w);await blank.save(path.join(out,'planilha-em-branco.xlsx'));
 for(const file of ['planilha-exemplo.xlsx','planilha-em-branco.xlsx']){
  await fs.rename(path.join(out,`${file}.inspect.ndjson`),path.join(review,`${topic}-${file}.inspect.ndjson`)).catch(e=>{if(e.code!=='ENOENT')throw e;});
 }
 guides.push({slug:topic,title:topic==='imoveis'?'Imóveis':'Obras e facilities',files:['planilha-exemplo.xlsx','planilha-em-branco.xlsx'],sheets:Object.keys(obj.ranges),editable:obj.inputs,capacity:50,firstRow:7,lastRow:56,settings:{reference:'Auxiliar!B5',competence:'Auxiliar!B6',...(topic==='obras-facilities'?{forecastMonths:'Auxiliar!B7'}:{})},steps:[
 'Extraia o ZIP e abra planilha-exemplo.xlsx para conhecer o preenchimento. Use planilha-em-branco.xlsx para iniciar o seu controle.',
 'Em Auxiliar!B5, informe a data de referência. Em B6, informe o primeiro dia do mês desejado. O painel usa a competência e considera pagamentos efetivados até a referência.',
 topic==='obras-facilities'?'Cadastre os contratos em Contratos!A7:F56. Use um ID único. Informe o estado administrativo sem confundir vencimento com encerramento.':'Cadastre os imóveis em Imoveis!A7:F56. Escolha Locado ou Próprio. Contrato, início e fim são obrigatórios para locados.',
 topic==='obras-facilities'?'Lance os pagamentos em Pagamentos!A7:I56 e selecione o contrato. Informe a competência, o valor, o vencimento e a documentação. A data de pagamento registra a quitação. A etapa informada é um acompanhamento separado.':'Lance aluguel, condomínio, IPTU e taxas em Obrigacoes!A7:H56. Use o ID do imóvel. Imóvel próprio aceita obrigações, mas não aluguel.',
 ...(topic==='obras-facilities'?['Em Previsoes!A7:E56, informe os saldos disponíveis e os valores mensais de serviço e material. Ajuste o horizonte em Auxiliar!B7. Saldo projetado igual a zero não é risco. Campo vazio mantém a previsão incompleta.','Registre aditivos, prorrogações e acompanhamento em Alteracoes!A7:E56. O histórico não altera automaticamente datas ou saldos: após a conferência, atualize Contratos e Previsoes.']:[]),
 'Confira as colunas Cadastro e Situação. Corrija campos incompletos e IDs duplicados antes de interpretar os totais. Documentação pendente permanece visível mesmo quando há pagamento.',
 'Abra Painel para acompanhar os totais e o gráfico. Use os filtros da linha 6 para localizar pendências nas abas operacionais.',
 'Para acrescentar registros, use a próxima linha vazia entre 7 e 56. Preencha somente as células amarelas. As células verdes já contêm fórmulas. Mantenha o conjunto da tabela ao ordenar.',
 'Para excluir um registro, apague apenas suas células amarelas com Delete. Não exclua a linha da planilha nem as fórmulas. Para recomeçar, abra novamente a versão em branco.'
 ],limits:[
 'Cada aba operacional aceita até 50 registros nas linhas preparadas. Registros além da linha 56 não participam dos indicadores sem ampliar fórmulas e validações.',
 'O painel agrupa por competência mensal. Ele não é um extrato de fluxo de caixa por data de pagamento.',
 'Datas devem ser datas válidas, valores devem ser numéricos e IDs devem ser únicos. Pagamentos futuros em relação à referência exigem conferência.',
 ...(topic==='obras-facilities'?['A previsão é saldo informado menos valor mensal vezes o horizonte. Não inclui reajustes automáticos, rateio diário nem desconto automático dos pagamentos: o saldo informado já deve representar a posição que você deseja projetar.','Um componente sem gastos deve receber zero explícito. Campo vazio significa informação ainda ausente. A análise não compensa falta de serviço com sobra de material.']:[]),
 'Arquivo sem macros, sem conexão externa e sem dependência de outras pastas. Cálculos e exportação verificados no motor de criação; não houve teste direto no Excel ou Google Planilhas. Após importar para outro aplicativo, confira fórmulas, listas, datas e gráfico antes do uso.'
 ],tests:validation.checks});
 console.log(`Exported ${topic}`);
}
const purposes={Painel:'Resumo dos pagamentos por competência, pendências e gráfico.',Contratos:'Cadastro de contratos e cálculo dos prazos.',Pagamentos:'Conferência documental e acompanhamento dos pagamentos.',Previsoes:'Projeção separada dos saldos de serviço e material.',Alteracoes:'Histórico de alterações e providências por contrato.',Imoveis:'Cadastro dos imóveis locados e próprios.',Obrigacoes:'Aluguéis, condomínio, IPTU e taxas por imóvel.',Auxiliar:'Data de referência, competência e listas de preenchimento.'};
for(const g of guides){
 g.sheets=g.sheets.map(name=>({name,purpose:purposes[name],inputs:g.editable[name]|| (name==='Auxiliar'?(g.slug==='obras-facilities'?'B5:B7':'B5:B6'):'Nenhum. Aba calculada.')}));
 g.settings=Object.entries(g.settings).map(([key,cell])=>`${cell}: ${{reference:'data de referência',competence:'primeiro dia do mês de competência',forecastMonths:'horizonte de projeção em meses, de 1 a 24'}[key]}`);
 g.steps=g.steps.map((text,i)=>({title:`Etapa ${i+1}`,text}));
 g.rules=g.limits;g.capacity='50 registros por aba operacional, da linha 7 à 56.';
 g.exercise=g.slug==='obras-facilities'?['No exemplo, registre 17/09/2026 em Pagamentos!G7. O valor pago em Painel!B8 passa de R$ 4.200,00 para R$ 16.700,00. Documentação pendente continua em 2. Apague G7 para restaurar.','Em Previsoes!B8, troque 18.500 por 21.600. O saldo projetado de serviço passa a zero e a situação fica Saldo suficiente. Restaure 18.500.']:['No exemplo, registre 17/09/2026 em Obrigacoes!G8. O valor pago em Painel!B8 passa de R$ 5.060,00 para R$ 5.740,00. A documentação pendente continua em 3. Apague G8 para restaurar.'];
 g.troubleshooting=[{problem:'O painel mostra Revisar dados.',solution:'Verifique a coluna Cadastro nas abas operacionais. Corrija ID vazio ou duplicado, vínculo sem cadastro, datas e valores. Em Imóveis, confira também aluguel lançado para imóvel próprio.'},{problem:'O resultado ficou vazio.',solution:'Confira a competência no Auxiliar e se há lançamentos nesse mês. Nas previsões, preencha saldo e mensalidade de cada componente. Campo vazio não é tratado como zero.'},{problem:'O painel mostra Conferir Auxiliar.',solution:'Informe datas válidas em Auxiliar!B5 e B6. B6 deve ser o primeiro dia do mês. Não apague as fórmulas verdes.'}];
 g.checks=g.tests.filter(x=>!String(x.expected).includes('Revisar')).slice(0,g.slug==='obras-facilities'?11:6).map(x=>({sheet:x.cell.split('!')[0],cell:x.cell.split('!')[1],expected:x.expected}));
}
await fs.writeFile(path.join(review,'buildings-guide.json'),JSON.stringify({topics:guides},null,2));
await fs.writeFile(path.join(review,'buildings-validation.json'),JSON.stringify(validations,null,2));
