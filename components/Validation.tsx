import React, { useState, useMemo } from 'react';
import { Lancamento, User, Banco, Categoria, Leilao, Unidade, UnvalidatedTransaction } from '../types';
import { parseDateToISO } from '../utils/format';
import { Loader, Save, Trash2, AlertTriangle, Edit, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ValidationViewProps {
  unvalidated: UnvalidatedTransaction[];
  setUnvalidated: React.Dispatch<React.SetStateAction<UnvalidatedTransaction[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  user: User;
  bancos: Banco[];
  categories: Categoria[];
  leiloes: Leilao[];
  unidades: Unidade[];
}

const ValidationView: React.FC<ValidationViewProps> = ({ unvalidated, setUnvalidated, setTransactions, user, bancos, categories, leiloes, unidades }) => {
  const [editableRows, setEditableRows] = useState<UnvalidatedTransaction[]>(unvalidated);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMassEditModalOpen, setIsMassEditModalOpen] = useState(false);
  const [massEditField, setMassEditField] = useState<'codigo_banco' | 'nome_unidade' | 'tipo'>('codigo_banco');
  const [massEditValue, setMassEditValue] = useState('');


  const categoriasMap = useMemo(() => new Map(categories.map(c => [c.codigo, c.id])), [categories]);
  const bancosMap = useMemo(() => new Map(bancos.map(b => [b.codigo, b.id])), [bancos]);
  const leiloesMap = useMemo(() => new Map(leiloes.map(l => [l.nome, l.id])), [leiloes]);
  const unidadesMap = useMemo(() => new Map(unidades.map(u => [u.nome, u.id])), [unidades]);

  const handleRowChange = (id: string, field: string, value: unknown) => {
    setEditableRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, rowData: { ...row.rowData, [field]: value } };
      }
      return row;
    }));
  };

  const validateAndSaveRow = async (row: UnvalidatedTransaction) => {
    setLoading(prev => new Set(prev).add(row.id));
    
    const rowErrors: string[] = [];
    const { 'data_pagamento (DD/MM/YYYY)': data_pagamento, 'data_competencia (DD/MM/YYYY)': data_competencia, descricao, 'valor (ex: 123.45)': valor, 'tipo (receita ou despesa)': tipo, codigo_rubrica, codigo_banco, fornecedor, 'nome_leilao (opcional)': nome_leilao, 'nome_unidade (opcional)': nome_unidade } = row.rowData;

    // --- Re-Validation Logic ---
    if (!data_pagamento) rowErrors.push("Data de pagamento é obrigatória.");
    if (!valor) rowErrors.push("Valor é obrigatório.");
    if (!tipo) rowErrors.push("Tipo é obrigatório.");
    if (!codigo_rubrica) rowErrors.push("Código da rubrica é obrigatório.");
    if (!codigo_banco) rowErrors.push("Código do banco é obrigatório.");
    
    const categoria_id = categoriasMap.get(String(codigo_rubrica));
    if (!categoria_id) rowErrors.push(`Rubrica "${codigo_rubrica}" não encontrada.`);

    const banco_id = bancosMap.get(String(codigo_banco));
    if (!banco_id) rowErrors.push(`Banco "${codigo_banco}" não encontrado.`);

    let leilao_id = null;
    if (nome_leilao) {
        leilao_id = leiloesMap.get(nome_leilao);
        if(!leilao_id) rowErrors.push(`Leilão "${nome_leilao}" não encontrado.`);
    }

    let unidade_id = null;
    if (nome_unidade) {
        unidade_id = unidadesMap.get(nome_unidade);
        if(!unidade_id) rowErrors.push(`Unidade "${nome_unidade}" não encontrada.`);
    }

    const parsedValor = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(parsedValor)) rowErrors.push(`Valor "${valor}" inválido.`);
    
    const isoPagamento = parseDateToISO(data_pagamento);
    if (!isoPagamento) {
        rowErrors.push("Data de pagamento inválida.");
    }

    const isoCompetencia = parseDateToISO(data_competencia);
    if (data_competencia && !isoCompetencia) {
        rowErrors.push("Data de competência inválida.");
    }
    
    if (rowErrors.length > 0) {
      setEditableRows(prev => prev.map(r => r.id === row.id ? { ...r, errors: rowErrors } : r));
      setLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(row.id);
          return newSet;
      });
      return null;
    }

    const newLancamento = {
        data_pagamento: isoPagamento!,
        data_competencia: isoCompetencia || isoPagamento!,
        descricao: descricao || '',
        valor: Math.round(parsedValor * 100),
        tipo: String(tipo).toLowerCase(),
        categoria_id: categoria_id!,
        banco_id: banco_id!,
        leilao_id,
        unidade_id,
        fornecedor: fornecedor || '',
        status: user.role === 'admin' ? 'aprovado' : 'pendente',
        created_by: user.id,
        approved_by: user.role === 'admin' ? user.id : null,
        conciliado: false,
    };
    
    const { data, error } = await supabase.from('lancamentos').insert(newLancamento).select().single();

    setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(row.id);
        return newSet;
    });

    if (error) {
        setEditableRows(prev => prev.map(r => r.id === row.id ? { ...r, errors: [...r.errors, `Erro no DB: ${error.message}`] } : r));
        return null;
    }

    return data;
  };

  const handleSave = async (id: string) => {
    const rowToSave = editableRows.find(r => r.id === id);
    if (!rowToSave) return;
    const savedData = await validateAndSaveRow(rowToSave);
    if (savedData) {
      setTransactions(prev => [...prev, savedData]);
      const updatedUnvalidated = editableRows.filter(r => r.id !== id);
      setEditableRows(updatedUnvalidated);
      setUnvalidated(updatedUnvalidated);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que quer descartar este lançamento?')) {
        const updated = editableRows.filter(r => r.id !== id);
        setEditableRows(updated);
        setUnvalidated(updated);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(editableRows.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleMassUpdate = () => {
    if (!massEditValue) {
        alert('Por favor, selecione ou digite um valor para aplicar.');
        return;
    }
    const fieldKeyMap: Record<typeof massEditField, string> = {
        codigo_banco: 'codigo_banco',
        nome_unidade: 'nome_unidade (opcional)',
        tipo: 'tipo (receita ou despesa)',
    };
    const fieldKey = fieldKeyMap[massEditField];
    setEditableRows(prev =>
        prev.map(row => {
            if (selectedIds.has(row.id)) {
                return { ...row, rowData: { ...row.rowData, [fieldKey]: massEditValue } };
            }
            return row;
        })
    );
    setIsMassEditModalOpen(false);
    setMassEditValue('');
    setSelectedIds(new Set());
  };

  if (editableRows.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <ShieldCheck size={48} className="mx-auto text-green-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800">Tudo Certo!</h3>
          <p className="mt-1 text-gray-500">Nenhum lançamento pendente de validação.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500 font-medium">
                  <th className="p-3 w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === editableRows.length} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
                  </th>
                  <th className="p-3">Data Pgto.</th>
                  <th className="p-3">Data Comp.</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Cód. Rubrica</th>
                  <th className="p-3">Cód. Banco</th>
                  <th className="p-3">Nome Unidade</th>
                  <th className="p-3 w-64">Erros</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editableRows.map(row => (
                  <tr key={row.id} className={`align-top transition-colors ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-2 text-center">
                       <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleSelectRow(row.id)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
                    </td>
                    <td className="p-2"><input type="text" value={row.rowData['data_pagamento (DD/MM/YYYY)'] || ''} onChange={(e) => handleRowChange(row.id, 'data_pagamento (DD/MM/YYYY)', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['data_competencia (DD/MM/YYYY)'] || ''} onChange={(e) => handleRowChange(row.id, 'data_competencia (DD/MM/YYYY)', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['descricao'] || ''} onChange={(e) => handleRowChange(row.id, 'descricao', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['valor (ex: 123.45)'] || ''} onChange={(e) => handleRowChange(row.id, 'valor (ex: 123.45)', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['tipo (receita ou despesa)'] || ''} onChange={(e) => handleRowChange(row.id, 'tipo (receita ou despesa)', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['codigo_rubrica'] || ''} onChange={(e) => handleRowChange(row.id, 'codigo_rubrica', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['codigo_banco'] || ''} onChange={(e) => handleRowChange(row.id, 'codigo_banco', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2"><input type="text" value={row.rowData['nome_unidade (opcional)'] || ''} onChange={(e) => handleRowChange(row.id, 'nome_unidade (opcional)', e.target.value)} className="w-full p-1 border border-gray-300 rounded" /></td>
                    <td className="p-2">
                      <ul className="text-xs text-red-600 space-y-1">
                        {row.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-1"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {err}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => handleSave(row.id)} disabled={loading.has(row.id)} className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50" title="Salvar">
                          {loading.has(row.id) ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                        </button>
                        <button onClick={() => handleDelete(row.id)} disabled={loading.has(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedIds.size > 0 && (
            <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-3 flex items-center justify-between shadow-top animate-fade-in-up">
              <span className="text-sm font-semibold text-gray-700">{selectedIds.size} {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}</span>
              <button onClick={() => setIsMassEditModalOpen(true)} className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 text-sm font-medium shadow-sm">
                <Edit size={16}/> Editar em Massa
              </button>
            </div>
          )}
        </div>
      
        {isMassEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsMassEditModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Edição em Massa</h3>
              <button onClick={() => setIsMassEditModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Campo para Alterar</label>
                <select value={massEditField} onChange={e => setMassEditField(e.target.value as 'codigo_banco' | 'nome_unidade' | 'tipo')} className="w-full border border-gray-300 rounded-lg p-2 bg-white">
                  <option value="codigo_banco">Código do Banco</option>
                  <option value="nome_unidade">Nome da Unidade</option>
                  <option value="tipo">Tipo (receita ou despesa)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Novo Valor</label>
                 <input type="text" value={massEditValue} onChange={e => setMassEditValue(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="Digite o novo valor..."/>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsMassEditModalOpen(false)} className="px-4 py-2 bg-white border rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleMassUpdate} className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium">Aplicar a {selectedIds.size} Itens</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationView;
