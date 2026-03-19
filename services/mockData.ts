import { Banco, Categoria, Lancamento, Leilao, LeilaoCategoria, Previsao, User, Unidade, Fornecedor, CentroCusto } from '../types';

export const UNIDADES: Unidade[] = [
  { id: 'u1', nome: 'Matriz Administrativa' },
  { id: 'u2', nome: 'Filial Bagé' },
  { id: 'u3', nome: 'Filial Campo Grande' },
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Ana Silva',
  email: 'ana.silva@parcerialeiloes.com.br',
  role: 'admin',
  avatar: 'https://picsum.photos/200',
  unidade_id: 'u1'
};

export const OTHER_USERS: User[] = [
    { id: 'u2', name: 'Carlos Souza', email: 'carlos@parcerialeiloes.com.br', role: 'colaborador', avatar: '', unidade_id: 'u2' },
];

export const FORNECEDORES: Fornecedor[] = [
    { id: 'f1', nome: 'CEMIG', cnpj: '06.981.180/0001-16' },
    { id: 'f2', nome: 'Canal Rural', cnpj: '00.000.000/0001-00' },
    { id: 'f3', nome: 'Parque Exposições', cnpj: '' },
    { id: 'f4', nome: 'Hotelaria São Jorge', cnpj: '' },
    { id: 'f5', nome: 'Gráfica Express', cnpj: '' },
];

export const LEILAO_CATEGORIAS: LeilaoCategoria[] = [
    { id: 'cat_equinos', nome: 'EQUINOS' },
    { id: 'cat_bovinos', nome: 'BOVINOS' },
    { id: 'cat_ovinos', nome: 'OVINOS' },
    { id: 'cat_outros', nome: 'OUTROS' },
];

export const BANCOS: Banco[] = [
  { id: 'b1', nome: 'Banco do Brasil', codigo: '001', saldo_inicial: 5000000 }, // R$ 50.000,00
  { id: 'b2', nome: 'Sicoob', codigo: '756', saldo_inicial: 12000000 }, // R$ 120.000,00
];

// --- New Registries based on PDF ---

export const CENTROS_CUSTO: CentroCusto[] = [
  { id: 'cc1', nome: 'RECEITA' },
  { id: 'cc2', nome: 'OUTRAS RECEITAS' },
  { id: 'cc3', nome: 'DESPESAS OPERACIONAIS' }, // Used in Leilão context
  { id: 'cc4', nome: 'DESPESAS OPERACIONAIS LEILÃO' },
  { id: 'cc5', nome: 'DESPESAS DE PRODUÇÃO' },
  { id: 'cc6', nome: 'CUSTOS FINANCEIROS EVENTO' },
  { id: 'cc7', nome: 'IMPOSTOS' },
  { id: 'cc8', nome: 'PESSOAL ADMINISTRATIVO' },
  { id: 'cc9', nome: 'ESTRUTURA' },
  { id: 'cc10', nome: 'SERVIÇOS DE TERCEIROS' },
  { id: 'cc11', nome: 'DESPESAS DE ESCRITÓRIO' },
  { id: 'cc12', nome: 'DESPESAS FINANCEIRAS' },
  { id: 'cc13', nome: 'DESPESAS SOCIETÁRIAS' },
  { id: 'cc14', nome: 'NÃO OPERACIONAIS' },
  { id: 'cc15', nome: 'CONTAS TRANSITÓRIAS' },
  { id: 'cc16', nome: 'SOCIETÁRIO' },
  { id: 'cc17', nome: 'IMOBILIZADO' },
];

