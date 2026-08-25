export interface ProductPackage {
  id: number;
  name: string;
  category: string;
  description: string | null;
  elements: string[];
  includes: string[];
  basePrice: number;
  vatRate: number;
  billingCycle: "ONE_TIME" | "MONTHLY" | "YEARLY";
  unitLabel: string;
  templateTasks: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  category: string;
  description?: string | null;
  elements?: string[];
  includes?: string[];
  basePrice: number;
  vatRate: number;
  billingCycle: "ONE_TIME" | "MONTHLY" | "YEARLY";
  unitLabel: string;
  templateTasks?: string[];
  active?: boolean;
}
