// Motor de sugestão da importação de OFX.
//
// Duas perguntas, nesta ordem, para cada linha do extrato:
//   1. isso já está lançado no sistema?  -> conciliar, não criar de novo
//   2. se não está, qual rubrica?        -> deduzir do que já foi lançado antes
//
// Nada aqui grava: o motor só propõe. Quem decide é quem revisa a tela.

import { Lancamento, Categoria, Leilao } from '../types';
import { formatDate as formatarData } from './format';
import { TransacaoOfx, normalizarNome } from './ofx';

export type Acao = 'conciliar' | 'criar' | 'ignorar';
export type Confianca = 'alta' | 'media' | 'baixa' | 'nenhuma';

/** O que faz suspeitar que a linha já está lançada, mesmo sem casar direto. */
export interface Alerta {
  lancamento: Lancamento;
  texto: string;
  forte: boolean;             // mesmo pagador, além do mesmo valor
}

/**
 * Uma fatia de um pagamento repartido em várias rubricas — o mesmo formato
 * que o cadastro manual grava em `split_revenue`. Um PIX de R$ 100 pode ser
 * 20 numa rubrica, 30 noutra e 50 numa terceira.
 */
export interface Divisao {
  id: string;
  categoria_id: string;
  valor: number;              // centavos
  leilao_id: string;
  fornecedor: string;
}

/** Lê as divisões de um lançamento já gravado, para mostrar na tela. */
export const lerDivisoes = (l: Lancamento | null): Divisao[] => {
  if (!l?.split_revenue || !Array.isArray(l.split_revenue)) return [];
  return (l.split_revenue as unknown as Divisao[])
    .filter(d => d && typeof d === 'object')
    .map((d, i) => ({
      id: `${l.id}-${i}`,
      categoria_id: String(d.categoria_id ?? ''),
      valor: Number(d.valor) || 0,
      leilao_id: d.leilao_id ? String(d.leilao_id) : '',
      fornecedor: String(d.fornecedor ?? ''),
    }));
};

export interface LinhaImportacao {
  chave: string;              // fitid, ou data+valor+índice quando o banco omite
  transacao: TransacaoOfx;
  acao: Acao;
  duplicada: boolean;         // já importada antes (mesmo FITID no banco)
  existente: Lancamento | null;
  ambiguo: boolean;           // mais de um lançamento candidato à conciliação
  alerta: Alerta | null;      // parece já lançado, mas não o bastante para conciliar
  categoria_id: string;
  divisoes: Divisao[];        // vazio = pagamento inteiro numa rubrica só
  leilao_id: string;
  leilaoConfianca: Confianca;  // nenhuma = ninguém sugeriu, quem revisa escolhe
  leilaoMotivo: string;
  fornecedor: string;
  descricao: string;
  data_competencia: string;
  confianca: Confianca;
  motivo: string;
}

// Casamento seguro: mesma data, ou quase — o banco às vezes credita no dia
// seguinte ao que a equipe lançou.
const TOLERANCIA_DIAS = 3;
// Com o pagador batendo, a folga é maior: a equipe lança na data combinada e
// o pagamento sai dias depois.
const TOLERANCIA_DIAS_MESMO_PAGADOR = 7;
// Fora dessa folga ainda dá para desconfiar, sem afirmar. Duas janelas: uma
// para "mesmo valor" e outra, mais larga, para "mesmo valor e mesmo pagador".
const ALERTA_DIAS = 15;
const ALERTA_DIAS_MESMO_PAGADOR = 45;

/**
 * Só estas famílias de rubrica pertencem a um leilão: receitas (10), custos
 * do evento (20, 21, 22) e repasses de terceiros (50). Imposto, folha,
 * escritório e o resto são da empresa, não do evento — no histórico, menos de
 * 1% desses lançamentos tem leilão, e quando tem é engano.
 */
const PREFIXOS_COM_LEILAO = ['10', '20', '21', '22', '50'];

