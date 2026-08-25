export type AccessCategory = "SERVER" | "HOSTING" | "DOMAIN" | "NETWORK" | "CLOUD" | "DATABASE" | "EMAIL" | "APPLICATION" | "SOCIAL" | "OTHER";
export type AccessScope = "PERSONAL" | "SIRA" | "CLIENT";
export type AccessStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type TwoFactorStatus = "ENABLED" | "DISABLED" | "UNKNOWN";
export type VaultProvider = "BITWARDEN" | "VAULTWARDEN" | "ONEPASSWORD" | "KEEPASS" | "OTHER";

export interface AccessRegistryEntry {
  id: number;
  clientId: number | null;
  clientName: string | null;
  name: string;
  category: AccessCategory;
  scope: AccessScope;
  provider: string | null;
  address: string | null;
  serviceUrl: string | null;
  username: string | null;
  vaultProvider: VaultProvider | null;
  vaultUrl: string | null;
  vaultReference: string | null;
  twoFactorStatus: TwoFactorStatus;
  renewalDate: string | null;
  notes: string | null;
  status: AccessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRegistryInput {
  clientId?: number | null;
  name: string;
  category: AccessCategory;
  scope: AccessScope;
  provider?: string | null;
  address?: string | null;
  serviceUrl?: string | null;
  username?: string | null;
  vaultProvider?: VaultProvider | null;
  vaultUrl?: string | null;
  vaultReference?: string | null;
  twoFactorStatus: TwoFactorStatus;
  renewalDate?: string | null;
  notes?: string | null;
  status: AccessStatus;
}

export interface AccessRegistryFilters {
  search?: string;
  category?: AccessCategory;
  scope?: AccessScope;
  status?: AccessStatus;
}
