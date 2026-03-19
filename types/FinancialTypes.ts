export interface Auction {
  id: string;
  name: string;
  date: string; // ISO date string
}

export interface CostCenterAllocation {
  id: string;
  name: string;
  value: number;
}

export interface FinancialEntry {
  auctionId?: string;
  competenceDate: string; // ISO date string
  allocations: CostCenterAllocation[];
  installments: number;
}

export interface Installment {
  costCenterName: string;
  installmentNumber: number;
  value: number;
  dueDate: string; // ISO date string
}
