/* ============================================================
   Motor de cálculo — "Reforma Tributária e Advocacia" (didático)
   Premissas dos caps. 3, 6, 7 e 8 da cartilha (fechamento 7/11/2026).
   Cenários ilustrativos. NÃO substitui parecer jurídico/contábil.
   ============================================================ */

// Tabela progressiva mensal do IRPF (didática, dedução da faixa superior
// calibrada pelo exemplo do cap. 6: base 11.305 → ≈ 2.200)
const TABELA_IRPF = [
  { ate: 2428.80, aliq: 0.0,   ded: 0 },
  { ate: 2826.65, aliq: 0.075, ded: 182.16 },
  { ate: 3751.05, aliq: 0.15,  ded: 394.16 },
  { ate: 4664.68, aliq: 0.225, ded: 675.49 },
  { ate: Infinity, aliq: 0.275, ded: 908.73 },
];

// Lei 15.270/2025 — isenção efetiva até R$ 5 mil, redução decrescente até R$ 7.350
function irpfMensal(base) {
  if (base <= 0) return 0;
  const fx = TABELA_IRPF.find(f => base <= f.ate);
  let imposto = Math.max(0, base * fx.aliq - fx.ded);
  if (base <= 5000) return 0;
  if (base < 7350) {
    const f5 = TABELA_IRPF.find(f => 5000 <= f.ate);
    const redutorMax = Math.max(0, 5000 * f5.aliq - f5.ded);
    const fator = (7350 - base) / (7350 - 5000);
    imposto = Math.max(0, imposto - redutorMax * fator);
  }
  return imposto;
}

// Simples Nacional — Anexo IV (advocacia); INSS patronal recolhido por fora
const ANEXO_IV = [
  { ate: 180000,  aliq: 0.045, ded: 0 },
  { ate: 360000,  aliq: 0.09,  ded: 8100 },
  { ate: 720000,  aliq: 0.102, ded: 12420 },
  { ate: 1800000, aliq: 0.14,  ded: 39780 },
  { ate: 3600000, aliq: 0.22,  ded: 183780 },
  { ate: 4800000, aliq: 0.33,  ded: 828000 },
];

function aliquotaEfetivaAnexoIV(rbt12) {
  if (rbt12 <= 0) return 0.045;
  const fx = ANEXO_IV.find(f => rbt12 <= f.ate) || ANEXO_IV[ANEXO_IV.length - 1];
  return Math.max(0, (rbt12 * fx.aliq - fx.ded) / rbt12);
}

const CONST = {
  TETO_INSS: 8475,            // teto previdenciário usado na cartilha (≈ 2026/27)
  INSS_PF: 0.20,              // contribuinte individual
  INSS_PATRONAL: 0.20,        // sobre pró-labore e pagto a contribuinte individual
  INSS_SOCIO: 0.11,           // retido do sócio sobre o pró-labore
  ENCARGOS_CLT: 0.54,         // INSS patronal+RAT+FGTS+provisões (cap. 8: 15.400/10.000)
  SHARE_CBS_DAS: 0.24,        // parcela do DAS que corresponde a PIS/Cofins→CBS (cap. 7: ≈24%)
  REDUCAO_ART127: 0.70,       // alíquota × 70% (redução de 30%)
  PRESUNCAO: 0.32,            // IRPJ/CSLL lucro presumido — serviços
  IRPJ: 0.15, IRPJ_ADICIONAL: 0.10, LIMITE_ADICIONAL_MES: 20000, CSLL: 0.09,
  TETO_SIMPLES_ANO: 4800000,
  LIMITE_LUCRO_ISENTO_MES: 50000, // Lei 15.270 — retenção de 10% acima, por beneficiário
};

