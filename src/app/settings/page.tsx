"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { APP_VERSION, RELEASE_CHANNEL } from "@/core/version";
import { TaskLabelSettings } from "./task-label-settings";

const sections = [

  {
    id: "task-labels",
    title: "Labels e detyrave",
    description: "Krijo kategoritë e punës dhe cakto ngjyrën që shfaqet në kartat e detyrave.",
    items: [
      "Krijimi i kategorive të punës",
      "Ngjyra individuale për çdo label",
      "Caktimi i label-it në detyra"
    ]
  },

  {
    id: "platform-hub",
    title: "Platform Hub & Connected Platforms",
    description: "Qendra për regjistrimin, monitorimin dhe menaxhimin e platformave të tjera të SIRA-s.",
    items: [
      "Central platform registry",
      "Connected applications",
      "Smart Xhamia integration",
      "Future company platforms",
      "Platform health monitoring",
      "API availability monitoring",
      "Database health status",
      "Version and release tracking",
      "Deployment history",
      "Backup status",
      "Storage usage",
      "Active user metrics",
      "Error and warning monitoring",
      "Module status per platform",
      "Maintenance mode control",
      "Remote configuration readiness",
      "Service accounts and API authentication",
      "Encrypted secret references",
      "Cross-platform audit logs",
      "Platform-specific permissions",
      "Multi-environment support",
      "Production, staging and development views",
      "Alerting and notifications",
      "Rollback and recovery readiness"
    ]
  },
  {
    id: "core",
    title: "Core Platform",
    description: "Themelet që mbajnë gjithë platformën.",
    items: [
      "Organizations & multi-company",
      "Users, teams and departments",
      "Roles, permissions and data scopes",
      "Settings and configuration",
      "Audit logs and change history",
      "Feature flags and module catalog",
      "API versioning",
      "Environment and secret management"
    ]
  },
  {
    id: "modules",
    title: "Modules & Add-ons",
    description: "Modulet kryesore dhe funksionet shtesë të aktivizueshme.",
    items: [
      "Clients",
      "Projects",
      "Tasks",
      "Products & Services",
      "Contracts",
      "Invoices",
      "Finance",
      "Tickets",
      "Documents",
      "Calendar",
      "Reports",
      "Client Portal",
      "Per-module add-ons",
      "Dependencies between modules",
      "Organization-specific activation"
    ]
  },
  {
    id: "automation",
    title: "Events, Jobs & Automation",
    description: "Proceset automatike dhe komunikimi ndërmjet moduleve.",
    items: [
      "Event system",
      "Background jobs",
      "Retry and failure handling",
      "Workflow engine",
      "Triggers, conditions and actions",
      "Approval workflows",
      "Recurring jobs",
      "Scheduled reminders"
    ]
  },
  {
    id: "ai",
    title: "AI & Intelligence",
    description: "Infrastruktura për ChatGPT dhe providerë të tjerë AI.",
    items: [
      "SIRA AI Chat",
      "AI provider abstraction",
      "OpenAI integration",
      "AI tools and actions",
      "Prompt registry",
      "Knowledge base",
      "Document analysis",
      "AI permissions",
      "Usage and cost limits",
      "Human confirmation for sensitive actions",
      "AI audit and data policy"
    ]
  },
  {
    id: "channels",
    title: "Web, PWA, Desktop & Mobile",
    description: "Qasje nga pajisje dhe platforma të ndryshme.",
    items: [
      "Web application",
      "Progressive Web App foundation",
      "Installable on Windows and mobile",
      "Desktop application readiness",
      "Mobile application readiness",
      "Shared API client",
      "Offline-capable foundation",
      "Push notification readiness",
      "Cross-platform authentication"
    ]
  },
  {
    id: "polyglot",
    title: "Polyglot & Service Integration",
    description: "Mundësi për shërbime në gjuhë të tjera programuese.",
    items: [
      "TypeScript / Node.js core",
      "Python services",
      ".NET services",
      "Java services",
      "Go services",
      "Rust services",
      "OpenAPI contracts",
      "JSON schemas",
      "Webhooks",
      "Message queues",
      "Service boundaries"
    ]
  },
  {
    id: "localization",
    title: "Languages & Localization",
    description: "Platformë shumëgjuhëshe që nga versioni 0.",
    items: [
      "Albanian (sq)",
      "German (de)",
      "English (en)",
      "User language",
      "Company default language",
      "Client language",
      "Localized email templates",
      "Localized PDF documents",
      "Date, time, number and currency formatting",
      "Fallback language rules"
    ]
  },
  {
    id: "integrations",
    title: "Integrations Hub",
    description: "Lidhje me sisteme dhe providerë të jashtëm.",
    items: [
      "SMTP",
      "Microsoft 365",
      "Gmail",
      "Calendars",
      "Payment providers",
      "Accounting software",
      "Cloud storage",
      "External APIs",
      "Webhooks",
      "Replaceable provider interfaces"
    ]
  },
  {
    id: "files",
    title: "Documents & File Service",
    description: "Menaxhim qendror i dokumenteve dhe attachments.",
    items: [
      "Upload and download",
      "Preview",
      "Versioning",
      "Metadata",
      "Permissions",
      "Virus scanning readiness",
      "Retention policies",
      "Local and object storage providers",
      "Document templates"
    ]
  },
  {
    id: "notifications",
    title: "Notifications & Communication",
    description: "Njoftime të centralizuara për të gjitha modulet.",
    items: [
      "In-app notifications",
      "Email notifications",
      "Push notifications",
      "Desktop notifications",
      "Mobile notifications",
      "SMS readiness",
      "Webhook notifications",
      "User notification preferences"
    ]
  },
  {
    id: "data",
    title: "Data Management",
    description: "Strukturë e sigurt për të dhënat dhe migrimet.",
    items: [
      "MySQL / MariaDB",
      "Versioned migrations",
      "Transactions",
      "Soft delete",
      "Tenant isolation",
      "Custom fields",
      "Tags and categories",
      "Import and export",
      "Migration center",
      "Duplicate detection",
      "Rollback strategy"
    ]
  },
  {
    id: "security",
    title: "Security & Compliance",
    description: "Kontrolle enterprise për siguri dhe privatësi.",
    items: [
      "MFA and passkey readiness",
      "Session management",
      "Device management",
      "Rate limiting",
      "Brute-force protection",
      "Encryption",
      "Secret management",
      "Security headers",
      "GDPR / DSGVO readiness",
      "Data retention",
      "Consent management",
      "SSO readiness",
      "Microsoft Entra ID readiness",
      "SAML / OIDC readiness"
    ]
  },
  {
    id: "operations",
    title: "Operations & Reliability",
    description: "Monitorim dhe rikuperim për përdorim profesional.",
    items: [
      "Health checks",
      "Structured logs",
      "Metrics",
      "Error tracking",
      "Performance monitoring",
      "Job monitoring",
      "Alerts",
      "Database backup",
      "File backup",
      "Restore tests",
      "Disaster recovery",
      "Retention policy"
    ]
  },
  {
    id: "commercial",
    title: "Plans, Licensing & Usage",
    description: "Bazë për SaaS dhe modele të ndryshme biznesi.",
    items: [
      "Basic plan",
      "Professional plan",
      "Enterprise plan",
      "Custom plan",
      "Module-based licensing",
      "Add-on licensing",
      "User seats",
      "Storage limits",
      "AI usage limits",
      "Email limits",
      "API request limits",
      "Trial periods",
      "Subscription readiness"
    ]
  },
  {
    id: "experience",
    title: "User Experience",
    description: "Përdorim i pastër, modern dhe ndërkombëtar.",
    items: [
      "Clean top navigation",
      "Responsive design",
      "Global search",
      "Command palette",
      "Accessibility",
      "Keyboard navigation",
      "Screen reader readiness",
      "Company branding",
      "Custom logo and colors",
      "Client portal branding"
    ]
  },
  {
    id: "quality",
    title: "Quality & Testing",
    description: "Standardet që çdo modul duhet t’i plotësojë.",
    items: [
      "Unit tests",
      "Integration tests",
      "API tests",
      "Permission tests",
      "Tenant isolation tests",
      "UI tests",
      "Migration tests",
      "Performance tests",
      "Security tests",
      "Module completion checklist"
    ]
  }
];

