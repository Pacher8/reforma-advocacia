/* ===== UI da calculadora, checklist e PDF ===== */
(function () {
  const $ = id => document.getElementById(id);
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const pc = v => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  let ultimo = null; // { inp, cen }

  function lerInputs() {
    return {
      receita: +$('receita').value || 0,
      sucumbenciaPct: +$('sucumbenciaPct').value || 0,
      carteiraB2BPct: +$('carteiraB2BPct').value || 0,
      socios: +$('socios').value || 0,
      prolaborePorSocio: +$('prolaborePorSocio').value || 0,
      folhaCLT: +$('folhaCLT').value || 0,
      assocPF: +$('assocPF').value || 0,
      assocSUA: +$('assocSUA').value || 0,
      despesas: {
        tecnologia: +$('dTecnologia').value || 0,
        imovel: +$('dImovel').value || 0,
        servicos: +$('dServicos').value || 0,
        bens: +$('dBens').value || 0,
      },
      contab: {
        pf: +$('cPf').value || 0,
        simples: +$('cSimples').value || 0,
        hibrido: +$('cHibrido').value || 0,
        presumido: +$('cPresumido').value || 0,
      },
      issPct: (+$('issPct').value || 0) / 100,
      issPfFixo: +$('issPfFixo').value || 0,
    };
  }

  const ORDEM = ['pf', 'simples', 'hibrido', 'presumido'];

  function renderCenario(res, titulo, destaque) {
    const regimes = ORDEM.map(k => res[k]);
    const maxPct = Math.max(...regimes.map(e => e.pct), 0.01);
    const melhor = regimes.reduce((a, b) => (b.total < a.total ? b : a));
    const linhas = regimes.map(e => `
      <div class="linha-res ${e === melhor ? 'melhor' : ''}">
        <div class="nome"><span>${e.nome}</span><em>${brl(e.total)} · <b>${pc(e.pct)}</b></em></div>
        <div class="barra"><i style="width:${Math.max(2, (e.pct / maxPct) * 100)}%"></i></div>
        <div class="det">${Object.entries(e.itens).filter(([, v]) => v > 0.5)
          .map(([k, v]) => `${k}: ${brl(v)}`).join(' · ') || '—'}</div>
      </div>`).join('');
    return `<div class="cenario ${destaque ? 'destaque' : ''}">
      <h4>${titulo}</h4>${linhas}
      <p class="det" style="margin-top:8px;color:var(--muted);font-size:.78rem">
        Menor carga neste cenário: <b>${melhor.nome}</b> (${pc(melhor.pct)})${res.acimaTeto ? ' · <b style="color:#B4231F">receita acima do teto do Simples</b>' : ''}</p>
    </div>`;
  }

  function renderExtras(inp, r) {
    const linhasCred = ORDEM.map(k => `<tr><td>${r[k].nome}</td><td>${brl(r[k].creditoCliente)}</td><td>${brl(r[k].custoLiquidoCliente)}</td></tr>`).join('');
    const alerta = r.alertaRetencao
      ? `<p class="alerta" style="margin-top:8px">⚠ Lucro estimado por sócio ≈ ${brl(r.lucroEstimadoPorSocio)}/mês — acima de R$ 50 mil incide retenção de 10% na distribuição (Lei 15.270); no Simples a aplicação é controvertida. Planeje o calendário de distribuição.</p>` : '';
    return `
      <div class="res-box"><h5>Crédito que você transfere ao cliente PJ</h5>
        <table><tr><td style="font-weight:700">Enquadramento</td><td style="font-weight:700">Crédito na nota</td><td style="font-weight:700">Custo líq. p/ cliente</td></tr>${linhasCred}</table>
        <p style="font-size:.76rem;color:var(--muted);margin-top:8px">Só clientes no lucro real/presumido creditam. Na sua carteira (${inp.carteiraB2BPct}% B2B),
        o crédito capturável no regime regular é ≈ <b>${brl(r.hibrido.creditoCapturavel)}/mês</b> — é esse número que entra na conversa de preço.</p>
      </div>
      <div class="res-box"><h5>Leituras do seu caso</h5>
        <p>${inp.carteiraB2BPct >= 50
          ? 'Mais da metade da carteira credita a sua nota: <b>simule o híbrido a sério</b> — o crédito integral vira argumento de preço (proposta em três linhas: honorários, IBS/CBS destacado, crédito estimado).'
          : 'Carteira majoritariamente de quem não credita (PF/Simples): a tendência do cap. 7 é <b>manter IBS/CBS no DAS</b> (Simples integral), salvo conclusão diversa da simulação.'}</p>
        ${inp.sucumbenciaPct > 15 ? '<p style="margin-top:8px">Sucumbência relevante: este cálculo adota a posição conservadora e a inclui na base em todos os enquadramentos (no Simples, por decisão do STJ — REsp 2.262.105/SC). No regime regular há possibilidade de contencioso pela não incidência, mas o tema é novo, sem precedentes sobre IBS/CBS, e ainda renderá batalha jurídica: inclua no custo, segregue registros desde já e avalie a estratégia do seu caso com seu tributarista, acompanhando a evolução.</p>' : ''}
        ${alerta}
      </div>`;
  }

  function calcularTudo() {
    const inp = lerInputs();
    if (!inp.receita) { alert('Informe a receita mensal.'); return; }
    const res = calcular(inp, REF_CBS_2027);
    ultimo = { inp, res };
    $('cenarios').innerHTML =
      renderCenario(res, 'CBS 11,3% — alíquota de referência calculada pelo TCU', true) +
      `<p class="field-note" style="grid-column:1/-1"><b>Sobre a alíquota:</b> 11,3% é a referência da CBS para 2027
      calculada pelo TCU (TC 006.529/2026-7) e está <b>sujeita a alteração pelo Senado até 15/12/2026</b> — se não houver
      votação, vale o cálculo do TCU. Refaça a simulação quando a alíquota for fixada. O resultado já aplica a redução
      de 30% da advocacia (art. 127 da LC 214/2025).</p>`;
    $('resExtra').innerHTML = renderExtras(inp, res);
    $('resultados').hidden = false;
    $('btnPdf').disabled = false;
    $('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- PDF (relatório de impressão) ---------- */
  function gerarPdf() {
    if (!ultimo) return;
    const { inp, res } = ultimo;
    const hoje = new Date().toLocaleDateString('pt-BR');
    const linhaRegime = (res, k) => {
      const e = res[k];
      return `<tr><td>${e.nome}</td><td class="num">${brl(e.total)}</td><td class="num">${pc(e.pct)}</td>
        <td class="num">${brl(e.creditoCliente)}</td></tr>`;
    };
    const barras = res => {
      const regimes = ORDEM.map(k => res[k]);
      const maxPct = Math.max(...regimes.map(e => e.pct), 0.01);
      const melhor = regimes.reduce((a, b) => (b.total < a.total ? b : a));
      return regimes.map(e =>
        `<div class="r-bar ${e === melhor ? 'best' : ''}" style="width:${Math.max(18, (e.pct / maxPct) * 100)}%">${e.nome.split('(')[0].trim()} — ${pc(e.pct)}</div>`
      ).join('');
    };
    const desp = inp.despesas;
    $('report').innerHTML = `
      <div class="r-head"><span class="k">Diagnóstico didático · Reforma Tributária e Advocacia</span>
        <h1>O impacto estimado da Reforma no seu escritório — 2027</h1>
        <p>Gerado em ${hoje} na calculadora de gustavopacher · premissas da cartilha, fechamento 7/11/2026</p></div>

      <h2>Dados informados</h2>
      <table class="avoid-break">
        <tr><td>Receita mensal média</td><td class="num">${brl(inp.receita)}</td>
            <td>Sucumbência na receita</td><td class="num">${inp.sucumbenciaPct}%</td></tr>
        <tr><td>Clientes no lucro real/presumido</td><td class="num">${inp.carteiraB2BPct}%</td>
            <td>Sócios com pró-labore</td><td class="num">${inp.socios} × ${brl(inp.prolaborePorSocio)}</td></tr>
        <tr><td>Folha CLT</td><td class="num">${brl(inp.folhaCLT)}</td>
            <td>Associados (PF / via SUA)</td><td class="num">${brl(inp.assocPF)} / ${brl(inp.assocSUA)}</td></tr>
        <tr><td>Despesas tributadas</td><td class="num">${brl(desp.tecnologia + desp.imovel + desp.servicos + desp.bens)}</td>
            <td>ISS presumido / ISS fixo PF</td><td class="num">${(inp.issPct * 100).toLocaleString('pt-BR')}% / ${brl(inp.issPfFixo)}</td></tr>
      </table>

      <h2>Carga estimada 2027 — CBS 11,3% (alíquota de referência calculada pelo TCU)</h2>
      <table class="avoid-break"><tr><th>Enquadramento</th><th>Carga mensal</th><th>% da receita</th><th>Crédito ao cliente PJ</th></tr>
        ${ORDEM.map(k => linhaRegime(res, k)).join('')}</table>
      <div class="avoid-break" style="margin:2mm 0 1mm">${barras(res)}</div>
      <p class="r-note"><b>Sobre a alíquota:</b> 11,3% é a referência da CBS calculada pelo TCU (TC 006.529/2026-7) e está
      sujeita a alteração pelo Senado até 15/12/2026 — sem votação, vale o cálculo do TCU. Refaça a simulação quando a
      alíquota for fixada. Os números já aplicam a redução de 30% da advocacia (art. 127 da LC 214/2025).</p>
      ${ultimoGrafico && ultimoGrafico.breakEven ? `
      <h2>Ponto de virada PF → PJ</h2>
      <p class="r-note" style="font-size:8.2pt;color:#2E3D4F">No modelo didático do gráfico (advogado atuando só; despesas
      tributadas de ${(ultimoGrafico.opts.despesasPct*100).toLocaleString('pt-BR')}% da receita; contabilidade da SUA de ${brl(ultimoGrafico.opts.contabPJ)}/mês;
      abertura de ${brl(ultimoGrafico.opts.custoAbertura)} diluída em ${ultimoGrafico.opts.amortMeses} meses; pró-labore de ${brl(ultimoGrafico.opts.prolabore)}),
      a SUA no Simples (Anexo IV) passa a custar menos que a pessoa física a partir de ≈ <b>${brl(ultimoGrafico.breakEven)}/mês</b> de receita.</p>` : ''}

      <p class="r-note">Premissas didáticas: redução de 30% do art. 127 da LC 214/2025 (CST 200 · cClassTrib 200052); crédito das
      despesas tributadas à alíquota cheia; crédito da contabilidade desprezado (conservador); parcela CBS do DAS ≈ 24%;
      Anexo IV com INSS patronal por fora; encargos CLT ≈ 54% da folha; IRPF pela tabela progressiva com a faixa da Lei
      15.270; INSS do contribuinte individual 20% até o teto (≈ R$ 8.475); sucumbência incluída na base em todos os
      enquadramentos (posição conservadora) — no Simples por decisão do STJ (REsp 2.262.105/SC); no regime regular, a
      não incidência pode ser discutida judicialmente, mas o tema é novo, sem precedentes sobre IBS/CBS, e deve render
      batalha jurídica: a estratégia é avaliada caso a caso, acompanhando a evolução.
      ${res.alertaRetencao ? ' <b>Atenção:</b> lucro estimado por sócio acima de R$ 50 mil/mês — retenção de 10% na distribuição (Lei 15.270).' : ''}</p>

      <div class="r-disc avoid-break"><b>Este diagnóstico não é parecer.</b> Conteúdo exclusivamente didático, com cenários
      ilustrativos construídos a partir dos atos oficiais vigentes em 7/11/2026 — a alíquota de referência da CBS será fixada
      pelo Senado até 15/12/2026 e a legislação da reforma está em constante alteração. Nenhuma decisão de regime, estrutura ou
      preço deve se basear só neste material: leve este relatório ao seu tributarista e ao seu contador para avaliação
      individualizada.</div>

      <div class="r-foot"><span><b>Reforma Tributária e Advocacia</b> · cartilha gratuita — edição pessoal, nov/2026</span>
      <span><b>Gustavo Pacher</b> · @gustavopacher</span></div>`;
    document.body.classList.add('print-report');
    window.print();
    setTimeout(() => document.body.classList.remove('print-report'), 500);
  }

  $('btnCalcular').addEventListener('click', calcularTudo);
  $('btnPdf').addEventListener('click', gerarPdf);

  /* ---------- gráfico: quando sair da PF para a PJ ---------- */
  let ultimoGrafico = null;

  function lerGrafico() {
    return {
      despesasPct: (+$('gDespesasPct').value || 0) / 100,
      contabPF: +$('gContabPF').value || 0,
      contabPJ: +$('gContabPJ').value || 0,
      custoAbertura: +$('gAbertura').value || 0,
      amortMeses: Math.max(1, +$('gAmort').value || 1),
      prolabore: +$('gProlabore').value || 0,
    };
  }

  function desenharGrafico(be) {
    const W = 720, H = 340, mL = 64, mR = 16, mT = 18, mB = 42;
    const iw = W - mL - mR, ih = H - mT - mB;
    const pts = be.pontos;
    const rMax = pts[pts.length - 1].r;
    const vMax = Math.max(...pts.map(p => Math.max(p.pf, p.pj))) * 1.08;
    const X = r => mL + (r / rMax) * iw;
    const Y = v => mT + ih - (v / vMax) * ih;
    const linha = key => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.r).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
    const kR = v => 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mil';

    // eixos e grades
    let grade = '';
    for (let i = 0; i <= 4; i++) {
      const v = (vMax / 4) * i, y = Y(v);
      grade += `<line x1="${mL}" y1="${y}" x2="${W - mR}" y2="${y}" stroke="#DDE5EE" stroke-width="1"/>
        <text x="${mL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#5B6B7D">${kR(v)}</text>`;
    }
    for (let r = 10000; r < rMax; r += 10000) {
      grade += `<text x="${X(r)}" y="${H - mB + 18}" text-anchor="middle" font-size="11" fill="#5B6B7D">${kR(r)}</text>
        <line x1="${X(r)}" y1="${mT}" x2="${X(r)}" y2="${H - mB}" stroke="#EEF2F7" stroke-width="1"/>`;
    }

    // faixa onde a PJ compensa + marcador do ponto de virada
    let marcador = '';
    if (be.breakEven) {
      const x = X(be.breakEven);
      marcador = `<rect x="${x}" y="${mT}" width="${W - mR - x}" height="${ih}" fill="#F5C518" opacity="0.08"/>
        <line x1="${x}" y1="${mT}" x2="${x}" y2="${H - mB}" stroke="#B4231F" stroke-width="2" stroke-dasharray="6 4"/>
        <text x="${Math.min(x + 8, W - 150)}" y="${mT + 16}" font-size="12" font-weight="700" fill="#B4231F">virada ≈ ${brl(be.breakEven)}/mês</text>`;
    }

    $('grafico').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Custo mensal total: pessoa física × sociedade (SUA no Simples)" style="width:100%;height:auto;display:block">
        ${grade}
        <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${H - mB}" stroke="#5B6B7D" stroke-width="1.5"/>
        <line x1="${mL}" y1="${H - mB}" x2="${W - mR}" y2="${H - mB}" stroke="#5B6B7D" stroke-width="1.5"/>
        ${marcador}
        <path d="${linha('pf')}" fill="none" stroke="#0B1F33" stroke-width="3"/>
        <path d="${linha('pj')}" fill="none" stroke="#D9A400" stroke-width="3"/>
        <text x="${W - mR}" y="${H - 6}" text-anchor="end" font-size="11" fill="#5B6B7D">receita mensal</text>
      </svg>
      <div class="graf-legenda">
        <span><i style="background:#0B1F33"></i>Pessoa física (regime regular)</span>
        <span><i style="background:#D9A400"></i>SUA no Simples (Anexo IV) + custos fixos</span>
      </div>`;
  }

  function renderGrafico() {
    const o = lerGrafico();
    const be = breakEvenPFvsPJ(o);
    ultimoGrafico = be;
    desenharGrafico(be);
    $('beTexto').innerHTML = be.breakEven
      ? `A partir de ≈ <b>${brl(be.breakEven)}/mês</b> de receita, virar PJ passa a custar menos — mesmo pagando
         contador (${brl(o.contabPJ)}/mês), pró-labore de ${brl(o.prolabore)} (com INSS e IRPF) e a abertura de
         ${brl(o.custoAbertura)} diluída em ${o.amortMeses} meses. Abaixo disso, os custos fixos da PJ comem a vantagem.`
      : 'Com esses custos fixos, a PJ não compensa na faixa simulada (até R$ 40 mil/mês) — reveja os parâmetros.';
  }

  ['gDespesasPct', 'gContabPF', 'gContabPJ', 'gAbertura', 'gAmort', 'gProlabore']
    .forEach(id => $(id).addEventListener('input', renderGrafico));
  renderGrafico();

  /* ---------- checklist ---------- */
  const respostas = {};
  document.querySelectorAll('#quiz .q').forEach(q => {
    q.querySelectorAll('.opts button').forEach(btn => {
      btn.addEventListener('click', () => {
        q.querySelectorAll('.opts button').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        respostas[q.dataset.q] = btn.dataset.v;
        if (Object.keys(respostas).length === 4) mostrarQuiz();
      });
    });
  });

  function mostrarQuiz() {
    const r = respostas;
    let titulo, pontos = [];
    if (r['3'] === 'sim') {
      titulo = 'Tendência: lucro presumido ou real';
      pontos.push('Acima do teto de R$ 4,8 mi/ano o Simples não é opção: compare presumido × real com créditos próprios integrais e IRPJ/CSLL e ISS por fora.');
    } else if (r['1'] === 'sim') {
      titulo = 'Tendência: simular o Simples híbrido';
      pontos.push('Seu cliente típico credita a nota: no híbrido o crédito integral de IBS/CBS vira argumento de preço — apresente proposta em três linhas (honorários, tributo destacado, crédito estimado). O cliente compara o custo líquido, não o preço de tabela.');
    } else {
      titulo = 'Tendência: Simples Nacional integral';
      pontos.push('Quem não apura IBS/CBS (pessoa física e cliente do Simples) não aproveita crédito — a nota “mais cara com crédito” não ajuda. Manter IBS/CBS dentro do DAS tende a ser o caminho, salvo conclusão diversa da simulação.');
    }
    if (r['4'] === 'sim') pontos.push('Folha pequena + despesas tributadas altas favorecem o regime regular (créditos próprios): inclua presumido/híbrido na simulação.');
    else pontos.push('Folha pesada reduz o alívio dos créditos — a folha não gera crédito de IBS/CBS. Reavalie preços para 2027.');
    if (r['2'] === 'sim') pontos.push('Sucumbência relevante: no Simples ela integra a receita bruta do DAS (STJ, REsp 2.262.105/SC). Fora do Simples a tese da não incidência tem acolhida — segregue registros e converse com seu tributarista sobre medida preventiva antes de 2027.');
    pontos.push('Use a calculadora acima com doze meses de números reais e leve o diagnóstico ao seu contador. Atenção ao prazo: quem optou pelo híbrido em setembro/outubro pode <b>cancelar a opção até 20/12/2026</b>; quem não optou segue com IBS/CBS no DAS e decide de novo na janela prevista para março/2027.');
    const el = $('quizResult');
    el.innerHTML = `<h4>${titulo}</h4><ul>${pontos.map(p => `<li>${p}</li>`).join('')}</ul>`;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
