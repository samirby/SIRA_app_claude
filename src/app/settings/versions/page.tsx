import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { APP_VERSION } from "@/core/version";
import { getApplicationReleases } from "@/modules/releases/release.service";
import type { ReleaseChangeType } from "@/modules/releases/release.types";

export const dynamic = "force-dynamic";

const changeLabels: Record<ReleaseChangeType, string> = {
  FEATURE: "Funksion i ri",
  IMPROVEMENT: "Përmirësim",
  FIX: "Rregullim",
  SECURITY: "Siguri",
  DATABASE: "Databazë",
};

function formatInstalledAt(value: string) {
  return new Intl.DateTimeFormat("sq-AL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Vienna",
  }).format(new Date(value));
}

export default async function VersionHistoryPage() {
  const releases = await getApplicationReleases();
  const current = releases.find((release) => release.version === APP_VERSION) ?? releases[0];
  const totalChanges = releases.reduce((sum, release) => sum + release.changes.length, 0);

  return (
    <AppShell
      title="Historiku i versioneve"
      subtitle="Shiko versionet e instaluara dhe çfarë ka ndryshuar në secilin version."
      action={<Link href="/settings" className="secondaryButton">← Kthehu te Settings</Link>}
    >
      <section className="releaseHistorySummary">
        <article className="releaseCurrentCard">
          <div>
            <small>VERSIONI AKTUAL</small>
            <strong>SIRA APP v{APP_VERSION}</strong>
            <span>{current?.title ?? "Versioni aktiv i platformës"}</span>
          </div>
          <i>Aktual</i>
        </article>
        <article>
          <small>Versione të regjistruara</small>
          <strong>{releases.length}</strong>
          <span>Historiku fillon nga v0.10.1</span>
        </article>
        <article>
          <small>Ndryshime të dokumentuara</small>
          <strong>{totalChanges}</strong>
          <span>Funksione, rregullime dhe databazë</span>
        </article>
      </section>

      <section className="releaseHistoryPanel">
        <div className="releaseHistoryHeading">
          <div>
            <span>RELEASE NOTES</span>
            <h2>Versionet e instaluara</h2>
            <p>Çdo SQL i një versioni të ardhshëm do ta shtojë automatikisht versionin dhe përshkrimin e tij këtu.</p>
          </div>
        </div>

        {releases.length ? (
          <div className="releaseTimeline">
            {releases.map((release) => {
              const isCurrent = release.version === APP_VERSION;
              return (
                <article className={`releaseEntry ${isCurrent ? "current" : ""}`} key={release.id}>
                  <div className="releaseTimelineMark" aria-hidden="true"><span /></div>
                  <div className="releaseEntryBody">
                    <header>
                      <div>
                        <div className="releaseVersionLine">
                          <strong>SIRA APP v{release.version}</strong>
                          <span className={isCurrent ? "current" : "installed"}>{isCurrent ? "Aktual" : "Instaluar"}</span>
                          <span className="channel">{release.channel}</span>
                        </div>
                        <h3>{release.title}</h3>
                      </div>
                      <time dateTime={release.installedAt}>{formatInstalledAt(release.installedAt)}</time>
                    </header>
                    <p>{release.summary}</p>
                    <div className="releaseChanges">
                      {release.changes.map((change) => (
                        <div key={change.id}>
                          <span className={`releaseChangeType ${change.type.toLowerCase()}`}>{changeLabels[change.type]}</span>
                          <strong>{change.description}</strong>
                        </div>
                      ))}
                    </div>
                    {release.migrationName ? <footer>SQL: <code>{release.migrationName}</code></footer> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="settingsEmptyState">Nuk ka ende versione të regjistruara.</div>
        )}
      </section>
    </AppShell>
  );
}
