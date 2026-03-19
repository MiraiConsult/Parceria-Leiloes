import React, { useMemo, useState } from 'react';
import { Leilao, Lancamento, Categoria, LeilaoCategoria } from '../types';
import { formatCurrency, getMonthName, parseDate } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface AuctionPerformanceDashboardProps {
  leiloes: Leilao[];
  lancamentos: Lancamento[];
  categories: Categoria[];
  catLeilao: LeilaoCategoria[];
}

const KpiCard: React.FC<{ title: string; value: number; prevValue?: number; format?: 'currency' | 'percent' | 'number' }> = ({ title, value, prevValue, format = 'currency' }) => {
  const numValue = Number(value) || 0;
  
  let variation: number;
  if (typeof prevValue === 'number' && prevValue !== 0) {
    const numPrevValue = Number(prevValue) || 0;
    variation = ((numValue - numPrevValue) / Math.abs(numPrevValue)) * 100;
  } else {
    variation = (numValue !== 0 ? 100 : 0);
  }
  const isPositive = variation >= 0;

  const formatValue = (val: number) => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return `${val.toFixed(1)}%`;
    return val.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
        {prevValue !== undefined && (
          <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{variation.toFixed(1)}%</span>
            <span className="text-xs text-slate-400 font-normal ml-1">vs AA</span>
          </div>
        )}
      </div>
    </div>
  );
};