/*
 Entradas (inp):
  receita            — receita mensal total (R$)
  sucumbenciaPct     — % da receita que é sucumbência (0–100) — informativo: a sucumbência
                       integra a base em TODOS os enquadramentos (STJ, REsp 2.262.105/SC, no
                       Simples; no regime regular, a tese da não incidência é contencioso em
                       aberto e NÃO é aplicada aqui)
  socios             — nº de sócios (capital + serviço) que retiram pró-labore
  prolaborePorSocio  — pró-labore mensal por sócio (R$)
  assocPF            — pagamentos mensais a associados pessoa física (R$)
  assocSUA           — pagamentos mensais a associados via SUA/nota (R$)
  folhaCLT           — folha mensal de empregados CLT (R$)
  despesas           — { tecnologia, imovel, servicos, bens } despesas tributadas (R$)
  contab             — { pf, simples, hibrido, presumido } honorários contábeis (R$)
  issPct             — ISS do presumido sobre a receita (padrão 0.03) — vigente até 2032
  issPfFixo          — ISS fixo mensal do autônomo (R$, padrão 80)
  carteiraB2BPct     — % da receita vinda de clientes no lucro real/presumido (0–100)
*/
function calcular(inp, refCBS) {
  const r = inp.receita || 0;
  const aliq = refCBS;                                   // nominal cheia (CBS−0,1pp + IBS 0,1 = referência)
  const aliqAdv = refCBS * CONST.REDUCAO_ART127;         // advocacia com redução de 30%
  const desp = inp.despesas || {};
  const despTrib = (desp.tecnologia||0)+(desp.imovel||0)+(desp.servicos||0)+(desp.bens||0);
  const prolaboreTotal = (inp.socios||0) * (inp.prolaborePorSocio||0);

  // Base de IBS/CBS no regime regular: receita integral, sucumbência incluída.
  // A tese da não incidência sobre a sucumbência (cap. 9) é discussão judicial em
  // aberto, tratada como medida de contencioso — não como premissa de cálculo.
  const baseConsumo = r;

  // Créditos no regime regular: despesas tributadas à alíquota cheia;
  // associado PF credita a nota dele (com redução de 30%);
  // contabilidade: crédito desprezado (conservador, como no cap. 6).
  const creditoRegular = despTrib * aliq + (inp.assocPF||0) * aliqAdv;

  // Débito bruto destacado na nota (crédito transferível ao cliente PJ)
  const debitoBruto = baseConsumo * aliqAdv;

  // Blocos comuns a todos os enquadramentos
  const encargosCLT = (inp.folhaCLT||0) * CONST.ENCARGOS_CLT;
  const patronalAssocPF = (inp.assocPF||0) * CONST.INSS_PATRONAL;
  const comum = encargosCLT + patronalAssocPF;

  // INSS e IRPF dos sócios (pró-labore)
  const inssSocios = prolaboreTotal * (CONST.INSS_PATRONAL + CONST.INSS_SOCIO);
  const irpfSocios = (inp.socios||0) * irpfMensal(inp.prolaborePorSocio||0);

  /* ---------- 1. Pessoa física (regime regular) ---------- */
  const pf = (() => {
    const consumo = Math.max(0, debitoBruto - creditoRegular);
    const inss = CONST.INSS_PF * Math.min(Math.max(0, r - despTrib), CONST.TETO_INSS);
    const baseIR = Math.max(0, r - despTrib - inss - (inp.contab?.pf||0));
    const irpf = irpfMensal(baseIR);
    const total = consumo + (inp.issPfFixo||0) + inss + irpf + (inp.contab?.pf||0) + comum;
    return { nome: 'Pessoa física (regime regular)',
      itens: { 'IBS + CBS (débito − crédito)': consumo, 'ISS fixo de autônomo': (inp.issPfFixo||0),
               'INSS (20% até o teto)': inss, 'IRPF (carnê-leão)': irpf,
               'Contabilidade': (inp.contab?.pf||0), 'Encargos de equipe': comum },
      total, pct: r ? total/r : 0, creditoCliente: debitoBruto };
  })();

  /* ---------- 2. SUA / sociedade — Simples integral ---------- */
  const rbt12 = r * 12; // inclui sucumbência (STJ — REsp 2.262.105/SC)
  const efetiva = aliquotaEfetivaAnexoIV(rbt12);
  const das = r * efetiva;
  const acimaTeto = rbt12 > CONST.TETO_SIMPLES_ANO;
  const simples = (() => {
    const total = das + inssSocios + irpfSocios + (inp.contab?.simples||0) + comum;
    return { nome: 'Simples Nacional integral (Anexo IV)',
      itens: { 'DAS': das, 'INSS sócios (patronal + 11%)': inssSocios, 'IRPF pró-labore': irpfSocios,
               'Contabilidade': (inp.contab?.simples||0), 'Encargos de equipe': comum },
      total, pct: r ? total/r : 0, creditoCliente: das * CONST.SHARE_CBS_DAS,
      efetivaAnexoIV: efetiva, acimaTeto };
  })();

  /* ---------- 3. Simples híbrido ---------- */
  const hibrido = (() => {
    const dasSem = das * (1 - CONST.SHARE_CBS_DAS);
    const consumo = Math.max(0, debitoBruto - creditoRegular);
    const total = dasSem + consumo + inssSocios + irpfSocios + (inp.contab?.hibrido||0) + comum;
    return { nome: 'Simples híbrido (IBS/CBS no regime regular)',
      itens: { 'DAS (sem a parcela CBS ≈ 24%)': dasSem, 'IBS + CBS (débito − crédito)': consumo,
               'INSS sócios (patronal + 11%)': inssSocios, 'IRPF pró-labore': irpfSocios,
               'Contabilidade': (inp.contab?.hibrido||0), 'Encargos de equipe': comum },
      total, pct: r ? total/r : 0, creditoCliente: debitoBruto, acimaTeto };
  })();

  /* ---------- 4. Lucro presumido ---------- */
  const presumido = (() => {
    const consumo = Math.max(0, debitoBruto - creditoRegular);
    const basePres = r * CONST.PRESUNCAO;
    const irpj = basePres * CONST.IRPJ + Math.max(0, basePres - CONST.LIMITE_ADICIONAL_MES) * CONST.IRPJ_ADICIONAL;
    const csll = basePres * CONST.CSLL;
    const iss = r * (inp.issPct ?? 0.03);
    const total = consumo + irpj + csll + iss + inssSocios + irpfSocios + (inp.contab?.presumido||0) + comum;
    return { nome: 'Lucro presumido',
      itens: { 'IBS + CBS (débito − crédito)': consumo, 'IRPJ (15% + adicional)': irpj, 'CSLL (9%)': csll,
               'ISS (até 2032)': iss, 'INSS sócios (patronal + 11%)': inssSocios, 'IRPF pró-labore': irpfSocios,
               'Contabilidade': (inp.contab?.presumido||0), 'Encargos de equipe': comum },
      total, pct: r ? total/r : 0, creditoCliente: debitoBruto };
  })();

  // Crédito capturável na carteira (só clientes no lucro real/presumido creditam)
  const b2b = (inp.carteiraB2BPct||0) / 100;
  [pf, simples, hibrido, presumido].forEach(e => {
    e.creditoCapturavel = e.creditoCliente * b2b;
    e.custoLiquidoCliente = r - e.creditoCliente; // se 100% da nota para cliente PJ (como na cartilha)
  });

  // Alerta Lei 15.270 — distribuição de lucros por beneficiário
  const lucroEstimadoPorSocio = (inp.socios||0) > 0
    ? Math.max(0, (r - despTrib - (inp.folhaCLT||0) - (inp.assocPF||0) - (inp.assocSUA||0) - prolaboreTotal) / inp.socios)
    : 0;
  const alertaRetencao = lucroEstimadoPorSocio > CONST.LIMITE_LUCRO_ISENTO_MES;

  return { refCBS, aliqAdv, pf, simples, hibrido, presumido, alertaRetencao, lucroEstimadoPorSocio, acimaTeto };
}

