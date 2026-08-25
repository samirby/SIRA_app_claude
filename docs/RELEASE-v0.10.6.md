# SIRA App v0.10.6

Ky version ndryshon krijimin automatik të strukturës së projektit.

## Ndryshimet

- Kur krijohet një projekt i ri, krijohen vetëm katër fazat bazë.
- Brenda fazave nuk krijohen më detyra automatike.
- Detyrat shtohen manualisht dhe lidhen me fazën e zgjedhur.
- Projektet dhe detyrat ekzistuese nuk ndryshohen ose fshihen.

## Instalimi

1. Krijo backup të aplikacionit dhe databazës.
2. Ekzekuto `database/migrations/019_project_phases_without_tasks.sql`.
3. Ngarko skedarët e versionit dhe bëj restart/redeploy.
4. Nëse përdoret `APP_VERSION`, vendose në `0.10.6`.

## Testimi

1. Krijo një projekt të ri me opsionin e katër fazave aktiv.
2. Hape projektin; duhet të shfaqen katër faza me progres 0%.
3. Faza e zgjedhur duhet të jetë pa detyra.
4. Shto vetë një detyrë dhe caktoja fazën përkatëse.
