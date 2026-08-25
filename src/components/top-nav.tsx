"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/core/version";

const businessItems = [
  ["Dashboard", "/"],
  ["Klientët", "/clients"],
  ["Projektet", "/projects"],
  ["Detyrat", "/tasks"],
  ["Ticketat", "/tickets"],
  ["Produktet", "/products"],
  ["Faturat", "/invoices"],
  ["Kontratat", "/contracts"],
  ["Financat", "/finance"],
];

const platformItems = [
  ["Qasjet & Kasaforta", "/accesses"],
  ["Platform Hub", "/platforms"],
  ["SIRA AI", "/ai"],
  ["App Studio", "/studio"],
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<"GLOBAL_ADMIN" | "WORKER" | null>(null);
  useEffect(() => { void fetch("/api/v1/auth/me", { cache: "no-store" }).then((response) => response.json()).then((result) => { if (result.ok) setRole(result.data.role); }).catch(() => undefined); }, []);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/v1/auth/logout", { method: "POST" }); }
    finally { window.location.assign("/login"); }
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="topNav">
      <div className="utilityBar">
        <div className="utilityBarInner">
          <div className="rightArea">
            <button className="topSearch" aria-label="Search">Search</button>
            <button className="iconButton" aria-label="Search" title="Search">⌕</button>
            {role === "GLOBAL_ADMIN" && <Link
              href="/admin"
              className={`iconButton adminDashboardButton ${pathname === "/admin" ? "active" : ""}`}
              aria-label="Admin Dashboard"
              title="Admin Dashboard"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </Link>}
            {role === "GLOBAL_ADMIN" && <Link href="/portal-preview" className={`clientPortalTopButton ${pathname.startsWith("/portal-preview") ? "active" : ""}`} aria-label="Client Portal" title="Client Portal">Client Portal</Link>}
            {role === "GLOBAL_ADMIN" && <Link href="/settings" className="iconButton" aria-label="Settings" title="Settings">⚙</Link>}
            {role === "GLOBAL_ADMIN" && <Link href="/settings/versions" className="versionBadge" title="Historiku i versioneve">
              SIRA APP v{APP_VERSION}
            </Link>}
            <div className="avatar">SB</div>
            <button className="logoutButton" disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? "..." : "Dil"}</button>
            <button
              className="mobileMenuButton"
              aria-label="Menu"
              onClick={() => setOpen((value) => !value)}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="mainMenuBar">
        <div className="mainMenuInner">
          <Link href="/" className="brandArea" aria-label="SIRA Solutions">
            <Image
              className="siraWordmark"
              src="/sira-logo-black.svg"
              alt="SIRA Solutions"
              width={560}
              height={180}
              unoptimized
              priority
            />
          </Link>

          <nav className="desktopNav" aria-label="Main navigation">
            {businessItems.filter(([,href]) => role === "GLOBAL_ADMIN" || ["/","/clients","/projects","/tasks","/tickets"].includes(href)).map(([label, href]) => (
              <Link key={href} href={href} className={isActive(href) ? "active" : ""}>
                {label}
              </Link>
            ))}

            {role === "GLOBAL_ADMIN" && <details className="moreMenu">
              <summary>Më shumë</summary>
              <div className="dropdown">
                {platformItems.map(([label, href]) => (
                  <Link key={href} href={href}>{label}</Link>
                ))}
              </div>
            </details>}
          </nav>
        </div>
      </div>

      {open && (
        <div className="mobileNav">
          {(role === "GLOBAL_ADMIN" ? [...businessItems, ["Admin Dashboard", "/admin"], ["Client Portal", "/portal-preview"], ...platformItems, ["Settings", "/settings"]] : businessItems.filter(([,href]) => ["/","/clients","/projects","/tasks","/tickets"].includes(href))).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
