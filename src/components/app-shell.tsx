import type { ReactNode } from "react";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  title,
  subtitle,
  action,
  hidePageHeader = false,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
  hidePageHeader?: boolean;
}) {
  return (
    <>
      <TopNav />
      <main className="shell">
        {!hidePageHeader ? (
          <>
            <div className="pageTopRow">
              <div className="breadcrumb">
                <span>Websites</span>
                <span>›</span>
                <span>SIRA Platform</span>
                <span>›</span>
                <strong>{title}</strong>
              </div>
            </div>

            <div className="pageHeader hostingerHeader">
              <div>
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              {action ? <div className="pageAction">{action}</div> : null}
            </div>
          </>
        ) : null}

        {children}
      </main>
    </>
  );
}
