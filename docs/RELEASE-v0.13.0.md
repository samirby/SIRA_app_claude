# SIRA App v0.13.0

## Dashboard, Produktet dhe Kontratat

Ky version sjell një refresh të Dashboard-it dhe aktivizon dy pjesë të rëndësishme të menaxhimit të biznesit.

### Ndryshimet
- Dashboard clean/compact me kartat kryesore, Tickets strip, projektet aktive, detyrat dhe kontratat që skadojnë.
- Produktet & Shërbimet me kategori, elemente, çka përmban, çmim, TVSH, cikël dhe njësi.
- Editim dhe arkivim/aktivizim i produkteve.
- Kontratat & Abonimet me pronar Klient/SIRA Solutions, furnitor, referencë, afate, çmim, cikël, reminder dhe auto-renew.
- Editim dhe fshirje e kontratave.
- Kontratat që skadojnë shfaqen në Dashboard.
- Release Notes me tipografi më të lexueshme dhe layout compact.

### Instalimi
1. Bëj backup të databazës dhe të versionit aktual.
2. Importo `SIRA-APP-v0.13.0-database.sql` në databazën ekzistuese.
3. Ngarko file-at e versionit të ri.
4. Vendos `APP_VERSION=0.13.0` në `.env`.
5. Ekzekuto `npm install`, `npm run build` dhe rinis aplikacionin.