export const rubricaTemLeilao = (codigo: string | undefined | null): boolean =>
  !!codigo && PREFIXOS_COM_LEILAO.some(p => codigo.trim().startsWith(p));

/**
 * Janela em que um movimento pode pertencer a um evento. Medido nos 9.559
 * lançamentos que já têm leilão: a despesa começa ~20 dias antes do remate e
 * a cobrança se arrasta depois dele; 95% cai entre 120 dias depois do evento
 * e 45 dias antes dele. Fora disso o leilão é de outra temporada.
 */
const EVENTO_ANTES_DIAS = 120;   // evento já aconteceu há até 120 dias
const EVENTO_DEPOIS_DIAS = 45;   // evento ainda vai acontecer, em até 45 dias

/** Mesmo mês de calendário — datas vêm como AAAA-MM-DD. */
const mesmoMes = (a: string, b: string): boolean => !!a && !!b && a.slice(0, 7) === b.slice(0, 7);

const diasEntre = (a: string, b: string): number =>
  Math.round(Math.abs(Date.parse(a + 'T12:00:00') - Date.parse(b + 'T12:00:00')) / 86400000);

// Forma jurídica não identifica ninguém: "REMATEFY" e "REMATEFY LTDA" são o
// mesmo pagador, e manter essas palavras só afasta os nomes na comparação.
const FORMA_JURIDICA = new Set(['LTDA', 'EIRELI', 'EPP', 'MEI', 'CIA', 'SOCIEDADE']);

const tokens = (nome: string): string[] =>
  normalizarNome(nome).split(' ').filter(t => t.length > 2 && !FORMA_JURIDICA.has(t));

/** Jaccard entre conjuntos de palavras — tolera ordem e nome do meio faltando. */
const semelhanca = (a: string, b: string): number => {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let comuns = 0;
  ta.forEach(t => { if (tb.has(t)) comuns++; });
  return comuns / (ta.size + tb.size - comuns);
};

/**
 * Um nome está contido no outro? O banco manda o nome completo e a equipe
 * escreve o curto: "FINANCE" × "FINANCE GESTÃO EMPRESARIAL LTDA", "EDUARDO
 * CARDOSO" × "EDUARDO MEIRELLES CARDOSO". Medir por Jaccard punia justamente
 * esses casos — o nome mais completo derrubava a nota. Aqui basta que todas
 * as palavras do lado curto estejam no longo, com pelo menos uma delas
 * distintiva, para não casar por "DA SILVA" ou "501".
 */
const nomeContido = (a: string, b: string): boolean => {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return false;
  const [curto, longo] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let distintiva = false;
  for (const t of curto) {
    if (!longo.has(t)) return false;
    if (t.length >= 5) distintiva = true;
  }
  return distintiva;
};

/**
 * Mesmo pagador? O nome do extrato quase nunca é igual ao do cadastro: a
 * equipe escreve "M3 ASSISTÊNCIA RURAL LTDA/DIEGO FERREIRA NUNES" e o banco
 * manda "M3 ASSISTENCIA RURAL LTDA". Exigir igualdade perderia justamente os
 * casos que interessam.
 */
const mesmoPagador = (fornecedor: string, contraparte: string): boolean => {
  const a = normalizarNome(fornecedor || '');
  if (!a || !contraparte) return false;
  if (a === contraparte) return true;
  if (a.length >= 8 && contraparte.length >= 8 && (a.includes(contraparte) || contraparte.includes(a))) return true;
  if (nomeContido(a, contraparte)) return true;
  return semelhanca(a, contraparte) >= 0.6;
};

/** Rubrica que mais aparece num conjunto de lançamentos, com sua participação. */
const rubricaDominante = (lancs: Lancamento[]): { categoria_id: string; share: number; n: number } => {
  const contagem = new Map<string, number>();
  lancs.forEach(l => {
    if (!l.categoria_id) return;
    contagem.set(l.categoria_id, (contagem.get(l.categoria_id) ?? 0) + 1);
  });
  let melhor = '';
  let max = 0;
  let total = 0;
  contagem.forEach((n, id) => {
    total += n;
    if (n > max) { max = n; melhor = id; }
  });
  return { categoria_id: melhor, share: total ? max / total : 0, n: total };
};