export default function SettingsPage() {
  const [openId, setOpenId] = useState<string>("task-labels");
  const [query, setQuery] = useState("");

  const activeSection = sections.find((section) => section.id === openId) ?? sections[0];

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeSection.items;
    return activeSection.items.filter((item) => item.toLowerCase().includes(normalized));
  }, [activeSection, query]);

  return (
    <AppShell
      title="Settings"
      subtitle="Menaxho konfigurimin, modulet dhe kapacitetet e SIRA Platform."
    >
      <section className="settingsHero">
        <div className="settingsHeroCopy">
          <span>PLATFORM SETTINGS</span>
          <h2>Konfigurimi qendror i platformës</h2>
          <p>
            Një hapësirë e vetme për arkitekturën, modulet, sigurinë,
            integrimet dhe opsionet e ardhshme të SIRA Platform.
          </p>
        </div>

        <div className="settingsReleaseCard">
          <div>
            <small>Versioni aktual</small>
            <strong>v{APP_VERSION}</strong>
          </div>
          <div className="settingsReleaseActions">
            <span>{RELEASE_CHANNEL}</span>
            <Link href="/settings/versions">Shiko ndryshimet →</Link>
          </div>
        </div>
      </section>

      <section className="settingsStats" aria-label="Platform summary">
        <article>
          <small>Arkitektura</small>
          <strong>Modular Monolith</strong>
          <span>Microservice-ready</span>
        </article>
        <article>
          <small>Modeli</small>
          <strong>Multi-company</strong>
          <span>Tenant-aware</span>
        </article>
        <article>
          <small>Kanale</small>
          <strong>Web · PWA · Mobile</strong>
          <span>Desktop-ready</span>
        </article>
        <article>
          <small>Gjuhët</small>
          <strong>SQ · DE · EN</strong>
          <span>E zgjerueshme</span>
        </article>
      </section>

      <Link href="/settings/users" className="settingsUsersLink"><span>♙</span><div><strong>Përdoruesit & Rolet</strong><small>Krijo Global Admin, Punëtor ose qasje për Klient.</small></div><b>Menaxho →</b></Link>

      <section className="settingsWorkspace">
        <aside className="settingsSidebar">
          <div className="settingsSidebarHeader">
            <div>
              <span>KATEGORITË</span>
              <strong>Platform Settings</strong>
            </div>
            <small>{sections.length}</small>
          </div>

          <nav aria-label="Settings categories">
            {sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className={openId === section.id ? "active" : ""}
                onClick={() => {
                  setOpenId(section.id);
                  setQuery("");
                }}
              >
                <span className="settingsNavIndex">{String(index + 1).padStart(2, "0")}</span>
                <span className="settingsNavText">
                  <strong>{section.title}</strong>
                  <small>{section.items.length} funksione</small>
                </span>
                <span className="settingsNavArrow">›</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="settingsContent">
          <div className="settingsContentHeader">
            <div>
              <span>PLATFORM AREA</span>
              <h3>{activeSection.title}</h3>
              <p>{activeSection.description}</p>
            </div>
            <div className="settingsCountBadge">{activeSection.items.length}</div>
          </div>

          {activeSection.id === "task-labels" ? <TaskLabelSettings /> : <>
            <label className="settingsSearch">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kërko në këtë kategori..."
                aria-label="Kërko në kategorinë aktive"
              />
            </label>

            <div className="settingsCapabilityGrid">
              {visibleItems.map((item) => (
                <article className="settingsCapabilityCard" key={item}>
                  <div className="settingsCapabilityIcon">✓</div>
                  <div>
                    <strong>{item}</strong>
                    <span>Foundation / Planned</span>
                  </div>
                </article>
              ))}
            </div>

            {visibleItems.length === 0 ? (
              <div className="settingsEmptyState">
                Nuk u gjet asnjë funksion për “{query}”.
              </div>
            ) : null}
          </>}
        </div>
      </section>

      <section className="settingsInfoNote">
        <div>i</div>
        <p>
          Kjo faqe shërben si konfigurim dhe roadmap teknik. Aktivizimi real i
          moduleve dhe add-ons do të menaxhohet gradualisht te
          <strong> Settings → Modules & Add-ons</strong>.
        </p>
      </section>
    </AppShell>
  );
}
