import React, { useState, useMemo } from 'react';
import { Leilao, Previsao, PrevisaoItem, Lancamento, Categoria } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Trash2, Save, Copy, ChevronDown, ChevronUp, ArrowLeft, Search, Edit, Loader, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuctionSimulatorProps {
  leiloes: Leilao[];
  categories: Categoria[];
  transactions: Lancamento[];
  transactionsLoading: boolean;
  previsoes: Previsao[];
  setPrevisoes: React.Dispatch<React.SetStateAction<Previsao[]>>;
}

const AuctionSimulator: React.FC<AuctionSimulatorProps> = ({ leiloes, categories, previsoes, setPrevisoes, transactionsLoading }) => {
  const [viewState, setViewState] = useState<'list' | 'editor' | 'analysis'>('list');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [selectedLeilaoId, setSelectedLeilaoId] = useState<string>('');
  const [draftItems, setDraftItems] = useState<PrevisaoItem[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const groups = useMemo(() => {
    return {
      receitas: categories.filter(c => c.classificacao === 'RECEITA'),
      operacionais: categories.filter(c => c.centro === 'DESPESAS OPERACIONAIS' || c.centro === 'DESPESAS OPERACIONAIS LEILÃO'),
      producao: categories.filter(c => c.centro === 'DESPESAS DE PRODUÇÃO'),
      financeiros: categories.filter(c => c.centro === 'CUSTOS FINANCEIROS EVENTO' || c.centro === 'DESPESAS FINANCEIRAS'),
    };
  }, [categories]);

  const initializeDraft = (previsao?: Previsao) => {
    const UNIDENTIFIED_REVENUE_ID = 'UNIDENTIFIED_REVENUE';
    const unidentifiedRevenueItem: PrevisaoItem = {
      id: crypto.randomUUID(),
      categoria_id: UNIDENTIFIED_REVENUE_ID,
      rubrica: '1010 - RECEITAS NÃO IDENTIFICADAS',
      valor: 0,
      tipo: 'receita',
      fornecedor: ''
    };

    if (previsao) {
        setActiveScenarioId(previsao.id);
        setScenarioName(previsao.nome_cenario);
        setSelectedLeilaoId(previsao.leilao_id);
        const items = previsao.itens || [];
        const hasUnidentified = items.some(i => i.categoria_id === UNIDENTIFIED_REVENUE_ID);
        setDraftItems(hasUnidentified ? items : [...items, unidentifiedRevenueItem]);
    } else {
        setActiveScenarioId(null);
        setScenarioName('');
        setSelectedLeilaoId(leiloes[0]?.id || '');
        const templateCategories = categories.filter(c => 
          c.classificacao === 'RECEITA' || 
          c.centro === 'DESPESAS OPERACIONAIS LEILÃO' ||
          c.centro === 'DESPESAS OPERACIONAIS' ||
          c.centro === 'DESPESAS DE PRODUÇÃO' || 
          c.centro === 'CUSTOS FINANCEIROS EVENTO' ||
          c.centro === 'DESPESAS FINANCEIRAS'
        );
        const newItems = templateCategories.map((cat): PrevisaoItem => ({
          id: crypto.randomUUID(),
          categoria_id: cat.id,
          rubrica: cat.rubrica,
          valor: 0,
          tipo: cat.classificacao === 'RECEITA' ? 'receita' : 'despesa',
          fornecedor: ''
        }));
        setDraftItems([...newItems, unidentifiedRevenueItem]);
    }
  };

  const handleCreateNew = () => {
      initializeDraft();
      setViewState('editor');
  };

  const handleEditScenario = (p: Previsao) => {
      initializeDraft(p);
      setViewState('editor');
  };

  const handleDuplicateScenario = async (id: string) => {
    const original = previsoes.find(p => p.id === id);
    if (!original) return;

    const newScenarioData = {
        nome_cenario: `${original.nome_cenario} (Cópia)`,
        leilao_id: original.leilao_id,
        data_criacao: new Date().toISOString(),
        itens: (original.itens || []).map(item => ({...item, id: crypto.randomUUID() }))
    };

    const { data, error } = await supabase
        .from('previsoes')
        .insert(newScenarioData)
        .select()
        .single();
    
    if (error) {
        alert('Falha ao duplicar o cenário.');
        console.error(error);
    } else {
        setPrevisoes(prev => [...prev, data]);
    }
  };

  const handleDeleteScenario = async (id: string) => {
      if (window.confirm('Excluir este cenário?')) {
          const { error } = await supabase.from('previsoes').delete().eq('id', id);
          if (error) {
              alert('Falha ao excluir o cenário.');
              console.error(error);
          } else {
              setPrevisoes(prev => prev.filter(p => p.id !== id));
          }
      }
  };

  const handleSave = async () => {
    if (!scenarioName.trim() || !selectedLeilaoId) {
      alert("Nome do cenário e leilão são obrigatórios.");
      return;
    }

    const previsionData: Partial<Previsao> = {
      nome_cenario: scenarioName,
      leilao_id: selectedLeilaoId,
      data_criacao: activeScenarioId
        ? previsoes.find(p => p.id === activeScenarioId)?.data_criacao || new Date().toISOString()
        : new Date().toISOString(),
      itens: draftItems
    };

    if (activeScenarioId) {
      previsionData.id = activeScenarioId;
    }

    const { data, error } = await supabase
      .from('previsoes')
      .upsert(previsionData)
      .select()
      .single();

    if (error) {
      alert('Falha ao salvar o cenário.');
      console.error(error);
    } else {
      setPrevisoes(prev => {
        const exists = prev.some(p => p.id === data.id);
        return exists ? prev.map(p => p.id === data.id ? data : p) : [...prev, data];
      });
      setViewState('list');
    }
  };

  const addItem = (cat: Categoria) => {
    const newItem: PrevisaoItem = {
      id: crypto.randomUUID(),
      categoria_id: cat.id,
      rubrica: cat.rubrica,
      valor: 0,
      tipo: cat.classificacao === 'RECEITA' ? 'receita' : 'despesa',
      fornecedor: ''
    };
    setDraftItems(prev => [...prev, newItem]);
  };

  const addEmptyItemToSection = (availableCats: Categoria[]) => {
      if (availableCats.length > 0) addItem(availableCats[0]);
  };

  const handleDuplicate = (item: PrevisaoItem) => {
    const newItem: PrevisaoItem = { ...item, id: crypto.randomUUID() };
    const index = draftItems.findIndex(i => i.id === item.id);
    const newItems = [...draftItems];
    newItems.splice(index + 1, 0, newItem);
    setDraftItems(newItems);
  };

  const updateItem = (id: string, field: keyof PrevisaoItem, value: string | number) => {
    setDraftItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (field === 'categoria_id') {
        const cat = categories.find(c => c.id === value);
        return { 
            ...i, 
            [field]: value, 
            rubrica: cat ? cat.rubrica : i.rubrica, 
            tipo: cat?.classificacao === 'RECEITA' ? 'receita' : 'despesa'
        };
      }
      return { ...i, [field]: value };
    }));
  };

  const removeItem = (id: string) => {
    setDraftItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleSection = (key: string) => {
      setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionTotals = useMemo(() => {
    const calcTotal = (availableCats: Categoria[]) => {
        const ids = new Set(availableCats.map(c => c.id));
        return draftItems.filter(i => ids.has(i.categoria_id)).reduce((acc, i) => acc + i.valor, 0);
    };
    const rec = calcTotal(groups.receitas);
    const ops = calcTotal(groups.operacionais);
    const prod = calcTotal(groups.producao);
    const fin = calcTotal(groups.financeiros);
    return { rec, ops, prod, fin, totalDespesas: ops + prod + fin, resultado: rec - (ops + prod + fin) };
  }, [draftItems, groups]);

  const renderSection = (title: string, sectionKey: string, availableCats: Categoria[], total: number, colorClass: string) => {
    const isCollapsed = collapsedSections[sectionKey];
    const sectionCatIds = new Set(availableCats.map(c => c.id));
    const sectionItems = draftItems.filter(i => sectionCatIds.has(i.categoria_id));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors ${colorClass}`} onClick={() => toggleSection(sectionKey)}>
              <div className="flex items-center gap-3"><h3 className="font-bold text-slate-800">{title}</h3></div>
              <div className="flex items-center gap-4"><span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>{isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
          </div>
          {!isCollapsed && (
              <div className="p-4 animate-fade-in">
                  <table className="w-full text-sm">
                      <thead><tr className="text-slate-500 text-left border-b border-slate-100"><th className="pb-2 pl-2 w-5/12">Rubrica (Sistema)</th><th className="pb-2 w-4/12">Fornecedor / Cliente</th><th className="pb-2 w-2/12 text-right">Valor (R$)</th><th className="pb-2 w-1/12 text-center"></th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                          {sectionItems.map(item => (
                              <tr key={item.id} className="group hover:bg-slate-50">
                                  <td className="py-2 pl-2 pr-2">
                                      <select className="w-full border border-slate-200 rounded p-1.5 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-700" value={item.categoria_id} onChange={(e) => updateItem(item.id, 'categoria_id', e.target.value)}>
                                          <option value="" disabled>Selecione...</option>
                                          {availableCats.map(c => (<option key={c.id} value={c.id}>{c.codigo} - {c.rubrica}</option>))}
                                      </select>
                                  </td>
                                  <td className="py-2 pr-2"><input className="w-full border border-slate-200 rounded p-1.5 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-600" placeholder={sectionKey === 'receitas' ? 'Nome do Cliente' : 'Nome do Fornecedor'} value={item.fornecedor || ''} onChange={(e) => updateItem(item.id, 'fornecedor', e.target.value)} /></td>
                                  <td className="py-2 pr-2"><input type="number" className={`w-full border border-slate-200 rounded p-1.5 text-right font-medium outline-none focus:ring-2 ${sectionKey === 'receitas' ? 'text-green-700 focus:ring-green-200' : 'text-red-700 focus:ring-red-200'}`} value={item.valor / 100} onChange={(e) => updateItem(item.id, 'valor', Math.round(parseFloat(e.target.value || '0') * 100))} /></td>
                                  <td className="py-2 text-center flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDuplicate(item)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded" title="Duplicar Linha"><Copy size={16} /></button>
{item.categoria_id !== 'UNIDENTIFIED_REVENUE' && <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remover"><Trash2 size={16}/></button>}</td>
                              </tr>
                          ))}
                          {sectionItems.length === 0 && (<tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">Nenhum item lançado.</td></tr>)}
                      </tbody>
                  </table>
                  <button onClick={() => addEmptyItemToSection(availableCats)} className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"><Plus size={16} /> Adicionar Linha</button>
              </div>
          )}
      </div>
    );
  };
  
  const renderList = () => {
    const filtered = previsoes.filter(p => p.nome_cenario.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (transactionsLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <Loader className="animate-spin text-brand-800" size={32} />
                <p className="mt-3 text-slate-500">Carregando dados...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div><h2 className="text-2xl font-bold text-slate-800">Cenários de Simulação</h2><p className="text-slate-500 text-sm">Gerencie suas previsões de leilão</p></div>
                <div className="flex gap-2"><button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 shadow-sm transition-colors"><Printer size={18} /> Imprimir</button><button onClick={handleCreateNew} className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 shadow-sm transition-colors"><Plus size={18} /> Novo Cenário</button></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                 <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar cenário..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium"><tr><th className="px-6 py-4">Nome do Cenário</th><th className="px-6 py-4">Evento Vinculado</th><th className="px-6 py-4">Criado em</th><th className="px-6 py-4 text-right">Resultado Previsto</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(p => {
                            const rec = (p.itens || []).filter(i => i.tipo === 'receita').reduce((acc, i) => acc + i.valor, 0);
                            const desp = (p.itens || []).filter(i => i.tipo === 'despesa').reduce((acc, i) => acc + i.valor, 0);
                            const result = rec - desp;
                            const leilaoName = leiloes.find(l => l.id === p.leilao_id)?.nome || 'N/A';
                            return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{p.nome_cenario}</td>
                                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{leilaoName}</td>
                                    <td className="px-6 py-4 text-slate-500">{formatDate(p.data_criacao)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${result >= 0 ? 'text-sky-600' : 'text-red-600'}`}>{formatCurrency(result)}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => handleDuplicateScenario(p.id)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Duplicar"><Copy size={18} /></button><button onClick={() => handleEditScenario(p)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded" title="Abrir"><Edit size={18} /></button><button onClick={() => handleDeleteScenario(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 size={18} /></button></td>
                                </tr>
                            );
                        })}
                         {filtered.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum cenário encontrado.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderEditorHeader = () => (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1 cursor-pointer hover:text-brand-800" onClick={() => setViewState('list')}><ArrowLeft size={16} /> Voltar</div>
            <h2 className="text-2xl font-bold text-slate-800">{activeScenarioId ? 'Editar Cenário' : 'Novo Cenário'}</h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
             <div className="flex-1 md:w-64"><input className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500" placeholder="Nome do Cenário" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} /></div>
             <div className="flex-1 md:w-64">
                <select value={selectedLeilaoId} onChange={(e) => setSelectedLeilaoId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="" disabled>Selecione o Leilão...</option>
                    {leiloes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
             </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 shadow-sm transition-colors"><Printer size={18} /> Imprimir</button><button onClick={handleSave} className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 shadow-sm transition-colors"><Save size={18} /> Salvar</button>
        </div>
      </div>
  );
  
  if (viewState === 'list') return renderList();

  return (
    <div className="space-y-6">
      {renderEditorHeader()}
      {viewState === 'editor' && (
          <>
            {renderSection('RECEITAS', 'receitas', groups.receitas, sectionTotals.rec, 'bg-emerald-50')}
            {renderSection('DESPESAS OPERACIONAIS', 'operacionais', groups.operacionais, sectionTotals.ops, 'bg-red-50')}
            {renderSection('DESPESAS DE PRODUÇÃO', 'producao', groups.producao, sectionTotals.prod, 'bg-red-50')}
            {renderSection('CUSTOS FINANCEIROS DO EVENTO', 'financeiros', groups.financeiros, sectionTotals.fin, 'bg-red-50')}

            <div className="mt-8 p-6 bg-slate-800 text-white rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-slate-200">Resultado do Cenário</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-emerald-300 uppercase tracking-wider">Total Receitas</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(sectionTotals.rec)}</p>
                </div>
                <div>
                  <p className="text-sm text-red-300 uppercase tracking-wider">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(sectionTotals.totalDespesas)}</p>
                </div>
                <div>
                  <p className="text-sm text-sky-300 uppercase tracking-wider">Resultado Final</p>
                  <p className={`text-2xl font-black ${sectionTotals.resultado >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>
                    {formatCurrency(sectionTotals.resultado)}
                  </p>
                </div>
              </div>
            </div>
          </>
      )}
       <div className="sticky bottom-0 bg-slate-800 text-white p-4 mt-6 rounded-t-xl shadow-lg flex justify-between items-center z-20">
          <h3 className="text-lg font-bold">RESULTADO DO CENÁRIO</h3>
          <span className={`text-2xl font-black ${sectionTotals.resultado >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(sectionTotals.resultado)}
          </span>
      </div>
    </div>
  );
};

export default AuctionSimulator;