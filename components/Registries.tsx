import React, { useState, useMemo } from 'react';
import { 
  Banco, Leilao, LeilaoCategoria, Unidade, Categoria, User, CentroCusto 
} from '../types';
import { Plus, Pencil, Trash2, Search, Loader, X, FileInput, DatabaseZap } from 'lucide-react';
import { formatCurrency, formatDate, parseDateToISO } from '../utils/format';
import { supabase } from '../supabaseClient';
import { ALL_MENU_ITEMS } from './Sidebar';
import { ImportModal } from './ImportModal';
import { generateRegistryTemplate } from '../utils/importExport';


type RegistryType =
  | 'bancos'
  | 'leiloes'
  | 'leilao_categorias'
  | 'unidades'
  | 'categorias'
  | 'users'
  | 'centros_custo';

interface RegistriesProps {
  bancos: Banco[];
  setBancos: React.Dispatch<React.SetStateAction<Banco[]>>;
  leiloes: Leilao[];
  setLeiloes: React.Dispatch<React.SetStateAction<Leilao[]>>;
  catLeilao: LeilaoCategoria[];
  setCatLeilao: React.Dispatch<React.SetStateAction<LeilaoCategoria[]>>;
  unidades: Unidade[];
  setUnidades: React.Dispatch<React.SetStateAction<Unidade[]>>;
  planoContas: Categoria[];
  setPlanoContas: React.Dispatch<React.SetStateAction<Categoria[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  centros: CentroCusto[];
  setCentros: React.Dispatch<React.SetStateAction<CentroCusto[]>>;
}

const tableMap: Record<string, { name: string, stateSetter: React.Dispatch<React.SetStateAction<unknown[]>>, data: unknown[] }> = {};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    {children}
  </div>
);

