import Image from "next/image";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main className="loginPage">
    <section className="loginPanel">
      <div className="loginBrand"><Image src="/sira-logo-black.svg" alt="SIRA Solutions" width={560} height={180} unoptimized /><span>BUSINESS MANAGER</span></div>
      <div className="loginHeading"><small>MIRË SE VJEN</small><h1>Kyçu në SIRA</h1><p>Menaxho klientët, projektet, detyrat dhe faturat në një vend.</p></div>
      <LoginForm />
      <footer>© {new Date().getFullYear()} SIRA Solutions</footer>
    </section>
    <aside className="loginVisual"><div><span>SIRA WORKSPACE</span><h2>Puna jote.<br />E organizuar qartë.</h2><p>Një hapësirë private për menaxhimin e përditshëm të SIRA Solutions.</p><ul><li>Projektet dhe fazat</li><li>Detyrat dhe koha</li><li>Klientët dhe faturimi</li></ul></div></aside>
  </main>;
}
