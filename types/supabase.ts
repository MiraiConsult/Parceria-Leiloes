export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bancos: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          saldo_inicial: number
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          saldo_inicial: number
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          saldo_inicial?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          centro: string
          classificacao: string
          codigo: string
          created_at: string
          id: string
          rubrica: string
        }
        Insert: {
          centro: string
          classificacao: string
          codigo: string
          created_at?: string
          id?: string
          rubrica: string
        }
        Update: {
          centro?: string
          classificacao?: string
          codigo?: string
          created_at?: string
          id?: string
          rubrica?: string
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      grupos_contabeis: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          approved_by: string | null
          banco_id: string
          categoria_id: string
          conciliado: boolean
          created_at: string
          created_by: string | null
          data_competencia: string
          data_pagamento: string
          descricao: string
          fornecedor: string
          fornecedor_id: string | null
          id: string
          leilao_id: string | null
          motivo_rejeicao: string | null
          split_revenue: Json | null
          status: string
          tipo: string
          unidade_id: string | null
          valor: number
        }
        Insert: {
          approved_by?: string | null
          banco_id: string
          categoria_id: string
          conciliado?: boolean
          created_at?: string
          created_by?: string | null
          data_competencia: string
          data_pagamento: string
          descricao: string
          fornecedor: string
          fornecedor_id?: string | null
          id?: string
          leilao_id?: string | null
          motivo_rejeicao?: string | null
          split_revenue?: Json | null
          status: string
          tipo: string
          unidade_id?: string | null
          valor: number
        }
        Update: {
          approved_by?: string | null
          banco_id?: string
          categoria_id?: string
          conciliado?: boolean
          created_at?: string
          created_by?: string | null
          data_competencia?: string
          data_pagamento?: string
          descricao?: string
          fornecedor?: string
          fornecedor_id?: string | null
          id?: string
          leilao_id?: string | null
          motivo_rejeicao?: string | null
          split_revenue?: Json | null
          status?: string
          tipo?: string
          unidade_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_leilao_id_fkey"
            columns: ["leilao_id"]
            isOneToOne: false
            referencedRelation: "leiloes"
            referencedColumns: ["id"]
          },
        ]
      }
      leilao_categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      leiloes: {
        Row: {
          categoria_id: string
          created_at: string
          data: string
          id: string
          nome: string
          unidade_id: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          data: string
          id?: string
          nome: string
          unidade_id: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          data?: string
          id?: string
          nome?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leiloes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "leilao_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leiloes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      previsoes: {
        Row: {
          created_at: string
          data_criacao: string
          id: string
          itens: Json
          leilao_id: string
          nome_cenario: string
        }
        Insert: {
          created_at?: string
          data_criacao: string
          id?: string
          itens: Json
          leilao_id: string
          nome_cenario: string
        }
        Update: {
          created_at?: string
          data_criacao?: string
          id?: string
          itens?: Json
          leilao_id?: string
          nome_cenario?: string
        }
        Relationships: [
          {
            foreignKeyName: "previsoes_leilao_id_fkey"
            columns: ["leilao_id"]
            isOneToOne: false
            referencedRelation: "leiloes"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          permissions: Json | null
          role: string
          unidade_id: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          permissions?: Json | null
          role: string
          unidade_id?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          permissions?: Json | null
          role?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never