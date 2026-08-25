import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { APP_VERSION, RELEASE_CHANNEL } from "@/core/version";

const essentials = [
  ["Database", "Connected foundation", "Connect", "/settings"],
  ["Backups", "Daily strategy ready", "View", "/settings"],
  ["Runtime logs", "Monitor processes and issues", "Open", "/settings"],
  ["Cache", "Clear latest changes when needed", "Manage", "/settings"],
];

const platformCards = [
  ["Build", "Next.js", "Modern application foundation"],
  ["Version", `v${APP_VERSION}`, "Current SIRA Platform release"],
  ["Environment", RELEASE_CHANNEL, "0.x remains active until the core modules are ready"],
];

export default function AdminDashboardPage() {
  return (
    <AppShell
      title="Admin Dashboard"
      subtitle="Platform status, technical readiness, deployment and system overview."
      action={<span className="dashboardDevelopmentBadge">Platform overview</span>}
    >
      <section className="siteHeaderCard">
        <div className="siteIdentity">
          <div className="siteIcon">S</div>
          <div>
            <strong>SIRA Platform</strong>
            <small>Created for scalable business, platform and AI ecosystem management.</small>
          </div>
        </div>
        <div className="siteHeaderActions">
          <Link href="/settings" className="secondaryButton">Open Settings</Link>
          <Link href="/settings/modules" className="primaryButton">Go to Modules</Link>
        </div>
      </section>

      <section className="statusStrip">
        <article><span className="statusGoodDot" /> Running</article>
        <article><span className="statusGoodDot" /> Architecture protected</article>
        <article><span className="statusGoodDot" /> Responsive foundation</article>
      </section>

      <section className="deploymentSummary">
        <div className="summaryLeft">
          <h3>Current platform release</h3>
          <div className="summaryBadge">Active</div>
        </div>
        <div className="deploymentGrid">
          <div className="deploymentItem"><small>State</small><strong className="successText">Completed</strong></div>
          <div className="deploymentItem"><small>Framework</small><strong>Next.js</strong></div>
          <div className="deploymentItem"><small>Node version</small><strong>22.x</strong></div>
          <div className="deploymentItem"><small>Build settings</small><strong>Default</strong></div>
          <div className="deploymentItem"><small>Root directory</small><strong>./</strong></div>
          <div className="deploymentItem"><small>Version</small><strong>v{APP_VERSION}</strong></div>
        </div>
      </section>

      <section className="hostGrid">
        <article className="hostCard">
          <div className="cardTitleRow"><h3>Essentials</h3></div>
          <div className="essentialsList">
            {essentials.map(([title, desc, action, href]) => (
              <div className="essentialsItem" key={title}>
                <div className="essentialsIcon">◫</div>
                <div className="essentialsText"><strong>{title}</strong><small>{desc}</small></div>
                <Link href={href} className="smallActionButton">{action}</Link>
              </div>
            ))}
          </div>
        </article>

        <article className="hostCard">
          <div className="cardTitleRow"><h3>Performance</h3><span className="secondaryButton compact">System view</span></div>
          <div className="performancePanel">
            <div className="scoreRing">99</div>
            <div className="performanceInfo"><strong>Desktop</strong><small>Design optimized for a clean and structured user experience.</small></div>
            <div className="mobileScore"><div className="emptyRing">○</div><div><strong>Mobile</strong><small>Responsive foundation active</small></div></div>
          </div>
        </article>
      </section>

      <section className="hostGrid lowerHostGrid">
        <article className="hostCard">
          <div className="cardTitleRow"><h3>Platform resources</h3><Link href="/settings/modules" className="secondaryButton compact">See details</Link></div>
          <div className="resourceUsage">
            <div className="resourceCircle">◎</div>
            <div className="resourceStats">
              <div><small>Database</small><strong>MySQL foundation</strong></div>
              <div><small>Modules</small><strong>Registry active</strong></div>
              <div><small>Applications</small><strong>Business Manager · Platform Hub</strong></div>
            </div>
          </div>
        </article>

        <article className="hostCard">
          <div className="cardTitleRow"><h3>Platform readiness</h3></div>
          <div className="miniCards">
            {platformCards.map(([title, value, desc]) => (
              <div className="miniCard" key={title}><small>{title}</small><strong>{value}</strong><span>{desc}</span></div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
