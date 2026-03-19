import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Lancamento, Banco, Categoria, Leilao, LeilaoCategoria, Unidade } from '../types';
import { formatCurrency, getMonthName, parseDate, formatDate } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { TrendingUp, DollarSign, Wallet, Activity, ArrowUp, ArrowDown, FileText, BarChart3, Eye, Loader, WalletCards, Search } from 'lucide-react';
import PeriodSelector, { Period } from './PeriodSelector';
import ExpenseAnalysis from './ExpenseAnalysis';

interface DashboardProps {
  transactions: Lancamento[];
  transactionsLoading: boolean;
  bancos: Banco[];
  categories: Categoria[];
  leiloes: Leilao[];
  catLeilao: LeilaoCategoria[];
  availableYears: number[];
  unidades: Unidade[];
  dashboardState: {
    period: { primary: Period; comparative: Period | null };
    selectedUnidade: string;
    activeTab: 'overview' | 'auctions' | 'expenses' | 'individualAuction';
    selectedLeilaoId: string;
  };
  setDashboardState: (updates: Partial<DashboardProps['dashboardState']>) => void;
}

const KpiCard: React.FC<{ title: string; value: string; variation?: number; icon?: React.ReactNode; variationLabel?: string }> = ({ title, value, variation, icon, variationLabel }) => {
  const hasVariation = variation !== undefined && !isNaN(variation);
  const isPositive = hasVariation && variation >= 0;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-1">
      <div className="flex justify-between items-start">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        {icon && <div className="p-2 bg-slate-100 rounded-full text-slate-500">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {hasVariation && (
          <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{variation.toFixed(1)}%</span>
          </div>
        )}
      </div>
      {hasVariation && <p className="text-xs text-slate-400 mt-1">{variationLabel}</p>}
    </div>
  );
};

