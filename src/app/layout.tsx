import "./globals.css";
export const metadata = { title: "SIRA Platform", description: "Enterprise-ready modular business platform", manifest: "/manifest.webmanifest" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="sq"><body>{children}</body></html>;
}
