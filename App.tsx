import React, { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Reconciliation from './components/Reconciliation';
import CashFlow from './components/CashFlow';
import DRE from './components/DRE';
import AuctionSimulator from './components/AuctionSimulator';
import AuctionComparison from './components/AuctionComparison';
import Registries from './components/Registries';
import AnnualAuctions from './components/AnnualAuctions';
import { FinancialEntryForm } from './components/FinancialEntryForm';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import DatabaseExport from './components/DatabaseExport';
import Tutorial from './components/Tutorial';
import { TransactionModal } from './components/TransactionModal';
import TransactionDetailsModal from './components/TransactionDetailsModal';
import { supabase } from './supabaseClient';
import { Loader, ShieldOff } from 'lucide-react';
import { Period } from './components/PeriodSelector';

import { Banco, Categoria, Lancamento, Leilao, LeilaoCategoria, Unidade, User, CentroCusto, Previsao, UnvalidatedTransaction, TransactionFilters } from './types';
import { parseDate } from './utils/format';
import { 
  BANCOS, 
  CATEGORIAS, 
  CENTROS_CUSTO,
  CURRENT_USER,
  LEILAO_CATEGORIAS,
  LEILOES, 
  MOCK_LANCAMENTOS, 
  MOCK_PREVISOES,
  OTHER_USERS,
  UNIDADES
} from './services/mockData';

interface ViewStates {
  transactions: TransactionFilters;
  dashboard: {
    period: { primary: Period; comparative: Period | null };
    selectedUnidade: string;
    activeTab: 'overview' | 'auctions' | 'expenses' | 'individualAuction';
    selectedLeilaoId: string;
  };
  cashFlow: { period: { primary: Period; comparative: Period | null } };
  dre: { period: { primary: Period; comparative: Period | null } };
  annualAuctions: { selectedYear: number };
  auctionComparison: { selectedPrevisaoIds: Set<string> };
  reconciliation: {
    selectedBankIds: Set<string>;
    selectedUnidades: Set<string>;
    leilaoFilter: Set<string>;
    rubricaFilter: Set<string>;
    dateFilter: { start: string; end: string };
  };
}

interface DetailsModalState {
  isOpen: boolean;
  title: string;
  transactions: Lancamento[];
}

const ProtectedRoute: React.FC<{ viewId: string; currentUser: User | null; children: React.ReactNode }> = ({ viewId, currentUser, children }) => {
  if (!currentUser) return null; // Should be covered by shellLoading

  const hasPermission = currentUser.role === 'admin' || currentUser.permissions?.includes(viewId);
  if (!hasPermission) {
     return (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
              <ShieldOff className="text-red-500 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
              <p className="text-gray-500 mt-2">Você não tem permissão para visualizar esta tela.</p>
          </div>
      );
  }
  return <>{children}</>;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [shellLoading, setShellLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Central State Management for data
  const [transactions, setTransactions] = useState<Lancamento[]>([]);
  const [unvalidatedTransactions, setUnvalidatedTransactions] = useState<UnvalidatedTransaction[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [leiloes, setLeiloes] = useState<Leilao[]>([]);
  const [previsoes, setPrevisoes] = useState<Previsao[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [catLeilao, setCatLeilao] = useState<LeilaoCategoria[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<Lancamento> | null>(null);
  
  // Details Modal State (for drilldown)
  const [detailsModal, setDetailsModal] = useState<DetailsModalState>({ isOpen: false, title: '', transactions: [] });

  // Centralized UI state for filters, selections, etc.
  const defaultYear = new Date().getFullYear();
  const defaultPeriod = { primary: { year: defaultYear, months: new Set(Array.from({ length: 12 }, (_, i) => i)) }, comparative: null };

  const [viewStates, setViewStates] = useState<ViewStates>({
    transactions: {
      filter: '',
      statusFilter: 'all',
      startDate: '',
      endDate: '',
      leilaoFilter: new Set<string>(),
      unidadeFilter: new Set<string>(),
      rubricaFilter: new Set<string>(),
      currentPage: 1,
    },
    dashboard: { period: defaultPeriod, selectedUnidade: 'all', activeTab: 'overview', selectedLeilaoId: 'all' },
    cashFlow: { period: defaultPeriod },
    dre: { period: defaultPeriod },
    annualAuctions: { selectedYear: defaultYear },
    auctionComparison: { selectedPrevisaoIds: new Set<string>() },
    reconciliation: {
      selectedBankIds: new Set<string>(),
      selectedUnidades: new Set<string>(),
      leilaoFilter: new Set<string>(),
      rubricaFilter: new Set<string>(),
      dateFilter: { start: '', end: '' },
    },
  });

  const visibleTransactions = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return transactions;
    return transactions.filter(t => t.created_by === currentUser.id);
  }, [transactions, currentUser]);
  
  const handleCellClick = ({ filters, title, dateField }: {
    filters: { yearFilter: number; monthFilter: string; categoryIds: string[] };
    title: string;
    dateField: 'data_pagamento' | 'data_competencia';
  }) => {
    if (!filters.categoryIds || filters.categoryIds.length === 0) return;

    const filteredTransactions = visibleTransactions.filter(t => {
      if (t.status !== 'aprovado') return false;
      if (!filters.categoryIds.includes(t.categoria_id)) return false;

      const date = parseDate(t[dateField]);
      if (isNaN(date.getTime())) return false;

      const yearMatch = date.getFullYear() === filters.yearFilter;
      const monthMatch = filters.monthFilter === 'all' || date.getMonth() === parseInt(filters.monthFilter!);

      return yearMatch && monthMatch;
    });

    setDetailsModal({ isOpen: true, title, transactions: filteredTransactions });
  };

  const closeDetailsModal = () => setDetailsModal({ isOpen: false, title: '', transactions: [] });

  const handleOpenTransactionModal = (transaction: Lancamento | null = null) => {
    const today = new Date().toISOString().split('T')[0];
    if (transaction) {
      setEditingTransaction({
        ...transaction,
        valor: transaction.valor / 100 // Convert cents to BRL for form input
      });
    } else {
      setEditingTransaction({
        data_pagamento: today,
        data_competencia: today,
        descricao: '',
        valor: 0,
        tipo: 'despesa',
        categoria_id: '',
        banco_id: '',
        fornecedor: '',
        unidade_id: currentUser?.unidade_id || '',
      });
    }
    setIsTransactionModalOpen(true);
  };

  const handleDeleteFromModal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (error) {
        alert('Erro ao excluir: ' + error.message);
    } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setDetailsModal(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    }
  };

  const handleEditFromModal = (transaction: Lancamento) => {
    closeDetailsModal();
    handleOpenTransactionModal(transaction);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  // Centralized year calculation
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    
    transactions.forEach(t => {
        const dPago = parseDate(t.data_pagamento);
        if (!isNaN(dPago.getTime())) years.add(dPago.getFullYear());
        
        const dComp = parseDate(t.data_competencia);
        if (!isNaN(dComp.getTime())) years.add(dComp.getFullYear());
    });

    leiloes.forEach(l => {
        const dLeilao = parseDate(l.data);
        if (!isNaN(dLeilao.getTime())) years.add(dLeilao.getFullYear());
    });

    if (years.size === 0) return [new Date().getFullYear()];
    
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, leiloes]);

  // No auto-selection: empty selectedBankIds means "all banks" (Todos os Bancos)


  useEffect(() => {
    // This effect runs once to get the initial session and set up the listener.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // If there's no session on initial check, we can stop the main loader.
      if (!session) {
        setShellLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchShellData = async () => {
    if (!session) {
        setShellLoading(false);
        return;
    }
    setError(null);
    try {
      // Set loading true at the start of the fetch process
      setShellLoading(true);
      const userRes = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (userRes.error) throw new Error(`Erro ao buscar perfil do usuário: ${userRes.error.message}`);
      const userProfile = userRes.data as User;
      
      const [
        bancosRes, categoriasRes, leiloesRes, previsoesRes,
        unidadesRes, catLeilaoRes, allUsersRes, centrosRes,
      ] = await Promise.all([
        supabase.from('bancos').select('*'),
        supabase.from('categorias').select('*'),
        supabase.from('leiloes').select('*'),
        supabase.from('previsoes').select('*'),
        supabase.from('unidades').select('*'),
        supabase.from('leilao_categorias').select('*'),
        supabase.from('users').select('*'),
        supabase.from('centros_custo').select('*'),
      ]);

      const responses = { bancosRes, categoriasRes, leiloesRes, previsoesRes, unidadesRes, catLeilaoRes, allUsersRes, centrosRes };
      for (const [key, res] of Object.entries(responses)) {
        if (res.error) throw new Error(`Erro ao buscar ${key}: ${res.error.message}`);
      }
      
      setBancos(bancosRes.data || []);
      setCategories(categoriasRes.data || []);
      setLeiloes(leiloesRes.data || []);
      setPrevisoes(previsoesRes.data || []);
      setUnidades(unidadesRes.data || []);
      setCatLeilao(catLeilaoRes.data || []);
      setUsers(allUsersRes.data || []);
      setCentros(centrosRes.data || []);
      setCurrentUser(userProfile);

      const currentPath = location.pathname.substring(1) || 'dashboard';
      if(location.pathname === '/login' || location.pathname === '/') {
        navigate('/dashboard');
        return;
      }
      
      const hasPermission = userProfile.role === 'admin' || (userProfile.permissions && userProfile.permissions.includes(currentPath));
      if (!hasPermission) {
        const defaultView = (userProfile.permissions && userProfile.permissions[0]) || 'dashboard';
        navigate(`/${defaultView}`);
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : (err as Record<string, unknown>)?.message ? String((err as Record<string, unknown>).message) : String(err);
      if (errorMessage.includes('Failed to fetch')) {
        console.warn("Supabase fetch failed. Falling back to mock data for shell.");
        setBancos(BANCOS);
        setCategories(CATEGORIAS);
        setLeiloes(LEILOES);
        setPrevisoes(MOCK_PREVISOES);
        setUnidades(UNIDADES);
        setCatLeilao(LEILAO_CATEGORIAS);
        setUsers([CURRENT_USER, ...OTHER_USERS]);
        setCentros(CENTROS_CUSTO);
        setCurrentUser(CURRENT_USER); // Use mock user

        if (location.pathname === '/' || location.pathname === '/login') {
          navigate('/dashboard');
        }
      } else {
        console.error("Falha na busca dos dados de base:", errorMessage);
        setError(errorMessage);
      }
    } finally {
      setShellLoading(false);
    }
  };

  const fetchAllLancamentos = async () => {
    setTransactionsLoading(true);
    try {
      const BATCH_SIZE = 1000;
      let allLancamentos: Lancamento[] = [];
      let lastBatchLength = 0;
      let offset = 0;
      do {
        const { data, error } = await supabase
          .from('lancamentos')
          .select('*')
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
          console.error('Erro ao buscar lote de lançamentos:', error.message || JSON.stringify(error));
          throw error;
        }
        if (data) {
          allLancamentos = allLancamentos.concat(data as Lancamento[]);
          lastBatchLength = data.length;
          offset += BATCH_SIZE;
        } else {
          lastBatchLength = 0;
        }
      } while (lastBatchLength === BATCH_SIZE);
      setTransactions(allLancamentos);
    } catch(err: unknown) {
        const errorMessage = err instanceof Error ? err.message : (err as Record<string, unknown>)?.message ? String((err as Record<string, unknown>).message) : String(err);
        if (errorMessage.includes('Failed to fetch')) {
          console.warn("Supabase fetch for transactions failed. Falling back to mock data.");
          setTransactions(MOCK_LANCAMENTOS);
        } else {
          console.error("Falha na busca de lançamentos:", errorMessage);
          setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
        }
    } finally {
        setTransactionsLoading(false);
    }
  };

  // This effect now correctly handles the logic for fetching data only when needed.
  useEffect(() => {
    // Case 1: We have a session but no user data yet. This is the initial login flow.
    if (session && !currentUser) {
      fetchShellData();
    } 
    // Case 2: The session has become null (user logged out).
    else if (!session && currentUser) {
      setCurrentUser(null);
      // Reset all data states on logout
      setTransactions([]);
      setBancos([]);
      setCategories([]);
      setLeiloes([]);
      setPrevisoes([]);
      setUnidades([]);
      setCatLeilao([]);
      setUsers([]);
      setCentros([]);
      navigate('/');
    }
  }, [session, currentUser, navigate]);

  // Effect for fetching transactions (slow data) after the shell is ready and user is set
  useEffect(() => {
    if (currentUser) {
        fetchAllLancamentos();
    }
  }, [currentUser]);
  
  if (shellLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <Loader className="animate-spin text-brand-800" size={48} />
            <p className="mt-4 text-gray-600">Carregando aplicação...</p>
        </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      <Sidebar
        user={currentUser}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unvalidatedCount={unvalidatedTransactions.length}
      />
      
      <main className={`flex-1 transition-all duration-300 p-6 md:p-8 overflow-x-hidden flex flex-col`}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 mb-6 rounded-md shadow-sm" role="alert">
            <p className="font-bold">Ocorreu um Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        <Routes>
            <Route path="/dashboard" element={<ProtectedRoute viewId="dashboard" currentUser={currentUser}><Dashboard transactions={visibleTransactions} transactionsLoading={transactionsLoading} bancos={bancos} categories={categories} leiloes={leiloes} catLeilao={catLeilao} availableYears={availableYears} unidades={unidades} dashboardState={viewStates.dashboard} setDashboardState={(updates: Partial<ViewStates['dashboard']>) => setViewStates(p => ({ ...p, dashboard: { ...p.dashboard, ...updates } }))} /></ProtectedRoute>} />
            <Route path="/tutorial" element={<ProtectedRoute viewId="tutorial" currentUser={currentUser}><Tutorial /></ProtectedRoute>} />
            <Route path="/registries" element={<ProtectedRoute viewId="registries" currentUser={currentUser}><Registries bancos={bancos} setBancos={setBancos} leiloes={leiloes} setLeiloes={setLeiloes} catLeilao={catLeilao} setCatLeilao={setCatLeilao} unidades={unidades} setUnidades={setUnidades} planoContas={categories} setPlanoContas={setCategories} users={users} setUsers={setUsers} currentUser={currentUser} centros={centros} setCentros={setCentros} /></ProtectedRoute>} />
            <Route path="/database" element={<ProtectedRoute viewId="database" currentUser={currentUser}><DatabaseExport transactions={visibleTransactions} categories={categories} leiloes={leiloes} bancos={bancos} unidades={unidades} users={users} catLeilao={catLeilao} centros={centros} /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute viewId="transactions" currentUser={currentUser}><Transactions transactions={visibleTransactions} transactionsLoading={transactionsLoading} setTransactions={setTransactions} user={currentUser} bancos={bancos} categories={categories} leiloes={leiloes} unidades={unidades} unvalidatedTransactions={unvalidatedTransactions} setUnvalidatedTransactions={setUnvalidatedTransactions} filters={viewStates.transactions} setFilters={updater => setViewStates(p => ({ ...p, transactions: updater(p.transactions) }))} handleOpenModal={handleOpenTransactionModal} /></ProtectedRoute>} />
            <Route path="/reconciliation" element={<ProtectedRoute viewId="reconciliation" currentUser={currentUser}><Reconciliation transactions={visibleTransactions} setTransactions={setTransactions} user={currentUser} transactionsLoading={transactionsLoading} bancos={bancos} unidades={unidades} leiloes={leiloes} categories={categories} selectedBankIds={viewStates.reconciliation.selectedBankIds} setSelectedBankIds={ids => setViewStates(p => ({ ...p, reconciliation: { ...p.reconciliation, selectedBankIds: ids }}))} selectedUnidades={viewStates.reconciliation.selectedUnidades} setSelectedUnidades={ids => setViewStates(p => ({...p, reconciliation: { ...p.reconciliation, selectedUnidades: ids }}))} leilaoFilter={viewStates.reconciliation.leilaoFilter} setLeilaoFilter={ids => setViewStates(p => ({...p, reconciliation: { ...p.reconciliation, leilaoFilter: ids }}))} rubricaFilter={viewStates.reconciliation.rubricaFilter} setRubricaFilter={ids => setViewStates(p => ({...p, reconciliation: { ...p.reconciliation, rubricaFilter: ids }}))} dateFilter={viewStates.reconciliation.dateFilter} setDateFilter={dateFilter => setViewStates(p => ({ ...p, reconciliation: { ...p.reconciliation, dateFilter } }))} handleOpenModal={handleOpenTransactionModal} /></ProtectedRoute>} />
            <Route path="/cashflow" element={<ProtectedRoute viewId="cashflow" currentUser={currentUser}><CashFlow transactions={visibleTransactions} transactionsLoading={transactionsLoading} categories={categories} availableYears={availableYears} period={viewStates.cashFlow.period} setPeriod={newPeriod => setViewStates(p => ({ ...p, cashFlow: { period: newPeriod }}))} onCellClick={handleCellClick} /></ProtectedRoute>} />
            <Route path="/dre" element={<ProtectedRoute viewId="dre" currentUser={currentUser}><DRE transactions={visibleTransactions} transactionsLoading={transactionsLoading} categories={categories} availableYears={availableYears} period={viewStates.dre.period} setPeriod={newPeriod => setViewStates(p => ({ ...p, dre: { period: newPeriod }}))} onCellClick={handleCellClick} /></ProtectedRoute>} />
            <Route path="/annualAuctions" element={<ProtectedRoute viewId="annualAuctions" currentUser={currentUser}><AnnualAuctions leiloes={leiloes} transactionsLoading={transactionsLoading} lancamentos={visibleTransactions} categories={categories} availableYears={availableYears} selectedYear={viewStates.annualAuctions.selectedYear} setSelectedYear={year => setViewStates(p => ({ ...p, annualAuctions: { selectedYear: year }}))} /></ProtectedRoute>} />
            <Route path="/auction-comparison" element={<ProtectedRoute viewId="auction-comparison" currentUser={currentUser}><AuctionComparison previsoes={previsoes} categories={categories} selectedPrevisaoIds={viewStates.auctionComparison.selectedPrevisaoIds} setSelectedPrevisaoIds={(ids) => setViewStates(p => ({ ...p, auctionComparison: { selectedPrevisaoIds: ids }}))} /></ProtectedRoute>} />
            <Route path="/auction" element={<ProtectedRoute viewId="auction" currentUser={currentUser}><AuctionSimulator leiloes={leiloes} transactionsLoading={transactionsLoading} categories={categories} transactions={visibleTransactions} previsoes={previsoes} setPrevisoes={setPrevisoes} /></ProtectedRoute>} />
            <Route path="/financial-entry" element={<ProtectedRoute viewId="financial-entry" currentUser={currentUser}><FinancialEntryForm leiloes={leiloes} /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>

      {currentUser && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          transaction={editingTransaction}
          setTransactions={setTransactions}
          user={currentUser}
          bancos={bancos}
          categories={categories}
          leiloes={leiloes}
          unidades={unidades}
        />
      )}

      <TransactionDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={closeDetailsModal}
        title={detailsModal.title}
        transactions={detailsModal.transactions}
        categories={categories}
        handleEdit={handleEditFromModal}
        handleDelete={handleDeleteFromModal}
      />
    </div>
  );
}

export default App;