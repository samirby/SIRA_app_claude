# SIRA App v0.12.0

## Rolet

- **Global Admin** — qasje e plotë dhe menaxhim i përdoruesve.
- **Punëtor** — Dashboard, klientët, projektet, detyrat dhe ticketat.
- **Klient** — vetëm Client Portal me projektet e klientit të lidhur.

## Menaxhimi

Global Admin hap **Settings → Përdoruesit & Rolet** për të:

- krijuar përdorues;
- zgjedhur rolin;
- lidhur rolin Klient me një klient ekzistues;
- aktivizuar ose çaktivizuar qasjen;
- vendosur password të ri.

Password-et e përdoruesve të databazës ruhen vetëm si hash `scrypt` me salt individual. Administratori kryesor nga variablat ENV mbetet Global Admin rezervë.

## Instalimi

1. Ekzekuto `database/migrations/024_users_roles_client_portal.sql`.
2. Ngarko versionin e ri dhe vendos `APP_VERSION=0.12.0`.
3. Bëj redeploy/restart.
4. Kyçu përsëri me administratorin ekzistues.
