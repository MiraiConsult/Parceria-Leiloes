import React, { useMemo } from 'react';
import { Previsao, Categoria } from '../types';
import MultiSelectFilter from './MultiSelectFilter';
import { formatCurrency } from '../utils/format';
import { BarChart3, Printer } from 'lucide-react';

interface AuctionComparisonProps {
  previsoes: Previsao[];
  categories: Categoria[];
  selectedPrevisaoIds: Set<string>;
  setSelectedPrevisaoIds: (ids: Set<string>) => void;
}

const AuctionComparison: React.FC<AuctionComparisonProps> = ({
  previsoes,
  categories,
  selectedPrevisaoIds,
  setSelectedPrevisaoIds,
}) => {

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const processedData = useMemo(() => {
    const selectedPrevisoes = previsoes
        .filter(p => selectedPrevisaoIds.has(p.id))
        .sort((a,b) => a.nome_cenario.localeCompare(b.nome_cenario));

    const receitaRowsMap = new Map<string, { catId: string; rubrica: string }>();
    const despesaRowsMap = new Map<string, { catId: string; rubrica: string; fornecedor: string }>();

    selectedPrevisoes.forEach(previsao => {
      previsao.itens.forEach(item => {
        const category = categoryMap.get(item.categoria_id);
        const rubrica = item.rubrica || category?.rubrica || 'N/A';

        if (item.tipo === 'receita') {
          const key = item.categoria_id;
          if (!receitaRowsMap.has(key)) {
            receitaRowsMap.set(key, { catId: item.categoria_id, rubrica });
          }
        } else {
          const key = `${item.categoria_id}-${item.fornecedor || 'N/A'}`;
          if (!despesaRowsMap.has(key)) {
            despesaRowsMap.set(key, { catId: item.categoria_id, rubrica, fornecedor: item.fornecedor || 'N/A' });
          }
        }
      });
    });

    const receitaRows = Array.from(receitaRowsMap.values()).sort((a,b) => a.rubrica.localeCompare(b.rubrica));
    const despesaRows = Array.from(despesaRowsMap.values()).sort((a,b) => {
        if (a.rubrica !== b.rubrica) return a.rubrica.localeCompare(b.rubrica);
        return a.fornecedor.localeCompare(b.fornecedor);
    });

    const auctionColumns = new Map<string, {
        receitas: Map<string, number>;
        despesas: Map<string, number>;
        totals: { receitas: number; despesas: number; resultado: number }
    }>();

    selectedPrevisoes.forEach(previsao => {
        const columnData = {
            receitas: new Map<string, number>(),
            despesas: new Map<string, number>(),
            totals: { receitas: 0, despesas: 0, resultado: 0 }
        };

        previsao.itens.forEach(item => {
            if (item.tipo === 'receita') {
                const key = item.categoria_id;
                const current = columnData.receitas.get(key) || 0;
                columnData.receitas.set(key, current + item.valor);
                columnData.totals.receitas += item.valor;
            } else if (item.tipo === 'despesa') {
                const key = `${item.categoria_id}-${item.fornecedor || 'N/A'}`;
                const current = columnData.despesas.get(key) || 0;
                columnData.despesas.set(key, current + item.valor);
                columnData.totals.despesas += item.valor;
            }
        });
        
        columnData.totals.resultado = columnData.totals.receitas - columnData.totals.despesas;
        auctionColumns.set(previsao.id, columnData);
    });

    return { selectedPrevisoes, receitaRows, despesaRows, auctionColumns };
  }, [selectedPrevisaoIds, previsoes, categories, categoryMap]);

  const selectOptions = useMemo(() => {
    return [...previsoes].map(p => ({ id: p.id, nome: p.nome_cenario, data: p.data_criacao })).sort((a,b) => b.data.localeCompare(a.data))
  }, [previsoes]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Comparativo de Cenários de Leilão</h2>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 shadow-sm transition-colors no-print">
            <Printer size={18} /> Imprimir
          </button>
        </div>
        <p className="text-slate-500 text-sm">Analise os resultados financeiros de múltiplos cenários lado a lado.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-20">
        <label className="text-sm font-medium text-slate-500 mb-2 block">Selecione os cenários para comparar</label>
        <MultiSelectFilter 
            options={selectOptions}
            selectedIds={selectedPrevisaoIds}
            onSelectionChange={setSelectedPrevisaoIds}
            label="Cenário"
            className="w-full max-w-2xl"
        />
      </div>
      
      {selectedPrevisaoIds.size === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
            <BarChart3 size={40} className="mx-auto text-slate-300"/>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">Nenhum Cenário Selecionado</h3>
            <p className="mt-1 text-slate-500">Escolha um ou mais cenários no seletor acima para iniciar a comparação.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="sticky left-0 bg-slate-100 z-10 px-4 py-3 text-left w-60 shadow-md">Rubrica</th>
                        <th className="sticky left-60 bg-slate-100 z-10 px-4 py-3 text-left w-48 shadow-md">Fornecedor</th>
                        {processedData.selectedPrevisoes.map(previsao => (
                            <th key={previsao.id} className="px-4 py-3 text-right min-w-[150px]">{previsao.nome_cenario}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    
                    {processedData.receitaRows.map(row => (
                        <tr key={row.catId} className="hover:bg-sky-50/50">
                            <td className="sticky left-0 bg-white hover:bg-sky-50/50 px-4 py-2 font-medium text-slate-800">{row.rubrica}</td>
                            <td className="sticky left-60 bg-white hover:bg-sky-50/50 px-4 py-2"></td>
                            {processedData.selectedPrevisoes.map(previsao => {
                                const val = processedData.auctionColumns.get(previsao.id)?.receitas.get(row.catId) || 0;
                                return <td key={previsao.id} className="px-4 py-2 text-right text-green-700">{val > 0 ? formatCurrency(val) : '-'}</td>
                            })}
                        </tr>
                    ))}
                     <tr className="bg-slate-100 font-medium">
                        <td colSpan={2} className="sticky left-0 bg-slate-100 px-4 py-2 text-slate-800">TOTAL RECEITAS</td>
                        {processedData.selectedPrevisoes.map(previsao => (
                            <td key={previsao.id} className="px-4 py-2 text-right font-bold text-green-800">{formatCurrency(processedData.auctionColumns.get(previsao.id)?.totals.receitas || 0)}</td>
                        ))}
                    </tr>

                    
                    {processedData.despesaRows.map(row => {
                        const key = `${row.catId}-${row.fornecedor}`;
                        return (
                            <tr key={key} className="hover:bg-sky-50/50">
                                <td className="sticky left-0 bg-white hover:bg-sky-50/50 px-4 py-2 text-slate-600">{row.rubrica}</td>
                                <td className="sticky left-60 bg-white hover:bg-sky-50/50 px-4 py-2 text-slate-500">{row.fornecedor !== 'N/A' ? row.fornecedor : ''}</td>
                                {processedData.selectedPrevisoes.map(previsao => {
                                    const val = processedData.auctionColumns.get(previsao.id)?.despesas.get(key) || 0;
                                    return <td key={previsao.id} className="px-4 py-2 text-right text-red-700">{val > 0 ? formatCurrency(val) : '-'}</td>
                                })}
                            </tr>
                        )
                    })}
                     <tr className="bg-slate-100 font-medium">
                        <td colSpan={2} className="sticky left-0 bg-slate-100 px-4 py-2 text-slate-800">TOTAL DESPESAS</td>
                        {processedData.selectedPrevisoes.map(previsao => (
                            <td key={previsao.id} className="px-4 py-2 text-right font-bold text-red-800">{formatCurrency(processedData.auctionColumns.get(previsao.id)?.totals.despesas || 0)}</td>
                        ))}
                    </tr>
                </tbody>
                <tfoot>
                    <tr className="bg-slate-800 text-white font-black text-base">
                        <td colSpan={2} className="sticky left-0 bg-slate-800 px-4 py-4">RESULTADO DO CENÁRIO</td>
                         {processedData.selectedPrevisoes.map(previsao => {
                            const total = processedData.auctionColumns.get(previsao.id)?.totals.resultado || 0;
                            return (
                                <td key={previsao.id} className={`px-4 py-4 text-right ${total >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {formatCurrency(total)}
                                </td>
                            )
                        })}
                    </tr>
                </tfoot>
            </table>
        </div>
      )}
    </div>
  );
};

export default AuctionComparison;