export const CATEGORIAS: Categoria[] = [
  // RECEITAS
  { id: 'c1001', codigo: '1001', rubrica: 'COMISSÃO EQUINOS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1002', codigo: '1002', rubrica: 'COMISSÃO BOVINOS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1003', codigo: '1003', rubrica: 'ENTRADA PROGRAMA LEILÕES', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1004', codigo: '1004', rubrica: 'ENTRADA LEILOEIRO', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1005', codigo: '1005', rubrica: 'COMISSÃO OUTROS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1006', codigo: '1006', rubrica: 'RECEITAS PRODUÇÃO LEILÃO', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1007', codigo: '1007', rubrica: 'COMISSÕES ANTIGAS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1008', codigo: '1008', rubrica: 'REEMBOLSO', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1009', codigo: '1009', rubrica: 'DEVOLUÇÃO COMISSÕES', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1010', codigo: '1010', rubrica: 'RECEITAS NÃO IDENTIFICADAS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1011', codigo: '1011', rubrica: 'ESTORNO', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1012', codigo: '1012', rubrica: 'COMISSÃO DE VENDAS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c1013', codigo: '1013', rubrica: 'DEMAIS RECEITAS', centro: 'RECEITA', classificacao: 'RECEITA' },
  { id: 'c5001', codigo: '5001', rubrica: 'TRANSFERÊNCIA PROGRAMA', centro: 'OUTRAS RECEITAS', classificacao: 'RECEITA' },
  { id: 'c5002', codigo: '5002', rubrica: 'ENTRADA DE TERCEIROS', centro: 'OUTRAS RECEITAS', classificacao: 'RECEITA' },
  { id: 'c5003', codigo: '5003', rubrica: 'RESSARCIMENTO A TERCEIROS', centro: 'OUTRAS RECEITAS', classificacao: 'RECEITA' },
  { id: 'c5004', codigo: '5004', rubrica: 'RESSARCIMENTO DE DESPESAS', centro: 'OUTRAS RECEITAS', classificacao: 'RECEITA' },

  // CUSTOS E DESPESAS DO LEILÃO (CUSTO_VARIAVEL)
  // Despesas Operacionais (do Leilão)
  { id: 'c2001', codigo: '2001', rubrica: 'HOSPEDAGEM', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2002', codigo: '2002', rubrica: 'ALIMENTAÇÃO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2003', codigo: '2003', rubrica: 'DIARIA', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2004', codigo: '2004', rubrica: 'DESLOCAMENTO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2006', codigo: '2006', rubrica: 'PEDAGIO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2007', codigo: '2007', rubrica: 'ALIMENTAÇÃO MESA', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2008', codigo: '2008', rubrica: 'COMISSÃO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2009', codigo: '2009', rubrica: 'PRIMAVERA', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2010', codigo: '2010', rubrica: 'ALIMENTAÇÃO VENDEDORES', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2011', codigo: '2011', rubrica: 'ALUGUEL CARRO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2012', codigo: '2012', rubrica: 'COMISSÃO LEILOEIRO', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2013', codigo: '2013', rubrica: 'LIMPEZA ESCRITORIO - LEILÕES', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2014', codigo: '2014', rubrica: 'PROGRAMA LEILÕES', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2017', codigo: '2017', rubrica: 'OUTRAS OPERACIONAIS', centro: 'DESPESAS OPERACIONAIS LEILÃO', classificacao: 'CUSTO_VARIAVEL' },
  
  // Despesas de Produção
  { id: 'c2101', codigo: '2101', rubrica: 'TRANSMISSÃO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2102', codigo: '2102', rubrica: 'FILMAGEM/FOTO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2103', codigo: '2103', rubrica: 'FRETE', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2104', codigo: '2104', rubrica: 'TATTERSALL', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2105', codigo: '2105', rubrica: 'ARTE E CRIAÇÃO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2106', codigo: '2106', rubrica: 'VETERINARIO/INSPETORIA', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2107', codigo: '2107', rubrica: 'CAMPEIRA', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2108', codigo: '2108', rubrica: 'ASSESSORIA', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2109', codigo: '2109', rubrica: 'SOM/LUZ/GERADOR', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2110', codigo: '2110', rubrica: 'SINDICATO RURAL', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2111', codigo: '2111', rubrica: 'IMPRESSÃO CATALOGOS', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2112', codigo: '2112', rubrica: 'AGENCIAMENTO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2113', codigo: '2113', rubrica: 'DECORAÇÃO/ALIMENTAÇÃO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2114', codigo: '2114', rubrica: 'OUTRAS DE PRODUÇÃO', centro: 'DESPESAS DE PRODUÇÃO', classificacao: 'CUSTO_VARIAVEL' },

  // Custos Financeiros do Evento
  { id: 'c2201', codigo: '2201', rubrica: 'TAXAS DE CARTÃO', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2202', codigo: '2202', rubrica: 'JUROS E MULTAS EVENTO', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2203', codigo: '2203', rubrica: 'ALUGUEL MÁQUINAS DE CARTÃO', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2204', codigo: '2204', rubrica: 'CUSTO DE ANTECIPAÇÃO', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2205', codigo: '2205', rubrica: 'TARIFAS BOLETOS/PROTESTOS', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2206', codigo: '2206', rubrica: 'DEVOLUÇÃO COMISSÕES', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c2207', codigo: '2207', rubrica: 'OUTROS FINANCEIROS EVENTO', centro: 'CUSTOS FINANCEIROS EVENTO', classificacao: 'CUSTO_VARIAVEL' },

  // Impostos (Diretos)
  { id: 'c3001', codigo: '3001', rubrica: 'SIMPLES NACIONAL', centro: 'IMPOSTOS', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c3002', codigo: '3002', rubrica: 'IOF', centro: 'IMPOSTOS', classificacao: 'CUSTO_VARIAVEL' },
  { id: 'c3006', codigo: '3006', rubrica: 'OUTROS IMPOSTOS', centro: 'IMPOSTOS', classificacao: 'CUSTO_VARIAVEL' },

  // DESPESAS OPERACIONAIS (DESPESA_FIXA)
  // Pessoal Administrativo
  { id: 'c3101', codigo: '3101', rubrica: 'SALÁRIOS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3102', codigo: '3102', rubrica: 'FÉRIAS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3103', codigo: '3103', rubrica: '13º SALÁRIOS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3104', codigo: '3104', rubrica: 'VALE TRANSPORTES', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3105', codigo: '3105', rubrica: 'ACORDOS / RESCISÕES TRABALHISTAS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3106', codigo: '3106', rubrica: 'AÇÃO JUDICIAL', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3107', codigo: '3107', rubrica: 'F.G.T.S.', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3108', codigo: '3108', rubrica: 'INSS/GPS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3109', codigo: '3109', rubrica: 'IRRF', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3110', codigo: '3110', rubrica: 'VALE ALIMENTAÇÃO', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3111', codigo: '3111', rubrica: 'TREINAMENTO', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3112', codigo: '3112', rubrica: 'ADIANTAMENTO DE SALÁRIO/VALE', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3113', codigo: '3113', rubrica: 'EXAME ADMINISSIONAL/DEMISSIONAL', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3114', codigo: '3114', rubrica: 'COMEMORAÇÃO', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3115', codigo: '3115', rubrica: 'OUTROS SERVIÇOS PRESTADOS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3116', codigo: '3116', rubrica: 'DESPESAS VIAGENS', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3117', codigo: '3117', rubrica: 'COMBUSTIVEL', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3118', codigo: '3118', rubrica: 'SEGURO DE VIDA/PLANO DE SAUDE', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3120', codigo: '3120', rubrica: 'OUTRAS PESSOAL', centro: 'PESSOAL ADMINISTRATIVO', classificacao: 'DESPESA_FIXA' },

  // Estrutura
  { id: 'c3201', codigo: '3201', rubrica: 'ALUGUEL', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3202', codigo: '3202', rubrica: 'CONDOMÍNIO', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3203', codigo: '3203', rubrica: 'ENERGIA ELÉTRICA', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3204', codigo: '3204', rubrica: 'TELEFONE', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3205', codigo: '3205', rubrica: 'ÁGUA', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3206', codigo: '3206', rubrica: 'MATERIAL DE LIMPEZA', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3207', codigo: '3207', rubrica: 'INTERNET', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3208', codigo: '3208', rubrica: 'SEGUROS', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3209', codigo: '3209', rubrica: 'TV A CABO', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3210', codigo: '3210', rubrica: 'EMAIL', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },
  { id: 'c3215', codigo: '3215', rubrica: 'OUTRAS OCUPAÇÃO', centro: 'ESTRUTURA', classificacao: 'DESPESA_FIXA' },

  // Serviços de Terceiros
  { id: 'c3301', codigo: '3301', rubrica: 'HONORÁRIOS CONTÁBEIS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3302', codigo: '3302', rubrica: 'HONORÁRIOS ADVOCATÍCIOS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3303', codigo: '3303', rubrica: 'HONORÁRIOS DE CONSULTORIA', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3304', codigo: '3304', rubrica: 'ALUGUEL / MANUTENÇÃO DE SISTEMA', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3305', codigo: '3305', rubrica: 'HOSPEDAGEM SITE', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3306', codigo: '3306', rubrica: 'AGÊNCIA DE MARKETING', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3307', codigo: '3307', rubrica: 'REDES SOCIAIS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3308', codigo: '3308', rubrica: 'GERENCIAMENTO REDES SOCIAIS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3309', codigo: '3309', rubrica: 'OUTROS SISTEMAS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3310', codigo: '3310', rubrica: 'MARKETING', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3311', codigo: '3311', rubrica: 'TI', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3312', codigo: '3312', rubrica: 'OUTRAS TERCEIROS', centro: 'SERVIÇOS DE TERCEIROS', classificacao: 'DESPESA_FIXA' },

  // Despesas de Escritório
  { id: 'c3401', codigo: '3401', rubrica: 'MATERIAL DE LIMPEZA', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3402', codigo: '3402', rubrica: 'LIMPEZA ESCRITORIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3403', codigo: '3403', rubrica: 'MATERIAIS DE MANUTENÇÃO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3404', codigo: '3404', rubrica: 'CORREIOS E FRETES', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3405', codigo: '3405', rubrica: 'TAXAS E EMOLUMENTOS - CARTÓRIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3406', codigo: '3406', rubrica: 'MATERIAL ESCRITORIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3407', codigo: '3407', rubrica: 'ALUGUEL CARRO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3408', codigo: '3408', rubrica: 'SUPERMERCADO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3409', codigo: '3409', rubrica: 'LAVANDERIA', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3410', codigo: '3410', rubrica: 'BRINDES', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3411', codigo: '3411', rubrica: 'CONSULTA DE CREDITO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3412', codigo: '3412', rubrica: 'SINDILER', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3413', codigo: '3413', rubrica: 'DESLOCAMENTO/VEICULOS', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3414', codigo: '3414', rubrica: 'OUTRAS ESCRITÓRIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3415', codigo: '3415', rubrica: 'DESPESA NÃO-IDENTIFICADA', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3416', codigo: '3416', rubrica: 'HOSPEDAGEM ESCRITORIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3417', codigo: '3417', rubrica: 'DIARIA ESCRITORIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },
  { id: 'c3418', codigo: '3418', rubrica: 'ALIMENTAÇÃO ESCRITORIO', centro: 'DESPESAS DE ESCRITÓRIO', classificacao: 'DESPESA_FIXA' },

  // Despesas Financeiras
  { id: 'c3601', codigo: '3601', rubrica: 'TARIFAS BANCÁRIAS', centro: 'DESPESAS FINANCEIRAS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3602', codigo: '3602', rubrica: 'JUROS E MULTAS OPERACIONAL', centro: 'DESPESAS FINANCEIRAS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3603', codigo: '3603', rubrica: 'TARIFAS - CARTÃO DE CRÉDITO', centro: 'DESPESAS FINANCEIRAS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3606', codigo: '3606', rubrica: 'OUTRAS FINANCEIRAS', centro: 'DESPESAS FINANCEIRAS', classificacao: 'DESPESA_FIXA' },

  // Despesas Societárias
  { id: 'c3701', codigo: '3701', rubrica: 'PRÓ-LABORE FÁBIO', centro: 'DESPESAS SOCIETÁRIAS', classificacao: 'DESPESA_FIXA' },
  { id: 'c3702', codigo: '3702', rubrica: 'PRÓ-LABORE LÍVIA', centro: 'DESPESAS SOCIETÁRIAS', classificacao: 'DESPESA_FIXA' },

  // NÃO OPERACIONAIS
  { id: 'c4001', codigo: '4001', rubrica: 'PATROCÍNIOS', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4002', codigo: '4002', rubrica: 'RECEITAS NÃO RECORRENTES', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4003', codigo: '4003', rubrica: 'RECEITAS DE APLICAÇÕES', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4004', codigo: '4004', rubrica: 'COMISSÃO DE PATROCÍNIO', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4005', codigo: '4005', rubrica: 'ALUGUÉIS NÃO OPERACIONAIS', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4006', codigo: '4006', rubrica: 'ESTORNO', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4007', codigo: '4007', rubrica: 'OUTRAS NÃO OPERACIONAIS', centro: 'NÃO OPERACIONAIS', classificacao: 'NAO_OPERACIONAL' },

  // Contas Transitórias (Usually NAO_OPERACIONAL in DRE or skipped)
  { id: 'c4301', codigo: '4301', rubrica: 'EMPRÉSTIMOS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4302', codigo: '4302', rubrica: 'TRANSFERÊNCIAS ENTRE CONTAS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4303', codigo: '4303', rubrica: 'REEMBOLSO INVESTIMENTO', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4304', codigo: '4304', rubrica: 'CONTAS A RECEBER (FIADOS)', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4305', codigo: '4305', rubrica: 'APORTE SÓCIOS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4306', codigo: '4306', rubrica: 'APORTE NOS INVESTIMENTOS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4307', codigo: '4307', rubrica: 'RESGATE DOS INVESTIMENTOS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4308', codigo: '4308', rubrica: 'SINDILER', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4309', codigo: '4309', rubrica: 'OUTROS CONTAS TRANSITÓRIAS', centro: 'CONTAS TRANSITÓRIAS', classificacao: 'NAO_OPERACIONAL' },

  // Societário (Distribuição Lucros)
  { id: 'c4101', codigo: '4101', rubrica: 'DISTRIBUIÇÃO DE LUCROS FÁBIO', centro: 'SOCIETÁRIO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4102', codigo: '4102', rubrica: 'DISTRIBUIÇÃO DE LUCROS LÍVIA', centro: 'SOCIETÁRIO', classificacao: 'NAO_OPERACIONAL' },

  // Investimentos (Imobilizado)
  { id: 'c4201', codigo: '4201', rubrica: 'IMÓVEIS', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4202', codigo: '4202', rubrica: 'MÁQUINAS E EQUIPAMENTOS', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4203', codigo: '4203', rubrica: 'REFORMAS - OBRAS NOVAS', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4204', codigo: '4204', rubrica: 'MATERIAL', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4205', codigo: '4205', rubrica: 'MÃO DE OBRA', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4206', codigo: '4206', rubrica: 'MÓVEIS E UTENSÍLIOS', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4207', codigo: '4207', rubrica: 'UNIFORMES', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4208', codigo: '4208', rubrica: 'MATERIAIS PERSONALIZADOS', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
  { id: 'c4210', codigo: '4210', rubrica: 'OUTROS IMOBILIZADO', centro: 'IMOBILIZADO', classificacao: 'NAO_OPERACIONAL' },
];

export const LEILOES: Leilao[] = [
  // 2023
  { id: 'l_2023_01', nome: 'VENDA DIRETA RZ NUNCA MÁS DA CARAPUÇA - 2023', data: '2023-01-10', categoria_id: 'cat_equinos', unidade_id: 'u2' },
  { id: 'l_2023_02', nome: 'REMATE COMEMORATIVO 6 ANOS BRUNO MEDIEROS - 2023', data: '2023-01-19', categoria_id: 'cat_bovinos', unidade_id: 'u2' },

  // 2024
  { id: 'l_2024_15', nome: 'LEILÃO VIRTUAL NELORE CEBOLA - 2024', data: '2024-03-15', categoria_id: 'cat_bovinos', unidade_id: 'u3' },
  { id: 'l_2024_19', nome: 'LEILÃO VIRTUAL HARAS YURI - 2024', data: '2024-04-19', categoria_id: 'cat_equinos', unidade_id: 'u2' },
  { id: 'l_2024_22', nome: 'LEILÃO VIRTUAL SEMENTES E VENTRES DO FUTURO - 2024', data: '2024-06-24', categoria_id: 'cat_bovinos', unidade_id: 'u3' },

  // 2025
  { id: 'l_2025_29', nome: 'LEILÃO REVOLUTION - 2025', data: '2025-03-20', categoria_id: 'cat_equinos', unidade_id: 'u1' },
  { id: 'l_2025_132', nome: 'LEILÃO TUPAMBAÉ - 2025', data: '2025-12-08', categoria_id: 'cat_equinos', unidade_id: 'u2' },
];

// Re-mapping mock transactions to new category IDs and new Leilao IDs to avoid errors
// Using "LEILÃO REVOLUTION - 2025" (l_2025_29) as the active example for mocks
const ACTIVE_MOCK_LEILAO_ID = 'l_2025_29'; 

export const MOCK_LANCAMENTOS: Lancamento[] = [
  // Jan
  { id: 't1', data_pagamento: '2024-01-10', data_competencia: '2024-01-10', descricao: 'Comissões Leilão Jan', valor: 1500000, tipo: 'receita', status: 'aprovado', conciliado: true, categoria_id: 'c1002', banco_id: 'b1', fornecedor: 'Clientes Diversos' },
  { id: 't2', data_pagamento: '2024-01-15', data_competencia: '2023-12-15', descricao: 'Energia Sede', valor: 45000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3203', banco_id: 'b1', fornecedor: 'CEMIG' },
  // Feb
  { id: 't3', data_pagamento: '2024-02-05', data_competencia: '2024-01-05', descricao: 'Salários Jan', valor: 850000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3101', banco_id: 'b2', fornecedor: 'Folha Pagamento' },
  { id: 't4', data_pagamento: '2024-02-12', data_competencia: '2024-01-12', descricao: 'Publicidade TV', valor: 200000, tipo: 'despesa', status: 'pendente', conciliado: false, categoria_id: 'c3310', banco_id: 'b1', leilao_id: 'l_2024_15', fornecedor: 'Canal Rural' },
  // Mar
  { id: 't5', data_pagamento: '2024-03-16', data_competencia: '2024-03-16', descricao: 'Comissões Leilão', valor: 1717302, tipo: 'receita', status: 'aprovado', conciliado: false, categoria_id: 'c1001', banco_id: 'b1', leilao_id: 'l_2024_15', fornecedor: 'Compradores L1' },
  { id: 't6', data_pagamento: '2024-03-14', data_competencia: '2024-03-14', descricao: 'Aluguel Recinto Leilão', valor: 150000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c2104', banco_id: 'b2', leilao_id: 'l_2024_15', fornecedor: 'Parque Exposições' },
  { id: 't6-1', data_pagamento: '2024-03-20', data_competencia: '2024-03-20', descricao: 'Reembolso Despesas Viagem', valor: 126902, tipo: 'receita', status: 'aprovado', conciliado: true, categoria_id: 'c1008', banco_id: 'b1', fornecedor: 'Funcionário X' },
  { id: 't6-2', data_pagamento: '2024-03-25', data_competencia: '2024-03-25', descricao: 'Serviços de TI', valor: 35000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3311', banco_id: 'b2', fornecedor: 'Tech Solutions' },
  // Apr
  { id: 't7', data_pagamento: '2024-04-10', data_competencia: '2024-03-10', descricao: 'Honorários Contábeis', valor: 75000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3301', banco_id: 'b1', fornecedor: 'Contabilidade XYZ' },
  { id: 't8', data_pagamento: '2024-04-20', data_competencia: '2024-04-20', descricao: 'Comissão Leilão de Abril', valor: 2200000, tipo: 'receita', status: 'aprovado', conciliado: false, categoria_id: 'c1002', banco_id: 'b2', leilao_id: 'l_2024_19', fornecedor: 'Clientes Leilão de Abril' },
  { id: 't8-1', data_pagamento: '2024-04-22', data_competencia: '2024-04-22', descricao: 'Transmissão Leilão Abril', valor: 250000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c2101', banco_id: 'b2', leilao_id: 'l_2024_19', fornecedor: 'Canal Rural' },
  // May
  { id: 't9', data_pagamento: '2024-05-05', data_competencia: '2024-04-05', descricao: 'Salários Abril', valor: 860000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3101', banco_id: 'b2', fornecedor: 'Folha Pagamento' },
  { id: 't10', data_pagamento: '2024-05-15', data_competencia: '2024-05-15', descricao: 'Aluguel Escritório', valor: 120000, tipo: 'despesa', status: 'aprovado', conciliado: false, categoria_id: 'c3201', banco_id: 'b1', fornecedor: 'Imobiliária Central' },
  { id: 't10-1', data_pagamento: '2024-05-25', data_competencia: '2024-05-25', descricao: 'Receita Não Identificada', valor: 50000, tipo: 'receita', status: 'aprovado', conciliado: true, categoria_id: 'c1010', banco_id: 'b1', fornecedor: 'Depósito Anônimo' },
  // Jun
  { id: 't11', data_pagamento: '2024-06-25', data_competencia: '2024-06-25', descricao: 'Entrada Leilão de Junho', valor: 500000, tipo: 'receita', status: 'pendente', conciliado: false, categoria_id: 'c1003', banco_id: 'b1', leilao_id: 'l_2024_22', fornecedor: 'Clientes Leilão de Junho' },
  { id: 't12', data_pagamento: '2024-06-18', data_competencia: '2024-06-18', descricao: 'Hospedagem Equipe Leilão', valor: 65000, tipo: 'despesa', status: 'aprovado', conciliado: false, categoria_id: 'c2001', banco_id: 'b2', leilao_id: 'l_2024_22', fornecedor: 'Hotelaria São Jorge' },
  { id: 't12-1', data_pagamento: '2024-06-28', data_competencia: '2024-06-28', descricao: 'Comissão de Vendas (Junho)', valor: 1800000, tipo: 'receita', status: 'aprovado', conciliado: false, categoria_id: 'c1012', banco_id: 'b1', fornecedor: 'Vendedores Parceiros' },
  // Jul
  { id: 't13', data_pagamento: '2024-07-01', data_competencia: '2024-07-01', descricao: 'Comissão Cliente Z (devolvido)', valor: 300000, tipo: 'receita', status: 'rejeitado', motivo_rejeicao: 'Cliente cancelou a compra', conciliado: false, categoria_id: 'c1001', banco_id: 'b1', fornecedor: 'Cliente Z' },
  { id: 't13-1', data_pagamento: '2024-07-10', data_competencia: '2024-06-10', descricao: 'Internet Fibra', valor: 15000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3207', banco_id: 'b1', fornecedor: 'Provedor Local' },
  { id: 't13-2', data_pagamento: '2024-07-20', data_competencia: '2024-07-20', descricao: 'Recebimento Comissão Antiga', valor: 750000, tipo: 'receita', status: 'aprovado', conciliado: true, categoria_id: 'c1007', banco_id: 'b2', fornecedor: 'Cliente Antigo' },
  
  // 2025 Data
  { id: 't14', data_pagamento: '2025-03-20', data_competencia: '2025-03-20', descricao: 'Comissão LEILÃO REVOLUTION', valor: 5500000, tipo: 'receita', status: 'aprovado', conciliado: false, categoria_id: 'c1001', banco_id: 'b1', leilao_id: ACTIVE_MOCK_LEILAO_ID, fornecedor: 'Compradores Revolution' },
  { id: 't15', data_pagamento: '2025-04-10', data_competencia: '2025-04-10', descricao: 'Salários (Mar/25)', valor: 900000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3101', banco_id: 'b2', fornecedor: 'Folha Pagamento' },
  { id: 't16', data_pagamento: '2025-04-25', data_competencia: '2025-04-25', descricao: 'Marketing Digital', valor: 150000, tipo: 'despesa', status: 'aprovado', conciliado: false, categoria_id: 'c3306', banco_id: 'b1', fornecedor: 'Agência Digital' },
  { id: 't17', data_pagamento: '2025-05-15', data_competencia: '2025-05-15', descricao: 'Receita de Consultoria', valor: 2500000, tipo: 'receita', status: 'aprovado', conciliado: true, categoria_id: 'c1013', banco_id: 'b2', fornecedor: 'Cliente Consultoria' },
  { id: 't18', data_pagamento: '2025-06-05', data_competencia: '2025-06-05', descricao: 'Pagamento Simples Nacional', valor: 320000, tipo: 'despesa', status: 'aprovado', conciliado: true, categoria_id: 'c3001', banco_id: 'b1', fornecedor: 'Governo Federal' },
  { id: 't19', data_pagamento: '2025-07-20', data_competencia: '2025-07-20', descricao: 'Comissão Leilão Tupambaé', valor: 4800000, tipo: 'receita', status: 'pendente', conciliado: false, categoria_id: 'c1001', banco_id: 'b1', leilao_id: 'l_2025_132', fornecedor: 'Compradores Tupambaé' },
  { id: 't20', data_pagamento: '2025-07-22', data_competencia: '2025-07-22', descricao: 'Aluguel Carro Equipe', valor: 22000, tipo: 'despesa', status: 'aprovado', conciliado: false, categoria_id: 'c2011', banco_id: 'b2', leilao_id: 'l_2025_132', fornecedor: 'Localiza' },
];

export const MOCK_PREVISOES: Previsao[] = [
    {
        id: 'p1',
        nome_cenario: 'Cenário Otimista - Revolution 2025',
        leilao_id: ACTIVE_MOCK_LEILAO_ID,
        data_criacao: '2024-10-15',
        itens: [
            { id: 'pi1', categoria_id: 'c1001', rubrica: 'Comissões de Venda', valor: 4000000, tipo: 'receita', fornecedor: '' }, 
            { id: 'pi2', categoria_id: 'c2104', rubrica: 'Aluguel de Recinto', valor: 150000, tipo: 'despesa', fornecedor: 'Parque Exposições' }, 
            { id: 'pi3', categoria_id: 'c2101', rubrica: 'Transmissão', valor: 180000, tipo: 'despesa', fornecedor: 'Canal Rural' }, 
        ]
    }
];