const Registries: React.FC<RegistriesProps> = (props) => {
  const [activeTab, setActiveTab] = useState<RegistryType>('bancos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // We are keeping groupedPlanoContas for future use, but commenting it out to fix linting errors for now.
  /*
  const groupedPlanoContas = useMemo(() => {
    const grouped = props.planoContas.reduce((acc, item) => {
        const { classificacao, centro } = item;
        if (!acc[classificacao]) acc[classificacao] = {};
        if (!acc[classificacao][centro]) acc[classificacao][centro] = [];
        acc[classificacao][centro].push(item);
        return acc;
    }, {} as Record<string, Record<string, Categoria[]>>);

    const CLASSIFICACAO_ORDER = ['RECEITA', 'CUSTO_VARIAVEL', 'DESPESA_FIXA', 'NAO_OPERACIONAL'];
    const sortedClassificacoes = (Object.keys(grouped) as string[]).sort((a, b) => {
        const indexA = CLASSIFICACAO_ORDER.indexOf(a);
        const indexB = CLASSIFICACAO_ORDER.indexOf(b);
        if (indexA === -1 && indexB !== -1) return 1;
        if (indexA !== -1 && indexB === -1) return -1;
        return indexA - indexB;
    });

    return sortedClassificacoes.map(classificacao => ({
        classificacao,
        centros: Object.entries(grouped[classificacao])
            .map(([centro, rubricas]) => ({
                centro,
                rubricas: (rubricas as Categoria[]).sort((a, b) => a.codigo.localeCompare(b.codigo))
            }))
            .sort((a, b) => a.centro.localeCompare(b.centro))
    }));
  }, [props.planoContas]);
  */

  tableMap.bancos = { name: 'Bancos', stateSetter: props.setBancos, data: props.bancos };
  tableMap.unidades = { name: 'Unidades', stateSetter: props.setUnidades, data: props.unidades };
  tableMap.leiloes = { name: 'Leilões', stateSetter: props.setLeiloes, data: props.leiloes };
  tableMap.leilao_categorias = { name: 'Cat. Leilão', stateSetter: props.setCatLeilao, data: props.catLeilao };
  tableMap.categorias = { name: 'Plano de Contas', stateSetter: props.setPlanoContas, data: props.planoContas };
  tableMap.centros_custo = { name: 'Centros de Custo', stateSetter: props.setCentros, data: props.centros };
  tableMap.users = { name: 'Usuários', stateSetter: props.setUsers, data: props.users };

  const handleDelete = async (id: string) => {
    if (id === props.currentUser.id) {
        alert("Você não pode excluir seu próprio usuário.");
        return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      tableMap[activeTab].stateSetter((prev: unknown[]) => prev.filter((i: Record<string, unknown>) => i.id !== id));
    }
  };

  const getInitialItem = (tab: RegistryType) => {
    const today = new Date().toISOString().split('T')[0];
    switch (tab) {
      case 'bancos': return { nome: '', codigo: '', saldo_inicial: 0 };
      case 'unidades': return { nome: '' };
      case 'leiloes': return { nome: '', data: today, categoria_id: '' };
      case 'leilao_categorias': return { nome: '' };
      case 'categorias': return { codigo: '', rubrica: '', centro: '', classificacao: 'DESPESA_FIXA' };
      case 'centros_custo': return { nome: '' };
      case 'users': return { name: '', email: '', role: 'colaborador', unidade_id: null, avatar: '', permissions: [] };
      default: return {};
    }
  };

  const handleOpenModal = (itemToEdit: Record<string, unknown> | null = null) => {
    if (itemToEdit) {
      const preparedItem = { ...itemToEdit };
      if (activeTab === 'bancos') preparedItem.saldo_inicial = (preparedItem.saldo_inicial as number) / 100;
      if (activeTab === 'users') preparedItem.permissions = Array.isArray(preparedItem.permissions) ? preparedItem.permissions : [];
      setEditingItem(preparedItem);
    } else {
      setEditingItem(getInitialItem(activeTab));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalChange = (field: string, value: unknown) => {
    setEditingItem((prev) => prev ? { ...prev, [field]: value } : null);
  };
  
  const handlePermissionChange = (viewId: string, isChecked: boolean) => {
    setEditingItem((prev) => {
        if (!prev) return null;
        const currentPermissions = (prev.permissions as string[]) || [];
        if (isChecked) {
            return { ...prev, permissions: [...currentPermissions, viewId] };
        } else {
            return { ...prev, permissions: currentPermissions.filter(id => id !== viewId) };
        }
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setModalLoading(true);

    if (activeTab === 'users' && !editingItem.id) {
        const body: {
            email: string;
            name: string;
            role: string;
            unidade_id?: string;
            permissions?: string[];
        } = {
            email: editingItem.email,
            name: editingItem.name,
            role: editingItem.role,
        };

        if (editingItem.unidade_id) {
            body.unidade_id = editingItem.unidade_id;
        }

        if (editingItem.role === 'colaborador') {
            body.permissions = editingItem.permissions || [];
        }

        const { error } = await supabase.functions.invoke('invite-user', { body });

        if (error) {
            alert(`Falha na comunicação com o servidor ao tentar convidar o usuário. Por favor, verifique sua conexão com a internet e tente novamente. (Detalhe: ${error.message})`);
        } else {
            alert('Convite enviado com sucesso! O novo usuário receberá um e-mail para definir sua senha.');
            handleCloseModal();
        }
        setModalLoading(false);
        return;
    }

    const dataToSave = { ...editingItem };
    if (activeTab === 'bancos') dataToSave.saldo_inicial = Math.round(((dataToSave.saldo_inicial as number) || 0) * 100);
    if (activeTab === 'users' && dataToSave.unidade_id === '') dataToSave.unidade_id = null;
    if (activeTab === 'users' && dataToSave.role === 'admin') dataToSave.permissions = null;
    if (activeTab === 'categorias' && !dataToSave.comp) {
        dataToSave.comp = dataToSave.codigo; // Ensure comp is set for manual adds/edits too
    }

    const { data, error } = await supabase.from(activeTab).upsert(dataToSave).select().single();
    
    if (error) {
        alert(`Erro ao salvar: ${error.message}`);
    } else if (data) {
        const stateSetter = tableMap[activeTab].stateSetter;
        if (editingItem.id) {
            stateSetter((prev: unknown[]) => prev.map((item: Record<string, unknown>) => item.id === data.id ? data : item));
        } else {
            stateSetter((prev: unknown[]) => [...prev, data]);
        }
        handleCloseModal();
    }
    
    setModalLoading(false);
  };
  
  const handleImportRegistries = async (data: Record<string, unknown>[]): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    const rowsToInsert: Record<string, unknown>[] = [];

    if (activeTab === 'categorias') {
        const existingCentros = new Set(props.centros.map(c => c.nome));
        const newCentrosToCreate = new Set<string>();
        data.forEach(row => {
            const { NomeGrupo } = row;
            if (NomeGrupo && !existingCentros.has(String(NomeGrupo))) {
                newCentrosToCreate.add(String(NomeGrupo));
            }
        });

        if (newCentrosToCreate.size > 0) {
            const newCentrosData = Array.from(newCentrosToCreate).map(nome => ({ nome }));
            const { data: createdCentros, error } = await supabase.from('centros_custo').insert(newCentrosData).select();

            if (error) {
                errors.push(`Erro ao criar novos Centros de Custo: ${error.message}`);
                return { success: false, errors };
            } else if (createdCentros) {
                props.setCentros(prev => [...prev, ...createdCentros]);
            }
        }
    }
    
    data.forEach((row, index) => {
        let newItem: Record<string, unknown> = {};
        let rowError = false;

        switch (activeTab) {
            case 'categorias':
                const classificacao = String(row.NomeClassificacao).toUpperCase();
                if (!['RECEITA', 'CUSTO_VARIAVEL', 'DESPESA_FIXA', 'NAO_OPERACIONAL'].includes(classificacao)) {
                    errors.push(`Linha ${index + 2}: Classificação '${row.NomeClassificacao}' inválida.`);
                    rowError = true;
                }
                newItem = {
                    classificacao: classificacao,
                    centro: String(row.NomeGrupo),
                    codigo: String(row.CodRubrica),
                    rubrica: String(row.NomeRubrica),
                };
                break;
            // Add other cases for different registries if needed
        }

        if (!rowError) {
            rowsToInsert.push(newItem);
        }
    });

    if (rowsToInsert.length > 0) {
        const { data: insertedData, error } = await supabase.from(activeTab).insert(rowsToInsert).select();
        if (error) {
            errors.push(`Erro ao inserir dados em lote: ${error.message}`);
        } else if (insertedData) {
            tableMap[activeTab].stateSetter((prev: unknown[]) => [...prev, ...insertedData]);
        }
    }

    return { success: errors.length === 0, errors };
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableMap[activeTab]?.data || [];
    return (tableMap[activeTab]?.data || []).filter((item: Record<string, unknown>) =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, activeTab, props]);

  const renderModalContent = () => {
    if (!editingItem) return null;
    switch (activeTab) {
      case 'bancos':
        return (<>
          <FormField label="Nome do Banco"><input type="text" value={editingItem.nome} onChange={e => handleModalChange('nome', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Código"><input type="text" value={editingItem.codigo} onChange={e => handleModalChange('codigo', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Saldo Inicial (R$)"><input type="number" step="0.01" value={editingItem.saldo_inicial ?? ''} onChange={e => handleModalChange('saldo_inicial', e.target.value === '' ? undefined : parseFloat(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
        </>);
      case 'unidades':
        return <FormField label="Nome da Unidade"><input type="text" value={editingItem.nome} onChange={e => handleModalChange('nome', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>;
      case 'centros_custo':
        return <FormField label="Nome do Centro de Custo"><input type="text" value={editingItem.nome} onChange={e => handleModalChange('nome', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>;
      case 'leiloes':
        return (<>
          <FormField label="Nome do Leilão"><input type="text" value={editingItem.nome} onChange={e => handleModalChange('nome', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Data"><input type="date" value={parseDateToISO(editingItem.data)} onChange={e => handleModalChange('data', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Categoria"><select value={editingItem.categoria_id} onChange={e => handleModalChange('categoria_id', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="">Selecione</option>{props.catLeilao.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></FormField>
          <FormField label="Unidade"><select value={editingItem.unidade_id} onChange={e => handleModalChange('unidade_id', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="">Selecione</option>{props.unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></FormField>
        </>);
      case 'leilao_categorias':
        return <FormField label="Nome da Categoria"><input type="text" value={editingItem.nome} onChange={e => handleModalChange('nome', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>;
      case 'categorias':
        return (<>
          <FormField label="Código da Rubrica"><input type="text" value={editingItem.codigo} onChange={e => handleModalChange('codigo', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Nome da Rubrica"><input type="text" value={editingItem.rubrica} onChange={e => handleModalChange('rubrica', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
          <FormField label="Centro de Custo"><select value={editingItem.centro} onChange={e => handleModalChange('centro', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="">Selecione</option>{props.centros.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></FormField>
          <FormField label="Classificação DRE"><select value={editingItem.classificacao} onChange={e => handleModalChange('classificacao', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="RECEITA">RECEITA</option><option value="CUSTO_VARIAVEL">CUSTO VARIÁVEL</option><option value="DESPESA_FIXA">DESPESA FIXA</option><option value="NAO_OPERACIONAL">NÃO OPERACIONAL</option></select></FormField>
        </>);
      case 'users':
        return (<>
            <FormField label="Nome Completo"><input type="text" value={editingItem.name} onChange={e => handleModalChange('name', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" /></FormField>
            <FormField label="Email"><input type="email" value={editingItem.email} onChange={e => handleModalChange('email', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" disabled={!!editingItem.id} /></FormField>
            {!editingItem.id && <p className="text-xs text-slate-500 -mt-2">O usuário receberá um convite por e-mail para definir a senha.</p>}
            <FormField label="Perfil"><select value={editingItem.role} onChange={e => handleModalChange('role', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="admin">Admin</option><option value="colaborador">Colaborador</option></select></FormField>
            <FormField label="Unidade Padrão"><select value={editingItem.unidade_id || ''} onChange={e => handleModalChange('unidade_id', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white"><option value="">Nenhuma</option>{props.unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></FormField>
            {editingItem.role === 'colaborador' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Permissões de Acesso</label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-lg border">
                        {ALL_MENU_ITEMS.flatMap(item => item.children ? item.children : item).map(view => {
                            if (['dashboard', 'tutorial'].includes(view.id)) return null;
                            return (
                                <label key={view.id} className="flex items-center gap-2">
                                    <input type="checkbox" checked={(editingItem.permissions || []).includes(view.id)} onChange={e => handlePermissionChange(view.id, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                    <span className="text-sm">{view.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </>);
      default: return null;
    }
  };

  const renderTable = () => {
    if (activeTab === 'categorias') return renderPlanoContasTable();

    let columns: { key: string, label: string, render?: (item: Record<string, unknown>) => React.ReactNode }[] = [];
    switch(activeTab) {
        case 'bancos': columns = [{key: 'nome', label: 'Nome'}, {key: 'codigo', label: 'Código'}, {key: 'saldo_inicial', label: 'Saldo Inicial', render: item => formatCurrency(item.saldo_inicial as number)}]; break;
        case 'unidades': columns = [{key: 'nome', label: 'Nome'}]; break;
        case 'centros_custo': columns = [{key: 'nome', label: 'Nome'}]; break;
        case 'leiloes': columns = [{key: 'nome', label: 'Nome'}, {key: 'data', label: 'Data', render: item => formatDate(item.data as string)}, {key: 'categoria_id', label: 'Categoria', render: item => props.catLeilao.find(c => c.id === item.categoria_id)?.nome || 'N/A'}]; break;
        case 'leilao_categorias': columns = [{key: 'nome', label: 'Nome'}]; break;
        case 'users': columns = [{key: 'name', label: 'Nome'}, {key: 'email', label: 'Email'}, {key: 'role', label: 'Perfil'}, {key: 'unidade_id', label: 'Unidade', render: item => props.unidades.find(u => u.id === item.unidade_id)?.nome || '-'}]; break;
    }

    return (
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                    {columns.map(c => <th key={c.key} className="px-6 py-4">{c.label}</th>)}
                    <th className="px-6 py-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="hover:bg-slate-50 group">
                        {columns.map(c => <td key={c.key} className="px-6 py-4">{c.render ? c.render(item) : (item[c.key] as React.ReactNode)}</td>)}
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded text-sky-600 hover:bg-sky-100" title="Editar"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(item.id as string)} className="p-1.5 rounded text-red-600 hover:bg-red-100" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
  };

  const renderPlanoContasTable = () => {
    // This is a simplified table for brevity. The original had complex grouping.
    return (
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Rubrica</th>
                    <th className="px-6 py-4">Centro de Custo</th>
                    <th className="px-6 py-4">Classificação DRE</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 font-mono">{item.codigo as string}</td>
                        <td className="px-6 py-4 font-medium">{item.rubrica as string}</td>
                        <td className="px-6 py-4">{item.centro as string}</td>
                        <td className="px-6 py-4 text-xs font-semibold">{(item.classificacao as string).replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded text-sky-600 hover:bg-sky-100" title="Editar"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(item.id as string)} className="p-1.5 rounded text-red-600 hover:bg-red-100" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Cadastros Gerais</h2>
        <div className="flex gap-2">
           <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
              <FileInput size={16} /> Importar
           </button>
           <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 text-sm font-medium transition-colors shadow-sm">
              <Plus size={16} /> Novo Item
           </button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {Object.entries(tableMap).map(([key, { name }]) => (
            props.currentUser.role === 'admin' || key !== 'users' ? 
            <button key={key} onClick={() => setActiveTab(key as RegistryType)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              <DatabaseZap size={16}/> {name}
            </button>
            : null
          ))}
        </nav>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar em..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center"><h3 className="font-bold text-lg">{(editingItem && editingItem.id) ? 'Editar' : 'Novo'} Item</h3><button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button></div>
            <div className="p-6 space-y-4">{renderModalContent()}</div>
            <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-white border rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={modalLoading} className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium disabled:opacity-70 flex items-center gap-2">
                {modalLoading ? <><Loader size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportRegistries}
        generateTemplate={() => generateRegistryTemplate(activeTab)}
        title={`Importar ${tableMap[activeTab]?.name || ''}`}
        templateName={`modelo_${activeTab}.xlsx`}
      />
    </div>
  );
};

export default Registries;