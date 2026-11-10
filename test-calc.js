const { calcular } = require('./calc.js');
const fmt = v => 'R$ ' + v.toFixed(0) + '';
const pct = v => (v*100).toFixed(1) + '%';

console.log('=== VALIDAÇÃO CAP. 6 (receita 15.000, despesas 2.000, 1 sócio, pró-labore 3.000, CBS 11,3%) ===');
const c6 = calcular({
  receita: 15000, sucumbenciaPct: 0, socios: 1, prolaborePorSocio: 3000,
  assocPF: 0, assocSUA: 0, folhaCLT: 0,
  despesas: { servicos: 2000 },
  contab: { pf: 0, simples: 600, hibrido: 700, presumido: 800 },
  issPct: 0.03, issPfFixo: 80, carteiraB2BPct: 100,
}, 0.113);
console.log('PF        ', fmt(c6.pf.total), pct(c6.pf.pct), '— esperado ≈ 4.935 · 32,9%');
console.log('  itens PF:', JSON.stringify(Object.fromEntries(Object.entries(c6.pf.itens).map(([k,v])=>[k,Math.round(v)]))));
console.log('Simples   ', fmt(c6.simples.total), pct(c6.simples.pct), '— esperado ≈ 2.205 · 14,7%');
console.log('Presumido ', fmt(c6.presumido.total), pct(c6.presumido.pct), '— esperado ≈ 4.292 · 28,6%');
console.log('Crédito cliente PF/presumido:', fmt(c6.pf.creditoCliente), '— esperado ≈ 1.187');
console.log('Crédito cliente Simples:', fmt(c6.simples.creditoCliente), '— cartilha ≈ 150 (nós usamos 24% do DAS)');

console.log('\n=== VALIDAÇÃO CAP. 7 (receita 60.000, despesas 10.000, sem sócios/pró-labore, CBS 11,3%) ===');
const c7 = calcular({
  receita: 60000, sucumbenciaPct: 0, socios: 0, prolaborePorSocio: 0,
  assocPF: 0, assocSUA: 0, folhaCLT: 0,
  despesas: { servicos: 10000 },
  contab: { pf: 0, simples: 0, hibrido: 0, presumido: 0 },
  issPct: 0.03, issPfFixo: 80, carteiraB2BPct: 100,
}, 0.113);
console.log('Simples   ', fmt(c7.simples.total), pct(c7.simples.pct), '— esperado ≈ 5.085 · 8,5%');
console.log('Híbrido   ', fmt(c7.hibrido.total), pct(c7.hibrido.pct), '— esperado ≈ 7.481 · 12,5%');
console.log('  itens híbrido:', JSON.stringify(Object.fromEntries(Object.entries(c7.hibrido.itens).map(([k,v])=>[k,Math.round(v)]))));
console.log('Presumido ', fmt(c7.presumido.total), pct(c7.presumido.pct), '— esperado ≈ 10.024 · 16,7%');
console.log('Crédito Simples:', fmt(c7.simples.creditoCliente), '— esperado ≈ 1.220');
console.log('Crédito híbrido/presumido:', fmt(c7.hibrido.creditoCliente), '— esperado ≈ 4.746');
console.log('Custo líquido cliente (híbrido):', fmt(c7.hibrido.custoLiquidoCliente), '— esperado ≈ 55.254');

console.log('\n=== CAP. 3 (presumido, receita 30.000, despesas 6.000 + contab 1.500, CBS 11,3%) ===');
const c3 = calcular({
  receita: 30000, sucumbenciaPct: 0, socios: 0, prolaborePorSocio: 0,
  assocPF: 0, assocSUA: 0, folhaCLT: 12000,
  despesas: { servicos: 6000 },
  contab: { presumido: 1500 }, issPct: 0.03, issPfFixo: 80, carteiraB2BPct: 100,
}, 0.113);
const consumo = c3.presumido.itens['IBS + CBS (débito − crédito)'];
console.log('CBS+IBS a recolher:', fmt(consumo), `(${pct(consumo/30000)})`, '— cartilha ≈ 1.576+119(contab não creditada aqui) ≈ 1.695 · nosso modelo conservador');
