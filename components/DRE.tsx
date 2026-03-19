import React, { useMemo, useState } from 'react';
import { Lancamento, Categoria } from '../types';
import { formatCurrency, getMonthName, parseDate } from '../utils/format';
import { EyeOff, Eye, Loader, FileText } from 'lucide-react';
import PeriodSelector, { Period } from './PeriodSelector';

interface DREProps {
  transactions: Lancamento[];
  transactionsLoading: boolean;
  categories: Categoria[];
  availableYears: number[];
  period: { primary: Period; comparative: Period | null };
  setPeriod: (period: { primary: Period; comparative: Period | null }) => void;
  onCellClick: (options: { filters: { yearFilter: number; monthFilter: string; categoryIds: string[] }; title: string; dateField: 'data_pagamento' | 'data_competencia' }) => void;
}

const DRE: React.FC<DREProps> = ({ transactions, transactionsLoading, categories, availableYears, period, setPeriod, onCellClick }) => {
  const [hideEmpty, setHideEmpty] = useState(false);

  const selectedMonths = useMemo(() => Array.from(period.primary.months).sort((a: number, b: number) => a - b), [period.primary.months]);

  const calculateYearData = (targetYear: number) => {
    const data: Record<string, Record<string, number[]>> = {
      RECEITA: {},
      CUSTO_VARIAVEL: {},
      DESPESA_FIXA: {},
      NAO_OPERACIONAL: {}
    };
    const categoryMap: Record<string, Categoria> = {};

    categories.forEach(c => {
      categoryMap[c.id] = c;
      if (data[c.classificacao]) {
        data[c.classificacao][c.id] = Array(12).fill(0);
      }
    });

    transactions.forEach(t => {
      if (t.status !== 'aprovado') return;
      const date = parseDate(t.data_competencia || t.data_pagamento); // Use data_competencia for DRE
      if (isNaN(date.getTime()) || date.getFullYear() !== targetYear) return;

      const month = date.getMonth();

      const processTransaction = (categoria_id: string, valor: number) => {
          const cat = categoryMap[categoria_id];
          if (!cat || !data[cat.classificacao]) return;

          const val = t.tipo === 'receita' ? (Number(valor) || 0) : -(Number(valor) || 0); 
          data[cat.classificacao][cat.id][month] += val;
      };

      if (t.split_revenue && Array.isArray(t.split_revenue) && t.split_revenue.length > 0) {
          t.split_revenue.forEach(split => {
              processTransaction(split.categoria_id, split.valor);
          });
      } else {
          processTransaction(t.categoria_id, t.valor);
      }
    });
    return { data, categoryMap };
  };

  const dataYear1 = useMemo(() => calculateYearData(period.primary.year), [transactions, categories, period.primary.year]);

  const sumMonths = (monthlyValues: number[], selectedMonths: Set<number>): number => {
    let total = 0;
    selectedMonths.forEach(monthIndex => {
        total += monthlyValues[monthIndex] || 0;
    });
    return total;
  };
  
  const getSectionValue = (dataset: ReturnType<typeof calculateYearData>, selectedMonths: Set<number>, section: string, catId?: string): number => {
    const group = dataset.data[section];
    if (!group) return 0;

    if (catId) {
      const vals = group[catId] || Array(12).fill(0);
      return sumMonths(vals, selectedMonths);
    }
    
    let total = 0;
    Object.values(group).forEach(vals => total += sumMonths(vals, selectedMonths));
    return total;
  };

  const renderSection = (sectionKey: string, label: string, headerColor: string, textColor: string) => {
    const groupData = dataYear1.data[sectionKey];
    if (!groupData) return null;

    const groupVal1 = getSectionValue(dataYear1, period.primary.months, sectionKey);
    const groupCatIds = Object.keys(groupData);

    if (hideEmpty && groupVal1 === 0) return null;

    return (
      <React.Fragment key={sectionKey}>
          <tr className={`${headerColor} border-t-2 border-b border-slate-200`}>
              <td className={`sticky left-0 z-20 px-4 py-3 font-black uppercase tracking-wider ${headerColor} ${textColor} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                 {label}
              </td>
              {selectedMonths.map(month => (
                  <td key={month} className={`px-4 py-3 text-right font-bold ${textColor} cursor-pointer hover:bg-sky-100/30`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: groupCatIds }, title: `Detalhes: ${label} (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_competencia' })}>{formatCurrency(getSectionValue(dataYear1, new Set([month]), sectionKey))}</td>
              ))}
              <td className={`px-4 py-3 text-right font-bold ${textColor} cursor-pointer hover:bg-sky-100/30`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: groupCatIds }, title: `Detalhes: ${label} (Total ${period.primary.year})`, dateField: 'data_competencia' })}>{formatCurrency(groupVal1)}</td>
          </tr>

          {Object.keys(groupData).map((catId) => {
              const catVal1 = getSectionValue(dataYear1, period.primary.months, sectionKey, catId);

              if (hideEmpty && catVal1 === 0) return null;

              return (
              <tr key={catId} className="hover:bg-sky-50/30 transition-colors group">
                  <td className="sticky left-0 bg-white group-hover:bg-sky-50/30 z-10 px-4 py-2 text-slate-600 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate pl-8 border-l-4 border-l-transparent hover:border-l-brand-400">{dataYear1.categoryMap[catId].rubrica}</td>
                  {selectedMonths.map(month => {
                      const catMonthVal = getSectionValue(dataYear1, new Set([month]), sectionKey, catId);
                      return <td key={month} className={`px-4 py-2 text-right font-medium cursor-pointer hover:bg-sky-100 ${catMonthVal >= 0 ? 'text-slate-800' : 'text-red-600'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: String(month), categoryIds: [catId] }, title: `Detalhes: ${dataYear1.categoryMap[catId].rubrica} (${getMonthName(month)}/${period.primary.year})`, dateField: 'data_competencia' })}>{formatCurrency(catMonthVal)}</td>
                  })}
                  <td className={`px-4 py-2 text-right font-bold cursor-pointer hover:bg-sky-100 ${catVal1 >= 0 ? 'text-slate-800' : 'text-red-600'}`} onClick={() => onCellClick({ filters: { yearFilter: period.primary.year, monthFilter: 'all', categoryIds: [catId] }, title: `Detalhes: ${dataYear1.categoryMap[catId].rubrica} (Total ${period.primary.year})`, dateField: 'data_competencia' })}>{formatCurrency(catVal1)}</td>
              </tr>
              );
          })}
      </React.Fragment>
    );
  };

  const renderTotal = (label: string, calcKeys: string[], headerColor: string, textColor: string) => {
    const totalVal1 = calcKeys.reduce((acc, key) => acc + getSectionValue(dataYear1, period.primary.months, key), 0);

    return (
      <tr className={`${headerColor} border-t-2 border-b-2 border-slate-300`}>
          <td className={`sticky left-0 z-20 px-4 py-3 font-black uppercase tracking-wider ${headerColor} ${textColor} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
             {label}
          </td>
          {selectedMonths.map(month => {
              const monthTotal = calcKeys.reduce((acc, key) => acc + getSectionValue(dataYear1, new Set([month]), key), 0);
              return <td key={month} className={`px-4 py-3 text-right font-bold ${textColor}`}>{formatCurrency(monthTotal)}</td>
          })}
          <td className={`px-4 py-3 text-right font-bold ${textColor}`}>{formatCurrency(totalVal1)}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-brand-600" />
            DRE Gerencial
          </h2>
          <p className="text-sm text-slate-500">Demonstrativo de Resultados por Competência</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHideEmpty(!hideEmpty)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            {hideEmpty ? <Eye size={16} /> : <EyeOff size={16} />}
            {hideEmpty ? 'Mostrar Vazios' : 'Ocultar Vazios'}
          </button>
        </div>
      </div>

      <PeriodSelector 
        availableYears={availableYears}
        period={period}
        onChange={setPeriod}
        allowComparison={false}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
        {transactionsLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
            <Loader className="animate-spin mb-4" size={32} />
            <p>Carregando dados do DRE...</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 relative custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-30 shadow-sm">
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-40 px-4 py-3 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Classificação</th>
                  {selectedMonths.map(month => (
                    <th key={month} className="px-4 py-3 text-right min-w-[120px]">{getMonthName(month)}</th>
                  ))}
                  <th className="px-4 py-3 text-right min-w-[140px] bg-slate-100 font-bold">Total {period.primary.year}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {renderSection('RECEITA', '(+) RECEITA BRUTA', 'bg-emerald-50', 'text-emerald-900')}
                {renderSection('CUSTO_VARIAVEL', '(-) CUSTOS VARIÁVEIS', 'bg-red-50', 'text-red-900')}
                {renderTotal('(=) MARGEM DE CONTRIBUIÇÃO', ['RECEITA', 'CUSTO_VARIAVEL'], 'bg-blue-50', 'text-blue-900')}
                {renderSection('DESPESA_FIXA', '(-) DESPESAS FIXAS', 'bg-orange-50', 'text-orange-900')}
                {renderTotal('(=) LUCRO OPERACIONAL', ['RECEITA', 'CUSTO_VARIAVEL', 'DESPESA_FIXA'], 'bg-indigo-50', 'text-indigo-900')}
                {renderSection('NAO_OPERACIONAL', '(+/-) NÃO OPERACIONAL', 'bg-slate-100', 'text-slate-800')}
                {renderTotal('(=) RESULTADO LÍQUIDO', ['RECEITA', 'CUSTO_VARIAVEL', 'DESPESA_FIXA', 'NAO_OPERACIONAL'], 'bg-slate-800', 'text-white')}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DRE;