/**
 * Leilão provável para um movimento, a partir do que o mesmo pagador já
 * rendeu antes — considerando só os eventos da temporada do movimento.
 *
 * Sem a janela, um pagador que aparece todo ano puxava a edição de 2023 para
 * um pagamento de 2026: os nomes se repetem (CATEL, RMK, SJ…) e a contagem
 * bruta premiava o ano com mais lançamentos. Medido contra a base: a regra
 * antiga acertava 30%; esta, exigindo 2+ lançamentos e 60% de concentração,
 * acerta 85%. Quando a evidência é mais fraca ela ainda sugere, mas avisa —
 * e, sem evidência nenhuma, deixa em branco em vez de chutar.
 */
const leilaoDoHistorico = (
  lancs: Lancamento[],
  data: string,
  naJanela: (leilaoId: string) => boolean,
): { leilao_id: string; confianca: Confianca; motivo: string } => {
  const contagem = new Map<string, number>();
  let total = 0;
  lancs.forEach(l => {
    if (!l.leilao_id || !naJanela(l.leilao_id)) return;
    contagem.set(l.leilao_id, (contagem.get(l.leilao_id) ?? 0) + 1);
    total++;
  });

  let melhor = '';
  let max = 0;
  contagem.forEach((n, id) => { if (n > max) { max = n; melhor = id; } });
  if (!melhor || !total) return { leilao_id: '', confianca: 'nenhuma', motivo: '' };

  const share = max / total;
  const confianca: Confianca = max >= 2 && share >= 0.6 ? 'alta'
    : share >= 0.4 ? 'media'
      : 'nenhuma';
  if (confianca === 'nenhuma') {
    return { leilao_id: '', confianca, motivo: '' };
  }
  return {
    leilao_id: melhor,
    confianca,
    motivo: max >= 2
      ? `${max} lançamento(s) desse pagador nesse leilão`
      : 'um lançamento desse pagador nesse leilão',
  };
};

interface Indices {
  porValor: Map<number, Lancamento[]>;
  porFornecedor: Map<string, Lancamento[]>;
  fornecedores: string[];
  porMemo: Map<string, Lancamento[]>;
  fitidsUsados: Set<string>;
}

/**
 * Índices do histórico. Montados uma vez por importação: são 12 mil
 * lançamentos contra algumas centenas de linhas de extrato, e varrer a lista
 * inteira por linha custaria caro na tela.
 */
export const indexarHistorico = (transactions: Lancamento[]): Indices => {
  const porValor = new Map<number, Lancamento[]>();
  const porFornecedor = new Map<string, Lancamento[]>();
  const porMemo = new Map<string, Lancamento[]>();
  const fitidsUsados = new Set<string>();

  transactions.forEach(l => {
    const valor = Number(l.valor) || 0;
    if (!porValor.has(valor)) porValor.set(valor, []);
    porValor.get(valor)!.push(l);

    const forn = normalizarNome(l.fornecedor || '');
    if (forn) {
      if (!porFornecedor.has(forn)) porFornecedor.set(forn, []);
      porFornecedor.get(forn)!.push(l);
    }

    // Lançamentos criados por importações anteriores guardam a origem: é o
    // sinal mais forte que existe, porque é o mesmo texto do mesmo banco.
    const memo = normalizarNome(l.ofx_memo || '');
    if (memo) {
      if (!porMemo.has(memo)) porMemo.set(memo, []);
      porMemo.get(memo)!.push(l);
    }
    if (l.ofx_fitid) fitidsUsados.add(l.ofx_fitid);
  });

  return {
    porValor,
    porFornecedor,
    porMemo,
    fitidsUsados,
    fornecedores: [...porFornecedor.keys()],
  };
};

/**
 * Procura no histórico a melhor referência para uma transação nova.
 * Devolve os lançamentos parecidos e o texto que explica por que são parecidos
 * — o motivo aparece na tela, para quem revisa poder discordar com base.
 */
