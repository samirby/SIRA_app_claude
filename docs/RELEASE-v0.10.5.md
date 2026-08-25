# SIRA App v0.10.5

Ky version e thjeshton funksionin **Projektet** dhe shton fshirjen e sigurt të një projekti.

## Ndryshimet

- Lista e projekteve ka pesë kolona: Projekti, Klienti, Progresi, Afati dhe Veprimet.
- Veprimet janë grupuar në menynë me tri pika.
- Detajet e projektit fokusohen në tri seksione: Puna, Dokumentet dhe Detajet.
- Një projekt pa faturë mund të fshihet pas konfirmimit.
- Fshirja është logjike (`deleted_at`), prandaj klienti dhe historiku nuk humbin.
- Projekti i lidhur me faturë nuk lejohet të fshihet.

## Instalimi

1. Krijo backup të aplikacionit dhe databazës.
2. Ekzekuto `database/migrations/018_project_simplification_delete.sql` në databazën e SIRA-s.
3. Ngarko skedarët e versionit dhe bëj restart/redeploy të aplikacionit.
4. Nëse përdoret variabla `APP_VERSION`, vendose në `0.10.5`.

## Testimi

1. Hape **Projektet** dhe kontrollo tabelën e thjeshtuar.
2. Hape menynë `⋮` të një projekti testues pa faturë.
3. Zgjidh **Fshi**, pastaj konfirmo.
4. Projekti duhet të largohet menjëherë nga lista.
5. Provo një projekt të lidhur me faturë; aplikacioni duhet ta refuzojë fshirjen.
