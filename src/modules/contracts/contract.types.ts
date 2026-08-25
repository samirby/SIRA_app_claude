export type ContractOwnerType = "CLIENT" | "COMPANY";
export type ContractStatus = "ACTIVE" | "INACTIVE" | "CANCELLED";
export type ContractCycle = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

export interface Contract {
  id: number;
  ownerType: ContractOwnerType;
  clientId: number | null;
  clientName: string | null;
  productId: number | null;
  productName: string | null;
  title: string;
  category: string;
  provider: string | null;
  reference: string | null;
  startDate: string;
  endDate: string | null;
  price: number;
  cycle: ContractCycle;
  reminderDays: number;
  cancellationNoticeDays: number;
  autoRenew: boolean;
  status: ContractStatus;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractInput {
  ownerType: ContractOwnerType;
  clientId?: number | null;
  productId?: number | null;
  title: string;
  category: string;
  provider?: string | null;
  reference?: string | null;
  startDate: string;
  endDate?: string | null;
  price: number;
  cycle: ContractCycle;
  reminderDays: number;
  cancellationNoticeDays: number;
  autoRenew: boolean;
  status: ContractStatus;
  description?: string | null;
  notes?: string | null;
}
