export interface WorkflowDefinition {
  code: string;
  name: string;
  trigger: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: unknown;
}

export interface WorkflowAction {
  type: string;
  configuration: Record<string, unknown>;
  requiresApproval?: boolean;
}
