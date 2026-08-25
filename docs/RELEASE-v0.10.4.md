# SIRA APP v0.10.4 — MySQL pool fix

- MySQL connection pool tani ruhet dhe ripërdoret edhe në production.
- Nuk krijohet më një pool i ri për çdo query.
- Korrigjon gabimin `connect EPERM 127.0.0.1:3306` gjatë krijimit automatik të projektit.

## Instalimi

1. Importo `database/migrations/017_mysql_pool_fix.sql` për historikun e versionit.
2. Ngarko ZIP-in v0.10.4 dhe bëj redeploy.
3. Vendose `APP_VERSION=0.10.4`, nëse përdoret kjo variabël.
4. Mos ndrysho Environment Variables e databazës nëse aplikacioni hap listat normalisht.