import { TooltipProps } from 'recharts';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-sm">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((p, i: number) => (
          <p key={i} style={{ color: p.color }} className="flex justify-between">
            <span className="font-medium">{p.name}:</span>
            <span className="font-bold ml-4">{formatCurrency(p.value as number)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, transactionsLoading, bancos, categories, leiloes, catLeilao, availableYears,
  unidades, dashboardState, setDashboardState
}) => {
  const { period, selectedUnidade, activeTab, selectedLeilaoId } = dashboardState;
  const [treemapDrilldownPath, setTreemapDrilldownPath] = useState<string[]>([]);
  
  const [leilaoSearchTerm, setLeilaoSearchTerm] = useState('');
  const [isLeilaoDropdownOpen, setIsLeilaoDropdownOpen] = useState(false);
  const auctionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (auctionDropdownRef.current && !auctionDropdownRef.current.contains(event.target as Node)) {
        setIsLeilaoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedLeilaoId && selectedLeilaoId !== 'all') {
      const leilao = leiloes.find(l => l.id === selectedLeilaoId);
      setLeilaoSearchTerm(leilao ? leilao.nome : '');
    } else {
      setLeilaoSearchTerm('');
    }
  }, [selectedLeilaoId, leiloes]);

  useEffect(() => {
    // Reset drilldown when global filters or tabs change
    setTreemapDrilldownPath([]);
  }, [period, selectedUnidade, activeTab]);

  const handleFilterChange = <K extends keyof typeof dashboardState>(key: K, value: typeof dashboardState[K]) => {
    setDashboardState({ [key]: value });
  };

  const handleSelectLeilao = (leilaoId: string) => {
    handleFilterChange('selectedLeilaoId', leilaoId);
    setIsLeilaoDropdownOpen(false);
  };

  const handleLeilaoSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeilaoSearchTerm(e.target.value);
    if (!isLeilaoDropdownOpen) {
        setIsLeilaoDropdownOpen(true);
    }
    if (e.target.value === '') {
        handleFilterChange('selectedLeilaoId', 'all');
    }
  };

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const processedData = useMemo(() => {
    const selectedYear = period.primary.year;
    const selectedMonths = period.primary.months;

    const filterByPeriodAndUnit = (txs: Lancamento[], dateField: 'data_competencia' | 'data_pagamento', year: number, months: Set<number>) => txs.filter(t => {
        const date = parseDate(t[dateField]);
        if (isNaN(date.getTime())) return false;
        const yearMatch = date.getFullYear() === year;
        const monthMatch = months.has(date.getMonth());
        const unidadeMatch = selectedUnidade === 'all' || t.unidade_id === selectedUnidade;
        return yearMatch && monthMatch && unidadeMatch;
    });
    
    // --- Overview ---
    const calculateMetrics = (txs: Lancamento[]) => {
      const approved = txs.filter(t => t.status === 'aprovado');
      const receitas = approved.filter(t => t.tipo === 'receita').reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
      const despesas = approved.filter(t => t.tipo === 'despesa').reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
      const aReceber = txs.filter(t => t.tipo === 'receita' && t.status === 'pendente').reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
      return { faturamento: receitas, resultado: receitas - despesas, aReceber };
    };
    const currentPeriodTx = filterByPeriodAndUnit(transactions, 'data_competencia', selectedYear, selectedMonths);
    const currentPeriodOverview = calculateMetrics(currentPeriodTx);
    const prevPeriodTx = filterByPeriodAndUnit(transactions, 'data_competencia', selectedYear - 1, selectedMonths);
    const prevPeriodOverview = calculateMetrics(prevPeriodTx);
    const totalSaldoBancos: number = bancos.reduce((acc: number, b: Banco) => acc + (Number(b.saldo_inicial) || 0), 0);
    const totalValorTransacoes: number = transactions.filter(t => t.status === 'aprovado').reduce((acc: number, t: Lancamento) => {
        const valor = Number(t.valor) || 0;
        return t.tipo === 'receita' ? acc + valor : acc - valor;
    }, 0);
    const totalBalance = totalSaldoBancos + totalValorTransacoes;
    const margem = currentPeriodOverview.faturamento > 0 ? (currentPeriodOverview.resultado / currentPeriodOverview.faturamento) * 100 : 0;
    const allMonthsFlow = Array.from({ length: 12 }, (_, i) => ({ name: getMonthName(i), Entradas: 0, Saídas: 0, Resultado: 0 }));
    transactions.filter(t => {
        const date = parseDate(t.data_pagamento);
        const yearMatch = !isNaN(date.getTime()) && date.getFullYear() === selectedYear;
        const unidadeMatch = selectedUnidade === 'all' || t.unidade_id === selectedUnidade;
        return yearMatch && unidadeMatch && t.status === 'aprovado';
    }).forEach(t => {
        const month = parseDate(t.data_pagamento).getMonth();
        if (t.tipo === 'receita') {
          allMonthsFlow[month].Entradas = allMonthsFlow[month].Entradas + (Number(t.valor) || 0);
        } else {
          allMonthsFlow[month].Saídas = allMonthsFlow[month].Saídas + (Number(t.valor) || 0);
        }
    });
    allMonthsFlow.forEach(m => m.Resultado = m.Entradas - m.Saídas);
    const monthlyFlow = allMonthsFlow.filter((_m, index) => selectedMonths.has(index));
    const approvedDespesas = currentPeriodTx.filter(t => t.tipo === 'despesa' && t.status === 'aprovado');
    const expenseComposition = approvedDespesas.reduce((acc: Record<string, number>, t) => {
        const centro = categoryMap.get(t.categoria_id)?.centro || 'Outros';
        acc[centro] = (acc[centro] || 0) + (Number(t.valor) || 0);
        return acc;
    }, {});
    let expenseChartData = Object.entries(expenseComposition).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (expenseChartData.length > 6) {
        const top5 = expenseChartData.slice(0, 5);
        const othersTotal = expenseChartData.slice(5).reduce((sum, item) => sum + item.value, 0);
        expenseChartData = [...top5, { name: 'Outros', value: othersTotal }];
    }

    // --- Auctions ---
    const periodLeiloes = leiloes.filter(l => { const d = parseDate(l.data); return !isNaN(d.getTime()) && d.getFullYear() === selectedYear && (selectedUnidade === 'all' || l.unidade_id === selectedUnidade) && selectedMonths.has(d.getMonth()) });
    const leilaoIds = new Set(periodLeiloes.map(l => l.id));
    const periodLancamentosLeilao = currentPeriodTx.filter(l => l.leilao_id && leilaoIds.has(l.leilao_id));
    const leilaoReceitas = periodLancamentosLeilao.filter(l => l.tipo === 'receita' && l.status === 'aprovado');
    const leilaoFaturamento = leilaoReceitas.reduce((sum: number, l) => sum + (Number(l.valor) || 0), 0);
    const leilaoDespesas = periodLancamentosLeilao.filter(l => l.tipo === 'despesa' && l.status === 'aprovado').reduce((sum: number, l) => sum + (Number(l.valor) || 0), 0);
    const leilaoResultado = leilaoFaturamento - leilaoDespesas;
    const topLeiloes = [...leilaoIds].map(id => ({ id, faturamento: leilaoReceitas.filter(l => l.leilao_id === id).reduce((s: number, l) => s + (Number(l.valor) || 0), 0), name: leiloes.find(l=>l.id===id)?.nome || 'N/A' })).sort((a, b) => b.faturamento - a.faturamento).slice(0, 10);
    const catLeilaoMap = new Map<string, string>(catLeilao.map(c => [c.id, c.nome]));
    const leilaoDistChart = Object.entries(periodLeiloes.reduce((acc: Record<string, number>, l) => { acc[catLeilaoMap.get(l.categoria_id) || 'OUTROS'] = (acc[catLeilaoMap.get(l.categoria_id) || 'OUTROS'] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
    const monthlyAuctionResults = allMonthsFlow.map(m => ({name: m.name, Resultado: 0}));
    periodLancamentosLeilao.filter(l => l.status === 'aprovado').forEach(l => { const d = parseDate(l.data_competencia); if(!isNaN(d.getTime())) monthlyAuctionResults[d.getMonth()].Resultado = monthlyAuctionResults[d.getMonth()].Resultado + (l.tipo === 'receita' ? (Number(l.valor) || 0) : -(Number(l.valor) || 0)) });
    
    // --- Expenses Analysis ---
    const currentExpenses = filterByPeriodAndUnit(transactions.filter(t => t.tipo === 'despesa'), 'data_competencia', selectedYear, selectedMonths);
    const prevPeriodExpenses = filterByPeriodAndUnit(transactions.filter(t => t.tipo === 'despesa'), 'data_competencia', selectedYear - 1, selectedMonths);
    const totalCurrentExpenses = currentExpenses.reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
    const totalPreviousExpenses = prevPeriodExpenses.reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
    const expenseVariation = totalPreviousExpenses !== 0 ? ((totalCurrentExpenses - totalPreviousExpenses) / Math.abs(totalPreviousExpenses)) * 100 : (totalCurrentExpenses > 0 ? 100 : 0);
    const expenseMonthlyAverage = selectedMonths.size > 0 ? totalCurrentExpenses / selectedMonths.size : 0;
    const expenseMonthlyTrend = Array.from(selectedMonths).sort((a,b)=>a-b).map(mIdx => ({ name: getMonthName(mIdx), Despesa: currentExpenses.filter(t => parseDate(t.data_competencia).getMonth() === mIdx).reduce((s, t) => s + (Number(t.valor) || 0), 0) }));
    
    let treemapData;
    let currentTreemapTitle = "Composição por Centro de Custo";

    if (treemapDrilldownPath.length === 0) {
        const byCentro = currentExpenses.reduce((acc: Record<string, number>, t) => { const c = categoryMap.get(t.categoria_id); acc[c?.centro || 'Outros'] = (acc[c?.centro || 'Outros'] || 0) + (Number(t.valor) || 0); return acc; }, {});
        treemapData = Object.entries(byCentro).map(([name, size]) => ({ name, size })).sort((a,b) => b.size - a.size);
    } else {
        const parentCentro = treemapDrilldownPath[0];
        currentTreemapTitle = `Composição de ${parentCentro}`;
        const byRubrica = currentExpenses.filter(t => categoryMap.get(t.categoria_id)?.centro === parentCentro).reduce((acc: Record<string, number>, t) => {
            const rubrica = categoryMap.get(t.categoria_id)?.rubrica || 'Outros';
            acc[rubrica] = (acc[rubrica] || 0) + (Number(t.valor) || 0);
            return acc;
        }, {});
        treemapData = Object.entries(byRubrica).map(([name, size]) => ({ name, size })).sort((a,b) => b.size - a.size);
    }

    const expenseTopCategory = treemapData[0]?.name || 'N/A';
    const expenseTableData = currentExpenses.reduce((acc: Record<string, { total: number, centros: Record<string, { total: number, rubricas: Record<string, { name: string, total: number }> }> }>, t) => {
        const cat = categoryMap.get(t.categoria_id); if (!cat) return acc;
        const { classificacao, centro, rubrica, id } = cat;
        if (!acc[classificacao]) acc[classificacao] = { total: 0, centros: {} }; if (!acc[classificacao].centros[centro]) acc[classificacao].centros[centro] = { total: 0, rubricas: {} }; if (!acc[classificacao].centros[centro].rubricas[id]) acc[classificacao].centros[centro].rubricas[id] = { name: rubrica, total: 0 };
        const val = Number(t.valor) || 0;
        // FIX: The values in `acc` can be of any type. Explicitly cast them to Number
        // before performing arithmetic operations to prevent type errors.
        acc[classificacao].total = (Number(acc[classificacao].total) || 0) + val;
        acc[classificacao].centros[centro].total = (Number(acc[classificacao].centros[centro].total) || 0) + val;
        acc[classificacao].centros[centro].rubricas[id].total = (Number(acc[classificacao].centros[centro].rubricas[id].total) || 0) + val;
        return acc;
    }, {});

    // --- Individual Auction Analysis ---
    let individualAuctionData = null;
    if (activeTab === 'individualAuction' && selectedLeilaoId && selectedLeilaoId !== 'all') {
        const leilaoTxs = transactions.filter(t => t.leilao_id === selectedLeilaoId && t.status === 'aprovado');
        const faturamento = leilaoTxs.filter(t => t.tipo === 'receita').reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
        const totalDespesas = leilaoTxs.filter(t => t.tipo === 'despesa').reduce((sum: number, t) => sum + (Number(t.valor) || 0), 0);
        const resultado = faturamento - totalDespesas;
        const lucratividade = faturamento > 0 ? (resultado / faturamento) * 100 : 0;
        const despesasTxs = leilaoTxs.filter(t => t.tipo === 'despesa');
        
        const costComposition = despesasTxs.reduce((acc: Record<string, number>, t) => {
            const centro = categoryMap.get(t.categoria_id)?.centro || 'Outros';
            // FIX: Use nullish coalescing operator to safely handle potentially undefined
            // accumulator values before performing addition.
            acc[centro] = (acc[centro] ?? 0) + (Number(t.valor) || 0);
            return acc;
        }, {});
        const costChartData = Object.entries(costComposition).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        individualAuctionData = {
            kpis: { faturamento, totalDespesas, resultado, lucratividade },
            costChartData,
            transactions: leilaoTxs.sort((a,b) => parseDate(b.data_pagamento).getTime() - parseDate(a.data_pagamento).getTime())
        };
    }

    return {
      overview: {
        kpis: { resultado: currentPeriodOverview.resultado, faturamento: currentPeriodOverview.faturamento, margem, totalBalance, aReceber: currentPeriodOverview.aReceber },
        variations: { resultado: Number(prevPeriodOverview.resultado) !== 0 ? ((Number(currentPeriodOverview.resultado) - Number(prevPeriodOverview.resultado)) / Math.abs(Number(prevPeriodOverview.resultado))) * 100 : (Number(currentPeriodOverview.resultado) > 0 ? 100 : 0), faturamento: Number(prevPeriodOverview.faturamento) !== 0 ? ((Number(currentPeriodOverview.faturamento) - Number(prevPeriodOverview.faturamento)) / Math.abs(Number(prevPeriodOverview.faturamento))) * 100 : (Number(currentPeriodOverview.faturamento) > 0 ? 100 : 0) },
        monthlyFlow, expenseChartData,
      },
      auctions: {
        kpis: { qtdLeiloes: periodLeiloes.length, faturamento: leilaoFaturamento, resultadoMedio: periodLeiloes.length > 0 ? leilaoResultado / periodLeiloes.length : 0, lucratividade: leilaoFaturamento > 0 ? (leilaoResultado / leilaoFaturamento) * 100 : 0 },
        topLeiloes, leilaoDistChart, monthlyAuctionResults: monthlyAuctionResults.filter((m, i) => selectedMonths.has(i)),
      },
      expenses: {
        totalCurrent: totalCurrentExpenses, variation: expenseVariation, monthlyAverage: expenseMonthlyAverage, topCategory: expenseTopCategory, monthlyTrend: expenseMonthlyTrend, treemapData, currentTreemapTitle, tableData: expenseTableData
      },
      individualAuction: individualAuctionData,
    };
  }, [period, selectedUnidade, transactions, bancos, categories, leiloes, catLeilao, treemapDrilldownPath, activeTab, selectedLeilaoId]);

  const handleTreemapClick = (data: { name?: string } | undefined) => {
    if (data && data.name && treemapDrilldownPath.length === 0) {
        setTreemapDrilldownPath([data.name]);
    }
  };

  const sortedLeiloes = useMemo(() => [...leiloes].sort((a,b) => parseDate(b.data).getTime() - parseDate(a.data).getTime()), [leiloes]);
  
  const filteredLeiloes = useMemo(() => {
    return sortedLeiloes.filter(l =>
        l.nome.toLowerCase().includes(leilaoSearchTerm.toLowerCase())
    );
  }, [leilaoSearchTerm, sortedLeiloes]);

  if (transactionsLoading) {
    return <div className="flex-1 flex flex-col items-center justify-center h-full"><Loader className="animate-spin text-brand-800" size={32} /><p className="mt-3 text-slate-500">Carregando lançamentos...</p></div>;
  }

  const DONUT_COLORS = ['#7f1d1d', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5'];
  const { overview, auctions, individualAuction } = processedData;
  const variationLabel = period.primary.months.size === 12 ? 'vs ano anterior' : period.primary.months.size === 1 ? 'vs mesmo mês do ano anterior' : 'vs período anterior';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
        {activeTab !== 'individualAuction' && (
          <div className="flex flex-col sm:flex-row gap-2">
              <select value={selectedUnidade} onChange={e => handleFilterChange('selectedUnidade', e.target.value as string)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                  <option value="all">Todas as Unidades</option>{unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <PeriodSelector period={period} onPeriodChange={(newPeriod) => setDashboardState({ period: newPeriod })} availableYears={availableYears} />
          </div>
        )}
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
            <button onClick={() => handleFilterChange('activeTab', 'overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'overview' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><Eye size={16}/> Visão Geral</button>
            <button onClick={() => handleFilterChange('activeTab', 'auctions')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'auctions' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><BarChart3 size={16}/> Performance Leilões</button>
            <button onClick={() => handleFilterChange('activeTab', 'expenses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'expenses' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><WalletCards size={16}/> Análise de Despesas</button>
            <button onClick={() => handleFilterChange('activeTab', 'individualAuction')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'individualAuction' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><Search size={16}/> Análise por Leilão</button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4"><KpiCard title="Resultado Líquido" value={formatCurrency(overview.kpis.resultado)} variation={overview.variations.resultado} icon={<DollarSign size={20} />} variationLabel={variationLabel} /><KpiCard title="Faturamento" value={formatCurrency(overview.kpis.faturamento)} variation={overview.variations.faturamento} icon={<TrendingUp size={20} />} variationLabel={variationLabel} /><KpiCard title="Saldo em Caixa (Total)" value={formatCurrency(overview.kpis.totalBalance)} icon={<Wallet size={20} />} /><KpiCard title="Contas a Receber (Período)" value={formatCurrency(overview.kpis.aReceber)} icon={<FileText size={20} />} /><KpiCard title="Margem de Lucro (Período)" value={`${overview.kpis.margem.toFixed(1)}%`} icon={<Activity size={20} />} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Mensal ({period.primary.year})</h3><ResponsiveContainer width="100%" height={300}><BarChart data={overview.monthlyFlow} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="Entradas" name="Entradas" fill="#059669" radius={[4, 4, 0, 0]} /><Bar dataKey="Saídas" name="Saídas" fill="#dc2626" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-4">Composição das Despesas</h3>
                <ResponsiveContainer width="100%" height={300}><BarChart data={overview.expenseChartData} layout="vertical" margin={{ top: 5, right: 100, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#334152' }} tickLine={false} axisLine={false} /><Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} /><Bar dataKey="value" name="Despesa" radius={[0, 4, 4, 0]}>{overview.expenseChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />))}<LabelList dataKey="value" position="right" formatter={(value: number) => formatCurrency(value)} style={{ fill: '#475569', fontSize: 12, fontWeight: '500' }} /></Bar></BarChart></ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'auctions' && (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><KpiCard title="Qtd Leilões" value={auctions.kpis.qtdLeiloes.toString()} /><KpiCard title="Faturamento Leilões" value={formatCurrency(auctions.kpis.faturamento)} /><KpiCard title="Resultado Médio / Leilão" value={formatCurrency(auctions.kpis.resultadoMedio)} /><KpiCard title="Lucratividade Leilões" value={`${auctions.kpis.lucratividade.toFixed(1)}%`} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Top 10 Leilões por Faturamento</h3><ResponsiveContainer width="100%" height={400}><BarChart data={auctions.topLeiloes} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(val) => formatCurrency(val)} /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="faturamento" name="Faturamento" fill="#991b1b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Distribuição de Leilões por Categoria</h3><ResponsiveContainer width="100%" height={400}><PieChart><Pie data={auctions.leilaoDistChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{auctions.leilaoDistChart.map((entry, index) => (<Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => `${value} leilões`} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Resultado Mensal dos Leilões ({period.primary.year})</h3><ResponsiveContainer width="100%" height={300}><BarChart data={auctions.monthlyAuctionResults}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={(val) => formatCurrency(val)} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Resultado" name="Resultado" fill="#0369a1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <ExpenseAnalysis
          expenses={processedData.expenses}
          variationLabel={variationLabel}
          treemapDrilldownPath={treemapDrilldownPath}
          setTreemapDrilldownPath={setTreemapDrilldownPath}
          handleTreemapClick={handleTreemapClick}
        />
      )}

      {activeTab === 'individualAuction' && (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <label htmlFor="leilao-search" className="block text-sm font-medium text-slate-600 mb-2">Selecione um Leilão para Análise</label>
                <div className="relative w-full md:w-2/3 lg:w-1/2" ref={auctionDropdownRef}>
                    <input
                        id="leilao-search"
                        type="text"
                        value={leilaoSearchTerm}
                        onChange={handleLeilaoSearchChange}
                        onFocus={() => setIsLeilaoDropdownOpen(true)}
                        placeholder="Comece a digitar o nome do leilão..."
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-50 text-base font-medium transition-colors w-full"
                        autoComplete="off"
                    />
                    <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    {isLeilaoDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            <ul>
                                {filteredLeiloes.length > 0 ? filteredLeiloes.map(l => (
                                    <li 
                                        key={l.id} 
                                        onClick={() => handleSelectLeilao(l.id)}
                                        className="px-4 py-3 hover:bg-slate-100 cursor-pointer text-slate-800 text-sm"
                                    >
                                        {l.nome}
                                    </li>
                                )) : (
                                    <li className="px-4 py-3 text-slate-500 text-sm">Nenhum leilão encontrado.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            {!individualAuction || selectedLeilaoId === 'all' ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Search size={40} className="mx-auto text-slate-300"/>
                    <h3 className="mt-4 text-lg font-semibold text-slate-700">Selecione um Leilão</h3>
                    <p className="mt-1 text-slate-500">Escolha um evento na lista acima para ver os detalhes financeiros.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Faturamento Total" value={formatCurrency(individualAuction.kpis.faturamento)} />
                        <KpiCard title="Custo Total" value={formatCurrency(individualAuction.kpis.totalDespesas)} />
                        <KpiCard title="Resultado Líquido" value={formatCurrency(individualAuction.kpis.resultado)} />
                        <KpiCard title="Lucratividade" value={`${individualAuction.kpis.lucratividade.toFixed(1)}%`} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold mb-4">Composição dos Custos</h3>
                             <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={individualAuction.costChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{individualAuction.costChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart></ResponsiveContainer>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                           <h3 className="text-lg font-semibold mb-4">Receita vs. Custo</h3>
                           <ResponsiveContainer width="100%" height={300}><BarChart data={[{ name: 'Comparativo', Receita: individualAuction.kpis.faturamento, Custo: individualAuction.kpis.totalDespesas }]} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={v => formatCurrency(v)} /><YAxis type="category" dataKey="name" hide /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="Receita" fill="#059669" radius={[0, 4, 4, 0]}><LabelList dataKey="Receita" position="right" formatter={(v: number) => formatCurrency(v)} /></Bar><Bar dataKey="Custo" fill="#dc2626" radius={[0, 4, 4, 0]}><LabelList dataKey="Custo" position="right" formatter={(v: number) => formatCurrency(v)} /></Bar></BarChart></ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold p-4 border-b border-slate-100">Extrato do Leilão</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3">Categoria</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {individualAuction.transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td className="px-4 py-3 text-slate-600">{formatDate(tx.data_pagamento)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{tx.descricao}</td>
                                            <td className="px-4 py-3 text-slate-500">{categoryMap.get(tx.categoria_id)?.rubrica || 'N/A'}</td>
                                            <td className={`px-4 py-3 text-right font-semibold ${tx.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.tipo === 'receita' ? '+' : '-'}{formatCurrency(tx.valor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;