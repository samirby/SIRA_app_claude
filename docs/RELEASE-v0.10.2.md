# SIRA APP v0.10.2 — Project Dashboard Test

## Çfarë u shtua

- Përmbledhje operative me progresin, fazën aktuale, afatin dhe buxhetin.
- Pamje horizontale e fazave me progres sipas detyrave të lidhura.
- Listë e detyrave aktive dhe lidhje direkte te skeda Detyrat.
- Përmbledhje financiare dhe bllokuesit aktivë.
- Aktivitetet e fundit në Përmbledhje.
- Skedë e re `Aktiviteti` për shënime, vendime, probleme dhe kërkesa të klientit.

## Instalimi

1. Krijo backup të databazës.
2. Importo `database/migrations/015_project_operational_dashboard.sql`.
3. Ngarko ZIP-in e v0.10.2 në Hostinger dhe bëj redeploy.
4. Nëse përdoret `APP_VERSION`, vendose në `0.10.2`.
5. Hape një projekt ekzistues dhe testo katër skedat.

Migrimi regjistron vetëm versionin dhe ndryshimet; nuk ndryshon të dhënat e projekteve.
