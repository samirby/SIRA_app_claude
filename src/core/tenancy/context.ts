export interface OrganizationContext {
  organizationId: number;
  organizationSlug: string;
}

export function getOrganizationContext(): OrganizationContext {
  return {
    organizationId: 1,
    organizationSlug: process.env.DEFAULT_ORGANIZATION_SLUG || "sira-solutions"
  };
}
