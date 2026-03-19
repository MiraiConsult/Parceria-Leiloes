import React, { useMemo, useState } from 'react';
import { Lancamento, Categoria } from '../types';
import { formatCurrency, getMonthName, parseDate } from '../utils/format';
import { CENTROS_CUSTO } from '../services/mockData';
import { EyeOff, Eye, TrendingUp, TrendingDown, Wallet, Loader } from 'lucide-react';
import PeriodSelector, { Period } from './PeriodSelector';

interface CashFlowProps {
  transactions: Lancamento[];
  transactionsLoading: boolean;
  categories: Categoria[];
  availableYears: number[];
  period: { primary: Period; comparative: Period | null };
  setPeriod: (period: { primary: Period; comparative: Period | null }) => void;
  onCellClick: (options: { filters: { yearFilter: number; monthFilter: string; categoryIds: string[] }; title: string; dateField: 'data_pagamento' | 'data_competencia' }) => void;
}

const CashFlow: React.FC<CashFlowProps> = ({ transactions, transactionsLoading, categories, availableYears, period, setPeriod, onCellClick }) => {
  const [hideEmpty, setHideEmpty] = useState(false);

  const selectedMonths = useMemo(() => Array.from(period.primary.months).sort((a: number, b: number) => a - b), [period.primary.months]);

  const calculateYearData = (targetYear: number) => {
    const inflows: Record<string, Record<string, number[]>> = {};
    const outflows: Record<string, Record<string, number[]>> = {};
    const categoryMap: Record<string, Categoria> = {};

    categories.forEach(c => {
      categoryMap[c.id] = c;
      const isInflow = c.classificacao === 'RECEITA' || c.centro === 'RECEITA' || c.centro === 'OUTRAS RECEITAS';
      const targetGroup = isInflow ? inflows : outflows;
      if (!targetGroup[c.centro]) targetGroup[c.centro] = {};
      targetGroup[c.centro][c.id] = Array(12).fill(0);
    });

    transactions.forEach(t => {
      if (t.status !== 'aprovado') return;
      const date = parseDate(t.data_pagamento);
      if (isNaN(date.getTime()) || date.getFullYear() !== targetYear) return;

      const month = date.getMonth();

      const processTransaction = (categoria_id: string, valor: number) => {
          const cat = categoryMap[categoria_id];
          if (!cat) return;

          const isInflowStructure = cat.classificacao === 'RECEITA' || cat.centro === 'RECEITA' || cat.centro === 'OUTRAS RECEITAS';
          const targetGroup = isInflowStructure ? inflows : outflows;
          
          if (!targetGroup[cat.centro]) targetGroup[cat.centro] = {};
          if (!targetGroup[cat.centro][cat.id]) targetGroup[cat.centro][cat.id] = Array(12).fill(0);

          const val = t.tipo === 'receita' ? (Number(valor) || 0) : -(Number(valor) || 0); 
          targetGroup[cat.centro][cat.id][month] += val;
      };

      if (t.split_revenue && Array.isArray(t.split_revenue) && t.split_revenue.length > 0) {
          t.split_revenue.forEach(split => {
              processTransaction(split.categoria_id, split.valor);
          });
      } else {
          processTransaction(t.categoria_id, t.valor);
      }
    });
    return { inflows, outflows, categoryMap };
  };

  const dataYear1 = useMemo(() => calculateYearData(period.primary.year), [transactions, categories, period.primary.year]);

  const sumMonths = (monthlyValues: number[], selectedMonths: Set<number>): number => {
    let total = 0;
    selectedMonths.forEach(monthIndex => {
        total += monthlyValues[monthIndex] || 0;
    });
    return total;
  };
  
  const getPeriodValue = (dataset: ReturnType<typeof calculateYearData>, selectedMonths: Set<number>, groupType: 'inflows' | 'outflows', center?: string, catId?: string): number => {
    const group = dataset[groupType];
    if (center && catId) {
      const vals = group[center]?.[catId] || Array(12).fill(0);
      return sumMonths(vals, selectedMonths);
    }
    if (center) {
      let total = 0;
      const centerCats = group[center] || {};
      Object.values(centerCats).forEach(vals => total += sumMonths(vals, selectedMonths));
      return total;
    }
    let total = 0;
    Object.values(group).forEach(centerCats => {
        Object.values(centerCats).forEach(vals => total += sumMonths(vals, selectedMonths));
    });
    return total;
  };
  
  const renderGroup = (title: string, groupType: 'inflows' | 'outflows', headerColor: string, textColor: string) => {
    const groupData = dataYear1[groupType];
    const centers = Object.entries(groupData).sort((a, b) => {
        const idxA = CENTROS_CUSTO.findIndex(c => c.nome === a[0]);
        const idxB = CENTROS_CUSTO.findIndex(c => c.nome === b[0]);
        if (idxA === -1 && idxB === -1) return a[0].localeCompare(b[0]);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
    
    const groupVal1 = getPeriodValue(dataYear1, period.primary.months, groupType);
    const groupCatIds = centers.flatMap(([, centerCats]) => Object.keys(centerCats));

    if (hideEmpty && groupVal1 === 0) return null;

    return (
      <>
          <tr className={`${headerColor} border-t-2 border-b border-slate-200`}>
              <td className={`sticky left-0 z-20 px-4 py-3 font-black uppercase tracking-wider ${headerColor} ${textColor} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex items-center gap-2`}>
                 {title === 'ENTRADAS' ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {title}
              </td>
              {selectedMonths.map(month => (
                  <td key={month} className={`px-4 py-3 text-right font-bold ${textColor} cursor-pointer hover:bg-sky-100/30`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: groupCatIds }, title: `Detalhes: ${title} (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(getPeriodValue(dataYear1, new Set([month]), groupType))}</td>
              ))}
              <td className={`px-4 py-3 text-right font-bold ${textColor} cursor-pointer hover:bg-sky-100/30`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: groupCatIds }, title: `Detalhes: ${title} (Total ${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(groupVal1)}</td>
          </tr>

          {centers.map(([centerName, centerCats]) => {
              const centerVal1 = getPeriodValue(dataYear1, period.primary.months, groupType, centerName);
              const centerCatIds = Object.keys(centerCats);
              
              if (hideEmpty && centerVal1 === 0) return null;

              return (
                  <React.Fragment key={centerName}>
                  <tr className="bg-slate-50/80 font-semibold text-xs text-slate-700">
                      <td className="sticky left-0 bg-slate-50 z-10 px-4 py-2 pl-6 font-bold uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-l-4 border-l-slate-300">{centerName}</td>
                      {selectedMonths.map(month => (
                          <td key={month} className="px-4 py-2 text-right bg-slate-50/50 cursor-pointer hover:bg-sky-100" onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: centerCatIds }, title: `Detalhes: ${centerName} (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(getPeriodValue(dataYear1, new Set([month]), groupType, centerName))}</td>
                      ))}
                      <td className="px-4 py-2 text-right bg-slate-50/50 cursor-pointer hover:bg-sky-100" onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: centerCatIds }, title: `Detalhes: ${centerName} (Total ${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(centerVal1)}</td>
                  </tr>
                  {Object.keys(centerCats).map((catId) => {
                      const catVal1 = getPeriodValue(dataYear1, period.primary.months, groupType, centerName, catId);

                      if (hideEmpty && catVal1 === 0) return null;

                      return (
                      <tr key={catId} className="hover:bg-sky-50/30 transition-colors group">
                          <td className="sticky left-0 bg-white group-hover:bg-sky-50/30 z-10 px-4 py-2 text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate pl-10 border-l-4 border-l-transparent hover:border-l-brand-400">{dataYear1.categoryMap[catId].rubrica}</td>
                          {selectedMonths.map(month => {
                              const catMonthVal = getPeriodValue(dataYear1, new Set([month]), groupType, centerName, catId);
                              return <td key={month} className={`px-4 py-2 text-right font-medium cursor-pointer hover:bg-sky-100 ${catMonthVal >= 0 ? 'text-slate-800' : 'text-red-600'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: [catId] }, title: `Detalhes: ${dataYear1.categoryMap[catId].rubrica} (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(catMonthVal)}</td>
                          })}
                          <td className={`px-4 py-2 text-right font-medium cursor-pointer hover:bg-sky-100 ${catVal1 >= 0 ? 'text-slate-800' : 'text-red-600'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: [catId] }, title: `Detalhes: ${dataYear1.categoryMap[catId].rubrica} (Total ${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(catVal1)}</td>
                      </tr>
                      );
                  })}
                  </React.Fragment>
              );
          })}
      </>
    );
  };
  
  const renderPeriodBalance = () => {
      const in1 = getPeriodValue(dataYear1, period.primary.months, 'inflows');
      const out1 = getPeriodValue(dataYear1, period.primary.months, 'outflows');
      const bal1 = in1 + out1;
      const allCatIds = categories.map(c => c.id);

      return (
          <tr className="bg-slate-800 text-white font-bold border-t border-slate-700">
              <td className="sticky left-0 bg-slate-800 z-20 px-4 py-4 text-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] uppercase tracking-wide flex items-center gap-2"><Wallet size={18} className="text-slate-200"/> SALDO DO PERÍODO</td>
              {selectedMonths.map(month => {
                  const monthIn = getPeriodValue(dataYear1, new Set([month]), 'inflows');
                  const monthOut = getPeriodValue(dataYear1, new Set([month]), 'outflows');
                  const monthBal = monthIn + monthOut;
                  return <td key={month} className={`px-4 py-4 text-right font-black cursor-pointer hover:bg-slate-700 ${monthBal >= 0 ? 'text-white' : 'text-red-300'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: allCatIds }, title: `Detalhes: Saldo (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(monthBal)}</td>
              })}
              <td className={`px-4 py-4 text-right font-black cursor-pointer hover:bg-slate-700 ${bal1 >= 0 ? 'text-white' : 'text-red-300'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: allCatIds }, title: `Detalhes: Saldo (Total ${period.primary.year})`, dateField: 'data_pagamento' })}>{formatCurrency(bal1)}</td>
          </tr>
      );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Fluxo de Caixa Realizado</h2>
         </div>
        <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector period={period} onPeriodChange={setPeriod} availableYears={availableYears} />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => setHideEmpty(!hideEmpty)} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${hideEmpty ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-500'}`} title="Ocultar Vazios">
                {hideEmpty ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="text-sm font-medium hidden md:inline">Vazios</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        {transactionsLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader className="animate-spin text-brand-800" size={32} />
                <p className="mt-3 text-slate-500">Carregando lançamentos...</p>
            </div>
        ) : (
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500">
                <th className="sticky left-0 bg-slate-50 z-30 px-4 py-3 text-left font-medium w-80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Rubrica</th>
                {selectedMonths.map(month => (
                    <th key={month} className="px-4 py-3 text-right font-medium min-w-[120px]">{getMonthName(month)}</th>
                ))}
                <th className="px-4 py-3 text-right font-bold text-slate-800 bg-sky-50/50 min-w-[140px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renderGroup('ENTRADAS', 'inflows', 'bg-emerald-50', 'text-emerald-900')}
              <tr className="h-6 bg-slate-50/50 border-none"><td colSpan={selectedMonths.length + 2}></td></tr>
              {renderGroup('SAÍDAS', 'outflows', 'bg-red-50', 'text-red-900')}
              <tr className="h-8 bg-slate-50 border-none"><td colSpan={selectedMonths.length + 2}></td></tr>
              {renderPeriodBalance()}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-slate-500 mt-2">* Regime de Caixa (Considera data efetiva do pagamento).</div>
    </div>
  );
};

export default CashFlow;
