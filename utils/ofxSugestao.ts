// Motor de sugestão da importação de OFX.
//
// Duas perguntas, nesta ordem, para cada linha do extrato:
//   1. isso já está lançado no sistema?  -> conciliar, não criar de novo
//   2. se não está, qual rubrica?        -> deduzir do que já foi lançado antes
//
// Nada aqui grava: o motor só propõe. Quem decide é quem revisa a tela.

import { Lancamento, Categoria, Leilao } from '../types';
import { TransacaoOfx, normalizarNome } from './ofx';

export type Acao = 'conciliar' | 'criar' | 'ignorar';
export type Confianca = 'alta' | 'media' | 'baixa' | 'nenhuma';

export interface LinhaImportacao {
  chave: string;              // fitid, ou data+valor+índice quando o banco omite
  transacao: TransacaoOfx;
  acao: Acao;
  duplicada: boolean;         // já importada antes (mesmo FITID no banco)
  existente: Lancamento | null;
  ambiguo: boolean;           // mais de um lançamento candidato à conciliação
  categoria_id: string;
  leilao_id: string;
  fornecedor: string;
  descricao: string;
  data_competencia: string;
  confianca: Confianca;
  motivo: string;
}

const TOLERANCIA_DIAS = 3;

const diasEntre = (a: string, b: string): number =>
  Math.round(Math.abs(Date.parse(a + 'T12:00:00') - Date.parse(b + 'T12:00:00')) / 86400000);

const tokens = (nome: string): string[] =>
  normalizarNome(nome).split(' ').filter(t => t.length > 2);

/** Jaccard entre conjuntos de palavras — tolera ordem e nome do meio faltando. */
const semelhanca = (a: string, b: string): number => {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let comuns = 0;
  ta.forEach(t => { if (tb.has(t)) comuns++; });
  return comuns / (ta.size + tb.size - comuns);
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

/** Leilão mais frequente entre os lançamentos, quando há um claro favorito. */
const leilaoDominante = (lancs: Lancamento[]): string => {
  const contagem = new Map<string, number>();
  lancs.forEach(l => {
    if (!l.leilao_id) return;
    contagem.set(l.leilao_id, (contagem.get(l.leilao_id) ?? 0) + 1);
  });
  let melhor = '';
  let max = 0;
  contagem.forEach((n, id) => { if (n > max) { max = n; melhor = id; } });
  return max >= 2 ? melhor : '';
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

/**
 * Leilão provável quando o fornecedor não indica um: o evento cuja data está
 * mais perto do movimento. Fora de 60 dias não arrisca.
 */
const leilaoPorData = (data: string, leiloes: Leilao[]): string => {
  let melhor = '';
  let menor = Infinity;
  leiloes.forEach(l => {
    if (!l.data) return;
    const d = diasEntre(data, l.data);
    if (d < menor) { menor = d; melhor = l.id; }
  });
  return menor <= 60 ? melhor : '';
};

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
  const doBanco = historico.filter(l => l.banco_id === bancoId);

  const candidatosPorValor = new Map<number, Lancamento[]>();
  doBanco.forEach(l => {
    const v = Number(l.valor) || 0;
    if (!candidatosPorValor.has(v)) candidatosPorValor.set(v, []);
    candidatosPorValor.get(v)!.push(l);
  });

  const jaTomados = new Set<string>();
  const categoriasValidas = new Set(categorias.map(c => c.id));

  // Data exata primeiro: assim uma linha que casa no dia não perde o
  // lançamento para outra que casaria só pela tolerância de 3 dias.
  const ordem = [...transacoes.keys()].sort((a, b) =>
    transacoes[a].data.localeCompare(transacoes[b].data));

  const linhas: LinhaImportacao[] = new Array(transacoes.length);

  ordem.forEach(i => {
    const t = transacoes[i];
    const tipo: 'receita' | 'despesa' = t.tipo === 'credito' ? 'receita' : 'despesa';

    const candidatos = (candidatosPorValor.get(t.valor) ?? [])
      .filter(l => l.tipo === tipo && !jaTomados.has(l.id) && diasEntre(l.data_pagamento, t.data) <= TOLERANCIA_DIAS)
      .sort((a, b) => diasEntre(a.data_pagamento, t.data) - diasEntre(b.data_pagamento, t.data));

    const existente = candidatos[0] ?? null;
    const mesmaData = candidatos.filter(l => l.data_pagamento === t.data);
    if (existente) jaTomados.add(existente.id);

    const duplicada = !!t.fitid && idx.fitidsUsados.has(t.fitid);

    let categoria_id = existente?.categoria_id ?? '';
    let leilao_id = existente?.leilao_id ?? '';
    let fornecedor = existente?.fornecedor ?? t.contraparte;
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
        leilao_id = leilaoDominante(ref.lancs);
        const nomeConhecido = ref.lancs.find(l => l.fornecedor)?.fornecedor;
        if (ref.peso >= 0.8 && nomeConhecido) fornecedor = nomeConhecido;
      }
      if (!leilao_id) leilao_id = leilaoPorData(t.data, leiloes);
    }

    linhas[i] = {
      chave: t.fitid || `${t.data}-${t.valor}-${i}`,
      transacao: t,
      acao: duplicada ? 'ignorar' : 'criar',
      duplicada,
      existente,
      ambiguo: mesmaData.length > 1,
      categoria_id,
      leilao_id,
      fornecedor,
      descricao: t.memo,
      data_competencia: t.data,
      confianca,
      motivo: duplicada ? 'já importada de um extrato anterior' : motivo,
    };

    if (existente && !duplicada) linhas[i].acao = 'conciliar';
  });

  return linhas;
};

/** Contagem para o rodapé da tela. */
export const resumir = (linhas: LinhaImportacao[]) => ({
  total: linhas.length,
  conciliar: linhas.filter(l => l.acao === 'conciliar').length,
  criar: linhas.filter(l => l.acao === 'criar').length,
  ignorar: linhas.filter(l => l.acao === 'ignorar').length,
  semRubrica: linhas.filter(l => l.acao === 'criar' && !l.categoria_id).length,
  duplicadas: linhas.filter(l => l.duplicada).length,
});
