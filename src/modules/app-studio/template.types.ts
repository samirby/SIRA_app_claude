export interface PlatformTemplate {
  code: string;
  name: string;
  description: string;
  defaultModules: string[];
  supportedLocales: string[];
}

export const platformTemplates: PlatformTemplate[] = [
  {
    code: "blank-business-app",
    name: "Blank Business App",
    description: "Minimal enterprise-ready platform.",
    defaultModules: ["clients", "projects", "tasks"],
    supportedLocales: ["sq", "de", "en"]
  },
  {
    code: "smart-xhamia",
    name: "Smart Xhamia",
    description: "Mosque management platform.",
    defaultModules: ["members", "payments", "school", "finance"],
    supportedLocales: ["sq", "de", "en"]
  },
  {
    code: "social-media-manager",
    name: "SIRA Social Media Manager",
    description: "Content, approvals, publishing and analytics.",
    defaultModules: ["clients", "social.accounts", "content.calendar", "publishing", "analytics"],
    supportedLocales: ["sq", "de", "en"]
  }
];
