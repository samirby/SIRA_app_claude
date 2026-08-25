import { AppShell } from "@/components/app-shell";
import { capabilityRegistry } from "@/core/modules/registry";

export default function Page() {
  return (
    <AppShell
      title="Modules & Add-ons"
      subtitle="Katalogu i moduleve, add-ons, integrations dhe platformave."
    >
      <section className="moduleCatalog">
        {capabilityRegistry.map((item) => (
          <article className="moduleCatalogCard" key={item.code}>
            <div className="moduleCatalogHeader">
              <div>
                <small>{item.kind.toUpperCase()}</small>
                <h3>{item.code}</h3>
              </div>
              <span className={`capabilityStatus ${item.status}`}>{item.status}</span>
            </div>
            <p>{item.descriptionKey}</p>
            <div className="moduleMeta">
              <span>Version {item.version}</span>
              <span>{item.dependencies?.length ?? 0} dependencies</span>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