const buscarReferencia = (
  t: TransacaoOfx,
  tipo: 'receita' | 'despesa',
  idx: Indices,
): { lancs: Lancamento[]; motivo: string; peso: number } => {
  const doTipo = (lancs: Lancamento[]) => lancs.filter(l => l.tipo === tipo);

  // 1. Mesmo texto de extrato já importado antes.
  const porMemo = doTipo(idx.porMemo.get(normalizarNome(t.memo)) ?? []);
  if (porMemo.length) {
    return { lancs: porMemo, motivo: `mesmo texto de extrato já classificado ${porMemo.length}×`, peso: 1 };
  }

  if (t.contraparte) {
    // 2. Fornecedor idêntico.
    const exato = doTipo(idx.porFornecedor.get(t.contraparte) ?? []);
    if (exato.length) {
      return { lancs: exato, motivo: `${exato.length} lançamento(s) de "${t.contraparte}"`, peso: 0.95 };
    }

    // 3. Um nome contém o outro ("MOVIDA" x "MOVIDA PARTICIPACOES S A").
    const contido = idx.fornecedores.filter(f =>
      f.length >= 8 && (f.includes(t.contraparte) || t.contraparte.includes(f)));
    if (contido.length) {
      const lancs = doTipo(contido.flatMap(f => idx.porFornecedor.get(f) ?? []));
      if (lancs.length) {
        return { lancs, motivo: `nome parecido com "${contido[0]}"`, peso: 0.8 };
      }
    }

    // 4. Mesmas palavras em ordem diferente, ou faltando o nome do meio.
    let melhorNome = '';
    let melhorScore = 0;
    idx.fornecedores.forEach(f => {
      const s = semelhanca(f, t.contraparte);
      if (s > melhorScore) { melhorScore = s; melhorNome = f; }
    });
    if (melhorScore >= 0.6) {
      const lancs = doTipo(idx.porFornecedor.get(melhorNome) ?? []);
      if (lancs.length) {
        return { lancs, motivo: `parecido com "${melhorNome}" (${Math.round(melhorScore * 100)}%)`, peso: 0.65 };
      }
    }
  }

  // 5. Ninguém conhecido: cai no valor. Vale para tarifa e mensalidade, que
  //    repetem o mesmo centavo todo mês; erra quando dois pagamentos
  //    diferentes têm o mesmo valor, por isso o peso é baixo.
  const porValor = doTipo(idx.porValor.get(t.valor) ?? []);
  if (porValor.length >= 2) {
    return { lancs: porValor, motivo: `mesmo valor já lançado ${porValor.length}×`, peso: 0.5 };
  }

  return { lancs: [], motivo: '', peso: 0 };
};

const grauDeConfianca = (share: number, n: number, peso: number): Confianca => {
  const nota = share * peso;
  if (nota >= 0.75 && n >= 3) return 'alta';
  if (nota >= 0.5 && n >= 2) return 'media';
  if (n >= 1) return 'baixa';
  return 'nenhuma';
};

// Não existe palpite de leilão "pelo evento mais próximo": medido na base,
// acerta 10% — há em média 70 remates dentro da janela de um pagamento, e em
// temporada de Expointer são vários no mesmo dia. Chutar aí só dá trabalho de
// desfazer, então quem revisa escolhe.

export interface ParametrosSugestao {
  transacoes: TransacaoOfx[];
  historico: Lancamento[];    // todos os lançamentos visíveis
  bancoId: string;            // banco escolhido para este extrato
  categorias: Categoria[];
  leiloes: Leilao[];
}

/**
 * Monta as linhas da tela de revisão: o que conciliar, o que criar e com qual
 * rubrica. A conciliação é 1 para 1 — um lançamento do sistema não pode ser
 * reivindicado por duas linhas do extrato.
 */
