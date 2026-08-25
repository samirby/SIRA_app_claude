# SIRA APP v0.10.3 — Projektet e thjeshtuara

- Moduli Projektet hapet direkt në formë liste.
- Formulari përfshin llojin e projektit.
- Opsioni për krijimin automatik të fazave dhe detyrave është aktiv automatikisht.
- Çdo projekt i ri krijon katër faza; faza e parë vendoset `Në punë`.
- Detyrat standarde lidhen automatikisht me fazën përkatëse.
- Brenda projektit klikohet faza dhe shfaqen vetëm detyrat e saj.

## Instalimi

1. Krijo backup të databazës.
2. Importo `database/migrations/016_project_templates.sql`.
3. Ngarko ZIP-in e v0.10.3 dhe bëj redeploy.
4. Vendose `APP_VERSION=0.10.3`, nëse kjo variabël ekziston.

Projektet ekzistuese marrin llojin `Website`, por nuk u shtohen faza ose detyra automatikisht. Gjenerimi zbatohet vetëm për projektet e reja.
