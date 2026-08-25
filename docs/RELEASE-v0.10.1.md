# SIRA APP v0.10.1

## Historiku i versioneve

- Versioni në shiritin e sipërm tani hap faqen `Settings → Historiku i versioneve`.
- Faqja shfaq versionet e instaluara, datën e instalimit, kanalin dhe ndryshimet e dokumentuara.
- Ndryshimet ndahen në funksione të reja, përmirësime, rregullime, siguri dhe databazë.
- Historiku fillon me v0.10.1; çdo migrim i ardhshëm do ta regjistrojë versionin e vet.
- Migrimi i Qasjeve & Kasafortës nuk provon më të shkruajë në tabelën opsionale `platform_capabilities`.

## Database update

Back up the database, then import `database/migrations/014_release_history.sql` exactly once before deploying the application files. The migration is safe to import again because version and change rows use unique keys.
