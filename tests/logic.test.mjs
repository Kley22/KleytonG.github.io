import test from 'node:test';
import assert from 'node:assert/strict';
import {daysBetween,contractStatus,projectBalance,paymentStatus,adjustment,fleetMetrics} from '../assets/js/logic.mjs';
test('vigência respeita encerramento, início futuro e último dia inclusivo',()=>{
  const row={start:'2026-01-01',end:'2026-09-17',closed:false};
  assert.equal(contractStatus(row,'2026-09-17'),'A renovar');
  assert.equal(contractStatus(row,'2026-09-18'),'Vencido');
  assert.equal(contractStatus({...row,closed:true},'2026-09-17'),'Encerrado');
  assert.equal(contractStatus(row,'2025-12-31'),'Não iniciado');
  assert.equal(daysBetween('2028-02-28','2028-03-01'),2);
});
test('projeção usa centavos e só identifica risco com saldo negativo',()=>{
  assert.deepEqual(projectBalance(1000.02,333.33,3),{remaining:0.03,spend:999.99,risk:false});
  assert.equal(projectBalance(1000,500,2).risk,false);
  assert.equal(projectBalance(1000,500.01,2).risk,true);
});
test('pagamento liquidado não aparece como atraso e hoje ainda é a pagar',()=>{
  assert.equal(paymentStatus({due:'2026-09-01',paid:'2026-09-02'},'2026-09-17'),'Pago');
  assert.equal(paymentStatus({due:'2026-09-17',paid:null},'2026-09-17'),'A pagar');
  assert.equal(paymentStatus({due:'2026-09-16',paid:null},'2026-09-17'),'Em atraso');
});
test('ajuste e consumo validam cálculos e entradas impossíveis',()=>{
  assert.deepEqual(adjustment(2400,8),{added:192,total:2592});
  assert.deepEqual(fleetMetrics(41500,41920,35,42000),{distance:420,efficiency:12,untilMaintenance:80});
  assert.throws(()=>fleetMetrics(41500,41400,35,42000),RangeError);
  assert.throws(()=>fleetMetrics(41500,41920,0,42000),RangeError);
});
