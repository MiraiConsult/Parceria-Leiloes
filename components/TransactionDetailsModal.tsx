import React from 'react';
import { Lancamento, Categoria } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { X, Pencil, Trash2, List } from 'lucide-react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: Lancamento[];
  categories: Categoria[];
  handleEdit: (transaction: Lancamento) => void;
  handleDelete: (id: string) => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, onClose, title, transactions, categories, handleEdit, handleDelete }) => {
  if (!isOpen) return null;

  const categoryMap = new Map(categories.map(c => [c.id, c.rubrica]));

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><List size={20} className="text-sky-500"/> {title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">DESCRIÇÃO</th>
                  <th className="p-3">VENCIMENTO</th>
                  <th className="p-3 text-right">VALOR</th>
                  <th className="p-3">TIPO</th>
                  <th className="p-3">CATEGORIA / RUBRICA</th>
                  <th className="p-3 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length > 0 ? (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 group">
                      <td className="p-3 font-medium text-slate-900">{t.descricao || '-'}</td>
                      <td className="p-3 text-slate-600">{formatDate(t.data_pagamento)}</td>
                      <td className={`p-3 text-right font-medium ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(t.valor)}
                      </td>
                      <td className="p-3 capitalize">{t.tipo}</td>
                      <td className="p-3 text-slate-600">{categoryMap.get(t.categoria_id) || 'N/A'}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(t)} className="p-1.5 text-sky-600 hover:bg-sky-100 rounded" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Excluir"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;