export const montarSugestoes = ({
  transacoes, historico, bancoId, categorias, leiloes,
}: ParametrosSugestao): LinhaImportacao[] => {
  const idx = indexarHistorico(historico);

  // Candidatos à conciliação saem de todas as contas, não só da do extrato.
  // A equipe lança pelo que combinou, e o pagamento sai de outra conta do
  // grupo — são duas contas no mesmo banco, e o lançamento certo ficava
  // invisível para a importação, que criava um segundo no lugar.
  const candidatosPorValor = new Map<number, Lancamento[]>();
  historico.forEach(l => {
    const v = Number(l.valor) || 0;
    if (!candidatosPorValor.has(v)) candidatosPorValor.set(v, []);
    candidatosPorValor.get(v)!.push(l);
  });

  const jaTomados = new Set<string>();
  const categoriasValidas = new Set(categorias.map(c => c.id));
  const dataLeilao = new Map(leiloes.filter(l => l.data).map(l => [l.id, l.data]));

  /** O evento pode ter a ver com um movimento desta data? */
  const naJanela = (leilaoId: string, data: string): boolean => {
    const evento = dataLeilao.get(leilaoId);
    if (!evento) return false;
    const dias = Math.round((Date.parse(data + 'T12:00:00') - Date.parse(evento + 'T12:00:00')) / 86400000);
    return dias <= EVENTO_ANTES_DIAS && dias >= -EVENTO_DEPOIS_DIAS;
  };
  const codigoPorId = new Map(categorias.map(c => [c.id, c.codigo]));
  const aceitaLeilao = (categoriaId: string) => rubricaTemLeilao(codigoPorId.get(categoriaId));

  // Data exata primeiro: assim uma linha que casa no dia não perde o
  // lançamento para outra que casaria só pela tolerância de 3 dias.
  const ordem = [...transacoes.keys()].sort((a, b) =>
    transacoes[a].data.localeCompare(transacoes[b].data));

  const linhas: LinhaImportacao[] = new Array(transacoes.length);

  ordem.forEach(i => {
    const t = transacoes[i];
    const tipo: 'receita' | 'despesa' = t.tipo === 'credito' ? 'receita' : 'despesa';

    const pagadorBate = (l: Lancamento) => mesmoPagador(l.fornecedor, t.contraparte);

    const candidatos = (candidatosPorValor.get(t.valor) ?? [])
      .filter(l => {
        if (l.tipo !== tipo || jaTomados.has(l.id)) return false;
        const mesmoNome = pagadorBate(l);
        if (diasEntre(l.data_pagamento, t.data) > (mesmoNome ? TOLERANCIA_DIAS_MESMO_PAGADOR : TOLERANCIA_DIAS)) return false;
        // Fora da conta do extrato, só casa quando o pagador também bate: num
        // mesmo dia saem vários PIX de valor redondo igual, e puxar para cá o
        // lançamento de outra conta sem essa certeza é pior que criar um novo.
        return l.banco_id === bancoId || mesmoNome;
      })
      .sort((a, b) =>
        Number(b.banco_id === bancoId) - Number(a.banco_id === bancoId)
        || Number(pagadorBate(b)) - Number(pagadorBate(a))
        || diasEntre(a.data_pagamento, t.data) - diasEntre(b.data_pagamento, t.data));

    const existente = candidatos[0] ?? null;
    const mesmaData = candidatos.filter(l => l.data_pagamento === t.data);
    if (existente) jaTomados.add(existente.id);

    const duplicada = !!t.fitid && idx.fitidsUsados.has(t.fitid);

    // Não casou dentro da folga, mas existe algo parecido demais para criar
    // sem avisar: mesmo valor e mesmo sentido, perto da data. Se o pagador
    // também bate, a janela é maior e o alerta é mais firme.
    // Com pagador diferente, só dentro do mesmo mês: mensalidade, diária e
    // comissão repetem o mesmo valor todo mês, e o lançamento do mês passado
    // não é este. Com o mesmo pagador, a virada de mês não atrapalha — lançar
    // em 02/10 o que o banco pagou em 30/09 é rotina.
    let alerta: Alerta | null = null;
    if (!existente && !duplicada) {
      const parecidos = (candidatosPorValor.get(t.valor) ?? [])
        .filter(l => l.tipo === tipo && !jaTomados.has(l.id)
          && (mesmoPagador(l.fornecedor, t.contraparte) || mesmoMes(l.data_pagamento, t.data)))
        .map(l => ({ l, dias: diasEntre(l.data_pagamento, t.data) }))
        .filter(({ l, dias }) =>
          dias <= (mesmoPagador(l.fornecedor, t.contraparte) ? ALERTA_DIAS_MESMO_PAGADOR : ALERTA_DIAS))
        .sort((a, b) => a.dias - b.dias);

      if (parecidos.length) {
        // Com o mesmo pagador em cena, o mais provável é ser o mesmo
        // movimento lançado com a data prevista; ordena o pagador na frente.
        parecidos.sort((a, b) =>
          Number(mesmoPagador(b.l.fornecedor, t.contraparte)) - Number(mesmoPagador(a.l.fornecedor, t.contraparte))
          || a.dias - b.dias);
        const { l, dias } = parecidos[0];
        const forte = mesmoPagador(l.fornecedor, t.contraparte);
        alerta = {
          lancamento: l,
          forte,
          texto: `já existe um lançamento de ${formatarData(l.data_pagamento)}`
            + ` com o mesmo valor${forte ? ` e o mesmo pagador` : ''}`
            + ` (${dias} dia${dias === 1 ? '' : 's'} de diferença)`,
        };
      }
    }

    let categoria_id = existente?.categoria_id ?? '';
    let leilao_id = existente?.leilao_id ?? '';
    let leilaoConfianca: Confianca = existente?.leilao_id ? 'alta' : 'nenhuma';
    let leilaoMotivo = existente?.leilao_id ? 'leilão do lançamento que já existe' : '';
    let fornecedor = existente?.fornecedor ?? t.contraparte;
    let divisoes: Divisao[] = [];
    let confianca: Confianca = 'nenhuma';
    let motivo = '';

    if (existente) {
      confianca = 'alta';
      motivo = mesmaData.length > 1
        ? `${mesmaData.length} lançamentos com esse valor no dia — confira qual é`
        : existente.data_pagamento === t.data
          ? 'lançamento com mesma data e valor'
          : `lançamento de ${existente.data_pagamento} com o mesmo valor`;
    } else {
      const ref = buscarReferencia(t, tipo, idx);
      if (ref.lancs.length) {
        const dom = rubricaDominante(ref.lancs);
        if (dom.categoria_id && categoriasValidas.has(dom.categoria_id)) {
          categoria_id = dom.categoria_id;
          confianca = grauDeConfianca(dom.share, dom.n, ref.peso);
          motivo = `${ref.motivo}, ${Math.round(dom.share * 100)}% nessa rubrica`;
        }
        const sugLeilao = leilaoDoHistorico(ref.lancs, t.data, id => naJanela(id, t.data));
        leilao_id = sugLeilao.leilao_id;
        leilaoConfianca = sugLeilao.confianca;
        leilaoMotivo = sugLeilao.motivo;
        const nomeConhecido = ref.lancs.find(l => l.fornecedor)?.fornecedor;
        if (ref.peso >= 0.8 && nomeConhecido) fornecedor = nomeConhecido;

        // Pagamento recorrente que a equipe costuma repartir: se a referência
        // é forte (mesmo texto ou mesmo pagador) e o valor é idêntico, repete
        // a mesma abertura de rubricas. Valor diferente não herda — a divisão
        // antiga não teria como fechar a conta.
        if (ref.peso >= 0.95) {
          const modelo = ref.lancs.find(l =>
            Number(l.valor) === t.valor && lerDivisoes(l).length > 1);
          if (modelo) {
            // A repartição antiga pode apontar para o evento do ano passado:
            // o rateio entre rubricas se repete, o leilão não.
            divisoes = lerDivisoes(modelo).map((d, i) => ({
              ...d,
              id: `sug-${i}`,
              leilao_id: d.leilao_id && naJanela(d.leilao_id, t.data) ? d.leilao_id : '',
            }));
            categoria_id = divisoes[0].categoria_id;
            motivo = `${ref.motivo}, repartida em ${divisoes.length} rubricas como antes`;
            confianca = 'alta';
          }
        }
      }
    }

    // Rubrica fora das famílias de evento não leva leilão, nem sugerido pelo
    // histórico nem pela data mais próxima.
    if (!existente) {
      if (!aceitaLeilao(categoria_id)) leilao_id = '';
      divisoes = divisoes.map(d => aceitaLeilao(d.categoria_id) ? d : { ...d, leilao_id: '' });
    }

    // Mesmo valor e mesmo pagador no mês: quase certamente é o mesmo
    // movimento lançado com outra data, então já nasce em "conciliar" — o
    // aviso fica à vista para quem revisa discordar. Só o valor batendo, com
    // outro pagador, é indício fraco: nasce em "criar" com o aviso ao lado,
    // porque ignorar por engano tira o movimento do DRE sem ninguém ver.
    const acao: Acao = duplicada ? 'ignorar'
      : existente ? 'conciliar'
        : alerta?.forte ? 'conciliar'
          : 'criar';

    linhas[i] = {
      chave: t.fitid || `${t.data}-${t.valor}-${i}`,
      transacao: t,
      acao,
      duplicada,
      existente,
      ambiguo: mesmaData.length > 1,
      alerta,
      categoria_id,
      divisoes,
      leilao_id,
      leilaoConfianca,
      leilaoMotivo,
      fornecedor,
      descricao: t.memo,
      data_competencia: t.data,
      confianca,
      motivo: duplicada
        ? 'já importada de um extrato anterior'
        : alerta ? alerta.texto : motivo,
    };
  });

  return linhas;
};

