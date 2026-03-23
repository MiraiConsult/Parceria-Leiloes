import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lancamento, Banco, Categoria, User, Unidade, Leilao } from '../types';
import { formatCurrency, formatDate, parseDate } from '../utils/format';
import { Landmark, TrendingUp, CheckCircle2, Loader, Pencil, Trash2, CheckSquare, XSquare, Plus, GripVertical, Search, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';
import MultiSelectFilter from './MultiSelectFilter';
import DatePickerInput from './DatePickerInput';

interface ReconciliationProps {
  transactions: Lancamento[];
  setTransactions: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  user: User;
  transactionsLoading: boolean;
  bancos: Banco[];
  unidades: Unidade[];
  leiloes: Leilao[];
  categories: Categoria[];
  selectedBankIds: Set<string>;
  setSelectedBankIds: (ids: Set<string>) => void;
  selectedUnidades: Set<string>;
  setSelectedUnidades: (ids: Set<string>) => void;
  dateFilter: { start: string; end: string };
  setDateFilter: (filter: { start: string; end: string }) => void;
  handleOpenModal: (transaction?: Lancamento) => void;
}

const Reconciliation: React.FC<ReconciliationProps> = ({ 
  transactions, setTransactions, transactionsLoading, bancos, unidades, leiloes, categories,
  selectedBankIds, setSelectedBankIds, selectedUnidades, setSelectedUnidades, 
  dateFilter, setDateFilter,
  handleOpenModal 
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const leilaoMap = useMemo(() => new Map(leiloes.map(l => [l.id, l.nome])), [leiloes]);
  const bancoMap = useMemo(() => new Map(bancos.map(b => [b.id, b.nome])), [bancos]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.rubrica])), [categories]);

  const handleDateFilterChange = (field: 'start' | 'end', value: string) => {
    setDateFilter({ ...dateFilter, [field]: value });
  };
  
  type StatementRow = Lancamento & { runningBalance: number };
  
  const [displayedStatement, setDisplayedStatement] = useState<StatementRow[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { statement: filteredAndSortedStatement, totalInitialBalance, projectedBalance } = useMemo(() => {
    const allBanksSelected = selectedBankIds.size === 0 || selectedBankIds.size === bancos.length;

    const selectedBancos = bancos.filter(b => allBanksSelected || selectedBankIds.has(b.id));

    const bankInitialBalance = selectedBancos
        .reduce((sum, b) => sum + (Number(b.saldo_inicial) || 0), 0);

    // Build a map of banco_id -> earliest allowed date (saldo_inicial_data)
    const bancoStartDateMap = new Map<string, Date | null>();
    for (const b of selectedBancos) {
      if (b.saldo_inicial_data) {
        const d = parseDate(b.saldo_inicial_data);
        bancoStartDateMap.set(b.id, isNaN(d.getTime()) ? null : d);
      } else {
        bancoStartDateMap.set(b.id, null);
      }
    }
    // Check if ANY selected bank has saldo_inicial_data configured
    const hasSaldoInicialData = selectedBancos.some(b => b.saldo_inicial_data);

    const start = dateFilter.start ? parseDate(dateFilter.start) : null;
    const end = dateFilter.end ? parseDate(dateFilter.end) : null;
    if (end) end.setHours(23, 59, 59, 999);

    // Get transactions for selected banks, excluding rejected
    const allBankTx = transactions.filter(t => {
      if (t.status === 'rejeitado') return false;
      if (!allBanksSelected && !selectedBankIds.has(t.banco_id)) return false;
      const txDate = parseDate(t.data_pagamento);
      if (isNaN(txDate.getTime())) return false;

      // If bank has saldo_inicial_data, skip transactions before that date
      const bancoStartDate = bancoStartDateMap.get(t.banco_id);
      if (bancoStartDate && txDate < bancoStartDate) return false;

      return true;
    });

    allBankTx.sort((a, b) => parseDate(a.data_pagamento).getTime() - parseDate(b.data_pagamento).getTime());

    // TWO modes of balance calculation:
    //
    // MODE 1 (saldo_inicial_data SET): Accumulate from saldo_inicial_data forward.
    //   The saldo_inicial represents the balance AT saldo_inicial_data, and we add
    //   all transactions from that date onward. Pre-range transactions adjust the
    //   displayed initial balance.
    //
    // MODE 2 (saldo_inicial_data NOT SET — default):
    //   saldo_inicial represents the balance at the START of the filtered period.
    //   Only transactions IN the date range are counted. This matches the original
    //   system behavior and avoids double-counting historical transactions.

    let displayInitialBalance = bankInitialBalance;
    const statementWithBalance: StatementRow[] = [];

    if (hasSaldoInicialData) {
      // MODE 1: Full accumulation from saldo_inicial_data
      const balanceByTxId = new Map<string, number>();
      let runningBal = bankInitialBalance;
      for (const t of allBankTx) {
        const absVal = Math.abs(Number(t.valor) || 0);
        const val = (t.tipo?.toLowerCase() === 'receita') ? absVal : -absVal;
        runningBal += val;
        balanceByTxId.set(t.id, runningBal);
      }

      if (start) {
        for (const t of allBankTx) {
          const txDate = parseDate(t.data_pagamento);
          if (txDate < start) {
            displayInitialBalance = balanceByTxId.get(t.id) ?? displayInitialBalance;
          } else {
            break;
          }
        }
      }

      for (const t of allBankTx) {
        const txDate = parseDate(t.data_pagamento);
        if (start && txDate < start) continue;
        if (end && txDate > end) continue;

        const matchesUnidades = selectedUnidades.size === 0 || (t.unidade_id ? selectedUnidades.has(t.unidade_id) : true);
        if (!matchesUnidades) continue;

        const desc = t.descricao || '';
        const forn = t.fornecedor || '';
        const rubrica = t.categoria_id ? (categoryMap.get(t.categoria_id) || '') : '';
        const matchesSearch = searchTerm === '' ||
          desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          forn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubrica.toLowerCase().includes(searchTerm.toLowerCase());

        if (matchesSearch) {
          statementWithBalance.push({ ...t, runningBalance: balanceByTxId.get(t.id) ?? 0 });
        }
      }
    } else {
      // MODE 2: saldo_inicial + transactions in date range only
      // This avoids double-counting when saldo_inicial already includes historical transactions
      let runningBal = bankInitialBalance;

      for (const t of allBankTx) {
        const txDate = parseDate(t.data_pagamento);

        // Skip transactions outside the date range entirely
        if (start && txDate < start) continue;
        if (end && txDate > end) continue;

        const absVal = Math.abs(Number(t.valor) || 0);
        const val = (t.tipo?.toLowerCase() === 'receita') ? absVal : -absVal;
        runningBal += val;

        const matchesUnidades = selectedUnidades.size === 0 || (t.unidade_id ? selectedUnidades.has(t.unidade_id) : true);
        if (!matchesUnidades) continue;

        const desc = t.descricao || '';
        const forn = t.fornecedor || '';
        const rubrica = t.categoria_id ? (categoryMap.get(t.categoria_id) || '') : '';
        const matchesSearch = searchTerm === '' ||
          desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          forn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rubrica.toLowerCase().includes(searchTerm.toLowerCase());

        if (matchesSearch) {
          statementWithBalance.push({ ...t, runningBalance: runningBal });
        }
      }
    }

    const lastVisible = statementWithBalance.length > 0 ? statementWithBalance[statementWithBalance.length - 1].runningBalance : displayInitialBalance;

    return { statement: statementWithBalance, totalInitialBalance: displayInitialBalance, projectedBalance: lastVisible };
  }, [transactions, selectedBankIds, bancos, dateFilter, selectedUnidades, searchTerm, categoryMap]);

  useEffect(() => {
    setDisplayedStatement(filteredAndSortedStatement);
  }, [filteredAndSortedStatement]);

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggedId(null);
      return;
    }

    const _statement = [...displayedStatement];
    const draggedItemContent = _statement.splice(dragItem.current, 1)[0];
    _statement.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setDisplayedStatement(_statement);
    setDraggedId(null);
  };
  
  const isAllSelected = useMemo(() => {
    return displayedStatement.length > 0 && displayedStatement.every(t => selectedIds.has(t.id));
  }, [displayedStatement, selectedIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedStatement.map(t => t.id)));
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };
  
  const handleToggleConciliado = async (ids: string[], newStatus: boolean) => {
    const actionIds = new Set(ids);
    setLoadingActions(prev => new Set([...prev, ...actionIds]));
    
    const { data, error } = await supabase
      .from('lancamentos')
      .update({ conciliado: newStatus })
      .in('id', ids)
      .select();

    if (error) {
      alert(`Erro ao atualizar: ${error.message}`);
    } else if (data) {
      setTransactions(prev => prev.map(t => {
        const updated = data.find(d => d.id === t.id);
        return updated ? { ...t, ...updated } : t;
      }));
      setSelectedIds(new Set()); // Clear selection after bulk action
    }
    setLoadingActions(prev => {
        const newSet = new Set(prev);
        actionIds.forEach(id => newSet.delete(id));
        return newSet;
    });
  };

  const handleDelete = async (ids: string[]) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${ids.length} lançamento(s)? Esta ação não pode ser desfeita.`)) return;

    const actionIds = new Set(ids);
    setLoadingActions(prev => new Set([...prev, ...actionIds]));
    
    const { error } = await supabase.from('lancamentos').delete().in('id', ids);

    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      setSelectedIds(new Set());
    }
    setLoadingActions(prev => {
        const newSet = new Set(prev);
        actionIds.forEach(id => newSet.delete(id));
        return newSet;
    });
  };

  const handleExportCSV = () => {
    const csvSep = ';';
    const headers = ['Data', 'Descrição', 'Fornecedor', 'Rubrica', 'Banco', 'Leilão', 'Conciliação', 'Tipo', 'Valor (R$)', 'Saldo do Dia (R$)'];
    const rows = displayedStatement.map(t => {
      const rubrica = t.categoria_id ? (categoryMap.get(t.categoria_id) || '') : '';
      const banco = bancoMap.get(t.banco_id) || '';
      const leilao = t.leilao_id ? (leilaoMap.get(t.leilao_id) || '') : '';
      const conciliacao = t.conciliado ? 'Conciliado' : 'Pendente';
      const valor = (Math.abs(Number(t.valor) || 0) / 100).toFixed(2).replace('.', ',');
      const saldo = ((t.runningBalance || 0) / 100).toFixed(2).replace('.', ',');
      const sinal = t.tipo?.toLowerCase() === 'receita' ? '' : '-';
      return [
        formatDate(t.data_pagamento),
        `"${(t.descricao || '').replace(/"/g, '""')}"`,
        `"${(t.fornecedor || '').replace(/"/g, '""')}"`,
        `"${rubrica.replace(/"/g, '""')}"`,
        banco,
        `"${leilao.replace(/"/g, '""')}"`,
        conciliacao,
        t.tipo || '',
        `${sinal}${valor}`,
        saldo,
      ].join(csvSep);
    });

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(csvSep), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conciliacao_${dateFilter.start || 'inicio'}_${dateFilter.end || 'fim'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Conciliação Bancária</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-500">De:</label>
              <div className="w-32">
                <DatePickerInput value={dateFilter.start} onChange={val => handleDateFilterChange('start', val)} placeholder="Data Inicial" />
              </div>
              <label className="text-sm font-medium text-slate-500">Até:</label>
              <div className="w-32">
                <DatePickerInput value={dateFilter.end} onChange={val => handleDateFilterChange('end', val)} placeholder="Data Final" />
              </div>
          </div>
           <MultiSelectFilter
            label="Banco"
            options={bancos}
            selectedIds={selectedBankIds}
            onSelectionChange={setSelectedBankIds}
            className="min-w-[200px]"
          />
          <MultiSelectFilter
            label="Unidade"
            options={unidades}
            selectedIds={selectedUnidades}
            onSelectionChange={setSelectedUnidades}
            className="min-w-[200px]"
          />
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {selectedIds.size > 0 && (
            <button onClick={() => handleDelete(Array.from(selectedIds))} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors shadow-sm">
              <Trash2 size={16} /> Excluir ({selectedIds.size})
            </button>
          )}
          <button onClick={handleExportCSV} disabled={displayedStatement.length === 0} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-medium mb-1">Saldo Inicial (Consolidado)</p><p className="text-2xl font-bold text-slate-800">{formatCurrency(totalInitialBalance)}</p></div>
            <div className="p-3 bg-slate-100 rounded-full text-slate-500"><Landmark size={24} /></div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm font-medium mb-1">Saldo Final (Consolidado)</p><p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-sky-600' : 'text-red-600'}`}>{formatCurrency(projectedBalance)}</p></div>
            <div className="p-3 bg-sky-50 rounded-full text-sky-600"><TrendingUp size={24} /></div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {transactionsLoading ? (
            <div className="flex flex-col items-center justify-center h-96"><Loader className="animate-spin text-brand-800" size={32} /><p className="mt-3 text-slate-500">Carregando lançamentos...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-4 w-12 text-center"><input type="checkbox" checked={isAllSelected} onChange={handleToggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"/></th>
                  <th className="w-10"></th>
                  <th className="px-6 py-4 w-32">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Rubrica</th>
                  <th className="px-6 py-4">Banco</th>
                  <th className="px-6 py-4">Leilão</th>
                  <th className="px-6 py-4 w-40 text-center">Conciliação</th>
                  <th className="px-6 py-4 w-40 text-right">Valor</th>
                  <th className="px-6 py-4 w-40 text-right">Saldo do Dia</th>
                  <th className="px-6 py-4 w-40 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStatement.map((t, index) => (
                  <tr 
                    key={t.id} 
                    draggable
                    onDragStart={() => {
                        dragItem.current = index;
                        setDraggedId(t.id);
                    }}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleDragSort}
                    onDragOver={(e) => e.preventDefault()}
                    className={`group transition-colors ${selectedIds.has(t.id) ? 'bg-sky-50' : ''} ${draggedId === t.id ? 'opacity-30 bg-sky-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => handleRowSelect(t.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"/></td>
                    <td className="px-2 py-4 text-center cursor-grab text-slate-400 active:cursor-grabbing">
                        <GripVertical size={18} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(t.data_pagamento)}</td>
                    <td className="px-6 py-4 text-slate-900">{t.descricao}<span className="block text-xs text-slate-400 font-medium">{t.fornecedor}</span></td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{t.categoria_id ? categoryMap.get(t.categoria_id) : ''}</td>
                    <td className="px-6 py-4 text-slate-500">{bancoMap.get(t.banco_id)}</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{t.leilao_id ? leilaoMap.get(t.leilao_id) : ''}</td>
                    <td className="px-6 py-4 text-center">
                       {t.conciliado ? (<span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 size={12} className="mr-1" /> Conciliado</span>) : (<span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">Pendente</span>)}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${t.tipo?.toLowerCase() === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{t.tipo?.toLowerCase() === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(t.valor))}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${t.runningBalance >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                      {formatCurrency(t.runningBalance)}
                    </td>
                    <td className="px-6 py-4 text-center">
                        {loadingActions.has(t.id) ? <Loader size={18} className="animate-spin mx-auto text-slate-400" /> :
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleToggleConciliado([t.id], !t.conciliado)} className={`p-1.5 rounded ${t.conciliado ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} title={t.conciliado ? 'Marcar como Pendente' : 'Conciliar'}>{t.conciliado ? <XSquare size={16}/> : <CheckSquare size={16}/>}</button>
                            <button onClick={() => handleOpenModal(t)} className="p-1.5 rounded text-sky-600 hover:bg-sky-100" title="Editar"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete([t.id])} className="p-1.5 rounded text-red-600 hover:bg-red-100" title="Excluir"><Trash2 size={16} /></button>
                        </div>}
                    </td>
                  </tr>
                ))}
                {displayedStatement.length === 0 && (<tr><td colSpan={11} className="px-6 py-8 text-center text-slate-400">Nenhuma movimentação para os filtros selecionados.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedIds.size > 0 && (
          <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-3 flex items-center justify-between shadow-top animate-fade-in-up z-30">
              <span className="text-sm font-semibold text-slate-700">{selectedIds.size} {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}</span>
              <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleConciliado(Array.from(selectedIds), true)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium"><CheckSquare size={16}/> Conciliar</button>
                  <button onClick={() => handleToggleConciliado(Array.from(selectedIds), false)} className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 text-sm font-medium"><XSquare size={16}/> Marcar Pendente</button>
                  <button onClick={() => handleDelete(Array.from(selectedIds))} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium"><Trash2 size={16}/> Excluir</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reconciliation;