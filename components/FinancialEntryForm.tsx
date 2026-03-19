import React, { useState, useEffect } from 'react';
import { Leilao } from '../types';
import { CostCenterAllocation, Installment } from '../types/FinancialTypes';

interface FinancialEntryFormProps {
  leiloes: Leilao[];
}

export const FinancialEntryForm: React.FC<FinancialEntryFormProps> = ({ leiloes }) => {
  const [selectedLeilaoId, setSelectedLeilaoId] = useState<string | undefined>();
  const [competenceDate, setCompetenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocations, setAllocations] = useState<CostCenterAllocation[]>([{ id: '1', name: '', value: 0 }]);
  const [installments, setInstallments] = useState(1);
  const [calculatedInstallments, setCalculatedInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    if (selectedLeilaoId) {
      const selectedLeilao = leiloes.find(l => l.id === selectedLeilaoId);
      if (selectedLeilao) {
        setCompetenceDate(selectedLeilao.data);
      }
    } else {
      setCompetenceDate(new Date().toISOString().split('T')[0]);
    }
  }, [selectedLeilaoId, leiloes]);

  const handleAddAllocation = () => {
    setAllocations([...allocations, { id: `${Date.now()}`, name: '', value: 0 }]);
  };

  const handleAllocationChange = (index: number, field: keyof CostCenterAllocation, value: string | number) => {
    const newAllocations = [...allocations];
    const allocation = newAllocations[index];

    if (field === 'name') {
      allocation.name = value as string;
    } else if (field === 'value') {
      allocation.value = parseFloat(value as string) || 0;
    }
    setAllocations(newAllocations);
  };

  const handleCalculate = () => {
    const newCalculatedInstallments: Installment[] = [];
    const baseCompetenceDate = new Date(competenceDate);

    allocations.forEach(allocation => {
      if (allocation.value > 0 && installments > 0) {
        const installmentValue = allocation.value / installments;
        for (let i = 1; i <= installments; i++) {
          const dueDate = new Date(baseCompetenceDate);
          dueDate.setMonth(dueDate.getMonth() + i -1);
          newCalculatedInstallments.push({
            costCenterName: allocation.name,
            installmentNumber: i,
            value: installmentValue,
            dueDate: dueDate.toISOString().split('T')[0],
          });
        }
      }
    });
    setCalculatedInstallments(newCalculatedInstallments);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lançamento Financeiro Manual</h1>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="leilao" className="block text-sm font-medium text-gray-700">Leilão (Opcional)</label>
            <select
              id="leilao"
              value={selectedLeilaoId || ''}
              onChange={(e) => setSelectedLeilaoId(e.target.value || undefined)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Nenhum</option>
              {leiloes.map(leilao => (
                <option key={leilao.id} value={leilao.id}>{leilao.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="competenceDate" className="block text-sm font-medium text-gray-700">Data de Competência</label>
            <input
              type="date"
              id="competenceDate"
              value={competenceDate}
              onChange={(e) => setCompetenceDate(e.target.value)}
              disabled={!!selectedLeilaoId}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Divisão por Rubrica</h2>
          {allocations.map((alloc, index) => (
            <div key={alloc.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 items-center">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Rubrica</label>
                <input
                  type="text"
                  placeholder="Nome da Rubrica"
                  value={alloc.name}
                  onChange={(e) => handleAllocationChange(index, 'name', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  placeholder="Valor"
                  value={alloc.value}
                  onChange={(e) => handleAllocationChange(index, 'value', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
          ))}
          <button onClick={handleAddAllocation} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Adicionar Rubrica</button>
        </div>

        <div className="mt-6">
          <label htmlFor="installments" className="block text-sm font-medium text-gray-700">Número de Parcelas</label>
          <input
            type="number"
            id="installments"
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value, 10) || 1)}
            min="1"
            className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>

        <div className="mt-8 border-t pt-6">
          <button 
            onClick={handleCalculate}
            className="w-full md:w-auto flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Calcular Parcelas
          </button>
        </div>

        {calculatedInstallments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Parcelas Calculadas</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubrica</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcela</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedInstallments.map((inst, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.costCenterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.installmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
