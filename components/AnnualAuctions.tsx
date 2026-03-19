import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Leilao, Lancamento, Categoria } from '../types';
import { formatCurrency, formatDate, getMonthName, parseDate } from '../utils/format';
import { ChevronDown, ChevronRight, Download, Loader } from 'lucide-react';

interface AnnualAuctionsProps {
  leiloes: Leilao[];
  lancamentos: Lancamento[];
  transactionsLoading: boolean;
  categories: Categoria[];
  availableYears: number[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

interface CalculatedData {
  comissao: number;
  inscricao: number;
  receitaTotal: number;
  recebido: number;
  aReceber: number;
  despProducao: number;
  despOperacional: number;
  saldo: number;
}

const AnnualAuctions: React.FC<AnnualAuctionsProps> = ({ leiloes, lancamentos, transactionsLoading, categories, availableYears, selectedYear, setSelectedYear }) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

  const processedData = useMemo(() => {
    const categoryMap = new Map<string, Categoria>(categories.map(c => [c.id, c]));
    const lancamentosByLeilao = new Map<string, Lancamento[]>();
    lancamentos.forEach(l => {
      if (l.leilao_id) {
        if (!lancamentosByLeilao.has(l.leilao_id)) {
          lancamentosByLeilao.set(l.leilao_id, []);
        }
        lancamentosByLeilao.get(l.leilao_id)!.push(l);
      }
    });

    const getCategoryType = (lancamento: Lancamento): string => {
      const category = categoryMap.get(lancamento.categoria_id);
      if (!category) return 'unknown';
      const rubrica = category.rubrica.toUpperCase();
      if (lancamento.tipo === 'receita') {
        if (rubrica.includes('COMISSÃO')) return 'comissao';
        if (rubrica.includes('INSCRIÇÃO') || rubrica.includes('ENTRADA')) return 'inscricao';
        return 'outraReceita';
      }
      if (lancamento.tipo === 'despesa') {
        if (category.centro.toUpperCase() === 'DESPESAS DE PRODUÇÃO') return 'despProducao';
        return 'despOperacional';
      }
      return 'unknown';
    };

    const yearLeiloes = leiloes.filter(l => {
        const date = parseDate(l.data);
        return !isNaN(date.getTime()) && date.getFullYear() === selectedYear;
    });
    
    const monthlyData: Record<number, { auctions: (Leilao & { calculated: CalculatedData })[], totals: CalculatedData }> = {};

    for (let i = 0; i < 12; i++) {
        monthlyData[i] = { auctions: [], totals: { comissao: 0, inscricao: 0, receitaTotal: 0, recebido: 0, aReceber: 0, despProducao: 0, despOperacional: 0, saldo: 0 } };
    }

    yearLeiloes.forEach(leilao => {
      const leilaoLancamentos = lancamentosByLeilao.get(leilao.id) || [];
      const calculated: CalculatedData = { comissao: 0, inscricao: 0, receitaTotal: 0, recebido: 0, aReceber: 0, despProducao: 0, despOperacional: 0, saldo: 0 };
      
      leilaoLancamentos.forEach(l => {
        const type = getCategoryType(l);
        if (l.tipo === 'receita') {
          if (l.status === 'aprovado') {
            calculated.receitaTotal += l.valor;
            calculated.recebido += l.valor;
            if (type === 'comissao') calculated.comissao += l.valor;
            if (type === 'inscricao') calculated.inscricao += l.valor;
          } else if (l.status === 'pendente') {
            calculated.aReceber += l.valor;
          }
        } else if (l.tipo === 'despesa' && l.status === 'aprovado') {
          if (type === 'despProducao') calculated.despProducao += l.valor;
          else if (type === 'despOperacional') calculated.despOperacional += l.valor;
        }
      });
      calculated.saldo = calculated.recebido - (calculated.despProducao + calculated.despOperacional);

      const date = parseDate(leilao.data);
      if(isNaN(date.getTime())) return;
      const month = date.getMonth();
      monthlyData[month].auctions.push({ ...leilao, calculated });
    });

    Object.values(monthlyData).forEach(month => {
        month.auctions.forEach(auction => {
            Object.keys(month.totals).forEach(key => {
                month.totals[key as keyof CalculatedData] += auction.calculated[key as keyof CalculatedData];
            });
        });
    });

    const annualTotal: CalculatedData = { comissao: 0, inscricao: 0, receitaTotal: 0, recebido: 0, aReceber: 0, despProducao: 0, despOperacional: 0, saldo: 0 };
    Object.values(monthlyData).forEach(month => {
        Object.keys(annualTotal).forEach(key => {
            annualTotal[key as keyof CalculatedData] += month.totals[key as keyof CalculatedData];
        });
    });
    
    return { monthlyData, annualTotal };
  }, [selectedYear, leiloes, lancamentos, categories]);

  const handleToggleMonth = (month: number) => {
    const newSet = new Set(expandedMonths);
    if (newSet.has(month)) {
      newSet.delete(month);
    } else {
      newSet.add(month);
    }
    setExpandedMonths(newSet);
  };

  const handleExport = () => {
    const dataForExport: (string | number)[][] = [];
    const headers = ["Mês/Leilão", "Data", "Comissão", "Inscrição", "Receita Total", "Recebido", "A Receber", "Desp. Produção", "Desp. Operacional", "Saldo do Leilão"];
    dataForExport.push(headers);
    
    for (let i = 0; i < 12; i++) {
        const month = processedData.monthlyData[i];
        if(month.auctions.length > 0) {
            dataForExport.push([
                getMonthName(i).toUpperCase(), "",
                month.totals.comissao/100, month.totals.inscricao/100, month.totals.receitaTotal/100,
                month.totals.recebido/100, month.totals.aReceber/100, month.totals.despProducao/100,
                month.totals.despOperacional/100, month.totals.saldo/100
            ]);
            month.auctions.forEach(a => {
                dataForExport.push([
                    `  ${a.nome}`, formatDate(a.data),
                    a.calculated.comissao/100, a.calculated.inscricao/100, a.calculated.receitaTotal/100,
                    a.calculated.recebido/100, a.calculated.aReceber/100, a.calculated.despProducao/100,
                    a.calculated.despOperacional/100, a.calculated.saldo/100
                ]);
            });
        }
    }

    dataForExport.push([
        "TOTAL ANUAL", "",
        processedData.annualTotal.comissao/100, processedData.annualTotal.inscricao/100, processedData.annualTotal.receitaTotal/100,
        processedData.annualTotal.recebido/100, processedData.annualTotal.aReceber/100, processedData.annualTotal.despProducao/100,
        processedData.annualTotal.despOperacional/100, processedData.annualTotal.saldo/100
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet(dataForExport);
    worksheet['!cols'] = [{wch:40}, {wch:12}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}];
    
    // Add currency formatting
    const currencyFormat = '"R$"#,##0.00';
    Object.keys(worksheet).forEach(cellAddress => {
        if(cellAddress[0] === '!' || cellAddress[0] === 'A' || cellAddress[0] === 'B') return;
        if(worksheet[cellAddress].v && typeof worksheet[cellAddress].v === 'number') {
            worksheet[cellAddress].z = currencyFormat;
        }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Leiloes ${selectedYear}`);
    XLSX.writeFile(workbook, `Relatorio_Leiloes_${selectedYear}.xlsx`);
  };

  const renderRow = (data: CalculatedData, label: React.ReactNode, isHeader = false, isFooter = false, isSubRow = false) => {
    const headerClass = isHeader ? 'font-bold bg-slate-100' : '';
    const footerClass = isFooter ? 'font-black bg-slate-200 border-t-2 border-slate-300' : '';
    const subRowClass = isSubRow ? 'hover:bg-sky-50/50' : '';
    const saldoClass = data.saldo >= 0 ? 'text-green-700' : 'text-red-700';

    return (
        <tr className={`${headerClass} ${footerClass} ${subRowClass}`}>
            <td className={`px-4 py-3 ${isSubRow ? 'pl-10' : ''}`}>{label}</td>
            <td className="px-4 py-3 text-green-600">{formatCurrency(data.comissao)}</td>
            <td className="px-4 py-3">{formatCurrency(data.inscricao)}</td>
            <td className="px-4 py-3 font-medium">{formatCurrency(data.receitaTotal)}</td>
            <td className="px-4 py-3 text-sky-600 font-bold">{formatCurrency(data.recebido)}</td>
            <td className="px-4 py-3 text-amber-600">{formatCurrency(data.aReceber)}</td>
            <td className="px-4 py-3 text-red-600">{formatCurrency(data.despProducao)}</td>
            <td className="px-4 py-3 text-red-600">{formatCurrency(data.despOperacional)}</td>
            <td className={`px-4 py-3 font-bold ${saldoClass}`}>{formatCurrency(data.saldo)}</td>
        </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatório Anual de Leilões</h2>
          <p className="text-slate-500 text-sm">Visão consolidada do resultado financeiro por evento.</p>
        </div>
        <div className="flex items-center gap-2">
            <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
            >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium">
                <Download size={16} /> Exportar
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
          <table className="w-full text-sm text-right min-w-[1200px]">
              <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase">
                  <tr>
                      <th className="px-4 py-3 text-left w-2/12">Mês / Leilão</th>
                      <th className="px-4 py-3">Comissão</th>
                      <th className="px-4 py-3">Inscrição</th>
                      <th className="px-4 py-3">Receita Total</th>
                      <th className="px-4 py-3">Recebido</th>
                      <th className="px-4 py-3">A Receber</th>
                      <th className="px-4 py-3">Desp. Produção</th>
                      <th className="px-4 py-3">Desp. Operacional</th>
                      <th className="px-4 py-3">Saldo Leilão</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {Object.entries(processedData.monthlyData).map(([monthIndex, monthData]) => {
                      const month = parseInt(monthIndex);
                      const isExpanded = expandedMonths.has(month);
                      const typedMonthData = monthData as { auctions: (Leilao & { calculated: CalculatedData })[], totals: CalculatedData };
                      const hasAuctions = typedMonthData.auctions.length > 0;
                      if (!hasAuctions) return null;

                      const monthLabel = (
                          <div className="flex items-center gap-2 text-left cursor-pointer" onClick={() => hasAuctions && handleToggleMonth(month)}>
                              {hasAuctions ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <div className="w-4"></div>}
                              <span className="font-bold text-slate-800">{getMonthName(month)}</span>
                          </div>
                      );

                      return (
                          <React.Fragment key={month}>
                              {renderRow(typedMonthData.totals, monthLabel, true)}
                              {isExpanded && typedMonthData.auctions.map((auction: Leilao & { calculated: CalculatedData }) => {
                                  const auctionLabel = <div className="text-left"><p className="font-medium text-slate-700">{auction.nome}</p><p className="text-xs text-slate-400">{formatDate(auction.data)}</p></div>;
                                  return renderRow(auction.calculated, auctionLabel, false, false, true);
                              })}
                          </React.Fragment>
                      );
                  })}
              </tbody>
              <tfoot>
                {renderRow(processedData.annualTotal, <div className="text-left">TOTAL ANUAL</div>, false, true)}
              </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default AnnualAuctions;