import { TooltipProps } from 'recharts';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-slate-200 rounded shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((p, i: number) => (
          <p key={i} style={{ color: p.color }}>{`${p.name}: ${formatCurrency(p.value as number)}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const AuctionPerformanceDashboard: React.FC<AuctionPerformanceDashboardProps> = ({ leiloes, lancamentos, categories, catLeilao }) => {
  const availableYears = useMemo(() => {
    if (leiloes.length === 0) return [new Date().getFullYear()];
    const years = new Set(leiloes.map(l => parseDate(l.data).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [leiloes]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  const processedData = useMemo(() => {
    const calculateDataForYear = (year: number) => {
      const yearLeiloes = leiloes.filter(l => parseDate(l.data).getFullYear() === year);
      const leilaoIds = new Set(yearLeiloes.map(l => l.id));
      const yearLancamentos = lancamentos.filter(l => l.leilao_id && leilaoIds.has(l.leilao_id));
      
      const receitas = yearLancamentos.filter(l => l.tipo === 'receita' && l.status === 'aprovado');
      const despesas = yearLancamentos.filter(l => l.tipo === 'despesa' && l.status === 'aprovado');
      const aReceberLanc = yearLancamentos.filter(l => l.tipo === 'receita' && l.status === 'pendente');
      const inadimplenciaLanc = yearLancamentos.filter(l => l.tipo === 'receita' && l.status === 'rejeitado');

      // FIX: `l.valor` might not be a number, which could lead to string concatenation
      // instead of addition. Explicitly cast `l.valor` to a number, with a fallback to 0.
      const faturamento = receitas.reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
      const totalDespesas = despesas.reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
      const resultado = faturamento - totalDespesas;
      const lucratividade = faturamento > 0 ? (resultado / faturamento) * 100 : 0;
      const aReceber = aReceberLanc.reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
      const inadimplencia = inadimplenciaLanc.reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
      
      const monthlyEntries = Array.from({ length: 12 }, (_, i) => ({ name: getMonthName(i), recebido: 0, aReceber: 0 }));
      receitas.forEach(l => { monthlyEntries[parseDate(l.data_pagamento).getMonth()].recebido += (Number(l.valor) || 0); });
      aReceberLanc.forEach(l => { monthlyEntries[parseDate(l.data_pagamento).getMonth()].aReceber += (Number(l.valor) || 0); });
      
      const leilaoFaturamento = new Map<string, number>();
      receitas.forEach(l => {
        leilaoFaturamento.set(l.leilao_id!, (leilaoFaturamento.get(l.leilao_id!) || 0) + (Number(l.valor) || 0));
      });
      const topLeiloes = Array.from(leilaoFaturamento.entries())
        .map(([id, fat]) => ({ id, faturamento: fat, name: leiloes.find(l=>l.id===id)?.nome || 'N/A' }))
        .sort((a, b) => b.faturamento - a.faturamento)
        .slice(0, 10);

      const catLeilaoMap: Map<string, string> = new Map<string, string>(catLeilao.map(c => [c.id, c.nome]));
      const leilaoDist = yearLeiloes.reduce((acc: Record<string, number>, l) => {
        const catName = catLeilaoMap.get(l.categoria_id) || 'OUTROS';
        acc[catName] = (acc[catName] || 0) + 1;
        return acc;
      }, {});
      const leilaoDistChart = Object.entries(leilaoDist).map(([name, value]) => ({ name, value }));

      const monthlyResults: number[] = Array(12).fill(0);
      yearLancamentos.filter(l=>l.status === 'aprovado').forEach(l => {
        const date = parseDate(l.data_competencia);
        if (isNaN(date.getTime())) return;
        const val = l.tipo === 'receita' ? (Number(l.valor) || 0) : -(Number(l.valor) || 0);
        monthlyResults[date.getMonth()] = monthlyResults[date.getMonth()] + val;
      });
      let cumulative = 0;
      const bankBalanceEvolution = monthlyResults.map((val, i) => {
        cumulative = cumulative + val;
        return { name: getMonthName(i), saldo: cumulative };
      });

      return {
        qtdLeiloes: yearLeiloes.length, faturamento, resultado, lucratividade, aReceber, inadimplencia,
        monthlyEntries, topLeiloes, leilaoDistChart, bankBalanceEvolution
      };
    };

    const current = calculateDataForYear(selectedYear);
    const previous = calculateDataForYear(selectedYear - 1);
    
    return { current, previous };
  }, [selectedYear, leiloes, lancamentos, categories, catLeilao]);
  
  const DONUT_COLORS = ['#b91c1c', '#f87171', '#7f1d1d', '#fca5a5'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard de Performance de Leilões</h2>
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Qtd Leilões" value={processedData.current.qtdLeiloes} prevValue={processedData.previous.qtdLeiloes} format="number" />
        <KpiCard title="Faturamento" value={processedData.current.faturamento} prevValue={processedData.previous.faturamento} />
        <KpiCard title="Receita Bruta" value={processedData.current.faturamento} prevValue={processedData.previous.faturamento} />
        <KpiCard title="Resultado" value={processedData.current.resultado} prevValue={processedData.previous.resultado} />
        <KpiCard title="Lucratividade" value={processedData.current.lucratividade} prevValue={processedData.previous.lucratividade} format="percent" />
        <KpiCard title="A Receber" value={processedData.current.aReceber} prevValue={processedData.previous.aReceber} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Top 10 Leilões por Faturamento</h3><ResponsiveContainer width="100%" height={400}><BarChart data={processedData.current.topLeiloes} layout="vertical" margin={{top: 5, right: 30, left: 10, bottom: 5}}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(val) => formatCurrency(val)} /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="faturamento" name="Faturamento" fill="#991b1b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Distribuição de Leilões por Categoria</h3><ResponsiveContainer width="100%" height={400}><PieChart><Pie data={processedData.current.leilaoDistChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{processedData.current.leilaoDistChart.map((entry, index) => (<Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => `${value} leilões`} /><Legend /></PieChart></ResponsiveContainer></div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Resultado Mensal Acumulado dos Leilões ({selectedYear})</h3><ResponsiveContainer width="100%" height={300}><LineChart data={processedData.current.bankBalanceEvolution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={(val) => formatCurrency(val)} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="saldo" name="Saldo Acumulado" stroke="#0369a1" strokeWidth={3} dot={{r: 4, fill: '#0369a1'}} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};

export default AuctionPerformanceDashboard;