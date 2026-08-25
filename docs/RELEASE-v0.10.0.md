# SIRA APP v0.10.0

## Qasjet & Kasaforta

- New access registry for Proxmox servers, hosting accounts, domains, databases, email, network devices and other services.
- Entries can belong to the user, SIRA Solutions or an existing client.
- The registry stores organizational metadata, username, 2FA status and renewal dates.
- Safe HTTP/HTTPS links open the service or its matching external vault item.
- Bitwarden, Vaultwarden, 1Password, KeePass and other vault references are supported.
- Search and filters are available for category, ownership and status.
- Records can be edited, archived and restored.
- Create and update operations are written to `audit_logs`.

## Security boundary

SIRA v0.10.0 does not contain a password, secret, recovery-code or master-key field. Passwords remain in the selected external password manager. Do not place secrets in the Notes field.

## Database update

Back up the database, then import `database/migrations/013_access_registry.sql` exactly once before deploying the application files. All migrations through `012_task_project_phases.sql` must already be installed.