/** Contagem para o rodapé da tela. */
export const resumir = (linhas: LinhaImportacao[], bancoId = '') => ({
  total: linhas.length,
  conciliar: linhas.filter(l => l.acao === 'conciliar').length,
  criar: linhas.filter(l => l.acao === 'criar').length,
  ignorar: linhas.filter(l => l.acao === 'ignorar').length,
  semRubrica: linhas.filter(l => l.acao === 'criar' && !l.categoria_id).length,
  // Rubrica de evento sem leilão escolhido: não trava a gravação, mas é o que
  // quem revisa precisa olhar depois que a sugestão parou de chutar.
  semLeilao: linhas.filter(l => l.acao === 'criar' && !l.leilao_id).length,
  duplicadas: linhas.filter(l => l.duplicada).length,
  jaLancados: linhas.filter(l => l.alerta || l.duplicada).length,
  // Conciliações que vão corrigir a conta do lançamento: o extrato é a prova
  // de qual conta pagou.
  outraConta: linhas.filter(l => l.acao === 'conciliar' && contaDiferente(l, bancoId)).length,
  // Avisadas de que já existem e ainda assim marcadas para criar: é o que a
  // tela precisa confirmar antes de gravar. O alerta fraco (só o valor bate,
  // pagador diferente) nasce em "criar" de propósito e não pede confirmação.
  criarMesmoAvisado: linhas.filter(l => l.acao === 'criar' && (l.alerta?.forte || l.duplicada)).length,
});

/**
 * A conciliação vai mexer na conta do lançamento? Acontece quando a equipe
 * lançou numa conta e o pagamento saiu de outra: o extrato é quem prova qual
 * conta pagou, então conciliar corrige o banco.
 */
export const contaDiferente = (l: LinhaImportacao, bancoId: string): boolean => {
  const alvo = alvoConciliacao(l);
  return !!alvo && !!bancoId && alvo.banco_id !== bancoId;
};

/** O lançamento com que a linha pode ser conciliada, tenha casado ou só se parecido. */
export const alvoConciliacao = (l: LinhaImportacao): Lancamento | null =>
  l.existente ?? l.alerta?.lancamento ?? null;
