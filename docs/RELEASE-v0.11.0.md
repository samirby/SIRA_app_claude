# SIRA App v0.11.0

## Login-i

- Login me email dhe password për një administrator.
- Session i nënshkruar në cookie `HttpOnly`.
- Mbrojtje e faqeve dhe API-ve.
- Opsioni **Më mbaj të kyçur**.
- Shfaqje/fshehje e password-it.
- Kufizim pas pesë tentativave të pasakta.
- Logout nga navigimi kryesor.

## Konfigurimi i detyrueshëm

Vendosi këto variabla në server para restart-it:

```env
APP_VERSION=0.11.0
AUTH_ADMIN_EMAIL=admin@sira.at
AUTH_ADMIN_PASSWORD=nje-password-i-forte
AUTH_SECRET=nje-vlere-e-gjate-rastesore-me-se-paku-32-karaktere
AUTH_SESSION_HOURS=12
```

Për `AUTH_SECRET` përdor një vlerë të re dhe të rastësishme. Mos përdor shembullin e dokumentit në production.
