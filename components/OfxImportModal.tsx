import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  UploadCloud, X, Loader, AlertTriangle, Landmark, CheckCircle2, Link2,
  EyeOff, Sparkles, Search, ArrowLeft, CircleAlert, TriangleAlert,
  Split, Plus, Trash2, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Lancamento, Banco, Categoria, Leilao, User } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { lerOfx, decodificarOfx, ContaOfx } from '../utils/ofx';
import {
  montarSugestoes, resumir, alvoConciliacao, lerDivisoes,
  LinhaImportacao, Acao, Confianca, Divisao,
} from '../utils/ofxSugestao';
import { supabase } from '../supabaseClient';
import SearchableSelect from './SearchableSelect';

interface OfxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Lancamento[];
  bancos: Banco[];
  categories: Categoria[];
  leiloes: Leilao[];
  user: User;
  onImported: (criados: Lancamento[], conciliados: string[]) => void;
}

const CORES_CONFIANCA: Record<Confianca, string> = {
  alta: 'bg-emerald-100 text-emerald-800',
  media: 'bg-amber-100 text-amber-800',
  baixa: 'bg-orange-100 text-orange-800',
  nenhuma: 'bg-slate-100 text-slate-500',
};

const ROTULO_CONFIANCA: Record<Confianca, string> = {
  alta: 'alta', media: 'média', baixa: 'baixa', nenhuma: '—',
};

/** Lembra qual banco do sistema corresponde a cada conta do extrato. */
const chaveConta = (conta: ContaOfx) => `ofx:conta:${conta.bancoCodigo}:${conta.conta}`;

const lembrarBanco = (conta: ContaOfx, bancoId: string) => {
  try { localStorage.setItem(chaveConta(conta), bancoId); } catch { /* modo privado */ }
};

const bancoLembrado = (conta: ContaOfx): string => {
  try { return localStorage.getItem(chaveConta(conta)) ?? ''; } catch { return ''; }
};

