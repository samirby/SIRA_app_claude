export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  companyName: string | null;
  clientType: "BUSINESS" | "PRIVATE";
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  taxNumber: string | null;
  website: string | null;
  notes: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  companyName?: string | null;
  clientType?: "BUSINESS" | "PRIVATE";
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  taxNumber?: string | null;
  website?: string | null;
  notes?: string | null;
}