// Alíquota de referência da CBS para 2027 — cálculo do TCU (TC 006.529/2026-7).
// Sujeita a alteração pelo Senado até 15/12/2026; sem votação, vale o cálculo do TCU.
const REF_CBS_2027 = 0.113;

/* ============================================================
   Ponto de virada PF → PJ (SUA no Simples, Anexo IV)
   Varre a receita mensal e compara o custo total como pessoa física
   com o custo como sociedade unipessoal, somando à PJ os custos fixos
   que a PF não tem: contabilidade mensal, custo de abertura diluído e
   o pró-labore obrigatório (INSS patronal + 11% retido e IRPF).
   ============================================================ */
function breakEvenPFvsPJ(opts) {
  const o = Object.assign({
    refCBS: REF_CBS_2027,
    despesasPct: 0.15,     // despesas tributadas como % da receita
    contabPF: 0,           // no carnê-leão muita gente dispensa contador
    contabPJ: 600,         // honorários contábeis mensais da SUA
    custoAbertura: 2500,   // registro na OAB, alvará, certificado digital etc.
    amortMeses: 24,        // horizonte de diluição do custo de abertura
    prolabore: 1631,       // pró-labore mensal do sócio (mínimo usual: 1 salário)
    issPfFixo: 80,
    rMax: 40000, passo: 250,
  }, opts || {});
  const pontos = [];
  let breakEven = null;
  for (let r = o.passo; r <= o.rMax; r += o.passo) {
    const res = calcular({
      receita: r, socios: 1, prolaborePorSocio: o.prolabore,
      assocPF: 0, assocSUA: 0, folhaCLT: 0,
      despesas: { servicos: r * o.despesasPct },
      contab: { pf: o.contabPF, simples: o.contabPJ },
      issPct: 0.03, issPfFixo: o.issPfFixo, carteiraB2BPct: 0,
    }, o.refCBS);
    const pf = res.pf.total;
    const pj = res.simples.total + o.custoAbertura / Math.max(1, o.amortMeses);
    pontos.push({ r, pf, pj });
    if (breakEven === null && pj < pf) breakEven = r;
  }
  return { pontos, breakEven, opts: o };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcular, breakEvenPFvsPJ, irpfMensal, aliquotaEfetivaAnexoIV, CONST, REF_CBS_2027 };
}
