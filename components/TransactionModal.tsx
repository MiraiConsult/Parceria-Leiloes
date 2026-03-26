import React, { useState, useEffect, useMemo } from 'react';
import { Lancamento, User, Banco, Categoria, Fornecedor, Leilao, Unidade } from '../types';
import { formatCurrency, parseDate } from '../utils/format';
import { X, Loader, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

type Installment = {
  id: string;
  vencimento: string;
  competencia: string;
  valor: number; // in cents
};

type SplitItem = {
  id: string;
  categoria_id: string;
  valor: number; // in cents
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Partial<Lancamento> | null;
  setTransactions: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  user: User;
  bancos: Banco[];
  categories: Categoria[];
  leiloes: Leilao[];
  unidades: Unidade[];
  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  setTransactions,
  user,
  bancos,
  categories,
  leiloes,
  unidades,
  fornecedores,
  setFornecedores,
}) => {
  const [formData, setFormData] = useState<Partial<Lancamento>>(transaction || {});
  const [fornecedorSearch, setFornecedorSearch] = useState('');
  const [showFornecedorDropdown, setShowFornecedorDropdown] = useState(false);
  const [addingFornecedor, setAddingFornecedor] = useState(false);
  const fornecedorRef = React.useRef<HTMLDivElement>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Installment State
  const [isInstallments, setIsInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [competenceMode, setCompetenceMode] = useState<'fixed' | 'monthly'>('fixed');
  const [valueDistribution, setValueDistribution] = useState<'divide' | 'repeat'>('divide');
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Split Revenue State
  const [isSplit, setIsSplit] = useState(false);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([{ id: crypto.randomUUID(), categoria_id: '', valor: 0 }]);

  const isEditing = useMemo(() => !!transaction?.id, [transaction]);

  const sortedLeiloes = useMemo(() => {
    return [...leiloes].sort((a, b) => parseDate(b.data).getTime() - parseDate(a.data).getTime());
  }, [leiloes]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const initialData = isEditing ? { ...transaction } : {
      descricao: '',
      valor: 0,
      status: 'pendente',
      data_pagamento: today,
      data_competencia: today,
      fornecedor: '',
      banco_id: '',
      categoria_id: '',
      tipo: 'despesa', // Default to despesa
      ...transaction,
    };
    setFormData(initialData);

    if (isEditing) {
      setIsInstallments(false);
      if (transaction?.split_revenue && transaction.split_revenue.length > 0) {
        setIsSplit(true);
        setSplitItems(transaction.split_revenue.map(item => ({
          id: crypto.randomUUID(),
          categoria_id: item.categoria_id,
          valor: item.valor,
        })));
      } else {
        setIsSplit(false);
        setSplitItems([{ id: crypto.randomUUID(), categoria_id: '', valor: 0 }]);
      }
    } else {
        // Reset state for new transactions
        setIsInstallments(false);
        setInstallmentsCount(2);
        setCompetenceMode('fixed');
        setValueDistribution('divide');
        setIsSplit(false);
        setSplitItems([{ id: crypto.randomUUID(), categoria_id: '', valor: 0 }]);
    }
  }, [transaction, isEditing, isOpen]);

  // Initialize fornecedor search from existing data
  useEffect(() => {
    if (isOpen) {
      setFornecedorSearch(transaction?.fornecedor || '');
    }
  }, [isOpen, transaction]);

  // Close fornecedor dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fornecedorRef.current && !fornecedorRef.current.contains(e.target as Node)) {
        setShowFornecedorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFornecedores = useMemo(() => {
    if (!fornecedorSearch.trim()) return fornecedores;
    return fornecedores.filter(f => f.nome.toLowerCase().includes(fornecedorSearch.toLowerCase()));
  }, [fornecedores, fornecedorSearch]);

  const handleSelectFornecedor = (f: Fornecedor) => {
    setFornecedorSearch(f.nome);
    handleFormChange('fornecedor', f.nome);
    handleFormChange('fornecedor_id', f.id);
    setShowFornecedorDropdown(false);
  };

  const handleAddFornecedor = async () => {
    const nome = fornecedorSearch.trim();
    if (!nome) return;
    setAddingFornecedor(true);
    const { data, error } = await supabase.from('fornecedores').insert({ nome }).select().single();
    if (error) {
      alert('Erro ao adicionar cliente/fornecedor: ' + error.message);
    } else if (data) {
      setFornecedores(prev => [...prev, data as Fornecedor]);
      handleFormChange('fornecedor', data.nome);
      handleFormChange('fornecedor_id', data.id);
      setShowFornecedorDropdown(false);
    }
    setAddingFornecedor(false);
  };

  useEffect(() => {
    if (formData.leilao_id) {
      const selectedLeilao = leiloes.find(l => l.id === formData.leilao_id);
      if (selectedLeilao) {
        setFormData(prev => ({ ...prev, data_competencia: selectedLeilao.data }));
      }
    }
  }, [formData.leilao_id, leiloes]);
  
  // Recalculate installments preview
  useEffect(() => {
    if (!isInstallments || isEditing) {
      setInstallments([]);
      return;
    };

    const newInstallments: Installment[] = [];
    const totalValue = Math.round((formData.valor || 0) * 100);
    const baseVencimento = parseDate(formData.data_pagamento || '');
    const baseCompetencia = parseDate(formData.data_competencia || '');
    
    if (isNaN(baseVencimento.getTime()) || isNaN(baseCompetencia.getTime())) return;

    let valuePerItem = 0;
    if (installmentsCount > 0) {
      valuePerItem = valueDistribution === 'divide' ? Math.floor(totalValue / installmentsCount) : totalValue;
    }
    let remainder = valueDistribution === 'divide' ? totalValue - (valuePerItem * installmentsCount) : 0;

    for (let i = 0; i < installmentsCount; i++) {
      const vencimento = new Date(baseVencimento);
      vencimento.setMonth(vencimento.getMonth() + i);

      const competencia = new Date(baseCompetencia);
      if (competenceMode === 'monthly') {
        competencia.setMonth(competencia.getMonth() + i);
      }
      
      const currentItemValue = valuePerItem + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      newInstallments.push({
        id: crypto.randomUUID(),
        vencimento: vencimento.toISOString().split('T')[0],
        competencia: competencia.toISOString().split('T')[0],
        valor: currentItemValue,
      });
    }
    setInstallments(newInstallments);
  }, [formData.valor, formData.data_pagamento, formData.data_competencia, installmentsCount, competenceMode, valueDistribution, isInstallments, isEditing]);
  
  const handleFormChange = (field: keyof Lancamento, value: unknown) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      if (field === 'tipo') {
        const currentCategory = categories.find(c => c.id === prev.categoria_id);
        if (currentCategory) {
          const isReceita = currentCategory.classificacao === 'RECEITA';
          if ((value === 'receita' && !isReceita) || (value === 'despesa' && isReceita)) {
            newFormData.categoria_id = '';
          }
        }
        setSplitItems([{ id: crypto.randomUUID(), categoria_id: '', valor: 0 }]);
      }
      return newFormData;
    });
  };

  const handleInstallmentChange = (id: string, field: keyof Installment, value: unknown) => {
    setInstallments(prev => prev.map(inst => inst.id === id ? { ...inst, [field]: value } : inst));
  }
  
  const handleSplitItemChange = (id: string, field: keyof SplitItem, value: unknown) => {
    setSplitItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addSplitItem = () => {
    setSplitItems(prev => [...prev, { id: crypto.randomUUID(), categoria_id: '', valor: 0 }]);
  };
  
  const removeSplitItem = (id: string) => {
    setSplitItems(prev => prev.filter(item => item.id !== id));
  };
  
  const totalDividido = useMemo(() => splitItems.reduce((acc, item) => acc + item.valor, 0), [splitItems]);
  const restanteADividir = useMemo(() => Math.round((formData.valor || 0) * 100) - totalDividido, [formData.valor, totalDividido]);
  
  const splittableCategories = useMemo(() => {
    if (formData.tipo === 'receita') {
        return categories.filter(c => c.classificacao === 'RECEITA');
    }
    return categories.filter(c => c.classificacao !== 'RECEITA');
  }, [categories, formData.tipo]);

  const handleSave = async () => {
    // --- Validation Start ---
    const requiredFields: (keyof Lancamento)[] = ['valor', 'data_pagamento', 'data_competencia', 'banco_id'];

    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os seguintes campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    if (isSplit) {
        if (restanteADividir !== 0) {
            alert('O valor total dividido por categoria/rubrica não corresponde ao valor total do lançamento.');
            return;
        }
        const missingSplitCategory = splitItems.some(item => !item.categoria_id || item.categoria_id === '');
        if (missingSplitCategory) {
            alert('Por favor, selecione uma rubrica para cada item da divisão.');
            return;
        }
    }
    // --- Validation End ---

    setModalLoading(true);

    if (isEditing) {
        const dataToUpdate = {
            ...formData,
            valor: Math.round((formData.valor || 0) * 100), // Convert back to cents
            categoria_id: isSplit && splitItems.length > 0 ? splitItems[0].categoria_id : formData.categoria_id,
            split_revenue: isSplit ? splitItems.map(i => ({ categoria_id: i.categoria_id, valor: Math.round(i.valor) })) : null,
            leilao_id: formData.leilao_id || null,
            unidade_id: formData.unidade_id || null,
        };
        
        // Remove id and other fields that shouldn't be updated directly
        delete dataToUpdate.id;
        delete (dataToUpdate as Record<string, unknown>).created_at;
        delete (dataToUpdate as Record<string, unknown>).runningBalance;

        // Remove undefined properties before update
        Object.keys(dataToUpdate).forEach(key => {
            if ((dataToUpdate as Record<string, unknown>)[key] === undefined) {
                delete (dataToUpdate as Record<string, unknown>)[key];
            }
        });
        const { data, error } = await supabase
            .from('lancamentos')
            .update(dataToUpdate)
            .eq('id', formData.id!)
            .select()
            .single();

        if (error) {
            console.error(error);
            alert("Erro ao atualizar o lançamento.");
        } else {
            setTransactions(p => p.map(t => t.id === data.id ? data : t));
            onClose();
        }
    } else if (isInstallments && installments.length > 0) {
        const totalValue = Math.round((formData.valor || 0) * 100);
        const splitProportions = isSplit && totalValue > 0
            ? splitItems.map(item => ({
                categoria_id: item.categoria_id,
                proportion: item.valor / totalValue,
              }))
            : [];

        const lancamentosToInsert = installments.map((inst, index) => {
            let installmentSplitRevenue = null;
            if (isSplit) {
                installmentSplitRevenue = splitProportions.map(p => ({
                    categoria_id: p.categoria_id,
                    valor: Math.round(inst.valor * p.proportion),
                  }));
                
                const splitTotal = installmentSplitRevenue.reduce((acc, item) => acc + item.valor, 0);
                const remainder = inst.valor - splitTotal;
                if (remainder !== 0 && installmentSplitRevenue.length > 0) {
                    installmentSplitRevenue[installmentSplitRevenue.length - 1].valor += remainder;
                }
            }

            return {
                data_pagamento: inst.vencimento,
                data_competencia: inst.competencia,
                descricao: `${formData.descricao || ''} (${index + 1}/${installments.length})`.trim(),
                valor: inst.valor,
                tipo: formData.tipo,
                status: formData.status || 'pendente',
                conciliado: false,
                categoria_id: isSplit && splitItems.length > 0 ? splitItems[0].categoria_id : formData.categoria_id,
                banco_id: formData.banco_id,
                leilao_id: formData.leilao_id || undefined,
                fornecedor: formData.fornecedor,
                unidade_id: formData.unidade_id || user.unidade_id || undefined,
                created_by: user.id,
                split_revenue: installmentSplitRevenue,
            };
        });

        const { data, error } = await supabase.from('lancamentos').insert(lancamentosToInsert).select();

        if (error) {
            console.error("Supabase Error:", JSON.stringify(error, null, 2));
            const friendlyMessage = `Erro ao salvar as parcelas.\n\nDetalhes: ${error.message}\nCódigo: ${error.code}`;
            alert(friendlyMessage);
        } else {
            setTransactions(p => [...p, ...data]);
            onClose();
        }

    } else {
        const dataToInsert = {
            data_pagamento: formData.data_pagamento,
            data_competencia: formData.data_competencia,
            descricao: formData.descricao || '',
            valor: Math.round((formData.valor || 0) * 100),
            tipo: formData.tipo,
            status: formData.status || 'pendente',
            conciliado: false, // Default to not reconciled
            categoria_id: isSplit && splitItems.length > 0 ? splitItems[0].categoria_id : (formData.categoria_id || null),
            banco_id: formData.banco_id,
            leilao_id: formData.leilao_id || undefined,
            fornecedor: formData.fornecedor,
            fornecedor_id: formData.fornecedor_id || null,
            unidade_id: formData.unidade_id || user.unidade_id || undefined,
            created_by: user.id,
            split_revenue: isSplit ? splitItems.map(i => ({ categoria_id: i.categoria_id, valor: Math.round(i.valor) })) : null,
        };

        // Remove null/undefined properties before insert
        Object.keys(dataToInsert).forEach(key => {
            if (dataToInsert[key as keyof typeof dataToInsert] === undefined) {
                delete dataToInsert[key as keyof typeof dataToInsert];
            }
        });

        const { data, error } = await supabase.from('lancamentos').insert(dataToInsert).select().single();
        if (error) {
            console.error("Supabase Error:", JSON.stringify(error, null, 2));
            const friendlyMessage = `Erro ao salvar o lançamento.\n\nDetalhes: ${error.message}\nCódigo: ${error.code}`;
            alert(friendlyMessage);
        }
        else { setTransactions(p => [...p, data]); onClose();}
    }

    setModalLoading(false);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">{isEditing ? 'Editar' : 'Novo'} Lançamento</h3><button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button></div>
        
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto">
          {/* Tipo de Lançamento */}
          <div className="md:col-span-2">
            <FormField label="Tipo de Lançamento">
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg max-w-sm">
                    <button
                        onClick={() => handleFormChange('tipo', 'despesa')}
                        className={`flex-1 text-center px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.tipo === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'}`}
                    >
                        Despesa
                    </button>
                    {user.role === 'admin' && (
                    <button
                        onClick={() => handleFormChange('tipo', 'receita')}
                        className={`flex-1 text-center px-4 py-2 text-sm font-semibold rounded-md transition-all ${formData.tipo === 'receita' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600'}`}
                    >
                        Receita
                    </button>
                    )}
                </div>
            </FormField>
          </div>

          {/* Coluna Esquerda */}
          <div className="space-y-4">
            <FormField label="Descrição"><input type="text" placeholder="Ex: Venda de Consultoria" className="w-full border border-slate-300 rounded-lg p-2" value={formData.descricao} onChange={e => handleFormChange('descricao', e.target.value)}/></FormField>
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Valor (R$)"><input type="number" step="0.01" className={`w-full border border-slate-300 rounded-lg p-2 font-semibold ${formData.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}`} value={formData.valor ?? ''} onChange={e => handleFormChange('valor', e.target.value === '' ? undefined : parseFloat(e.target.value))}/></FormField>
                <FormField label="Status"><select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={formData.status} onChange={e => handleFormChange('status', e.target.value)}><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField label="Vencimento"><input type="date" className="w-full border border-slate-300 rounded-lg p-2" value={formData.data_pagamento} onChange={e => handleFormChange('data_pagamento', e.target.value)}/></FormField>
                <FormField label="Competência"><input type="date" className="w-full border border-slate-300 rounded-lg p-2 disabled:bg-slate-100" value={formData.data_competencia} onChange={e => handleFormChange('data_competencia', e.target.value)} disabled={!!formData.leilao_id}/></FormField>
            </div>
            <FormField label="Cliente / Fornecedor (Opcional)">
                <div className="relative" ref={fornecedorRef}>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Buscar cliente ou fornecedor..."
                                className="w-full border border-slate-300 rounded-lg p-2"
                                value={fornecedorSearch}
                                onChange={e => {
                                    setFornecedorSearch(e.target.value);
                                    handleFormChange('fornecedor', e.target.value);
                                    handleFormChange('fornecedor_id', undefined);
                                    setShowFornecedorDropdown(true);
                                }}
                                onFocus={() => setShowFornecedorDropdown(true)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddFornecedor}
                            disabled={addingFornecedor || !fornecedorSearch.trim() || fornecedores.some(f => f.nome.toLowerCase() === fornecedorSearch.trim().toLowerCase())}
                            className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Adicionar novo cliente/fornecedor"
                        >
                            {addingFornecedor ? <Loader size={20} className="animate-spin"/> : <Plus size={20}/>}
                        </button>
                    </div>
                    {showFornecedorDropdown && (fornecedorSearch.trim() || fornecedores.length > 0) && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredFornecedores.length > 0 ? (
                                filteredFornecedores.map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => handleSelectFornecedor(f)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
                                    >
                                        {f.nome}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-slate-400">
                                    Nenhum resultado. Clique no + para adicionar.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </FormField>
             <FormField label="Conta / Banco">
                <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={formData.banco_id} onChange={e => handleFormChange('banco_id', e.target.value)}><option value="">Selecionar conta...</option>{bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</select>
            </FormField>
            <FormField label="Unidade">
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white" 
                    value={formData.unidade_id || ''} 
                    onChange={e => handleFormChange('unidade_id', e.target.value)}
                >
                    <option value="">Selecionar unidade...</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
            </FormField>
            <FormField label="Vincular ao Leilão (Opcional)">
                <select 
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white" 
                    value={formData.leilao_id || ''} 
                    onChange={e => handleFormChange('leilao_id', e.target.value === '' ? null : e.target.value)}
                >
                    <option value="">Nenhum</option>
                    {sortedLeiloes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
            </FormField>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-4">
            {!isSplit && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                  <FormField label="Categorização">
                      <div className="flex gap-2">
                          <select className="w-full border border-slate-300 rounded-lg p-2 bg-white flex-1" value={formData.categoria_id} onChange={e => handleFormChange('categoria_id', e.target.value)}><option value="">Selecione a rubrica...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.rubrica}</option>)}</select>
                          <button className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100"><Plus size={20}/></button>
                      </div>
                  </FormField>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded" checked={isSplit} onChange={e => {
                    setIsSplit(e.target.checked);
                    if (e.target.checked) {
                        handleFormChange('categoria_id', '');
                    }
                }}/> <span className="font-semibold text-slate-700">Dividir por Categoria/Rubrica</span></label>
                {isSplit && (
                    <div className="mt-4 space-y-2 animate-fade-in">
                        {splitItems.map(item => (
                            <div key={item.id} className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                                <select className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm" value={item.categoria_id} onChange={e => handleSplitItemChange(item.id, 'categoria_id', e.target.value)}><option value="">Selecione a rubrica...</option>{splittableCategories.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.rubrica}</option>)}</select>
                                <input type="number" placeholder="R$" className={`w-full border border-slate-300 rounded-lg p-2 text-sm text-right font-semibold ${formData.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}`} value={item.valor / 100} onChange={e => handleSplitItemChange(item.id, 'valor', Math.round(parseFloat(e.target.value)*100))}/>
                                <button onClick={() => removeSplitItem(item.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        <button onClick={addSplitItem} className="text-sm font-medium text-brand-800 hover:text-brand-900 mt-2">+ Adicionar Divisão</button>
                        <div className="text-right text-xs mt-2 pt-2 border-t border-slate-200">
                            <p>Total do Lançamento: <span className="font-bold">{formatCurrency(formData.valor ? formData.valor*100 : 0)}</span></p>
                            <p>Total Dividido: <span className="font-bold">{formatCurrency(totalDividido)}</span></p>
                            <p className={`font-bold ${restanteADividir === 0 ? 'text-green-600' : 'text-red-600'}`}>Restante a dividir: {formatCurrency(restanteADividir)}</p>
                        </div>
                    </div>
                )}
            </div>
          </div>
          
          {/* Parcelamento - Full width */}
          {!isEditing && (
            <div className="md:col-span-2 space-y-4">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded" checked={isInstallments} onChange={e => setIsInstallments(e.target.checked)}/> <span className="font-semibold text-slate-700">Parcelamento / Recorrência</span></label>
                    {isInstallments && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                        <FormField label="Nº de Parcelas"><input type="number" min="2" className="w-full border border-slate-300 rounded-lg p-2" value={installmentsCount} onChange={e => setInstallmentsCount(parseInt(e.target.value))} /></FormField>
                        <FormField label="Competência"><select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={competenceMode} onChange={e => setCompetenceMode(e.target.value as 'fixed' | 'monthly')}><option value="fixed">Fixa</option><option value="monthly">Mensal</option></select></FormField>
                        <FormField label="Distribuição do Valor"><select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={valueDistribution} onChange={e => setValueDistribution(e.target.value as 'divide' | 'repeat')}><option value="divide">Dividir valor total</option><option value="repeat">Repetir valor</option></select></FormField>
                    </div>
                    )}
                 </div>
                 {isInstallments && installments.length > 0 && (
                     <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-200/80 md:col-span-2">
                        <h4 className="font-semibold text-sky-800 text-sm mb-2">Prévia das Parcelas (Editável)</h4>
                        <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-sky-700 font-medium">
                                <th className="p-1 w-8">#</th><th className="p-1">Vencimento</th><th className="p-1">Competência</th><th className="p-1 text-right">Valor</th>
                            </tr></thead>
                            <tbody>{installments.map((inst, i) => (
                                <tr key={inst.id}>
                                    <td className="p-1 text-slate-500">{i+1})</td>
                                    <td className="p-1"><input type="date" value={inst.vencimento} onChange={e => handleInstallmentChange(inst.id, 'vencimento', e.target.value)} className="w-full border border-slate-300 rounded p-1 bg-white" /></td>
                                    <td className="p-1"><input type="date" value={inst.competencia} onChange={e => handleInstallmentChange(inst.id, 'competencia', e.target.value)} className="w-full border border-slate-300 rounded p-1 bg-white" /></td>
                                    <td className="p-1"><input type="number" value={inst.valor/100} onChange={e => handleInstallmentChange(inst.id, 'valor', Math.round(parseFloat(e.target.value)*100))} className="w-full border border-slate-300 rounded p-1 bg-white text-right" /></td>
                                </tr>
                            ))}</tbody>
                        </table>
                        </div>
                     </div>
                 )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/70">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={modalLoading} className="px-5 py-2.5 bg-brand-800 text-white rounded-lg text-sm font-bold hover:bg-brand-900 disabled:bg-brand-700 disabled:opacity-70 flex items-center justify-center min-w-[140px]">
            {modalLoading ? <><Loader size={18} className="animate-spin"/> Salvando...</> : <><Save size={16}/> Salvar Lançamento</>}
          </button>
        </div>
      </div>
    </div>
  );
};