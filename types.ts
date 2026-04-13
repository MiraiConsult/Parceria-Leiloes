import { Json } from "./types/supabase";

export type Role = 'admin' | 'colaborador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  unidade_id?: string;
  permissions?: string[];
}

export interface Unidade {
  id: string;
  nome: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
}

export interface LeilaoCategoria {
  id: string;
  nome: string;
}

export interface Banco {
  id: string;
  nome: string;
  codigo: string;
  saldo_inicial: number; // in cents
  saldo_inicial_data?: string; // ISO date string (YYYY-MM-DD) - date of the initial balance
}

// New Interface for "Centro" (Column B of PDF)
export interface CentroCusto {
  id: string;
  nome: string;
}

export interface Categoria {
  id: string;
  codigo: string;
  rubrica: string;
  centro: string; // Refers to CentroCusto.nome (keeping string for easier display, or could be ID)
  classificacao: 'RECEITA' | 'CUSTO_VARIAVEL' | 'DESPESA_FIXA' | 'NAO_OPERACIONAL'; // Behavioral mapping for DRE
}

export interface Leilao {
  id: string;
  nome: string;
  data: string;
  categoria_id: string; // Refers to LeilaoCategoria
  unidade_id: string;
}

export interface Lancamento {
  id: string;
  data_pagamento: string; // Vencimento (Caixa)
  data_competencia: string; // Competência (DRE)
  descricao: string;
  valor: number; // in cents
  tipo: 'receita' | 'despesa';
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivo_rejeicao?: string;
  conciliado: boolean;
  categoria_id: string; // Refers to Plano de Contas
  banco_id: string;
  leilao_id?: string;
  fornecedor: string; // Keeping simple string for display, but ideally links to Fornecedor ID
  fornecedor_id?: string;
  unidade_id?: string;
  created_by?: string;
  approved_by?: string;
  split_revenue?: Json | null; // For splitting one revenue into multiple types
}

export interface PrevisaoItem {
  id: string;
  categoria_id: string;
  rubrica: string; // Custom description or override
  valor: number;
  tipo: 'receita' | 'despesa';
  fornecedor: string; // Free text field now
}

export interface Previsao {
  id: string;
  nome_cenario: string; // Name of the simulation scenario
  leilao_id: string;
  data_criacao: string;
  itens: PrevisaoItem[];
}

export interface UnvalidatedTransaction {
  id: string; // A temporary client-side ID for React keys
  rowData: Record<string, unknown>; // The original row from XLSX
  errors: string[];
}

export interface TransactionFilters {
  filter: string;
  statusFilter: 'all' | 'pendente' | 'aprovado' | 'rejeitado';
  startDate: string;
  endDate: string;
  leilaoFilter: Set<string>;
  unidadeFilter: Set<string>;
  rubricaFilter: Set<string>;
  currentPage: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}