import * as XLSX from 'xlsx';

// Helper to save the file
const saveFile = (buffer: BlobPart, fileName: string) => {
  const data = new Blob([buffer], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateLancamentosTemplate = () => {
  const headers = [
    'data_pagamento (DD/MM/YYYY)',
    'data_competencia (DD/MM/YYYY)',
    'descricao',
    'valor (ex: 123.45)',
    'tipo (receita ou despesa)',
    'codigo_rubrica',
    'codigo_banco',
    'fornecedor',
    'nome_leilao (opcional)',
    'nome_unidade (opcional)',
  ];
  const exampleData = [
    {
      'data_pagamento (DD/MM/YYYY)': '25/10/2024',
      'data_competencia (DD/MM/YYYY)': '25/10/2024',
      'descricao': 'Energia Elétrica Escritório',
      'valor (ex: 123.45)': 450.99,
      'tipo (receita ou despesa)': 'despesa',
      'codigo_rubrica': '3203',
      'codigo_banco': '756',
      'fornecedor': 'CEMIG',
      'nome_leilao (opcional)': '',
      'nome_unidade (opcional)': 'Matriz Administrativa',
    },
    {
      'data_pagamento (DD/MM/YYYY)': '15/11/2024',
      'data_competencia (DD/MM/YYYY)': '15/11/2024',
      'descricao': 'Comissão Leilão X',
      'valor (ex: 123.45)': 15000.00,
      'tipo (receita ou despesa)': 'receita',
      'codigo_rubrica': '1001',
      'codigo_banco': '001',
      'fornecedor': 'Cliente Comprador Y',
      'nome_leilao (opcional)': 'LEILÃO REVOLUTION - 2025',
      'nome_unidade (opcional)': 'Filial Bagé',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  ws['!cols'] = [ {wch:28}, {wch:32}, {wch:30}, {wch:20}, {wch:25}, {wch:15}, {wch:20}, {wch:25}, {wch:30}, {wch:30} ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveFile(wbout, 'modelo_lancamentos.xlsx');
};

export const generateRegistryTemplate = (registryType: string) => {
  let headers: string[] = [];
  let exampleData: Record<string, unknown>[] = [];
  const fileName = `modelo_${registryType}.xlsx`;
  let sheetName = registryType.charAt(0).toUpperCase() + registryType.slice(1);
  let cols: {wch: number}[] = [];

  switch (registryType) {
    case 'bancos':
      headers = ['nome', 'codigo', 'saldo_inicial (ex: 123.45)'];
      exampleData = [{ nome: 'Novo Banco SA', codigo: '999', 'saldo_inicial (ex: 123.45)': 10000.00 }];
      cols = [{wch:30}, {wch:10}, {wch:25}];
      break;
    case 'unidades':
      headers = ['nome'];
      exampleData = [{ nome: 'Nova Filial' }];
      cols = [{wch:40}];
      break;
    case 'leiloes':
      headers = ['nome', 'data (DD/MM/YYYY)', 'nome_categoria_leilao'];
      exampleData = [{ nome: 'Leilão Futuro', 'data (DD/MM/YYYY)': '31/12/2025', nome_categoria_leilao: 'BOVINOS' }];
      cols = [{wch:40}, {wch:20}, {wch:25}];
      break;
    case 'leilao_categorias':
      headers = ['nome'];
      exampleData = [{ nome: 'GADO DE CORTE' }];
      cols = [{wch:40}];
      break;
    case 'categorias':
      headers = ['NomeClassificacao', 'NomeGrupo', 'CodRubrica', 'NomeRubrica'];
      exampleData = [
        { NomeClassificacao: 'RECEITAS', NomeGrupo: 'VENDAS', CodRubrica: '1010', NomeRubrica: 'VENDA PRODUTO A' },
        { NomeClassificacao: 'RECEITAS', NomeGrupo: 'VENDAS', CodRubrica: '1011', NomeRubrica: 'VENDA SERVICO X' },
        { NomeClassificacao: 'DESPESAS', NomeGrupo: 'PESSOAL', CodRubrica: '1012', NomeRubrica: 'SALARIOS' },
        { NomeClassificacao: 'DESPESAS', NomeGrupo: 'ADMINISTRATIVO', CodRubrica: '1013', NomeRubrica: 'ALUGUEL' },
      ];
      cols = [{wch:20}, {wch:25}, {wch:15}, {wch:40}];
      sheetName = 'PlanoDeContas';
      break;
    case 'centros_custo':
      headers = ['nome'];
      exampleData = [{ nome: 'Novo Centro de Custo' }];
      cols = [{wch:40}];
      break;
    case 'grupos_contabeis':
      headers = ['nome'];
      exampleData = [{ nome: 'Novo Grupo' }];
      cols = [{wch:40}];
      break;
    case 'users':
      headers = ['name', 'email', 'role (admin ou colaborador)'];
      exampleData = [{ name: 'Novo Usuário', email: 'novo.usuario@email.com', 'role (admin ou colaborador)': 'colaborador' }];
      cols = [{wch:30}, {wch:30}, {wch:30}];
      break;
    default:
      return;
  }

  const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
  ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveFile(wbout, fileName);
};