export const OfxImportModal: React.FC<OfxImportModalProps> = ({
  isOpen, onClose, transactions, bancos, categories, leiloes, user, onImported,
}) => {
  const [etapa, setEtapa] = useState<'upload' | 'revisao'>('upload');
  const [erro, setErro] = useState<string>('');
  const [arrastando, setArrastando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [contas, setContas] = useState<ContaOfx[]>([]);
  const [contaIdx, setContaIdx] = useState(0);
  const [bancoId, setBancoId] = useState('');
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [busca, setBusca] = useState('');
  type Filtro = 'todas' | Acao | 'jaLancados';
  const [filtroAcao, setFiltroAcao] = useState<Filtro>('todas');
  const [statusNovo, setStatusNovo] = useState<'pendente' | 'aprovado'>('pendente');
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const opcoesRubrica = useMemo(
    () => categories.map(c => ({ id: c.id, nome: `${c.codigo} - ${c.rubrica}` })),
    [categories]);
  const opcoesLeilao = useMemo(
    () => leiloes.map(l => ({ id: l.id, nome: l.nome })),
    [leiloes]);
  const leilaoMap = useMemo(() => new Map(leiloes.map(l => [l.id, l])), [leiloes]);
  const rubricaMap = useMemo(
    () => new Map(categories.map(c => [c.id, `${c.codigo} - ${c.rubrica}`])),
    [categories]);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const limpar = () => {
    setEtapa('upload'); setErro(''); setNomeArquivo(''); setContas([]);
    setContaIdx(0); setBancoId(''); setLinhas([]); setBusca('');
    setFiltroAcao('todas'); setSalvando(false); setProgresso('');
    setExpandidas(new Set());
  };

  // ---- repartição de um pagamento em várias rubricas ----

  const somaDivisoes = (d: Divisao[]) => d.reduce((acc, i) => acc + (Number(i.valor) || 0), 0);

  /** Uma linha só pode ser gravada se a divisão fecha o valor e tem rubrica. */
  const divisaoValida = (l: LinhaImportacao) =>
    l.divisoes.length === 0
      ? !!l.categoria_id
      : somaDivisoes(l.divisoes) === l.transacao.valor && l.divisoes.every(d => !!d.categoria_id);

  const alternarExpansao = (chave: string) =>
    setExpandidas(prev => {
      const proximo = new Set(prev);
      if (proximo.has(chave)) proximo.delete(chave); else proximo.add(chave);
      return proximo;
    });

  /** Abre a repartição: começa com a rubrica atual levando o valor inteiro. */
  const abrirDivisao = (l: LinhaImportacao) => {
    if (l.divisoes.length === 0) {
      alterarLinha(l.chave, {
        divisoes: [
          { id: crypto.randomUUID(), categoria_id: l.categoria_id, valor: l.transacao.valor, leilao_id: l.leilao_id, fornecedor: l.fornecedor },
          { id: crypto.randomUUID(), categoria_id: '', valor: 0, leilao_id: l.leilao_id, fornecedor: l.fornecedor },
        ],
      });
    }
    setExpandidas(prev => new Set(prev).add(l.chave));
  };

  const mudarDivisao = (chave: string, id: string, campo: keyof Divisao, valor: string | number) =>
    setLinhas(prev => prev.map(l => l.chave !== chave ? l : {
      ...l,
      divisoes: l.divisoes.map(d => d.id === id ? { ...d, [campo]: valor } : d),
    }));

  const acrescentarDivisao = (chave: string) =>
    setLinhas(prev => prev.map(l => {
      if (l.chave !== chave) return l;
      const restante = Math.max(0, l.transacao.valor - somaDivisoes(l.divisoes));
      return {
        ...l,
        divisoes: [...l.divisoes, { id: crypto.randomUUID(), categoria_id: '', valor: restante, leilao_id: l.leilao_id, fornecedor: l.fornecedor }],
      };
    }));

  const removerDivisao = (chave: string, id: string) =>
    setLinhas(prev => prev.map(l => l.chave !== chave ? l : {
      ...l,
      divisoes: l.divisoes.filter(d => d.id !== id),
    }));

  /** Desfaz a repartição e volta ao pagamento inteiro numa rubrica só. */
  const desfazerDivisao = (l: LinhaImportacao) => {
    alterarLinha(l.chave, {
      divisoes: [],
      categoria_id: l.divisoes[0]?.categoria_id || l.categoria_id,
    });
    setExpandidas(prev => { const p = new Set(prev); p.delete(l.chave); return p; });
  };

  const fechar = () => { limpar(); onClose(); };

  const recalcular = useCallback((conta: ContaOfx, banco: string) => {
    setLinhas(montarSugestoes({
      transacoes: conta.transacoes,
      historico: transactions,
      bancoId: banco,
      categorias: categories,
      leiloes,
    }));
  }, [transactions, categories, leiloes]);

  const receberArquivo = async (arquivo: File | null) => {
    if (!arquivo) return;
    if (!/\.ofx$/i.test(arquivo.name)) {
      setErro('Selecione um arquivo .ofx — é o extrato que o banco chama de "Money" ou "OFX".');
      return;
    }
    setErro('');
    setNomeArquivo(arquivo.name);
    try {
      const extrato = lerOfx(decodificarOfx(await arquivo.arrayBuffer()));
      const conta = extrato.contas[0];
      const sugerido = bancoLembrado(conta)
        || bancos.find(b => b.codigo && b.codigo === conta.bancoCodigo)?.id
        || '';
      setContas(extrato.contas);
      setContaIdx(0);
      setBancoId(sugerido);
      if (sugerido) recalcular(conta, sugerido);
      setEtapa('revisao');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui ler o arquivo.');
    }
  };

  const trocarBanco = (id: string) => {
    setBancoId(id);
    const conta = contas[contaIdx];
    if (conta && id) { lembrarBanco(conta, id); recalcular(conta, id); }
  };

  const trocarConta = (idx: number) => {
    setContaIdx(idx);
    const conta = contas[idx];
    const sugerido = bancoLembrado(conta) || bancoId;
    setBancoId(sugerido);
    if (conta && sugerido) recalcular(conta, sugerido);
  };

  const alterarLinha = (chave: string, mudanca: Partial<LinhaImportacao>) =>
    setLinhas(prev => prev.map(l => l.chave === chave ? { ...l, ...mudanca } : l));

  /** Repete a rubrica escolhida em todas as linhas do mesmo pagador. */
  const replicarPorFornecedor = (linha: LinhaImportacao) => {
    const alvo = linha.transacao.contraparte;
    if (!alvo || !linha.categoria_id) return;
    setLinhas(prev => prev.map(l =>
      l.acao === 'criar' && l.transacao.contraparte === alvo
        ? { ...l, categoria_id: linha.categoria_id, motivo: 'aplicada em lote pelo pagador', confianca: 'alta' }
        : l));
  };

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter(l => {
      if (filtroAcao === 'jaLancados') {
        if (!l.alerta && !l.duplicada) return false;
      } else if (filtroAcao !== 'todas' && l.acao !== filtroAcao) {
        return false;
      }
      if (!termo) return true;
      return l.transacao.memo.toLowerCase().includes(termo)
        || l.fornecedor.toLowerCase().includes(termo);
    });
  }, [linhas, busca, filtroAcao]);

  const resumo = useMemo(() => resumir(linhas), [linhas]);
  const bloqueadas = useMemo(
    () => linhas.filter(l => l.acao === 'criar' && !divisaoValida(l)).length,
    [linhas]);

  /**
   * Confere no banco, no instante de gravar, se alguma linha marcada para
   * criar já não foi lançada. A lista da tela pode ter minutos de idade — e
   * nesse meio-tempo outra pessoa pode ter lançado o mesmo pagamento.
   * Devolve as chaves das linhas que precisam voltar para a revisão.
   */
  const conferirNoBanco = async (aCriar: LinhaImportacao[]): Promise<Map<string, Lancamento>> => {
    const achados = new Map<string, Lancamento>();
    if (!aCriar.length) return achados;

    const datas = aCriar.map(l => l.transacao.data).sort();
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('banco_id', bancoId)
      .gte('data_pagamento', datas[0])
      .lte('data_pagamento', datas[datas.length - 1]);

    if (error || !data) return achados;   // sem confirmação, segue o que a tela decidiu

    const porChave = new Map<string, Lancamento[]>();
    (data as Lancamento[]).forEach(l => {
      const k = `${l.data_pagamento}|${l.valor}|${l.tipo}`;
      if (!porChave.has(k)) porChave.set(k, []);
      porChave.get(k)!.push(l);
    });

    // Os que a tela já resolveu como conciliação não contam de novo.
    const reservados = new Set(
      linhas.map(l => (l.acao === 'conciliar' ? alvoConciliacao(l)?.id : null)).filter(Boolean) as string[]);

    aCriar.forEach(l => {
      const tipo = l.transacao.tipo === 'credito' ? 'receita' : 'despesa';
      const iguais = (porChave.get(`${l.transacao.data}|${l.transacao.valor}|${tipo}`) ?? [])
        .filter(c => !reservados.has(c.id));
      if (iguais.length) {
        achados.set(l.chave, iguais[0]);
        reservados.add(iguais[0].id);
      }
    });

    return achados;
  };

  const efetivar = async () => {
    if (bloqueadas > 0) {
      const semRubrica = linhas.filter(l => l.acao === 'criar' && l.divisoes.length === 0 && !l.categoria_id).length;
      const divisaoAberta = bloqueadas - semRubrica;
      setErro(
        [
          semRubrica > 0 ? `${semRubrica} sem rubrica` : '',
          divisaoAberta > 0 ? `${divisaoAberta} com a repartição sem fechar o valor` : '',
        ].filter(Boolean).join(' e ')
        + '. Ajuste as linhas ou marque como ignorar.',
      );
      return;
    }

    const avisadas = linhas.filter(l => l.acao === 'criar' && (l.alerta || l.duplicada));
    if (avisadas.length && !window.confirm(
      `${avisadas.length} lançamento(s) marcados para criar já aparecem no sistema.\n\n` +
      `Criar mesmo assim vai gerar valores repetidos no DRE e no fluxo de caixa.\n\n` +
      `Confirma a criação desses ${avisadas.length}?`,
    )) return;

    setSalvando(true);
    setErro('');

    const conta = contas[contaIdx];
    let aCriar = linhas.filter(l => l.acao === 'criar');
    const aConciliar = linhas.filter(l => l.acao === 'conciliar' && alvoConciliacao(l));

    try {
      setProgresso('Conferindo se já foram lançados...');
      const jaLancados = await conferirNoBanco(aCriar);
      if (jaLancados.size) {
        // Nada é gravado nesta rodada: as linhas afetadas voltam para a tela
        // marcadas como já lançadas, e quem revisa decide de novo.
        setLinhas(prev => prev.map(l => {
          const achado = jaLancados.get(l.chave);
          if (!achado) return l;
          return {
            ...l,
            acao: 'ignorar' as Acao,
            existente: achado,
            alerta: {
              lancamento: achado,
              forte: true,
              texto: `já existe um lançamento de ${formatDate(achado.data_pagamento)} com esse valor`,
            },
            motivo: 'encontrado no banco na hora de gravar',
          };
        }));
        setFiltroAcao('jaLancados');
        setErro(
          `${jaLancados.size} lançamento(s) já existiam no sistema e foram marcados como "ignorar". ` +
          `Nada foi gravado. Reveja as linhas destacadas e efetive de novo.`,
        );
        setSalvando(false);
        setProgresso('');
        return;
      }
      aCriar = linhas.filter(l => l.acao === 'criar');

      // A coluna que guarda a origem no extrato é opcional: sem ela a
      // importação funciona igual, só perde a trava contra reimportar o mesmo
      // arquivo duas vezes e o aprendizado entre uma importação e a seguinte.
      let guardaOrigem = false;
      try {
        guardaOrigem = !(await supabase.from('lancamentos').select('ofx_fitid').limit(1)).error;
      } catch {
        guardaOrigem = false;
      }

      const criados: Lancamento[] = [];
      const blocos = 50;

      for (let i = 0; i < aCriar.length; i += blocos) {
        setProgresso(`Criando lançamentos ${i + 1}–${Math.min(i + blocos, aCriar.length)} de ${aCriar.length}...`);
        const lote = aCriar.slice(i, i + blocos).map(l => {
          const leilao = l.leilao_id ? leilaoMap.get(l.leilao_id) : undefined;
          return {
            data_pagamento: l.transacao.data,
            data_competencia: l.data_competencia || l.transacao.data,
            descricao: l.descricao,
            valor: l.transacao.valor,
            tipo: l.transacao.tipo === 'credito' ? 'receita' : 'despesa',
            status: statusNovo,
            conciliado: true,
            categoria_id: l.divisoes.length ? l.divisoes[0].categoria_id : l.categoria_id,
            split_revenue: l.divisoes.length
              ? l.divisoes.map(d => ({
                  categoria_id: d.categoria_id,
                  valor: Math.round(d.valor),
                  leilao_id: d.leilao_id || null,
                  fornecedor: d.fornecedor || '',
                }))
              : null,
            banco_id: bancoId,
            leilao_id: l.leilao_id || null,
            fornecedor: l.fornecedor || l.transacao.contraparte || 'NÃO IDENTIFICADO',
            unidade_id: leilao?.unidade_id || null,
            created_by: user.id,
            ...(statusNovo === 'aprovado' ? { approved_by: user.id } : {}),
            ...(guardaOrigem ? { ofx_fitid: l.transacao.fitid || null, ofx_memo: l.transacao.memo } : {}),
          };
        });

        const { data, error } = await supabase.from('lancamentos').insert(lote).select();
        if (error) throw new Error(`Falha ao criar os lançamentos: ${error.message}`);
        criados.push(...(data as Lancamento[]));
      }

      const conciliados: string[] = [];
      for (let i = 0; i < aConciliar.length; i += blocos) {
        setProgresso(`Conciliando ${i + 1}–${Math.min(i + blocos, aConciliar.length)} de ${aConciliar.length}...`);
        const ids = aConciliar.slice(i, i + blocos).map(l => alvoConciliacao(l)!.id);
        const { error } = await supabase
          .from('lancamentos')
          .update({ conciliado: true })
          .in('id', ids);
        if (error) throw new Error(`Falha ao conciliar: ${error.message}`);
        conciliados.push(...ids);
      }

      onImported(criados, conciliados);
      alert(
        `Importação concluída.\n\n` +
        `${criados.length} lançamento(s) criado(s)\n` +
        `${conciliados.length} conciliado(s) com lançamentos que já existiam\n` +
        `${resumo.ignorar} ignorado(s)\n\n` +
        `Extrato: ${conta.conta} — ${formatDate(conta.inicio)} a ${formatDate(conta.fim)}`,
      );
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gravar.');
    } finally {
      setSalvando(false);
      setProgresso('');
    }
  };

  if (!isOpen) return null;

  const conta = contas[contaIdx];
  const somaCredito = conta?.transacoes.filter(t => t.tipo === 'credito').reduce((a, t) => a + t.valor, 0) ?? 0;
  const somaDebito = conta?.transacoes.filter(t => t.tipo === 'debito').reduce((a, t) => a + t.valor, 0) ?? 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 rounded-t-xl">
          <div className="flex items-center gap-3">
            {etapa === 'revisao' && (
              <button onClick={limpar} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500" title="Escolher outro arquivo">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-800">Importar extrato (OFX)</h3>
              {nomeArquivo && <p className="text-xs text-gray-500">{nomeArquivo}</p>}
            </div>
          </div>
          <button onClick={fechar} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        {etapa === 'upload' && (
          <div className="p-8 flex-1 overflow-y-auto">
            <div
              onDrop={e => { e.preventDefault(); setArrastando(false); receberArquivo(e.dataTransfer.files?.[0] ?? null); }}
              onDragOver={e => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={e => { e.preventDefault(); setArrastando(false); }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${arrastando ? 'border-brand-600 bg-brand-50' : 'border-gray-300 bg-gray-50/70 hover:border-gray-400'}`}
            >
              <input ref={inputRef} type="file" className="hidden" accept=".ofx"
                     onChange={e => receberArquivo(e.target.files?.[0] ?? null)} />
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <UploadCloud size={40} />
                <p className="font-medium text-gray-700">Arraste o arquivo .ofx do banco</p>
                <p className="text-sm">ou <span className="text-brand-700 font-semibold">clique para selecionar</span></p>
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-600 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-gray-700">Como funciona</p>
              <p>1. O sistema procura, para cada linha do extrato, um lançamento que já exista com o mesmo valor e data — esses são <strong>conciliados</strong>, não duplicados.</p>
              <p>2. O que sobra vira <strong>sugestão de lançamento novo</strong>, com a rubrica deduzida do histórico do mesmo pagador.</p>
              <p>3. Nada é gravado até você revisar e confirmar. Toda sugestão pode ser trocada.</p>
            </div>
          </div>
        )}

        {etapa === 'revisao' && conta && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">Conta do extrato</span>
                {contas.length > 1 ? (
                  <select value={contaIdx} onChange={e => trocarConta(Number(e.target.value))}
                          className="border border-slate-300 rounded-lg p-1.5 text-sm bg-white">
                    {contas.map((c, i) => <option key={i} value={i}>{c.conta} ({c.transacoes.length})</option>)}
                  </select>
                ) : (
                  <span className="font-semibold text-slate-700 text-sm">{conta.conta}</span>
                )}
                <span className="text-xs text-slate-400">
                  {formatDate(conta.inicio)} a {formatDate(conta.fim)} · {conta.transacoes.length} transações
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Lançar no banco</span>
                <select value={bancoId} onChange={e => trocarBanco(e.target.value)}
                        className="border border-slate-300 rounded-lg p-1.5 text-sm bg-white min-w-[180px]">
                  <option value="">Selecione...</option>
                  {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 text-sm ml-auto">
                <span className="text-emerald-700 font-semibold">+{formatCurrency(somaCredito)}</span>
                <span className="text-red-700 font-semibold">-{formatCurrency(somaDebito)}</span>
                {conta.saldo !== null && (
                  <span className="text-slate-500">saldo {formatCurrency(conta.saldo)}</span>
                )}
              </div>
            </div>

            {!bancoId ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 gap-2">
                <CircleAlert size={18} /> Escolha em qual banco do sistema este extrato deve ser lançado.
              </div>
            ) : (
              <>
                <div className="px-5 py-2 border-b border-gray-100 bg-slate-50 flex flex-wrap items-center gap-2">
                  {([
                    ['todas', `Todas (${resumo.total})`],
                    ['conciliar', `Conciliar (${resumo.conciliar})`],
                    ['criar', `Criar (${resumo.criar})`],
                    ['ignorar', `Ignorar (${resumo.ignorar})`],
                  ] as const).map(([valor, rotulo]) => (
                    <button key={valor} onClick={() => setFiltroAcao(valor as Filtro)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filtroAcao === valor ? 'bg-brand-800 text-white border-brand-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>
                      {rotulo}
                    </button>
                  ))}
                  {resumo.jaLancados > 0 && (
                    <button onClick={() => setFiltroAcao('jaLancados')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${filtroAcao === 'jaLancados' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'}`}>
                      <TriangleAlert size={12} /> Já lançados ({resumo.jaLancados})
                    </button>
                  )}
                  {resumo.semRubrica > 0 && (
                    <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 font-semibold">
                      {resumo.semRubrica} sem rubrica
                    </span>
                  )}
                  {resumo.criarMesmoAvisado > 0 && (
                    <span className="text-xs text-amber-900 bg-amber-100 border border-amber-300 rounded-full px-3 py-1 font-semibold">
                      {resumo.criarMesmoAvisado} vão duplicar
                    </span>
                  )}
                  <div className="relative ml-auto">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar no extrato..."
                           className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-64" />
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-2 w-32">Ação</th>
                        <th className="px-3 py-2 w-24">Data</th>
                        <th className="px-3 py-2">Extrato</th>
                        <th className="px-3 py-2 w-28 text-right">Valor</th>
                        <th className="px-3 py-2 w-64">Rubrica</th>
                        <th className="px-3 py-2 w-48">Leilão</th>
                        <th className="px-3 py-2 w-40">Origem da sugestão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visiveis.map(l => (
                        <tr key={l.chave} className={
                          l.acao === 'criar' && (l.alerta || l.duplicada) ? 'bg-amber-50'
                            : l.acao === 'ignorar' ? 'bg-slate-50 opacity-60'
                              : l.acao === 'conciliar' ? 'bg-sky-50/40' : ''
                        }>
                          <td className="px-3 py-2 align-top">
                            <select
                              value={l.acao}
                              onChange={e => alterarLinha(l.chave, { acao: e.target.value as Acao })}
                              className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white w-full min-w-[104px] leading-normal"
                            >
                              <option value="criar">Criar</option>
                              <option value="conciliar" disabled={!alvoConciliacao(l)}>Conciliar</option>
                              <option value="ignorar">Ignorar</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 align-top whitespace-nowrap text-slate-600">
                            {formatDate(l.transacao.data)}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="text-slate-800 truncate max-w-[380px]" title={l.transacao.memo}>
                              {l.transacao.contraparte || l.transacao.memo}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[380px]">
                              {l.transacao.operacao}
                              {l.transacao.documento && ` · ${l.transacao.documento}`}
                            </div>
                            {l.acao === 'conciliar' && l.existente && (
                              <div className={`text-xs mt-1 rounded px-1.5 py-1 border ${l.ambiguo ? 'text-amber-800 bg-amber-100/70 border-amber-200' : 'text-sky-800 bg-sky-100/60 border-sky-200'}`}>
                                <span className="flex items-start gap-1">
                                  <Link2 size={12} className="flex-shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Já existe no sistema.</strong>{' '}
                                    {formatDate(l.existente.data_pagamento)} ·{' '}
                                    {l.existente.fornecedor || l.existente.descricao?.slice(0, 40) || 'sem fornecedor'}
                                    {l.existente.categoria_id && !lerDivisoes(l.existente).length && (
                                      <> · {rubricaMap.get(l.existente.categoria_id) || 'rubrica removida'}</>
                                    )}
                                    <br />
                                    <span className="text-sky-900">
                                      Conciliar mantém esse lançamento e só marca que bateu com o banco. Nada é criado.
                                    </span>
                                    {l.ambiguo && (
                                      <><br /><span className="text-amber-900">Há mais de um lançamento com esse valor no dia — confira qual é antes de efetivar.</span></>
                                    )}
                                  </span>
                                </span>
                              </div>
                            )}
                            {(l.alerta || l.duplicada) && l.acao !== 'conciliar' && (
                              <div className="text-xs mt-1 flex items-start gap-1 text-amber-800 bg-amber-100/70 border border-amber-200 rounded px-1.5 py-1">
                                <TriangleAlert size={12} className="flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong>Já lançado.</strong>{' '}
                                  {l.duplicada
                                    ? 'esta transação veio de um extrato já importado'
                                    : l.alerta?.texto}
                                  {l.alerta && (
                                    <>
                                      {' — '}
                                      <span className="text-amber-900">
                                        {l.alerta.lancamento.fornecedor || l.alerta.lancamento.descricao?.slice(0, 40)}
                                      </span>
                                    </>
                                  )}
                                  {l.acao === 'criar' && ' · marcada para criar mesmo assim'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className={`px-3 py-2 align-top text-right font-semibold whitespace-nowrap ${l.transacao.tipo === 'credito' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {l.transacao.tipo === 'credito' ? '+' : '-'}{formatCurrency(l.transacao.valor)}
                          </td>
                          <td className="px-3 py-2 align-top">
                            {l.acao === 'conciliar' ? (
                              <span className="text-xs text-slate-500">
                                mantém a rubrica do lançamento existente
                              </span>
                            ) : l.divisoes.length > 0 ? (
                              <button
                                onClick={() => alternarExpansao(l.chave)}
                                className={`w-full text-left text-xs border rounded px-2 py-1.5 transition-colors ${
                                  divisaoValida(l)
                                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                                    : 'border-red-300 bg-red-50 text-red-800'}`}
                              >
                                <span className="flex items-center gap-1 font-semibold">
                                  {expandidas.has(l.chave) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  <Split size={12} /> {l.divisoes.length} rubricas
                                </span>
                                <span className="block mt-0.5">
                                  {divisaoValida(l)
                                    ? l.divisoes.map(d => formatCurrency(d.valor)).join(' + ')
                                    : `falta ${formatCurrency(l.transacao.valor - somaDivisoes(l.divisoes))} para fechar`}
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-start gap-1">
                                <div className="flex-1 min-w-0">
                                  <SearchableSelect
                                    options={opcoesRubrica}
                                    value={l.categoria_id || null}
                                    onChange={id => alterarLinha(l.chave, { categoria_id: id ?? '', motivo: 'escolhida manualmente', confianca: 'alta' })}
                                    placeholder="Escolher rubrica..."
                                  />
                                </div>
                                {l.categoria_id && l.transacao.contraparte && (
                                  <button
                                    onClick={() => replicarPorFornecedor(l)}
                                    title={`Aplicar esta rubrica em todas as linhas de ${l.transacao.contraparte}`}
                                    className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-slate-100 rounded"
                                  >
                                    <Sparkles size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => abrirDivisao(l)}
                                  title="Repartir este pagamento em várias rubricas"
                                  className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-slate-100 rounded"
                                >
                                  <Split size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            {l.acao === 'conciliar' ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : (
                              <SearchableSelect
                                options={opcoesLeilao}
                                value={l.leilao_id || null}
                                onChange={id => alterarLinha(l.chave, { leilao_id: id ?? '' })}
                                placeholder="Sem leilão"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${CORES_CONFIANCA[l.confianca]}`}>
                              {ROTULO_CONFIANCA[l.confianca]}
                            </span>
                            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{l.motivo}</div>
                          </td>
                        </tr>
                      )).flatMap((linhaTabela, idx) => {
                        const l = visiveis[idx];
                        const extras = [linhaTabela];

                        // O que já está no sistema, com as divisões que alguém
                        // da equipe já fez — é o que a conciliação preserva.
                        const jaLancado = alvoConciliacao(l);
                        const divisoesExistentes = lerDivisoes(jaLancado);
                        if (jaLancado && (l.acao === 'conciliar' || l.alerta) && divisoesExistentes.length > 0) {
                          extras.push(
                            <tr key={`${l.chave}-existente`} className={l.acao === 'conciliar' ? 'bg-sky-50/40' : 'bg-amber-50'}>
                              <td />
                              <td colSpan={6} className="px-3 pb-2 pt-0">
                                <div className="text-xs border border-slate-200 bg-white rounded p-2">
                                  <span className="font-semibold text-slate-700">
                                    O lançamento que já existe está repartido em {divisoesExistentes.length} rubricas:
                                  </span>
                                  <ul className="mt-1 space-y-0.5">
                                    {divisoesExistentes.map(d => (
                                      <li key={d.id} className="flex justify-between gap-4 text-slate-600">
                                        <span>{rubricaMap.get(d.categoria_id) || 'rubrica removida'}</span>
                                        <span className="font-semibold whitespace-nowrap">{formatCurrency(d.valor)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className="mt-1 text-slate-500">
                                    {l.acao === 'conciliar'
                                      ? 'Conciliar mantém este lançamento e as divisões como estão — nada é criado.'
                                      : 'Escolha "Conciliar" para manter este lançamento, ou "Criar" para gerar outro.'}
                                  </p>
                                </div>
                              </td>
                            </tr>,
                          );
                        }

                        // Editor da repartição da linha do extrato.
                        if (l.acao !== 'conciliar' && l.divisoes.length > 0 && expandidas.has(l.chave)) {
                          const restante = l.transacao.valor - somaDivisoes(l.divisoes);
                          extras.push(
                            <tr key={`${l.chave}-divisao`} className="bg-slate-50">
                              <td />
                              <td colSpan={6} className="px-3 pb-3 pt-0">
                                <div className="border border-slate-300 rounded-lg bg-white p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                      <Split size={13} /> Repartir {formatCurrency(l.transacao.valor)} entre rubricas
                                    </span>
                                    <button onClick={() => desfazerDivisao(l)}
                                            className="text-xs text-slate-500 hover:text-red-600 underline">
                                      usar uma rubrica só
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {l.divisoes.map(d => (
                                      <div key={d.id} className="grid grid-cols-[1fr_180px_120px_32px] gap-2 items-center">
                                        <SearchableSelect
                                          options={opcoesRubrica}
                                          value={d.categoria_id || null}
                                          onChange={id => mudarDivisao(l.chave, d.id, 'categoria_id', id ?? '')}
                                          placeholder="Escolher rubrica..."
                                        />
                                        <SearchableSelect
                                          options={opcoesLeilao}
                                          value={d.leilao_id || null}
                                          onChange={id => mudarDivisao(l.chave, d.id, 'leilao_id', id ?? '')}
                                          placeholder="Sem leilão"
                                        />
                                        <input
                                          type="number" step="0.01" min="0"
                                          value={d.valor / 100}
                                          onChange={e => mudarDivisao(l.chave, d.id, 'valor', Math.round((parseFloat(e.target.value) || 0) * 100))}
                                          className="border border-slate-300 rounded-lg p-2 text-sm text-right font-semibold"
                                        />
                                        <button onClick={() => removerDivisao(l.chave, d.id)}
                                                disabled={l.divisoes.length <= 2}
                                                title={l.divisoes.length <= 2 ? 'Uma repartição precisa de ao menos duas rubricas' : 'Remover'}
                                                className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                                    <button onClick={() => acrescentarDivisao(l.chave)}
                                            className="text-xs flex items-center gap-1 text-brand-700 font-semibold hover:underline">
                                      <Plus size={13} /> Acrescentar rubrica
                                    </button>
                                    <span className={`text-xs font-semibold ${restante === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                      {restante === 0
                                        ? `fecha em ${formatCurrency(l.transacao.valor)}`
                                        : restante > 0
                                          ? `faltam ${formatCurrency(restante)}`
                                          : `passou ${formatCurrency(-restante)}`}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>,
                          );
                        }

                        return extras;
                      })}
                      {visiveis.length === 0 && (
                        <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">Nenhuma linha com esse filtro.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {erro && (
              <div className="px-5 py-3 bg-red-50 border-t border-red-200 text-sm text-red-800 flex items-center gap-2">
                <AlertTriangle size={16} /> {erro}
              </div>
            )}

            <div className="p-4 border-t border-gray-100 flex items-center gap-3 bg-gray-50 rounded-b-xl">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Criar como</span>
                <select value={statusNovo} onChange={e => setStatusNovo(e.target.value as 'pendente' | 'aprovado')}
                        className="border border-slate-300 rounded-lg p-1.5 text-sm bg-white">
                  <option value="pendente">Pendente de aprovação</option>
                  <option value="aprovado">Já aprovado</option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-sm ml-auto">
                <span className="flex items-center gap-1 text-sky-700"><Link2 size={14} /> {resumo.conciliar} a conciliar</span>
                <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 size={14} /> {resumo.criar} a criar</span>
                <span className="flex items-center gap-1 text-slate-500"><EyeOff size={14} /> {resumo.ignorar} ignorados</span>
              </div>

              <button onClick={fechar} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={efetivar}
                disabled={salvando || !bancoId || (resumo.criar + resumo.conciliar) === 0}
                className="px-5 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 disabled:opacity-60 flex items-center gap-2 min-w-[200px] justify-center"
              >
                {salvando
                  ? <><Loader size={16} className="animate-spin" /> {progresso || 'Gravando...'}</>
                  : `Efetivar ${resumo.criar + resumo.conciliar} lançamento(s)`}
              </button>
            </div>
          </>
        )}

        {etapa === 'upload' && erro && (
          <div className="px-8 pb-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-sm text-red-800 flex items-start gap-2">
              <AlertTriangle size={18} className="flex-shrink-0" /> {erro}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfxImportModal;
