import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader } from 'lucide-react';
import { 
  Lancamento, Categoria, Leilao, Banco, Unidade, User, LeilaoCategoria, CentroCusto 
} from '../types';
import { formatDate } from '../utils/format';

interface DatabaseExportProps {
  transactions: Lancamento[];
  categories: Categoria[];
  leiloes: Leilao[];
  bancos: Banco[];
  unidades: Unidade[];
  users: User[];
  catLeilao: LeilaoCategoria[];
  centros: CentroCusto[];
}

type ExportableTable = 
  | 'lancamentos' 
  | 'categorias' 
  | 'leiloes' 
  | 'bancos' 
  | 'unidades' 
  | 'users' 
  | 'leilao_categorias' 
  | 'centros_custo';

const DatabaseExport: React.FC<DatabaseExportProps> = (props) => {
  const [loading, setLoading] = useState<ExportableTable | null>(null);

  const exportables: { id: ExportableTable; title: string; description: string }[] = [
    { id: 'lancamentos', title: 'Lançamentos Financeiros', description: 'Todas as transações de receita e despesa.' },
    { id: 'categorias', title: 'Plano de Contas (Rubricas)', description: 'Estrutura de categorias para classificação.' },
    { id: 'leiloes', title: 'Eventos (Leilões)', description: 'Lista de todos os leilões cadastrados.' },
    { id: 'bancos', title: 'Contas Bancárias', description: 'Contas e seus saldos iniciais.' },
    { id: 'unidades', title: 'Unidades de Negócio', description: 'Filiais e matriz da empresa.' },
    { id: 'users', title: 'Usuários', description: 'Lista de usuários do sistema.' },
    { id: 'leilao_categorias', title: 'Categorias de Leilão', description: 'Tipos de leilões (ex: Bovinos, Equinos).' },
    { id: 'centros_custo', title: 'Centros de Custo', description: 'Grupos para o plano de contas.' },
  ];
  
  const handleExport = (table: ExportableTable) => {
    setLoading(table);
    
    // Use a timeout to allow UI to update before blocking with export logic
    setTimeout(() => {
        try {
            let dataToExport: Record<string, unknown>[] = [];
            let fileName = `${table}.xlsx`;

            switch (table) {
                case 'lancamentos':
                    const catMap = new Map<string, Categoria>(props.categories.map(c => [c.id, c]));
                    const bancoMap = new Map<string, Banco>(props.bancos.map(b => [b.id, b]));
                    const leilaoMap = new Map<string, Leilao>(props.leiloes.map(l => [l.id, l]));
                    const unidadeMap = new Map<string, Unidade>(props.unidades.map(u => [u.id, u]));
                    
                    dataToExport = props.transactions.map(t => ({
                        'ID': t.id,
                        'Data Pagamento': formatDate(t.data_pagamento),
                        'Data Competência': formatDate(t.data_competencia),
                        'Descrição': t.descricao,
                        'Valor': t.valor / 100,
                        'Tipo': t.tipo,
                        'Status': t.status,
                        'Rubrica': catMap.get(t.categoria_id)?.rubrica || 'N/A',
                        'Código Rubrica': catMap.get(t.categoria_id)?.codigo || 'N/A',
                        'Banco': bancoMap.get(t.banco_id)?.nome || 'N/A',
                        'Leilão': leilaoMap.get(t.leilao_id || '')?.nome || '',
                        'Fornecedor/Cliente': t.fornecedor,
                        'Unidade': unidadeMap.get(t.unidade_id || '')?.nome || '',
                        'Conciliado': t.conciliado ? 'Sim' : 'Não',
                    }));
                    break;

                case 'categorias':
                    dataToExport = props.categories.map(c => ({
                        'Código': c.codigo,
                        'Rubrica': c.rubrica,
                        'Centro de Custo': c.centro,
                        'Classificação DRE': c.classificacao,
                    }));
                    fileName = 'plano_de_contas.xlsx';
                    break;
                
                case 'leiloes':
                    const leilaoCatMap = new Map(props.catLeilao.map(c => [c.id, c.nome]));
                    dataToExport = props.leiloes.map(l => ({
                        'Nome': l.nome,
                        'Data': formatDate(l.data),
                        'Categoria': leilaoCatMap.get(l.categoria_id) || 'N/A',
                    }));
                    break;
                
                case 'bancos':
                     dataToExport = props.bancos.map(b => ({
                        'Nome': b.nome,
                        'Código': b.codigo,
                        'Saldo Inicial': b.saldo_inicial / 100,
                    }));
                    break;

                case 'users':
                    const uniMap = new Map(props.unidades.map(u => [u.id, u.nome]));
                    dataToExport = props.users.map(u => ({
                        'Nome': u.name,
                        'Email': u.email,
                        'Perfil': u.role,
                        'Unidade': u.unidade_id ? uniMap.get(u.unidade_id) : '',
                    }));
                    break;
                
                case 'unidades':
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    dataToExport = props.unidades.map(({ id, created_at, ...rest }) => rest);
                    break;
                case 'leilao_categorias':
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    dataToExport = props.catLeilao.map(({ id, created_at, ...rest }) => rest);
                    break;
                case 'centros_custo':
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    dataToExport = props.centros.map(({ id, created_at, ...rest }) => rest);
                    break;
            }

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

            // Add currency formatting for relevant tables
            if (['lancamentos', 'bancos'].includes(table)) {
                const currencyFormat = '"R$"#,##0.00';
                const col = table === 'lancamentos' ? 'E' : 'C'; // Column with valor/saldo
                Object.keys(worksheet).forEach(cellAddress => {
                    if(cellAddress.startsWith(col) && cellAddress !== `${col}1`) { // Check if it's the right column and not the header
                        worksheet[cellAddress].z = currencyFormat;
                    }
                });
            }

            XLSX.writeFile(workbook, fileName);
        } catch (e) {
            console.error("Failed to export data", e);
            alert("Ocorreu um erro ao exportar os dados.");
        } finally {
            setLoading(null);
        }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Exportação de Dados</h2>
        <p className="text-gray-500 text-sm mt-1">
          Selecione uma base de dados para exportar todos os registros em formato XLSX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportables.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
            <button
              onClick={() => handleExport(item.id)}
              disabled={loading === item.id}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-900 text-sm font-medium transition-colors shadow-sm disabled:bg-brand-700 disabled:opacity-75"
            >
              {loading === item.id ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Exportar para XLSX
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseExport;