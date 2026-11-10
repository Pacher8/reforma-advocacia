# Site da cartilha — Reforma Tributária e Advocacia (Gustavo Pacher)

One-page estático com calculadora do impacto da Reforma (2027), checklist de carteira e geração de
diagnóstico em PDF. **Tudo client-side** — nenhum backend, nenhum dado sai do navegador do visitante.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | A página (hero, conteúdo da cartilha, CTA, calculadora, checklist, autor, rodapé) |
| `styles.css` | Identidade visual EMENTA (azul-marinho `#0B1F33` + amarelo `#F5C518`) + CSS de impressão do relatório |
| `calc.js` | Motor de cálculo puro (caps. 3, 6, 7 e 8 da cartilha) — roda no navegador e no Node |
| `app.js` | Interface: formulário, cenário CBS 11,3% (TCU), gráfico PF→PJ, checklist e PDF |
| `test-calc.js` | Validação dos números contra os exemplos da cartilha (`node test-calc.js`) |

## Rodar localmente

```bash
python -m http.server 8742
```

e abra `http://localhost:8742`.

## Publicar

**Link provisório (já no ar):** https://claude.ai/artifact/Krm48eki2jqSUbKne2JxYb — privado por padrão; liberar no menu **Share** ("anyone with the link") para teste/compartilhamento. O PDF da cartilha está publicado junto (arquivo `cartilha.pdf`).

**Publicação oficial (recomendada para o link da bio):**
1. **Netlify Drop**: arraste ESTA pasta inteira em [app.netlify.com/drop](https://app.netlify.com/drop) — sai com URL https na hora (o `cartilha.pdf` já está dentro e fica acessível em `/cartilha.pdf`).
2. **Domínio próprio**: aponte um CNAME (ex.: `reforma.gustavopacher.adv.br`) para o host — o link da bio e o link do PDF ficam na SUA marca.
3. Alternativas: Vercel (`npx vercel`) ou qualquer hospedagem via FTP (6 arquivos).

**Mecânica "comente ADVOCACIA" (entrega da cartilha por DM):**
- Ferramenta: **ManyChat** (parceiro oficial da Meta — não viola as regras do Instagram): gatilho = comentário com a palavra "ADVOCACIA" no post fixado → resposta automática na DM com o link `https://SEU-DOMINIO/cartilha.pdf` + convite para a calculadora.
- Enquanto o ManyChat não estiver configurado: responder manualmente as DMs (viável nos primeiros dias; o comentário continua alimentando o algoritmo).
- Na legenda dos posts: "calculadora no **link da bio**" (links em legenda não são clicáveis no Instagram) e CTA "comente ADVOCACIA".

## O PDF de diagnóstico

O botão **"Gerar meu diagnóstico em PDF"** monta o relatório e abre a caixa de impressão do navegador —
o visitante escolhe "Salvar como PDF". Fiel ao design, sem bibliotecas externas.

## Premissas do cálculo (didáticas — fechamento 7/11/2026)

- Redução de 30% do art. 127 da LC 214/2025; CBS de **11,3%** — alíquota de referência calculada pelo TCU (TC 006.529/2026-7), sujeita a alteração pelo Senado até 15/12/2026 (sem votação, vale o cálculo do TCU).
- Gráfico "quando sair da PF para a PJ": PF regime regular × SUA Simples Anexo IV, somando à PJ contabilidade mensal, custo de abertura diluído e pró-labore obrigatório (INSS + IRPF) — função `breakEvenPFvsPJ` em `calc.js`.
- Débito 2027 = receita × referência × 70% (CBS−0,1 p.p. + IBS 0,1%); crédito das despesas tributadas à alíquota cheia; crédito da contabilidade desprezado (conservador).
- Anexo IV com INSS patronal por fora; parcela CBS do DAS ≈ 24%; encargos CLT ≈ 54% da folha.
- IRPF tabela progressiva + faixa da Lei 15.270; INSS individual 20% até o teto (≈ R$ 8.475).
- Sucumbência integra a base em **todos** os enquadramentos (posição conservadora): no Simples por decisão do STJ (REsp 2.262.105/SC); no regime regular, a não incidência pode ser discutida judicialmente, mas o tema é novo, **sem precedentes sobre IBS/CBS**, e ainda renderá batalha jurídica — a calculadora inclui no custo e a estratégia de contencioso é avaliada caso a caso.

Validação: `node test-calc.js` reproduz o cap. 6 (32,9% / 14,7% / 28,6%) e o cap. 7 (8,5% / 12,5% / 16,7%).

> Conteúdo exclusivamente didático. Não substitui parecer jurídico nem a apuração contábil.
