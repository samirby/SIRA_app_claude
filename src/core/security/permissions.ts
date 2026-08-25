export const permissions = {
  settingsRead: "settings.read",
  settingsWrite: "settings.write",
  clientsRead: "clients.read",
  clientsWrite: "clients.write",
  projectsRead: "projects.read",
  projectsWrite: "projects.write",
  tasksRead: "tasks.read",
  tasksWrite: "tasks.write",
  financeRead: "finance.read",
  financeWrite: "finance.write",
  accessesRead: "accesses.read",
  accessesWrite: "accesses.write"
} as const;
export type Permission = typeof permissions[keyof typeof permissions];
